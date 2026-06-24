import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema/scheduling";
import { users } from "@/lib/db/schema/users";
import { counselors } from "@/lib/db/schema/counselors";
import { eq } from "drizzle-orm";
import { updateBookingStatus } from "@/lib/db/queries/bookings";
import {
  notifyClientBookingConfirmed,
  notifyClientRescheduleResult,
  notifyCounselorBookingCancelled,
} from "@/lib/notifications/notify";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
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
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const { id } = await params;
  const { status, counselorNote } = await req.json();
  const updated = await updateBookingStatus(id, status, counselorNote);

  // 触发通知（不影响主流程）
  try {
    const [bk] = await db.select().from(bookings).where(eq(bookings.id, id));
    const [c] = await db.select().from(counselors).where(eq(counselors.id, bk?.counselorId ?? ""));
    const counselorName = c?.displayName ?? "咨询师";
    const scheduledAt = bk?.scheduledAt
      ? new Date(bk.scheduledAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })
      : "";

    if (status === "pending_payment" && bk?.clientId) {
      await notifyClientBookingConfirmed({ clientUserId: bk.clientId, counselorName, scheduledAt, bookingId: id });
    }
    if (status === "cancelled" && c?.userId) {
      await notifyCounselorBookingCancelled({ counselorUserId: c.userId, clientName: "来访者", scheduledAt, bookingId: id });
    }
    if ((status === "reschedule_accepted" || status === "reschedule_rejected") && bk?.clientId) {
      await notifyClientRescheduleResult({ clientUserId: bk.clientId, counselorName, accepted: status === "reschedule_accepted", newTime: scheduledAt, bookingId: id });
    }
  } catch (e) { console.error("[notify]", e); }

  return NextResponse.json(updated);
}
