import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getCounselorByUserId } from "@/lib/db/queries/counselors";
import { saveReportFile } from "@/lib/uploads/report";

/** 评估报告文件上传（仅老师可用） */
export async function POST(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;

  const c = await getCounselorByUserId(r.user.id);
  if (!c) return NextResponse.json({ error: "not_counselor" }, { status: 403 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const url = await saveReportFile(file, c.id);
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[report-upload]", e);
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
