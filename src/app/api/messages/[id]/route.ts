import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getConversationMessages, sendMessage, getConversationOtherUser, canAccessConversation } from "@/lib/db/queries/messages";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const { id } = await params;
  // 访问校验：参与者放行；staff 可访问客服共享会话（selfId=官方客服身份）
  const access = await canAccessConversation(id, r.user.id, r.user.role);
  if (!access.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const selfId = access.selfId;
  const [msgs, otherUser] = await Promise.all([
    getConversationMessages(id),
    getConversationOtherUser(id, selfId),
  ]);
  return NextResponse.json({ msgs, otherUser, selfId });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const { id } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });
  // staff 在客服共享会话中回复时，以官方客服账号身份发出
  const access = await canAccessConversation(id, r.user.id, r.user.role);
  if (!access.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const selfId = access.selfId;
  const msg = await sendMessage({
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    conversationId: id,
    senderId: selfId,
    content: content.trim(),
  });
  return NextResponse.json({ msg, sender: { id: selfId, name: r.user.name } }, { status: 201 });
}
