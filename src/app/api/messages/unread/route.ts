import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getTotalUnreadCount } from "@/lib/db/queries/messages";

/** GET /api/messages/unread → 返回当前用户总未读消息数（用于底部导航红点） */
export async function GET(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const count = await getTotalUnreadCount(r.user.id);
  return NextResponse.json({ count });
}
