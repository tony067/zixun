import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// 头像上传已改为前端直接 storage.upload()，此路由仅作兼容保留
export async function POST(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  return NextResponse.json({ error: "Use client-side storage.upload() instead" }, { status: 410 });
}
