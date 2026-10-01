import { NextRequest, NextResponse } from "next/server";
import { getServiceById } from "@/lib/db/queries/services";

/** 服务详情（上架状态即可看，购买后才有订单） */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getServiceById(id);
  if (!s || s.status !== "active") return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(s);
}
