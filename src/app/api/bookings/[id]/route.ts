import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema/scheduling";
import { counselors } from "@/lib/db/schema/counselors";
import { eq } from "drizzle-orm";
import { updateBookingStatus } from "@/lib/db/queries/bookings";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [counselor] = await db.select({
    id: counselors.id, displayName: counselors.displayName,
    counselorTypes: counselors.counselorTypes, avatarUrl: counselors.avatarUrl,
  }).from(counselors).where(eq(counselors.id, booking.counselorId));
  return NextResponse.json({ booking: { ...booking, counselor: counselor ?? null } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = requireAuth(req);
  if (!r.ok) return r.response;
  const { id } = await params;
  const { status, counselorNote } = await req.json();
  const updated = await updateBookingStatus(id, status, counselorNote);
  return NextResponse.json(updated);
}
