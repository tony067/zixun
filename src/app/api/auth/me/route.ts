import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getUserById } from "@/lib/db/queries/users";

/** 页面刷新时 AuthProvider 调此接口恢复会话，返回数据库里的完整用户信息（包含 role） */
export async function GET(req: NextRequest) {
  const result = await requireAuth(req);
  if (!result.ok) return result.response;

  // 从数据库取完整用户信息，包括 role 字段
  const dbUser = await getUserById(result.user.id);
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatarUrl: dbUser.avatarUrl,
      role: dbUser.role ?? "visitor",
    },
  });
}
