import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateBookingStatus } from "@/lib/db/queries/bookings";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = requireAuth(req);
  if (!r.ok) return r.response;
  const { id } = await params;
  const { status, counselorNote } = await req.json();
  const updated = await updateBookingStatus(id, status, counselorNote);
  return NextResponse.json(updated);
}
