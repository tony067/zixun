import { NextRequest, NextResponse } from "next/server";
import { computeAvailableDays } from "@/lib/scheduling/slots";

/**
 * 公开接口：返回指定咨询师未来 N 天的可预约时间
 * 根据循环规则 + 单次规则，减去已被屏蔽、已预约的时段
 * （计算逻辑统一在 src/lib/scheduling/slots.ts，与预约创建校验共用）
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const url = new URL(req.url);
  const days = Math.min(60, Math.max(1, parseInt(url.searchParams.get("days") || "30")));

  const result = await computeAvailableDays(id, days);
  return NextResponse.json({ days: result });
}
