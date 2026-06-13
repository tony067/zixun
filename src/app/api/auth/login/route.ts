import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/db/queries/users";
import { signToken } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    const user = await getUserByEmail(email.toLowerCase().trim());
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

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
    console.error("[login]", e);
    return NextResponse.json({ error: "服务器错误，请稍后重试" }, { status: 500 });
  }
}

