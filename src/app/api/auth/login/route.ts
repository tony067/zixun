import { NextResponse } from "next/server";

// Eazo 处理认证 — 此路由不使用
export async function POST() {
  return NextResponse.json({ error: "Use Eazo authentication" }, { status: 404 });
}

async function _unused(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
  }

  const rows = await db.execute(
    sql`SELECT id, email, name, avatar_url, password_hash FROM users WHERE email = ${email.toLowerCase()}`
  ) as unknown as Array<{ id: string; email: string; name: string; avatar_url: string; password_hash: string }>;

  const user = rows[0];

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
