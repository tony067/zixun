import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { saveAvatarFile } from "@/lib/uploads/avatar";
import { db } from "@/lib/db/client";
import { counselors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "没有上传文件" }, { status: 400 });
    }

    const url = await saveAvatarFile(file, auth.user.id);

    await db
      .update(counselors)
      .set({ avatarUrl: url })
      .where(eq(counselors.userId, auth.user.id));

    return NextResponse.json({ url, ok: true });
  } catch (e) {
    console.error("[counselor/avatar-upload] error:", e);
    const message = e instanceof Error ? e.message : "上传失败，请重试";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
