import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const allowed = ["jpg", "jpeg", "png", "webp", "gif"];
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: "Only jpg/png/webp allowed" }, { status: 400 });
    }

    const filename = `${r.user.id}-${Date.now()}.${ext}`;
    const uploadDir = join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(join(uploadDir, filename), buffer);

    const url = `/uploads/avatars/${filename}`;
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[avatar-upload]", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
