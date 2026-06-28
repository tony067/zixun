import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getUserConversations, getOrCreateConversation } from "@/lib/db/queries/messages";

export async function GET(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const convs = await getUserConversations(r.user.id);
  return NextResponse.json(convs);
}

export async function POST(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const { otherUserId, counselorId } = await req.json();
  let targetUserId = otherUserId;
  if (counselorId && !otherUserId) {
    const { db } = await import("@/lib/db/client");
    const { counselors } = await import("@/lib/db/schema/counselors");
    const { eq } = await import("drizzle-orm");
    const [row] = await db.select({ userId: counselors.userId }).from(counselors).where(eq(counselors.id, counselorId));
    if (!row?.userId) return NextResponse.json({ error: "counselor not found" }, { status: 404 });
    targetUserId = row.userId;
  }
  if (!targetUserId) return NextResponse.json({ error: "missing userId" }, { status: 400 });
  const conv = await getOrCreateConversation(r.user.id, targetUserId);
  return NextResponse.json(conv);
}
