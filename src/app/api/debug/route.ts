import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema/scheduling";
import { counselors } from "@/lib/db/schema/counselors";

export async function GET(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const userId = r.user.id;

  const myBookings = await db.select({ id: bookings.id, clientId: bookings.clientId, status: bookings.status })
    .from(bookings).limit(5);

  const myCounselor = await db.select({ id: counselors.id, userId: counselors.userId, reviewStatus: counselors.reviewStatus })
    .from(counselors).limit(10);

  return NextResponse.json({
    loggedInUserId: userId,
    allBookings: myBookings,
    allCounselors: myCounselor,
  });
}
