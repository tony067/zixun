import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getConversationMessages, sendMessage, getConversationOtherUser } from "@/lib/db/queries/messages";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const { id } = await params;
  const [msgs, otherUser] = await Promise.all([
    getConversationMessages(id),
    getConversationOtherUser(id, r.user.id),
  ]);
  return NextResponse.json({ msgs, otherUser });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const { id } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });
  const msg = await sendMessage({
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    conversationId: id,
    senderId: r.user.id,
    content: content.trim(),
  });
  return NextResponse.json({ msg, sender: { id: r.user.id, name: r.user.name } }, { status: 201 });
}
