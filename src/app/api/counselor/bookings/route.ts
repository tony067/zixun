import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getCounselorByUserId } from "@/lib/db/queries/counselors";
import { getCounselorBookings } from "@/lib/db/queries/bookings";

export async function GET(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  try {
    const c = await getCounselorByUserId(result.user.id);
    if (!c) return NextResponse.json({ error: "not a counselor" }, { status: 403 });
    const list = await getCounselorBookings(c.id);
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
