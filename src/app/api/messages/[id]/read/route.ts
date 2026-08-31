import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { markConversationRead } from "@/lib/db/queries/messages";

/** POST /api/messages/[id]/read → 标记某会话所有"别人发"的消息为已读 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const { id } = await params;
  await markConversationRead(id, r.user.id);
  return NextResponse.json({ ok: true });
}
