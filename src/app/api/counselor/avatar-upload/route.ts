import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { storage } from "@eazo/sdk";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const { path } = await req.json();
    const key = path ?? `avatars/${auth.user.id}/${Date.now()}.jpg`;
    const creds = await storage.getCredentials(key);
    return NextResponse.json({ uploadUrl: creds.uploadUrl, url: creds.publicUrl, key: creds.key });
  } catch (e) {
    console.error("avatar-upload error:", e);
    return NextResponse.json({ error: "上传失败，请重试" }, { status: 500 });
  }
}
