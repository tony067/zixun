import { NextRequest, NextResponse } from "next/server";
import { getAllBookings } from "@/lib/db/queries/bookings";

export async function GET(_req: NextRequest) {
  try {
    const list = await getAllBookings();
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
