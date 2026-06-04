import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { storage } from "@eazo/sdk";

export async function POST(req: NextRequest) {
  const r = requireAuth(req);
  if (!r.ok) return r.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `avatars/${r.user.id}/${Date.now()}.${ext}`;

    // Get presigned upload credentials
    const creds = await storage.getCredentials(path);
    
    // Upload to S3 using presigned URL
    const buf = await file.arrayBuffer();
    const uploadRes = await fetch(creds.uploadUrl, {
      method: "PUT",
      body: buf,
      headers: { "Content-Type": file.type || "image/jpeg" },
    });

    if (!uploadRes.ok) {
      return NextResponse.json({ error: "upload failed" }, { status: 500 });
    }

    return NextResponse.json({ url: creds.publicUrl });
  } catch (err) {
    console.error("avatar upload error:", err);
    return NextResponse.json({ error: "upload error" }, { status: 500 });
  }
}
