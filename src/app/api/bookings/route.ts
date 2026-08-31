import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createBooking, getClientBookings } from "@/lib/db/queries/bookings";
import { getCounselorById } from "@/lib/db/queries/counselors";
import { notifyCounselorNewBooking } from "@/lib/notifications/notify";

export async function GET(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const list = await getClientBookings(r.user.id);
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const body = await req.json();
  const { counselorId, scheduledAt, sessionMode, clientNote, applicationForm, agreementSigned, sessionNumber, pricingOptionId, durationMinutes: clientDuration, priceAmount: clientPrice } = body;
  if (!counselorId || !scheduledAt) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

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

  const booking = await createBooking({
    id: `bk_${Date.now()}`,
    clientId: r.user.id,
    counselorId,
    scheduledAt: new Date(scheduledAt),
    durationMinutes: Number(durationMinutes) || 50,
    sessionMode: sessionMode ?? "video",
    priceAmount: Number(priceAmount) || 0,
    clientNote,
    applicationForm: applicationForm ?? null,
    agreementSigned: agreementSigned ?? false,
    sessionNumber: sessionNumber ?? 1,
  });

  try {
    if (counselor.userId) {
      const label = new Date(scheduledAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
      await notifyCounselorNewBooking({
        counselorUserId: counselor.userId,
        clientName: r.user.name || r.user.email?.split("@")[0] || "visitor",
        scheduledAt: label,
        bookingId: booking.id,
      });
    }
  } catch (e) { console.error("[notify new booking]", e); }

  return NextResponse.json(booking, { status: 201 });
}
