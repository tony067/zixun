import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { getUserByEmail, upsertUser } from "@/lib/db/queries/users";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";
import { signToken } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    const existing = await getUserByEmail(email.toLowerCase().trim());
    if (existing) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }

    const id = nanoid();
    const passwordHash = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      id,
      email: email.toLowerCase().trim(),
      name: name?.trim() || null,
      passwordHash,
    });

    const user = await getUserByEmail(email.toLowerCase().trim());
    if (!user) throw new Error("Insert failed");

    const token = await signToken({
      sub: user.id,
      email: user.email ?? "",
      name: user.name,
      avatarUrl: user.avatarUrl,
    });

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
    });
  } catch (e) {
    console.error("[register]", e);
    return NextResponse.json({ error: "注册失败，请稍后重试" }, { status: 500 });
  }
}

