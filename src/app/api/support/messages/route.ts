import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

// 确保 support_messages 表存在
async function ensureTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS support_messages (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function GET(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  await ensureTable();
  const rows = await db.execute(sql`
    SELECT id, sender_id as "senderId", content, is_admin as "isAdmin", created_at as "createdAt"
    FROM support_messages
    WHERE user_id = ${r.user.id}
    ORDER BY created_at ASC
    LIMIT 100
  `);
  return NextResponse.json({ messages: rows });
}

export async function POST(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  await ensureTable();
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });
  await db.execute(sql`
    INSERT INTO support_messages (user_id, sender_id, content, is_admin)
    VALUES (${r.user.id}, ${r.user.id}, ${content.trim()}, FALSE)
  `);
  return NextResponse.json({ ok: true });
}
