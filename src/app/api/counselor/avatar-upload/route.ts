import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { storage } from "@eazo/sdk";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const { filename, contentType } = await req.json();
    const ext = filename?.split(".").pop() ?? "jpg";
    const key = `avatars/${auth.user.id}/${Date.now()}.${ext}`;

    const { uploadUrl, url } = await storage.getUploadUrl({
      key,
      contentType: contentType ?? "image/jpeg",
      expiresIn: 300,
    });

    return NextResponse.json({ uploadUrl, url, key });
  } catch (e) {
    console.error("avatar-upload error:", e);
    return NextResponse.json({ error: "上传失败，请重试" }, { status: 500 });
  }
}
