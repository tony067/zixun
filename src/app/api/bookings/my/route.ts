import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema/scheduling";
import { counselors } from "@/lib/db/schema/counselors";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  const { id: clientId } = auth.user;

  const rows = await db.select().from(bookings).where(eq(bookings.clientId, clientId));

  // 补充咨询师信息
  const result = await Promise.all(rows.map(async b => {
    const [c] = await db.select({
      id: counselors.id,
      displayName: counselors.displayName,
      avatarUrl: counselors.avatarUrl,
      counselorTypes: counselors.counselorTypes,
    }).from(counselors).where(eq(counselors.id, b.counselorId));
    return { ...b, counselor: c ?? null };
  }));

  // 按时间排序：未来的在前，过去的在后
  result.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return NextResponse.json(result);
}
