import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { counselors } from "@/lib/db/schema/counselors";
import { eq } from "drizzle-orm";
import { notifyCounselorReviewResult } from "@/lib/notifications/notify";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const { action, reason } = await req.json();
  const approved = action === "approve";
  const newStatus = approved ? "approved" : "rejected";
  await db.update(counselors).set({ reviewStatus: newStatus }).where(eq(counselors.id, id));
  try {
    const [c] = await db.select().from(counselors).where(eq(counselors.id, id));
    if (c?.userId) await notifyCounselorReviewResult({ counselorUserId: c.userId, approved, reason: reason ?? "" });
  } catch (e) { console.error("[notify]", e); }
  return NextResponse.json({ ok: true });
}
