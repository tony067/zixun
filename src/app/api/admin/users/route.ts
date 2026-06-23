import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { bookings } from "@/lib/db/schema/scheduling";
import { counselors } from "@/lib/db/schema/counselors";
import { eq, desc, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (auth.user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role"); // "visitor" | "counselor" | "admin" | null

  // 获取所有用户
  const allUsers = await db.select({
    id:        users.id,
    email:     users.email,
    name:      users.name,
    avatarUrl: users.avatarUrl,
    role:      users.role,
    createdAt: users.createdAt,
  }).from(users).orderBy(desc(users.createdAt));

  // 获取每个用户的订单数
  const bookingCounts = await db.select({
    clientId: bookings.clientId,
    cnt: count(bookings.id),
  }).from(bookings).groupBy(bookings.clientId);
  const bookingMap: Record<string, number> = {};
  bookingCounts.forEach(b => { bookingMap[b.clientId] = Number(b.cnt); });

  // 咨询师：获取接单数（counselor_id）
  const counselorBookingCounts = await db.select({
    counselorId: bookings.counselorId,
    cnt: count(bookings.id),
  }).from(bookings).groupBy(bookings.counselorId);
  const counselorBookingMap: Record<string, number> = {};
  counselorBookingCounts.forEach(b => { counselorBookingMap[b.counselorId] = Number(b.cnt); });

  // 咨询师 userId → counselorId 映射
  const allCounselors = await db.select({ id: counselors.id, userId: counselors.userId })
    .from(counselors);
  const userIdToCounselorId: Record<string, string> = {};
  allCounselors.forEach(c => { if (c.userId) userIdToCounselorId[c.userId] = c.id; });

  const result = allUsers
    .filter(u => !role || u.role === role)
    .map(u => {
      const counselorId = userIdToCounselorId[u.id];
      const bookingCount = u.role === "counselor"
        ? (counselorId ? (counselorBookingMap[counselorId] ?? 0) : 0)
        : (bookingMap[u.id] ?? 0);
      return {
        id:           u.id,
        email:        u.email ?? "",
        name:         u.name ?? u.email ?? u.id,
        avatarUrl:    u.avatarUrl,
        role:         u.role ?? "visitor",
        bookingCount,
        counselorId:  counselorId ?? null,
        createdAt:    u.createdAt,
      };
    });

  return NextResponse.json(result);
}
