import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema/scheduling";
import { counselors } from "@/lib/db/schema/counselors";
import { users } from "@/lib/db/schema/users";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  if (auth.user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
  const counselorId = searchParams.get("counselorId"); // 可选，不传则返回所有

  const from = `${year}-${String(month).padStart(2,"0")}-01`;
  const toDate = new Date(year, month, 0); // 该月最后一天
  const to   = `${year}-${String(month).padStart(2,"0")}-${String(toDate.getDate()).padStart(2,"0")}`;

  // 查询完成的订单
  const conditions = [
    gte(bookings.scheduledDate, from),
    lte(bookings.scheduledDate, to),
    eq(bookings.status, "completed"),
  ];
  if (counselorId) conditions.push(eq(bookings.counselorId, counselorId));

  const rows = await db
    .select({
      id:            bookings.id,
      scheduledDate: bookings.scheduledDate,
      scheduledTime: bookings.scheduledTime,
      priceAmount:   bookings.priceAmount,
      status:        bookings.status,
      counselorId:   bookings.counselorId,
      clientId:      bookings.clientId,
      clientNote:    bookings.clientNote,
    })
    .from(bookings)
    .where(and(...conditions))
    .orderBy(desc(bookings.scheduledDate));

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

  const items = rows.map(r => ({
    id:            r.id,
    scheduledDate: r.scheduledDate,
    scheduledTime: r.scheduledTime,
    priceAmount:   r.priceAmount ?? 0,
    counselorId:   r.counselorId,
    counselorName: counselorMap[r.counselorId] ?? r.counselorId,
    clientId:      r.clientId,
    clientName:    clientMap[r.clientId] ?? r.clientId,
    clientNote:    r.clientNote ?? "",
  }));

  const total = items.reduce((s, r) => s + r.priceAmount, 0);

  return NextResponse.json({ year, month, items, total });
}
