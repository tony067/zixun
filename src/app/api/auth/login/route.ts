import { NextResponse } from "next/server";

// Eazo 处理认证 — 此路由不使用
export async function POST() {
  return NextResponse.json({ error: "Use Eazo authentication" }, { status: 404 });
}
