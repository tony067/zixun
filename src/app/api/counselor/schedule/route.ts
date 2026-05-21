import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getCounselorByUserId } from "@/lib/db/queries/counselors";
import { getRules, createRule, deleteRule } from "@/lib/db/queries/schedules";
import { nanoid } from "nanoid";

export async function GET(req: NextRequest) {
  const r = requireAuth(req);
  if (!r.ok) return r.response;
  const counselor = await getCounselorByUserId(r.user.id);
  if (!counselor) return NextResponse.json([]);
  return NextResponse.json(await getRules(counselor.id));
}

export async function POST(req: NextRequest) {
  const r = requireAuth(req);
  if (!r.ok) return r.response;
  const counselor = await getCounselorByUserId(r.user.id);
  if (!counselor) return NextResponse.json({ error: "no counselor profile" }, { status: 403 });

  const body = await req.json();
  const rule = await createRule({
    id: nanoid(),
    counselorId: counselor.id,
    type: body.type ?? "available",
    weekdays: body.weekdays ?? null,
    startTime: body.startTime ?? null,
    durationMinutes: body.durationMinutes ?? 50,
    validFrom: body.validFrom ?? null,
    validUntil: body.validUntil ?? null,
    fixedClientId: body.fixedClientId || null,
    blockNote: body.blockNote || null,
    isSingle: body.isSingle ?? false,
    singleDate: body.singleDate ?? null,
    singleTime: body.singleTime ?? null,
  });
  return NextResponse.json(rule, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const r = requireAuth(req);
  if (!r.ok) return r.response;
  const counselor = await getCounselorByUserId(r.user.id);
  if (!counselor) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { id } = await req.json();
  await deleteRule(id, counselor.id);
  return NextResponse.json({ ok: true });
}
