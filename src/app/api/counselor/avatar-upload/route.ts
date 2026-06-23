import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "没有上传文件" }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
    const allowed = ["jpg", "jpeg", "png", "webp", "gif"];
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: "仅支持 JPG / PNG / WebP 格式" }, { status: 400 });
    }

    const filename = `${auth.user.id}_${Date.now()}.${ext}`;
    // 优先使用环境变量，否则使用项目根目录
    const appRoot = process.env.APP_ROOT ?? process.cwd();
    const uploadDir = path.join(appRoot, "public", "uploads", "avatars");

    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/avatars/${filename}`;
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[counselor/avatar-upload] error:", e);
    return NextResponse.json({ error: "上传失败，请重试" }, { status: 500 });
  }
}
