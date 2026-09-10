import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getUserConversations, getOrCreateConversation, sendMessage, getOfficialStaffUserId } from "@/lib/db/queries/messages";

export async function GET(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const convs = await getUserConversations(r.user.id, r.user.role);
  return NextResponse.json(convs);
}

export async function POST(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const { otherUserId, counselorId, toAdmin } = await req.json();
  let targetUserId = otherUserId;
  if (counselorId && !otherUserId) {
    const { db } = await import("@/lib/db/client");
    const { counselors } = await import("@/lib/db/schema/counselors");
    const { eq } = await import("drizzle-orm");
    const [row] = await db.select({ userId: counselors.userId }).from(counselors).where(eq(counselors.id, counselorId));
    if (!row?.userId) return NextResponse.json({ error: "counselor not found" }, { status: 404 });
    targetUserId = row.userId;
  }
  // 联系客服：定向到官方客服账号（最早的 support 用户，无则最早的 admin 用户）
  if (toAdmin && !targetUserId) {
    const officialId = await getOfficialStaffUserId();
    if (!officialId) return NextResponse.json({ error: "no staff user" }, { status: 404 });
    targetUserId = officialId;
  }
  if (!targetUserId) return NextResponse.json({ error: "missing userId" }, { status: 400 });
  if (targetUserId === r.user.id) return NextResponse.json({ error: "不能与自己建立会话" }, { status: 400 });
  const conv = await getOrCreateConversation(r.user.id, targetUserId);
  // 客服会话首次创建时，由官方账号发一条欢迎消息
  if (toAdmin) {
    const { db } = await import("@/lib/db/client");
    const { messages } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    const [existing] = await db.select({ id: messages.id }).from(messages).where(eq(messages.conversationId, conv.id)).limit(1);
    if (!existing) {
      await sendMessage({
        id: `msg_${Date.now()}_welcome`,
        conversationId: conv.id,
        senderId: targetUserId,
        content: "你好！我是 MindPace 客服。有任何关于预约、平台使用或咨询师资质的问题，都可以在这里告诉我。",
      });
    }
  }
  return NextResponse.json(conv);
}
