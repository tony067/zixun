import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getCounselorByUserId } from "@/lib/db/queries/counselors";
import { updateService } from "@/lib/db/queries/services";

/** 编辑 / 上架下架（仅归属老师可操作） */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const c = await getCounselorByUserId(r.user.id);
  if (!c) return NextResponse.json({ error: "not_counselor" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    if (!String(body.name).trim()) return NextResponse.json({ error: "Missing name" }, { status: 400 });
    data.name = String(body.name).trim();
  }
  if (body.tagline !== undefined) data.tagline = body.tagline ? String(body.tagline).trim() : null;
  if (body.description !== undefined) data.description = body.description ? String(body.description) : null;
  if (body.price !== undefined) {
    const p = Number(body.price) || 0;
    if (p <= 0) return NextResponse.json({ error: "价格必须大于0" }, { status: 400 });
    data.price = p;
  }
  if (body.questions !== undefined) data.questions = Array.isArray(body.questions) ? body.questions : [];
  if (body.questionnaireLink !== undefined) data.questionnaireLink = String(body.questionnaireLink).trim() || null;
  if (body.status !== undefined) data.status = body.status === "inactive" ? "inactive" : "active";

  const updated = await updateService(id, c.id, data);
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(updated);
}

/** 下架（软删除：status=inactive，保留历史订单可查） */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const c = await getCounselorByUserId(r.user.id);
  if (!c) return NextResponse.json({ error: "not_counselor" }, { status: 403 });

  const { id } = await params;
  const updated = await updateService(id, c.id, { status: "inactive" });
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(updated);
}
