import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema/scheduling";
import { serviceOrders } from "@/lib/db/schema/services";
import { counselors } from "@/lib/db/schema/counselors";
import { users } from "@/lib/db/schema";
import { sql, count, sum, eq, gt } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  try {
    // 「新增订单」红点：上次查看订单管理之后新产生的订单（咨询 + 个性服务）
    const [meRow] = await db.select({ seen: users.ordersLastSeenAt }).from(users)
      .where(eq(users.id, auth.user.id));
    const seenAt = meRow?.seen ?? new Date(0);
    const [newBkRow] = await db.select({ count: count() }).from(bookings)
      .where(gt(bookings.createdAt, seenAt));
    const [newSvcRow] = await db.select({ count: count() }).from(serviceOrders)
      .where(gt(serviceOrders.createdAt, seenAt));

    // 总用户数
    const [totalUsersRow] = await db.select({ count: count() }).from(users);
    // 本月新增用户
    const [monthUsersRow] = await db.select({ count: count() }).from(users)
      .where(sql`created_at >= ${monthStart}`);
    // 上月新增用户
    const [lastMonthUsersRow] = await db.select({ count: count() }).from(users)
      .where(sql`created_at >= ${lastMonthStart} AND created_at < ${monthStart}`);

    // 本月订单数（咨询 + 个性服务，统一口径）
    const [monthOrdersRow] = await db.select({ count: count() }).from(bookings)
      .where(sql`created_at >= ${monthStart}`);
    const [svcMonthOrdersAllRow] = await db.select({ count: count() }).from(serviceOrders)
      .where(sql`created_at >= ${monthStart}`);
    // 上月订单数
    const [lastMonthOrdersRow] = await db.select({ count: count() }).from(bookings)
      .where(sql`created_at >= ${lastMonthStart} AND created_at < ${monthStart}`);
    const [svcLastMonthOrdersRow] = await db.select({ count: count() }).from(serviceOrders)
      .where(sql`created_at >= ${lastMonthStart} AND created_at < ${monthStart}`);

    // 累计订单（咨询 + 个性服务）
    const [totalOrdersRow] = await db.select({ count: count() }).from(bookings);
    const [svcTotalOrdersRow] = await db.select({ count: count() }).from(serviceOrders);

    // 咨询师已上线数量
    const [activeCounselorsRow] = await db.select({ count: count() }).from(counselors)
      .where(sql`review_status = 'approved'`);

    // 本月应收（咨询已完成/已支付 + 个性服务已支付/已提交/已完成，统一口径）
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

    // 待处理订单（咨询：待确认+待支付；个性服务：待支付+待写报告）
    const [pendingBookingsRow] = await db.select({ count: count() }).from(bookings)
      .where(sql`status IN ('pending_confirmation', 'pending_payment')`);
    const [pendingSvcRow] = await db.select({ count: count() }).from(serviceOrders)
      .where(sql`status IN ('pending_payment', 'submitted')`);

    // 个性服务（评估）订单：本月/累计收入 + 本月订单数
    const [svcMonthRevenueRow] = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(price AS NUMERIC)), 0)`
    }).from(serviceOrders)
      .where(sql`created_at >= ${monthStart} AND status IN ('completed', 'paid', 'submitted')`);
    const [svcTotalRevenueRow] = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(price AS NUMERIC)), 0)`
    }).from(serviceOrders)
      .where(sql`status IN ('completed', 'paid', 'submitted')`);

    const totalUsers = totalUsersRow.count;
    const monthUsers = monthUsersRow.count;
    const lastMonthUsers = lastMonthUsersRow.count;
    const monthOrders = monthOrdersRow.count + svcMonthOrdersAllRow.count;
    const lastMonthOrders = lastMonthOrdersRow.count + svcLastMonthOrdersRow.count;
    const totalOrders = totalOrdersRow.count + svcTotalOrdersRow.count;
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
      // 咨询 / 个性服务拆分
      bkMonthOrders: monthOrdersRow.count,
      svcMonthOrders: svcMonthOrdersAllRow.count,
      bkTotalOrders: totalOrdersRow.count,
      svcTotalOrders: svcTotalOrdersRow.count,
      bkMonthRevenue: monthRevenue,
      bkTotalRevenue: totalRevenue,
      // 待处理拆分
      pendingOrders: pendingBookingsRow.count + pendingSvcRow.count,
      pendingBookingOrders: pendingBookingsRow.count,
      pendingSvcOrders: pendingSvcRow.count,
      // 「新增订单」红点（上次查看后新增，看过即归零）
      newOrders: newBkRow.count + newSvcRow.count,
      activeCounselors,
      pendingCounselors,
      monthRevenue: monthRevenue + parseFloat(svcMonthRevenueRow.total ?? "0"),
      totalRevenue: totalRevenue + parseFloat(svcTotalRevenueRow.total ?? "0"),
      svcMonthRevenue: parseFloat(svcMonthRevenueRow.total ?? "0"),
      svcTotalRevenue: parseFloat(svcTotalRevenueRow.total ?? "0"),
    });
  } catch (e) {
    console.error("[admin stats]", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
