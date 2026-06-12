import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { signToken } from "@/lib/auth";
import * as crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + process.env.JWT_SECRET).digest("hex");
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
  }

  const result = await db.execute(
    "SELECT id, email, name, avatar_url, password_hash FROM users WHERE email = $1",
    [email.toLowerCase()]
  );

  const user = (result as { rows: Array<{ id: string; email: string; name: string; avatar_url: string; password_hash: string }> }).rows[0];

  if (!user) {
    return NextResponse.json({ error: "邮箱或密码不正确" }, { status: 401 });
  }

  const hash = hashPassword(password);
  if (user.password_hash !== hash) {
    return NextResponse.json({ error: "邮箱或密码不正确" }, { status: 401 });
  }

  const tokenUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
  };

  const token = await signToken(tokenUser);

  return NextResponse.json({ token, user: tokenUser });
}
