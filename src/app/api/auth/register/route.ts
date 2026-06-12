import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { signToken } from "@/lib/auth";
import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + process.env.JWT_SECRET).digest("hex");
}

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "请填写所有必填项" }, { status: 400 });
  }

  // 检查邮箱是否已注册
  const existing = await db.execute(
    "SELECT id FROM users WHERE email = $1",
    [email.toLowerCase()]
  );

  if ((existing as { rows: unknown[] }).rows.length > 0) {
    return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
  }

  const id = uuidv4();
  const passwordHash = hashPassword(password);

  await db.execute(
    `INSERT INTO users (id, email, name, password_hash, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [id, email.toLowerCase(), name, passwordHash]
  );

  const tokenUser = { id, email: email.toLowerCase(), name };
  const token = await signToken(tokenUser);

  return NextResponse.json({ token, user: tokenUser }, { status: 201 });
}
