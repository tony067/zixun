import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getCounselorByUserId } from "@/lib/db/queries/counselors";
import { getCounselorServices, createService } from "@/lib/db/queries/services";

/** 我（老师）的评估服务列表 + 新建 */
export async function GET(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const c = await getCounselorByUserId(r.user.id);
  if (!c) return NextResponse.json([]);
  return NextResponse.json(await getCounselorServices(c.id));
}

export async function POST(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const c = await getCounselorByUserId(r.user.id);
  if (!c) return NextResponse.json({ error: "not_counselor" }, { status: 403 });

  const body = await req.json();
  const { name, tagline, description, price, questions, questionnaireLink } = body;
  if (!name || !String(name).trim()) return NextResponse.json({ error: "Missing name" }, { status: 400 });
  const priceNum = Number(price) || 0;
  if (priceNum <= 0) return NextResponse.json({ error: "价格必须大于0" }, { status: 400 });

  const service = await createService({
    id: `sv_${Date.now()}`,
    counselorId: c.id,
    type: "assessment",
    name: String(name).trim(),
    tagline: tagline ? String(tagline).trim() : null,
    description: description ? String(description) : null,
    price: priceNum,
    questions: Array.isArray(questions) ? questions : [],
    questionnaireLink: questionnaireLink && String(questionnaireLink).trim() ? String(questionnaireLink).trim() : null,
    status: "active",
  });
  return NextResponse.json(service, { status: 201 });
}
