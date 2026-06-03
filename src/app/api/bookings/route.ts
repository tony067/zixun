import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createBooking, getClientBookings } from "@/lib/db/queries/bookings";
import { getCounselorById } from "@/lib/db/queries/counselors";
import { notifyCounselorNewBooking } from "@/lib/notifications/notify";

export async function GET(req: NextRequest) {
  const r = requireAuth(req);
  if (!r.ok) return r.response;
  const list = await getClientBookings(r.user.id);
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const r = requireAuth(req);
  if (!r.ok) return r.response;
  const body = await req.json();
  const { counselorId, scheduledAt, sessionMode, clientNote, applicationForm, agreementSigned, sessionNumber } = body;
  if (!counselorId || !scheduledAt) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const counselor = await getCounselorById(counselorId);
  if (!counselor) return NextResponse.json({ error: "Counselor not found" }, { status: 404 });

  const booking = await createBooking({
    id: `bk_${Date.now()}`,
    clientId: r.user.id,
    counselorId,
    scheduledAt: new Date(scheduledAt),
    durationMinutes: counselor.sessionDuration ?? 50,
    sessionMode: sessionMode ?? "video",
    priceAmount: counselor.pricePerSession ?? 300,
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
