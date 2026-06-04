import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const r = requireAuth(req);
  if (!r.ok) return r.response;
  const [user] = await db.select().from(users).where(eq(users.id, r.user.id));
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const r = requireAuth(req);
  if (!r.ok) return r.response;
  const { displayName, avatarUrl } = await req.json();
  const update: Record<string, string> = {};
  if (displayName) update.name = displayName;   // users表用name字段
  if (avatarUrl)   update.avatarUrl = avatarUrl;
  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  await db.update(users).set(update).where(eq(users.id, r.user.id));
  return NextResponse.json({ ok: true });
}
