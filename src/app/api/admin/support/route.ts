import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

// GET: 所有用户的客服消息列表（管理员）
export async function GET(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const rows = await db.execute(sql`
    SELECT DISTINCT ON (user_id) user_id as "userId",
      content as "lastMessage", created_at as "lastAt", is_admin as "isAdmin"
    FROM support_messages
    ORDER BY user_id, created_at DESC
  `);
  return NextResponse.json({ threads: rows });
}

// POST: 管理员回复某用户
export async function POST(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const { userId, content } = await req.json();
  await db.execute(sql`
    INSERT INTO support_messages (user_id, sender_id, content, is_admin)
    VALUES (${userId}, ${r.user.id}, ${content}, TRUE)
  `);
  return NextResponse.json({ ok: true });
}
