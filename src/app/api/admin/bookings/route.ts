import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllBookings } from "@/lib/db/queries/bookings";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const list = await getAllBookings();
  return NextResponse.json(list);
}
