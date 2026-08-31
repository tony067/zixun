import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getRules, createRule, deleteRule, findOverlappingRule } from "@/lib/db/queries/schedules";
import { getOrCreateCounselorForUser } from "@/lib/db/queries/counselors";

function timeEnd(start: string, dur: number): string {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + (m || 0) + dur;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const c = await getOrCreateCounselorForUser(auth.user.id, auth.user.name || "咨询师");
  if (!c) return NextResponse.json([], { status: 200 });
  const rules = await getRules(c.id);
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const c = await getOrCreateCounselorForUser(auth.user.id, auth.user.name || "咨询师");
  if (!c) return NextResponse.json({ error: "not counselor" }, { status: 403 });
  const body = await req.json();
  const weekdays = Array.isArray(body.weekdays) ? body.weekdays
    : typeof body.weekdays === "string" ? body.weekdays.split(",").map(Number).filter((n: number) => !isNaN(n))
    : [];
  const isSingle = body.mode === "single" || body.isSingle === true;
  const startTime = body.startTime;
  const duration = body.durationMinutes || 50;

  // 重叠检查
  const overlap = await findOverlappingRule(c.id, {
    weekdays: isSingle ? "" : weekdays.join(","),
    startTime,
    durationMinutes: duration,
    isSingle,
    singleDate: isSingle ? (body.singleDate || body.date || null) : null,
    singleTime: isSingle ? (body.singleTime || startTime || null) : null,
    validFrom: body.validFrom || null,
    validUntil: body.validUntil || null,
  });
  if (overlap) {
    const newStart = startTime;
    const newEnd = timeEnd(startTime, duration);
    const rStart = overlap.startTime ?? "?";
    const rEnd = overlap.endTime ?? "?";
    const ctx = overlap.singleDate
      ? `${overlap.singleDate} ${rStart}–${rEnd}`
      : `周${"一二三四五六日"[overlap.weekday ?? 0]} ${rStart}–${rEnd}`;
    return NextResponse.json({
      error: "overlap",
      message: `该时间段与已有规则冲突：${ctx}（你设置的是 ${newStart}–${newEnd}）`,
    }, { status: 409 });
  }

  const rule = await createRule({
    id: `rule_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    counselorId: c.id,
    type: body.type || "available",
    weekdays: isSingle ? "" : weekdays.join(","),
    startTime,
    durationMinutes: duration,
    validFrom: body.validFrom || null,
    validUntil: body.validUntil || null,
    fixedClientId: body.fixedClientId || null,
    blockNote: body.blockNote || null,
    isSingle,
    singleDate: isSingle ? (body.singleDate || body.date || null) : null,
    singleTime: isSingle ? (body.singleTime || startTime || null) : null,
    isActive: true,
  });
  return NextResponse.json(rule, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const c = await getOrCreateCounselorForUser(auth.user.id, auth.user.name || "咨询师");
  if (!c) return NextResponse.json({ error: "not counselor" }, { status: 403 });
  const { id } = await req.json();
  await deleteRule(id, c.id);
  return NextResponse.json({ ok: true });
}

