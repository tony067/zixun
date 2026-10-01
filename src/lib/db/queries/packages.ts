import { db } from "@/lib/db/client";
import { bookings, consultationPackages } from "@/lib/db/schema";
import { counselors } from "@/lib/db/schema/counselors";
import { and, eq, sql, desc } from "drizzle-orm";

/**
 * 套餐账户：购买 sessions>1 的定价方案后生成。
 * 核销规则（用户确认）：咨询师确认子预约时锁定1次（used+1）；
 * 已锁定的子预约被取消时释放（used-1）；套餐购买单退款时套餐整体作废。
 */

// 套餐购买订单变为 paid（线上支付或客服确认线下转账）时确保套餐账户存在
export async function ensurePackageForPaidBooking(booking: {
  id: string; clientId: string; counselorId: string; sessionNumber: number | null;
}) {
  if ((booking.sessionNumber ?? 1) <= 1) return;
  const [existing] = await db
    .select({ id: consultationPackages.id })
    .from(consultationPackages)
    .where(eq(consultationPackages.orderId, booking.id));
  if (existing) return;
  await db.insert(consultationPackages).values({
    id: `pkg_${Date.now()}`,
    orderId: booking.id,
    clientId: booking.clientId,
    counselorId: booking.counselorId,
    totalSessions: booking.sessionNumber ?? 1,
    usedSessions: 0,
  }).onConflictDoNothing();
}

export async function getPackageById(id: string) {
  const [pkg] = await db.select().from(consultationPackages).where(eq(consultationPackages.id, id));
  return pkg ?? null;
}

// 来访的套餐列表（带咨询师名），按创建时间倒序
export async function getClientPackages(clientId: string) {
  return db.select({
    id: consultationPackages.id,
    orderId: consultationPackages.orderId,
    counselorId: consultationPackages.counselorId,
    counselorName: counselors.displayName,
    planName: consultationPackages.planName,
    totalSessions: consultationPackages.totalSessions,
    usedSessions: consultationPackages.usedSessions,
    status: consultationPackages.status,
    createdAt: consultationPackages.createdAt,
  })
    .from(consultationPackages)
    .leftJoin(counselors, eq(counselors.id, consultationPackages.counselorId))
    .where(eq(consultationPackages.clientId, clientId))
    .orderBy(desc(consultationPackages.createdAt));
}

// 原子核销1次（确认子预约时）：used < total 才成功
export async function consumePackageSession(packageId: string): Promise<boolean> {
  const rows = await db.update(consultationPackages)
    .set({ usedSessions: sql`${consultationPackages.usedSessions} + 1` })
    .where(and(
      eq(consultationPackages.id, packageId),
      eq(consultationPackages.status, "active"),
      sql`${consultationPackages.usedSessions} < ${consultationPackages.totalSessions}`,
    ))
    .returning({ id: consultationPackages.id });
  return rows.length > 0;
}

// 释放1次（已锁定的子预约被取消时）
export async function releasePackageSession(packageId: string) {
  await db.update(consultationPackages)
    .set({ usedSessions: sql`greatest(${consultationPackages.usedSessions} - 1, 0)` })
    .where(eq(consultationPackages.id, packageId));
}

// 套餐退款：套餐购买订单退款时作废套餐
export async function refundPackageByOrder(orderId: string) {
  await db.update(consultationPackages)
    .set({ status: "refunded" })
    .where(eq(consultationPackages.orderId, orderId));
}
