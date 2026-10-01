import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema/scheduling";
import { serviceOrders } from "@/lib/db/schema/services";
import { counselors } from "@/lib/db/schema/counselors";
import { users } from "@/lib/db/schema/users";
import { eq, and, gte, lte, inArray, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
  const counselorId = searchParams.get("counselorId"); // 可选，不传则返回所有

  const fromDate = new Date(year, month - 1, 1);
  const toDate   = new Date(year, month, 0, 23, 59, 59); // 该月最后一天末尾

  // 咨询订单：按咨询时间（scheduledAt）落月，已完成
  const bkConds = [
    gte(bookings.scheduledAt, fromDate),
    lte(bookings.scheduledAt, toDate),
    eq(bookings.status, "completed"),
  ];
  if (counselorId) bkConds.push(eq(bookings.counselorId, counselorId));
  const bkRows = await db.select({
    id: bookings.id, at: bookings.scheduledAt, priceAmount: bookings.priceAmount,
    counselorId: bookings.counselorId, clientId: bookings.clientId, clientNote: bookings.clientNote,
  }).from(bookings).where(and(...bkConds)).orderBy(desc(bookings.scheduledAt));

  // 评估订单：按支付时间（paidAt，无则 createdAt）落月，已付款即计入
  const svcConds = [
    gte(serviceOrders.paidAt, fromDate),
    lte(serviceOrders.paidAt, toDate),
    inArray(serviceOrders.status, ["paid", "submitted", "completed"]),
  ];
  if (counselorId) svcConds.push(eq(serviceOrders.counselorId, counselorId));
  const svcRows = await db.select({
    id: serviceOrders.id, at: serviceOrders.paidAt, createdAt: serviceOrders.createdAt,
    priceAmount: serviceOrders.price, counselorId: serviceOrders.counselorId,
    clientId: serviceOrders.clientId, serviceName: serviceOrders.serviceName,
  }).from(serviceOrders).where(and(...svcConds)).orderBy(desc(serviceOrders.paidAt));

  // 批量拉咨询师与来访者姓名（inArray 一次查询）
  const counselorIds = [...new Set([...bkRows.map(r => r.counselorId), ...svcRows.map(r => r.counselorId)])];
  const clientIds    = [...new Set([...bkRows.map(r => r.clientId), ...svcRows.map(r => r.clientId)])];

  const counselorRows = counselorIds.length
    ? await db.select({ id: counselors.id, displayName: counselors.displayName }).from(counselors).where(inArray(counselors.id, counselorIds))
    : [];
  const counselorMap: Record<string, string> = {};
  counselorRows.forEach(c => { counselorMap[c.id] = c.displayName ?? c.id; });

  const clientRows = clientIds.length
    ? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, clientIds))
    : [];
  const clientMap: Record<string, string> = {};
  clientRows.forEach(u => { clientMap[u.id] = u.name ?? u.id; });

  const fmtDate = (d: Date | null) => d
    ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` : "";
  const fmtTime = (d: Date | null) => d
    ? `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}` : "";

  const bkItems = bkRows.map(r => ({
    id: r.id, type: "booking" as const,
    scheduledDate: fmtDate(r.at ? new Date(r.at) : null),
    scheduledTime: fmtTime(r.at ? new Date(r.at) : null),
    priceAmount: r.priceAmount ?? 0,
    counselorId: r.counselorId, counselorName: counselorMap[r.counselorId] ?? r.counselorId,
    clientId: r.clientId, clientName: clientMap[r.clientId] ?? r.clientId,
    note: r.clientNote ?? "",
  }));

  const svcItems = svcRows.map(r => ({
    id: r.id, type: "service" as const,
    scheduledDate: fmtDate(r.at ? new Date(r.at) : (r.createdAt ? new Date(r.createdAt) : null)),
    scheduledTime: fmtTime(r.at ? new Date(r.at) : (r.createdAt ? new Date(r.createdAt) : null)),
    priceAmount: r.priceAmount ?? 0,
    counselorId: r.counselorId, counselorName: counselorMap[r.counselorId] ?? r.counselorId,
    clientId: r.clientId, clientName: clientMap[r.clientId] ?? r.clientId,
    note: r.serviceName ?? "",
  }));

  // 咨询在前、评估在后，各自按时间倒序
  const items = [...bkItems, ...svcItems];
  const total = items.reduce((s, r) => s + r.priceAmount, 0);

  return NextResponse.json({ year, month, items, total });
}
