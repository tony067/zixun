import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema/scheduling";
import { users } from "@/lib/db/schema/users";
import { counselors } from "@/lib/db/schema/counselors";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const status = req.nextUrl.searchParams.get("status");

  const rows = await db.select({
    id: bookings.id,
    status: bookings.status,
    scheduledAt: bookings.scheduledAt,
    priceAmount: bookings.priceAmount,
    sessionMode: bookings.sessionMode,
    sessionNumber: bookings.sessionNumber,
    durationMinutes: bookings.durationMinutes,
    createdAt: bookings.createdAt,
    rescheduleStatus: bookings.rescheduleStatus,
    clientId: bookings.clientId,
    counselorId: bookings.counselorId,
  }).from(bookings).orderBy(bookings.createdAt);

  // filter by status
  const filtered = status ? rows.filter(r => r.status === status) : rows;

  // join client and counselor names
  const enriched = await Promise.all(filtered.map(async b => {
    const [clientUser] = await db.select({ id: users.id, name: users.name, email: users.email })
      .from(users).where(eq(users.id, b.clientId));
    const [counselor] = await db.select({ id: counselors.id, displayName: counselors.displayName })
      .from(counselors).where(eq(counselors.id, b.counselorId));
    return { ...b, client: clientUser ?? null, counselor: counselor ?? null };
  }));

  return NextResponse.json(enriched);
}
