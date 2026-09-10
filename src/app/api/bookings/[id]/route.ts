import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema";
import { counselors } from "@/lib/db/schema/counselors";
import { eq } from "drizzle-orm";
import { checkSlotAvailable } from "@/lib/scheduling/slots";
import { syncBookingProgress } from "@/lib/db/queries/bookings";
import { notifyClientBookingConfirmed, notifyClientBookingRejected, notifyUser } from "@/lib/notifications/notify";
import { ALL_BOOKING_STATUSES } from "@/lib/booking-status";

const VALID_STATUSES = ALL_BOOKING_STATUSES;

async function loadBookingWithRole(id: string, userId: string, role: string) {
  const [row] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!row) return { error: "not found" as const };
  // 判定顺序：admin → support → counselor → client（同一账号兼具多重身份时取最高权限，
  // 避免"咨询师自己下的测试单"被 clientId 先匹配而误判为 client）
  if (role === "admin") return { booking: row, actor: "admin" as const };
  if (role === "support") return { booking: row, actor: "support" as const };
  if (row.counselorId) {
    const [c] = await db.select().from(counselors).where(eq(counselors.id, row.counselorId));
    if (c?.userId === userId) return { booking: row, actor: "counselor" as const };
  }
  if (row.clientId === userId) return { booking: row, actor: "client" as const };
  return { error: "forbidden" as const };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const { id } = await params;
  await syncBookingProgress();

  const [row] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });

  // 权限：来访者本人或咨询师本人或管理员可看
  const isOwner = row.clientId === r.user.id;
  let isCounselor = false;
  if (!isOwner && row.counselorId) {
    const [c] = await db.select().from(counselors).where(eq(counselors.id, row.counselorId));
    isCounselor = c?.userId === r.user.id;
  }
  const isStaff = r.user.role === "admin" || r.user.role === "support";
  if (!isOwner && !isCounselor && !isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // 关联咨询师信息
  let counselorInfo: any = null;
  if (row.counselorId) {
    const [c] = await db.select().from(counselors).where(eq(counselors.id, row.counselorId));
    if (c) {
      counselorInfo = {
        id: c.id,
        displayName: c.displayName,
        avatarUrl: c.avatarUrl,
        counselorTypes: c.counselorTypes,
      };
    }
  }

  return NextResponse.json({
    id: row.id,
    status: row.status,
    scheduledAt: row.scheduledAt,
    durationMinutes: row.durationMinutes ?? 50,
    sessionMode: row.sessionMode ?? "视频",
    priceAmount: row.priceAmount ?? 0,
    sessionNumber: row.sessionNumber ?? 1,
    applicationForm: row.applicationForm,
    agreementSigned: row.agreementSigned,
    createdAt: row.createdAt,
    clientNote: row.clientNote,
    counselorNote: row.counselorNote,
    paidAt: row.paidAt,
    paymentMethod: row.paymentMethod,
    meetingLink: row.meetingLink,
    adjustRequest: row.adjustRequest,
    counselor: counselorInfo,
  });
}

/**
 * PATCH /api/bookings/[id]
 * 状态流转（新流程：支付前置，三端同步）：
 *   下单即支付 → 待确认 pending_confirmation（已支付·待咨询师确认）
 *   待确认 → 咨询师确认（可改时间、发咨询链接 meetingLink）→ 待咨询 paid
 *   待确认 → 咨询师拒绝 → rejected（通知来访，模拟退款）
 *   paid 到开始时间自动 → in_progress；in_progress 超时自动 → completed（见 syncBookingProgress）
 *   paid/in_progress → 管理员手动 completed
 *   pending_confirmation/pending_payment/paid → cancelled（来访/咨询师/管理员）
 *   管理员：任意合法状态之间可改
 *   客服（support 角色）：仅 标记已支付（待支付→已支付）+ 退款
 * 另支持咨询师/管理员直接改期（body.scheduledAt 不带 status）。
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const loaded = await loadBookingWithRole(id, r.user.id, r.user.role ?? "");
  if ("error" in loaded) {
    const code = loaded.error === "not found" ? 404 : 403;
    return NextResponse.json({ error: loaded.error }, { status: code });
  }
  const { booking, actor } = loaded;

  // —— 直接改期（咨询师/管理员，不带 status）——
  if (body.scheduledAt && !body.status) {
    if (actor !== "counselor" && actor !== "admin") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const newTime = new Date(body.scheduledAt);
    if (isNaN(newTime.getTime())) {
      return NextResponse.json({ error: "invalid scheduledAt" }, { status: 400 });
    }
    const check = await checkSlotAvailable(booking.counselorId, newTime, booking.durationMinutes ?? 50, id, { ignoreRules: true });
    if (!check.ok) {
      return NextResponse.json({ error: "slot_unavailable", message: check.reason }, { status: 409 });
    }
    const [updated] = await db.update(bookings)
      .set({ scheduledAt: newTime, rescheduleStatus: null, rescheduleNewTime: null })
      .where(eq(bookings.id, id))
      .returning();
    return NextResponse.json(updated);
  }

  // —— 状态变更 ——
  const { status } = body;
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const current = booking.status ?? "pending_confirmation";
  let allowed = false;
  if (actor === "admin") {
    // 管理员：任意合法状态之间可改
    allowed = true;
  } else if (actor === "support") {
    // 客服（显式授权的角色）：仅开放订单促进 —— 标记已支付 + 退款
    allowed =
      (status === "paid" && ["pending_payment", "confirmed"].includes(current)) ||
      (status === "refunded" && ["pending_confirmation", "pending_payment", "paid", "in_progress", "completed"].includes(current));
  } else if (actor === "client") {
    // 来访：取消自己的订单（已支付未开始的）
    allowed = status === "cancelled" && ["pending_confirmation", "pending_payment", "paid"].includes(current);
  } else {
    // 咨询师
    allowed =
      // 确认订单（→待咨询）：确认时可带 meetingLink / 新时间
      (status === "paid" && ["pending_confirmation", "pending_payment"].includes(current)) ||
      // 拒绝（模拟退款）
      (status === "rejected" && ["pending_confirmation", "pending_payment"].includes(current)) ||
      // 退款：仅限未开始的订单（进行中/已完成只能由管理员退款）
      (status === "refunded" && ["pending_confirmation", "pending_payment", "paid"].includes(current)) ||
      // 取消
      (status === "cancelled" && ["pending_confirmation", "pending_payment", "paid", "in_progress"].includes(current));
    // 注：不开放咨询师手动"标记完成"——订单按咨询时间自动流转（开始→进行中，结束→已完成）
  }
  if (!allowed) {
    return NextResponse.json(
      { error: "invalid_transition", message: `当前状态（${current}）不允许变更为 ${status}` },
      { status: 409 },
    );
  }

  // 确认订单（→ paid，咨询师确认）：处理改时间 + 咨询链接
  if (status === "paid" && actor === "counselor") {
    // 时间：优先用咨询师指定的；调剂申请单必须指定
    let newTime: Date | null = body.scheduledAt ? new Date(body.scheduledAt) : null;
    if (body.scheduledAt && isNaN(newTime!.getTime())) {
      return NextResponse.json({ error: "invalid scheduledAt" }, { status: 400 });
    }
    if (!newTime && booking.adjustRequest) {
      return NextResponse.json(
        { error: "scheduled_required", message: "该订单为时间调剂申请，请先选择确认的咨询时间" },
        { status: 400 },
      );
    }
    const finalTime = newTime ?? new Date(booking.scheduledAt);
    // 仅校验与已有预约冲突 + 不能是过去（调剂时间可能不在档期规则内，属咨询师个人承诺）
    const check = await checkSlotAvailable(booking.counselorId, finalTime, booking.durationMinutes ?? 50, id, { ignoreRules: true });
    if (!check.ok) {
      return NextResponse.json({ error: "slot_unavailable", message: check.reason }, { status: 409 });
    }
    const [updated] = await db.update(bookings)
      .set({
        status: "paid",
        scheduledAt: finalTime,
        meetingLink: body.meetingLink ? String(body.meetingLink) : null,
        counselorNote: body.counselorNote ? String(body.counselorNote) : booking.counselorNote,
        paidAt: booking.paidAt ?? new Date(),
        paymentMethod: booking.paymentMethod ?? "online",
        rescheduleStatus: null,
        rescheduleNewTime: null,
      })
      .where(eq(bookings.id, id))
      .returning();
    // 通知来访
    try {
      const timeLabel = finalTime.toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
      await notifyClientBookingConfirmed({
        clientUserId: booking.clientId,
        counselorName: (await db.select({ displayName: counselors.displayName }).from(counselors).where(eq(counselors.id, booking.counselorId)))[0]?.displayName ?? "咨询师",
        scheduledAt: timeLabel,
        bookingId: id,
      });
    } catch (e) { console.error("[notify confirmed]", e); }
    return NextResponse.json(updated);
  }

  // 退款：通知来访（模拟退款，未实际扣款）
  if (status === "refunded") {
    const [updated] = await db.update(bookings)
      .set({ status: "refunded" })
      .where(eq(bookings.id, id))
      .returning();
    try {
      await notifyUser({
        userId: booking.clientId,
        title: "订单已退款",
        body: "您的咨询订单已退款（模拟支付未实际扣款）。如有疑问请联系客服。",
        data: { bookingId: id },
      });
    } catch (e) { console.error("[notify refunded]", e); }
    return NextResponse.json(updated);
  }

  // 拒绝：通知来访（模拟退款）
  if (status === "rejected") {
    const [updated] = await db.update(bookings)
      .set({ status: "rejected" })
      .where(eq(bookings.id, id))
      .returning();
    try {
      await notifyClientBookingRejected({
        clientUserId: booking.clientId,
        counselorName: (await db.select({ displayName: counselors.displayName }).from(counselors).where(eq(counselors.id, booking.counselorId)))[0]?.displayName ?? "咨询师",
        bookingId: id,
      });
    } catch (e) { console.error("[notify rejected]", e); }
    return NextResponse.json(updated);
  }

  // 其他状态变更
  const extra: Partial<typeof bookings.$inferInsert> = {};
  if (status === "paid" && !booking.paidAt) {
    extra.paymentMethod = body.paymentMethod ?? "online";
    extra.paidAt = new Date();
  }
  if (status === "paid" && actor === "admin") {
    if (body.meetingLink) extra.meetingLink = String(body.meetingLink);
  }

  const [updated] = await db.update(bookings)
    .set({ status, ...extra })
    .where(eq(bookings.id, id))
    .returning();
  return NextResponse.json(updated);
}
