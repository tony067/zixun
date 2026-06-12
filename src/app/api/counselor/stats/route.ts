import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getCounselorByUserId } from "@/lib/db/queries/counselors";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const c = await getCounselorByUserId(auth.user.id);
  if (!c) return NextResponse.json({ error: "not counselor" }, { status: 403 });

  const all = await db.select().from(bookings).where(eq(bookings.counselorId, c.id));
  const totalBookings = all.length;
  const completedSessions = all.filter(b => b.status === "completed").length;
  const confirmedSessions = all.filter(b => b.status === "confirmed").length;
  const pendingCount = all.filter(b => b.status === "pending_confirmation").length;
  const uniqueClients = new Set(all.map(b => b.clientId)).size;

  return NextResponse.json({ totalBookings, completedSessions, confirmedSessions, pendingCount, uniqueClients });
}
