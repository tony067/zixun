import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema/scheduling";
import { counselors } from "@/lib/db/schema/counselors";
import { eq } from "drizzle-orm";
import { notifyCounselorRescheduleRequest, notifyClientRescheduleResult } from "@/lib/notifications/notify";

// 来访提交改期申请
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const { newTime, reason } = await req.json();
  await db.update(bookings).set({
    rescheduleStatus: "pending",
    rescheduleRequestedAt: new Date(),
    rescheduleNewTime: new Date(newTime),
    rescheduleReason: reason ?? "",
  }).where(eq(bookings.id, id));

  // 通知咨询师有改期申请
  try {
    const [bk] = await db.select().from(bookings).where(eq(bookings.id, id));
    const [c] = await db.select().from(counselors).where(eq(counselors.id, bk?.counselorId ?? ""));
    if (c?.userId) {
      const requestedLabel = new Date(newTime).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
      await notifyCounselorRescheduleRequest({
        counselorUserId: c.userId,
        clientName: auth.user.name || auth.user.email?.split("@")[0] || "来访者",
        requestedTime: requestedLabel,
        bookingId: id,
      });
    }
  } catch (e) { console.error("[notify reschedule]", e); }

  return NextResponse.json({ ok: true });
}.where(eq(bookings.id, id));
  return NextResponse.json({ ok: true });
}

// 咨询师确认或拒绝改期
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const { action, note } = await req.json(); // action: "approve" | "reject"
  if (action === "approve") {
    const [bk] = await db.select({ rescheduleNewTime: bookings.rescheduleNewTime })
      .from(bookings).where(eq(bookings.id, id));
    await db.update(bookings).set({
      rescheduleStatus: "approved",
      rescheduleNote: note ?? "",
      scheduledAt: bk?.rescheduleNewTime ?? new Date(),
    }).where(eq(bookings.id, id));
  } else {
    await db.update(bookings).set({
      rescheduleStatus: "rejected",
      rescheduleNote: note ?? "",
    }).where(eq(bookings.id, id));
  }
  return NextResponse.json({ ok: true });
}
