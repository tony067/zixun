import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema/scheduling";
import { counselors } from "@/lib/db/schema/counselors";
import { users } from "@/lib/db/schema";
import { sql, count, sum } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  try {
    // 总用户数
    const [totalUsersRow] = await db.select({ count: count() }).from(users);
    // 本月新增用户
    const [monthUsersRow] = await db.select({ count: count() }).from(users)
      .where(sql`created_at >= ${monthStart}`);
    // 上月新增用户
    const [lastMonthUsersRow] = await db.select({ count: count() }).from(users)
      .where(sql`created_at >= ${lastMonthStart} AND created_at < ${monthStart}`);

    // 本月订单数
    const [monthOrdersRow] = await db.select({ count: count() }).from(bookings)
      .where(sql`created_at >= ${monthStart}`);
    // 上月订单数
    const [lastMonthOrdersRow] = await db.select({ count: count() }).from(bookings)
      .where(sql`created_at >= ${lastMonthStart} AND created_at < ${monthStart}`);

    // 累计订单
    const [totalOrdersRow] = await db.select({ count: count() }).from(bookings);

    // 咨询师已上线数量
    const [activeCounselorsRow] = await db.select({ count: count() }).from(counselors)
      .where(sql`review_status = 'approved'`);

    // 本月应收（已完成或已支付的订单金额之和）
    const [monthRevenueRow] = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(price_per_session AS NUMERIC)), 0)`
    }).from(bookings)
      .where(sql`created_at >= ${monthStart} AND status IN ('completed', 'paid')`);

    // 累计应收
    const [totalRevenueRow] = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(price_per_session AS NUMERIC)), 0)`
    }).from(bookings)
      .where(sql`status IN ('completed', 'paid')`);

    // 待审核咨询师
    const [pendingCounselorsRow] = await db.select({ count: count() }).from(counselors)
      .where(sql`review_status = 'submitted'`);

    const totalUsers = totalUsersRow.count;
    const monthUsers = monthUsersRow.count;
    const lastMonthUsers = lastMonthUsersRow.count;
    const monthOrders = monthOrdersRow.count;
    const lastMonthOrders = lastMonthOrdersRow.count;
    const totalOrders = totalOrdersRow.count;
    const activeCounselors = activeCounselorsRow.count;
    const monthRevenue = parseFloat(monthRevenueRow.total ?? "0");
    const totalRevenue = parseFloat(totalRevenueRow.total ?? "0");
    const pendingCounselors = pendingCounselorsRow.count;

    const orderChange = lastMonthOrders > 0
      ? Math.round(((monthOrders - lastMonthOrders) / lastMonthOrders) * 100)
      : 0;
    const userChange = lastMonthUsers > 0
      ? Math.round(((monthUsers - lastMonthUsers) / lastMonthUsers) * 100)
      : 0;

    return NextResponse.json({
      totalUsers,
      monthUsers,
      userChange,
      monthOrders,
      orderChange,
      totalOrders,
      activeCounselors,
      pendingCounselors,
      monthRevenue,
      totalRevenue,
    });
  } catch (e) {
    console.error("[admin stats]", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
