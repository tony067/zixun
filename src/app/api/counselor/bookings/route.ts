import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getCounselorByUserId } from "@/lib/db/queries/counselors";
import { getCounselorBookings } from "@/lib/db/queries/bookings";

export async function GET(req: NextRequest) {
  const r = requireAuth(req);
  if (!r.ok) return r.response;
  const counselor = await getCounselorByUserId(r.user.id);
  if (!counselor) return NextResponse.json([], { status: 200 });
  const list = await getCounselorBookings(counselor.id);
  return NextResponse.json(list);
}
