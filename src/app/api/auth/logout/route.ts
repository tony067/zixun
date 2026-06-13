import { NextResponse } from "next/server";

/**
 * 登出端点 — JWT 是无状态的，真正的登出在客户端清除 localStorage token
 * 此路由仅作为语义上的出口，客户端 AuthProvider.logout() 会调用它（可选）
 */
export async function POST() {
  return NextResponse.json({ ok: true });
}
