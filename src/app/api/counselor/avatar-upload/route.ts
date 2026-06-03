import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { storage } from "@eazo/sdk";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const { filename, contentType } = await req.json();
    if (!filename || !contentType) {
      return NextResponse.json({ error: "missing filename or contentType" }, { status: 400 });
    }

    const ext = filename.split(".").pop() ?? "jpg";
    const path = `avatars/${auth.user.id}/${Date.now()}.${ext}`;

    // 获取预签名上传 URL（有效期 5 分钟）
    const { uploadUrl, url: cdnUrl } = await storage.getUploadUrl(path, {
      contentType,
      expiresIn: 300,
    });

    return NextResponse.json({ uploadUrl, cdnUrl });
  } catch (e) {
    console.error("[avatar-upload]", e);
    return NextResponse.json({ error: "failed to get upload url" }, { status: 500 });
  }
}
