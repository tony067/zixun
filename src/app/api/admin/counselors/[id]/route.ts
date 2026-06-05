import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { counselors } from "@/lib/db/schema/counselors";
import { users } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";
import { notifyCounselorReviewResult } from "@/lib/notifications/notify";

function parseListField(arr: string[] | null | undefined) {
  if (!arr?.length) return [];
  return arr.map((s, i) => {
    try { const p = JSON.parse(s); return { id: p.id ?? String(i), value: p.value ?? s }; }
    catch { return { id: String(i), value: s }; }
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const [c] = await db.select().from(counselors).where(eq(counselors.id, id));
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // 拉用户邮箱
  const [u] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, c.userId));
  return NextResponse.json({ counselor: {
    ...c,
    email: u?.email ?? "",
    userName: u?.name ?? "",
    qualifications: parseListField(c.qualifications),
    education: parseListField(c.education),
    trainings: parseListField(c.trainings),
    workExperiences: parseListField(c.workExperiences),
  } });
}

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
