import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createBooking, getClientBookings, syncBookingProgress } from "@/lib/db/queries/bookings";
import { getCounselorById } from "@/lib/db/queries/counselors";
import { checkSlotAvailable } from "@/lib/scheduling/slots";
import { notifyCounselorNewBooking } from "@/lib/notifications/notify";

export async function GET(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  await syncBookingProgress();
  const list = await getClientBookings(r.user.id);
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const body = await req.json();
  const { counselorId, scheduledAt, sessionMode, clientNote, applicationForm, agreementSigned, sessionNumber, pricingOptionId, durationMinutes: clientDuration, priceAmount: clientPrice, paymentMethod, adjustRequest } = body;

  // 新流程：来访先支付再提交订单（网页端为模拟支付），paymentMethod 由支付步骤传入
  if (!paymentMethod) return NextResponse.json({ error: "missing payment" }, { status: 400 });
  if (!counselorId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  // adjustRequest：无合适时段时的时间调剂申请 { message, acceptOther }
  const isAdjust = !!adjustRequest?.message;
  if (!scheduledAt && !isAdjust) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const counselor = await getCounselorById(counselorId);
  if (!counselor) return NextResponse.json({ error: "Counselor not found" }, { status: 404 });

  // 价格和时长：优先用前端从 pricingOptions 解析后的值（避免 DB 旧字段污染）
  // 然后尝试从 counselors.pricingOptions(JSON字符串) 中查找
  let options: any[] = [];
  if (Array.isArray((counselor as any).pricingOptions)) {
    options = (counselor as any).pricingOptions;
  } else if (typeof (counselor as any).pricingOptions === "string") {
    try { options = JSON.parse((counselor as any).pricingOptions); } catch { options = []; }
  }
  const selected = pricingOptionId ? options.find((o: any) => o.id === pricingOptionId) : options[0];

  // 优先级：客户端明确传值 > pricingOptions 选中项 > counselors 旧字段
  const durationMinutes = clientDuration
    ?? selected?.duration
    ?? selected?.durationMinutes
    ?? counselor.sessionDuration
    ?? 50;
  const priceAmount = clientPrice
    ?? selected?.price
    ?? selected?.totalPrice
    ?? selected?.pricePerSession
    ?? counselor.pricePerSession
    ?? 0;

  // 调剂申请：暂无确定时间，先落一个占位时间（+48小时），咨询师确认时再定真实时间
  const finalScheduledAt = isAdjust
    ? new Date(Date.now() + 48 * 60 * 60 * 1000)
    : new Date(scheduledAt);

  if (!isAdjust) {
    // 常规预约：服务端校验时段必须真实可约（在档期内、未被屏蔽、未被预约）
    const slotCheck = await checkSlotAvailable(
      counselorId,
      finalScheduledAt,
      Number(durationMinutes) || 50,
    );
    if (!slotCheck.ok) {
      return NextResponse.json({ error: "slot_unavailable", message: slotCheck.reason }, { status: 409 });
    }
  }

  const booking = await createBooking({
    id: `bk_${Date.now()}`,
    clientId: r.user.id,
    counselorId,
    scheduledAt: finalScheduledAt,
    durationMinutes: Number(durationMinutes) || 50,
    sessionMode: sessionMode ?? "视频",
    priceAmount: Number(priceAmount) || 0,
    status: "pending_confirmation",
    paidAt: new Date(),
    paymentMethod: String(paymentMethod),
    adjustRequest: isAdjust ? { message: String(adjustRequest.message), acceptOther: adjustRequest.acceptOther ?? "是" } : null,
    clientNote,
    applicationForm: applicationForm ?? null,
    agreementSigned: agreementSigned ?? false,
    sessionNumber: sessionNumber ?? 1,
  });

  try {
    if (counselor.userId) {
      const label = isAdjust
        ? (adjustRequest.message as string).slice(0, 40)
        : finalScheduledAt.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
      await notifyCounselorNewBooking({
        counselorUserId: counselor.userId,
        clientName: r.user.name || r.user.email?.split("@")[0] || "visitor",
        scheduledAt: label,
        bookingId: booking.id,
        isAdjustRequest: isAdjust,
      });
    }
  } catch (e) { console.error("[notify new booking]", e); }

  return NextResponse.json(booking, { status: 201 });
}
