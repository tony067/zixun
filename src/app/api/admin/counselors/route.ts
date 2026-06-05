import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { counselors } from "@/lib/db/schema/counselors";
import { eq, desc } from "drizzle-orm";
import { notifyCounselorReviewResult } from "@/lib/notifications/notify";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  const rows = await db.select().from(counselors).where(eq(counselors.reviewStatus, status));
  return NextResponse.json(rows);
}

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { counselorId, action, reason } = await req.json();
  const approved = action === "approve";
  const newStatus = approved ? "approved" : "rejected";

  await db.update(counselors)
    .set({ reviewStatus: newStatus })
    .where(eq(counselors.id, counselorId));

  // 通知咨询师审核结果
  try {
    const [c] = await db.select().from(counselors).where(eq(counselors.id, counselorId));
    if (c?.userId) {
      await notifyCounselorReviewResult({
        counselorUserId: c.userId,
        approved,
        reason: reason ?? "",
      });
    }
  } catch (e) { console.error("[notify review]", e); }

  return NextResponse.json({ ok: true });
}
