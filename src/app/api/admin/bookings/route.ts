import { NextRequest, NextResponse } from "next/server";
import { getAllBookings } from "@/lib/db/queries/bookings";

export async function GET(_req: NextRequest) {
  const list = await getAllBookings();
  return NextResponse.json(list);
}
