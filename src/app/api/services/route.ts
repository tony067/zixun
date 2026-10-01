import { NextRequest, NextResponse } from "next/server";
import { getActiveServices, getCounselorServices } from "@/lib/db/queries/services";

/**
 * 上架中的个性服务列表（来访端浏览）
 * ?counselorId=xx → 指定老师的全部服务（含下架，供档案页展示；仅返回上架的在来访端展示）
 */
export async function GET(req: NextRequest) {
  const counselorId = req.nextUrl.searchParams.get("counselorId");
  if (counselorId) {
    const list = await getCounselorServices(counselorId);
    return NextResponse.json(list.filter(s => s.status === "active"));
  }
  const list = await getActiveServices();
  return NextResponse.json(list);
}
