import { NextResponse } from "next/server";

// Eazo 处理注册 — 此路由不使用
export async function POST() {
  return NextResponse.json({ error: "Use Eazo authentication" }, { status: 404 });
}

// 以下仅保留编译用占位，不执行
const _x = null;
import { v4 as uuidv4 } from "uuid";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + (process.env.JWT_SECRET ?? "mindpace")).digest("hex");
}

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "请填写所有必填项" }, { status: 400 });
  }

  const existing = await db.execute(
    sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`
  ) as unknown as Array<{ id: string }>;

  if (existing.length > 0) {
    return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
  }

  const id = uuidv4();
  const passwordHash = hashPassword(password);

  await db.execute(
    sql`INSERT INTO users (id, email, name, password_hash, created_at) VALUES (${id}, ${email.toLowerCase()}, ${name}, ${passwordHash}, NOW())`
  );

  const tokenUser = { id, email: email.toLowerCase(), name };
  const token = await signToken(tokenUser);

  return NextResponse.json({ token, user: tokenUser }, { status: 201 });
}
