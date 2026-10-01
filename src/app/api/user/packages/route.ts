import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getClientPackages } from "@/lib/db/queries/packages";

// 来访的套餐账户列表（含剩余次数与咨询师信息）
export async function GET(req: NextRequest) {
  const r = await requireAuth(req);
  if (!r.ok) return r.response;
  const list = await getClientPackages(r.user.id);
  return NextResponse.json({ packages: list });
}
