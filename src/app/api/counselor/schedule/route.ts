import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getRules, createRule, deleteRule } from "@/lib/db/queries/schedules";
import { getOrCreateCounselorForUser } from "@/lib/db/queries/counselors";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const c = await getOrCreateCounselorForUser(auth.user.id, auth.user.name || "咨询师");
  if (!c) return NextResponse.json([], { status: 200 });
  const rules = await getRules(c.id);
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const c = await getOrCreateCounselorForUser(auth.user.id, auth.user.name || "咨询师");
  if (!c) return NextResponse.json({ error: "not counselor" }, { status: 403 });
  const body = await req.json();
  // weekdays 存为 JSON 数组
  const weekdays = Array.isArray(body.weekdays) ? body.weekdays
    : typeof body.weekdays === "string" ? body.weekdays.split(",").map(Number).filter((n: number) => !isNaN(n))
    : [];
  const rule = await createRule({
    id: `rule_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    counselorId: c.id,
    mode: body.mode || "recurring",
    type: body.type || "available",
    weekdays,
    startTime: body.startTime,
    durationMinutes: body.durationMinutes || 50,
    validFrom: body.validFrom || null,
    validUntil: body.validUntil || null,
    fixedClientId: body.fixedClientId || null,
    blockNote: body.blockNote || null,
    isSingle: body.isSingle || false,
    date: body.date || null,
    isActive: true,
  });
  return NextResponse.json(rule, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const c = await getOrCreateCounselorForUser(auth.user.id, auth.user.name || "咨询师");
  if (!c) return NextResponse.json({ error: "not counselor" }, { status: 403 });
  const { id } = await req.json();
  await deleteRule(id, c.id);
  return NextResponse.json({ ok: true });
}

