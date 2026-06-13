import { NextResponse } from "next/server";

// Eazo 处理注册 — 此路由不使用
export async function POST() {
  return NextResponse.json({ error: "Use Eazo authentication" }, { status: 404 });
}

// 以下仅保留编译用占位，不执行
const _x = null;
export {};
