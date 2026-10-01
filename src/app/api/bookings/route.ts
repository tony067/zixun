import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createBooking, getClientBookings, syncBookingProgress } from "@/lib/db/queries/bookings";
import { getCounselorById } from "@/lib/db/queries/counselors";
import { checkSlotAvailable } from "@/lib/scheduling/slots";
import { notifyCounselorNewBooking } from "@/lib/notifications/notify";
import { ensurePackageForPaidBooking, getPackageById } from "@/lib/db/queries/packages";

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
  const { counselorId, scheduledAt, sessionMode, clientNote, applicationForm, agreementSigned, sessionNumber, pricingOptionId, durationMinutes: clientDuration, priceAmount: clientPrice, paymentMethod, adjustRequest, packageId } = body;

  // 套餐子预约：从套餐扣除次数，无需支付
  const isPackageRedeem = typeof packageId === "string" && packageId.length > 0;
  // 新流程：来访先支付再提交订单（网页端为模拟支付），paymentMethod 由支付步骤传入
  if (!isPackageRedeem && !paymentMethod) return NextResponse.json({ error: "missing payment" }, { status: 400 });
  if (!counselorId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  // adjustRequest：无合适时段时的时间调剂申请 { message, acceptOther }
  const isAdjust = !!adjustRequest?.message;
  // 线下转账：来访不通过应用支付、直接转账给客服，订单以「待支付」入库，由客服确认收款
  const isOffline = body.offline === true;
  // 注意：scheduledAt 为空的检查在下方 isPackagePurchase 判定之后（套餐购买无需时间）

  const counselor = await getCounselorById(counselorId);
  if (!counselor) return NextResponse.json({ error: "Counselor not found" }, { status: 404 });

  // ── 套餐子预约：校验套餐归属/余次，0元下单，确认时核销 ──
  let pkg: Awaited<ReturnType<typeof getPackageById>> | null = null;
  if (isPackageRedeem) {
    pkg = await getPackageById(String(packageId));
    if (!pkg || pkg.clientId !== r.user.id || pkg.counselorId !== counselorId) {
      return NextResponse.json({ error: "package_not_found" }, { status: 404 });
    }
    if (pkg.status !== "active") {
      return NextResponse.json({ error: "package_unavailable", message: "套餐已退款或不可用" }, { status: 409 });
    }
    if ((pkg.usedSessions ?? 0) >= pkg.totalSessions) {
      return NextResponse.json({ error: "package_exhausted", message: "套餐次数已用完" }, { status: 409 });
    }
  }

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
  // 套餐购买：无需选时间，落 +30 天占位，逐次预约时才产生真实时间
  const isPackagePurchase = !isPackageRedeem && Number(selected?.sessions ?? sessionNumber ?? 1) > 1;
  if (!scheduledAt && !isAdjust && !isPackagePurchase) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const finalScheduledAt = isAdjust
    ? new Date(Date.now() + 48 * 60 * 60 * 1000)
    : isPackagePurchase && !scheduledAt
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : new Date(scheduledAt);

  if (!isAdjust && !isPackagePurchase) {
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

  // 套餐购买单为预付费商品：线上支付直接 paid 生效；线下转账仍走 pending_payment 由客服确认
  const purchasePaid = isPackagePurchase && !isOffline;

  const booking = await createBooking({
    id: `bk_${Date.now()}`,
    clientId: r.user.id,
    counselorId,
    scheduledAt: finalScheduledAt,
    durationMinutes: Number(durationMinutes) || 50,
    sessionMode: sessionMode ?? "视频",
    priceAmount: isPackageRedeem ? 0 : Number(priceAmount) || 0,
    status: isPackageRedeem ? "pending_confirmation" : purchasePaid ? "paid" : isOffline ? "pending_payment" : "pending_confirmation",
    ...(isPackageRedeem || isOffline ? {} : { paidAt: new Date() }),
    paymentMethod: isPackageRedeem ? "package" : String(paymentMethod),
    adjustRequest: isAdjust ? { message: String(adjustRequest.message), acceptOther: adjustRequest.acceptOther ?? "是" } : null,
    clientNote,
    applicationForm: applicationForm ?? null,
    agreementSigned: agreementSigned ?? false,
    sessionNumber: isPackageRedeem ? 1 : Number(selected?.sessions ?? sessionNumber ?? 1),
    packageId: isPackageRedeem ? String(packageId) : undefined,
  });

  // 套餐购买付款生效 → 生成套餐账户；线下转账的单在客服确认收款时生成
  if (purchasePaid) {
    try { await ensurePackageForPaidBooking(booking as any); } catch (e) { console.error("[ensurePackage]", e); }
  }

  // 核销时机（用户确认的规则）：咨询师确认子预约时才锁定次数（在 PATCH 流转中处理），
  // 创建子预约时仅校验余次，不扣减

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
