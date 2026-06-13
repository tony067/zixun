import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/** 页面刷新时 AuthProvider 调此接口恢复会话 */
export async function GET(req: NextRequest) {
  const result = await requireAuth(req);
  if (!result.ok) return result.response;
  return NextResponse.json({ user: result.user });
}
