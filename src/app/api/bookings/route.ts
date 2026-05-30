import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createBooking, getClientBookings, updateBookingStatus } from "@/lib/db/queries/bookings";
import { getCounselorById } from "@/lib/db/queries/counselors";

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
  if (!counselorId || !scheduledAt) return NextResponse.json({ error: "missing fields" }, { status: 400 });

  const counselor = await getCounselorById(counselorId);
  if (!counselor) return NextResponse.json({ error: "counselor not found" }, { status: 404 });

  const booking = await createBooking({
    id: `bk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    clientId: r.user.id,
    counselorId,
    scheduledAt: new Date(scheduledAt),
    durationMinutes: counselor.sessionDuration ?? 50,
    sessionMode: sessionMode ?? "视频咨询",
    priceAmount: counselor.pricePerSession ?? 300,
    clientNote,
    applicationForm: applicationForm ?? null,
    agreementSigned: agreementSigned ?? false,
    sessionNumber: sessionNumber ?? 1,
  });
  return NextResponse.json(booking, { status: 201 });
}
