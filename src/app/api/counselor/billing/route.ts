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

  const { searchParams } = new URL(req.url);
  const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  const fromDate = new Date(year, month - 1, 1);
  const toDate   = new Date(year, month, 0, 23, 59, 59);

  // 先找这个用户对应的 counselor 记录
  const counselorRow = await db.select({ id: counselors.id })
    .from(counselors).where(eq(counselors.userId, auth.user.id)).limit(1);

  if (!counselorRow[0]) {
    return NextResponse.json({ error: "not a counselor" }, { status: 403 });
  }
  const counselorId = counselorRow[0].id;

  const rows = await db
    .select({
      id:            bookings.id,
      scheduledDate: bookings.scheduledDate,
      scheduledTime: bookings.scheduledTime,
      priceAmount:   bookings.priceAmount,
      clientId:      bookings.clientId,
      clientNote:    bookings.clientNote,
    })
    .from(bookings)
    .where(and(
      eq(bookings.counselorId, counselorId),
      eq(bookings.status, "completed"),
      gte(bookings.scheduledDate, from),
      lte(bookings.scheduledDate, to),
    ))
    .orderBy(desc(bookings.scheduledDate));

  const clientMap: Record<string, string> = {};
  for (const r of rows) {
    if (!clientMap[r.clientId]) {
      const u = await db.select({ name: users.name })
        .from(users).where(eq(users.id, r.clientId)).limit(1);
      clientMap[r.clientId] = u[0]?.name ?? "来访者";
    }
  }

  const items = rows.map(r => ({
    id:            r.id,
    scheduledDate: r.scheduledDate,
    scheduledTime: r.scheduledTime,
    priceAmount:   r.priceAmount ?? 0,
    clientName:    clientMap[r.clientId] ?? "来访者",
    clientNote:    r.clientNote ?? "",
  }));

  const total = items.reduce((s, r) => s + r.priceAmount, 0);

  return NextResponse.json({ year, month, counselorId, items, total });
}
