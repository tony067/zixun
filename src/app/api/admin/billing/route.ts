import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema/scheduling";
import { counselors } from "@/lib/db/schema/counselors";
import { users } from "@/lib/db/schema/users";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (auth.user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
  const counselorId = searchParams.get("counselorId"); // 可选，不传则返回所有

  // scheduledAt 是 timestamp，用 Date 范围筛选
  const fromDate = new Date(year, month - 1, 1);
  const toDate   = new Date(year, month, 0, 23, 59, 59); // 该月最后一天末尾

  // 查询完成的订单
  const conditions = [
    gte(bookings.scheduledAt, fromDate),
    lte(bookings.scheduledAt, toDate),
    eq(bookings.status, "completed"),
  ];
  if (counselorId) conditions.push(eq(bookings.counselorId, counselorId));

  const rows = await db
    .select({
      id:          bookings.id,
      scheduledAt: bookings.scheduledAt,
      priceAmount: bookings.priceAmount,
      status:      bookings.status,
      counselorId: bookings.counselorId,
      clientId:    bookings.clientId,
      clientNote:  bookings.clientNote,
    })
    .from(bookings)
    .where(and(...conditions))
    .orderBy(desc(bookings.scheduledAt));

  // 批量拉咨询师和来访者姓名
  const counselorIds = [...new Set(rows.map(r => r.counselorId))];
  const clientIds    = [...new Set(rows.map(r => r.clientId))];

  const counselorList = counselorIds.length
    ? await db.select({ id: counselors.id, displayName: counselors.displayName })
        .from(counselors).where(eq(counselors.id, counselorIds[0]))  // 单条查询兜底
    : [];

  // 多条用 inArray 需要 drizzle-orm v0.30+，兼容写法：逐个 map
  const counselorMap: Record<string, string> = {};
  for (const cid of counselorIds) {
    const c = await db.select({ displayName: counselors.displayName })
      .from(counselors).where(eq(counselors.id, cid)).limit(1);
    counselorMap[cid] = c[0]?.displayName ?? cid;
  }

  const clientMap: Record<string, string> = {};
  for (const uid of clientIds) {
    const u = await db.select({ name: users.name })
      .from(users).where(eq(users.id, uid)).limit(1);
    clientMap[uid] = u[0]?.name ?? uid;
  }

  const items = rows.map(r => {
    const d = r.scheduledAt ? new Date(r.scheduledAt) : null;
    const scheduledDate = d
      ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
      : "";
    const scheduledTime = d
      ? `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`
      : "";
    return {
      id:            r.id,
      scheduledDate,
      scheduledTime,
      priceAmount:   r.priceAmount ?? 0,
      counselorId:   r.counselorId,
      counselorName: counselorMap[r.counselorId] ?? r.counselorId,
      clientId:      r.clientId,
      clientName:    clientMap[r.clientId] ?? r.clientId,
      clientNote:    r.clientNote ?? "",
    };
  });

  const total = items.reduce((s, r) => s + r.priceAmount, 0);

  return NextResponse.json({ year, month, items, total });
}
