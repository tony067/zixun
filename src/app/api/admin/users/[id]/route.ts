import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { bookings } from "@/lib/db/schema/scheduling";
import { counselors } from "@/lib/db/schema/counselors";
import { eq, desc } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (auth.user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // 支持修改 role 和 status
  const updates: Record<string, unknown> = {};
  if (body.role !== undefined) updates.role = body.role;
  if (body.status !== undefined) updates.status = body.status;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  const updated = await db
    .update(users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  if (!updated[0]) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, role: updated[0].role, status: updated[0].status });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (auth.user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // 查用户基本信息
  const userRow = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!userRow[0]) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const user = userRow[0];

  // 来访者订单（作为 client）
  const clientBookings = await db.select({
    id:              bookings.id,
    counselorId:     bookings.counselorId,
    scheduledAt:     bookings.scheduledAt,
    priceAmount:     bookings.priceAmount,
    status:          bookings.status,
    clientNote:      bookings.clientNote,
    agreementSigned: bookings.agreementSigned,
  }).from(bookings)
    .where(eq(bookings.clientId, id))
    .orderBy(desc(bookings.scheduledAt));

  // 如果是咨询师，同时查接单记录
  const counselorRow = await db.select({ id: counselors.id, displayName: counselors.displayName })
    .from(counselors).where(eq(counselors.userId, id)).limit(1);

  let counselorBookings: typeof clientBookings = [];
  if (counselorRow[0]) {
    counselorBookings = await db.select({
      id:              bookings.id,
      counselorId:     bookings.counselorId,
      scheduledAt:     bookings.scheduledAt,
      priceAmount:     bookings.priceAmount,
      status:          bookings.status,
      clientNote:      bookings.clientNote,
      agreementSigned: bookings.agreementSigned,
    }).from(bookings)
      .where(eq(bookings.counselorId, counselorRow[0].id))
      .orderBy(desc(bookings.scheduledAt));
  }

  // 查对方姓名（批量）
  const peerIds = [
    ...clientBookings.map(b => b.counselorId),
    ...counselorBookings.map(b => b.counselorId),
  ];
  const allCounselorNames: Record<string, string> = {};
  if (peerIds.length) {
    const cs = await db.select({ id: counselors.id, name: counselors.displayName }).from(counselors);
    cs.forEach(c => { allCounselorNames[c.id] = c.name ?? c.id; });
  }

  const STATUS_LABEL: Record<string, string> = {
    pending_confirmation: "待确认",
    paid:                 "待咨询",
    completed:            "已完成",
    cancelled:            "已取消",
    refunded:             "已退款",
  };

  function formatBooking(b: typeof clientBookings[0]) {
    const d = b.scheduledAt ? new Date(b.scheduledAt) : null;
    return {
      id:             b.id,
      scheduledDate:  d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` : "",
      scheduledTime:  d ? `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}` : "",
      priceAmount:    b.priceAmount ?? 0,
      status:         b.status ?? "",
      statusLabel:    STATUS_LABEL[b.status ?? ""] ?? b.status ?? "",
      counselorName:   allCounselorNames[b.counselorId] ?? b.counselorId,
      clientNote:      b.clientNote ?? "",
      agreementSigned: b.agreementSigned ?? false,
    };
  }

  return NextResponse.json({
    id:              user.id,
    email:           user.email ?? "",
    name:            user.name ?? user.email ?? user.id,
    avatarUrl:       user.avatarUrl,
    role:            user.role ?? "visitor",
    status:          user.status ?? "active",
    createdAt:       user.createdAt,
    counselorId:     counselorRow[0]?.id ?? null,
    counselorName:   counselorRow[0]?.displayName ?? null,
    clientBookings:  clientBookings.map(formatBooking),
    counselorBookings: counselorBookings.map(formatBooking),
  });
}
