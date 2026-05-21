import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getRules, createRule, deleteRule } from "@/lib/db/queries/schedules";
import { getCounselorByUserId } from "@/lib/db/queries/counselors";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const c = await getCounselorByUserId(auth.user.id);
  if (!c) return NextResponse.json([], { status: 200 });
  const rules = await getRules(c.id);
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const c = await getCounselorByUserId(auth.user.id);
  if (!c) return NextResponse.json({ error: "not counselor" }, { status: 403 });
  const body = await req.json();
  const rule = await createRule({
    id: `rule_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    counselorId: c.id,
    ...body,
  });
  return NextResponse.json(rule, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const c = await getCounselorByUserId(auth.user.id);
  if (!c) return NextResponse.json({ error: "not counselor" }, { status: 403 });
  const { id } = await req.json();
  await deleteRule(id, c.id);
  return NextResponse.json({ ok: true });
}
