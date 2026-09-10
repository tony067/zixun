import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { counselors } from "@/lib/db/schema/counselors";
import { users } from "@/lib/db/schema/users";
import { notifyUser } from "@/lib/notifications/notify";

/**
 * 惰性状态同步（每次查询订单前调用）：
 *   paid(待咨询) + 到达开始时间 → in_progress(进行中)，并发送开始提醒
 *   in_progress + 超过结束时间 → completed(已完成)
 */
export async function syncBookingProgress() {
  try {
    const started = await db.update(bookings)
      .set({ status: "in_progress" })
      .where(and(
        eq(bookings.status, "paid"),
        sql`${bookings.scheduledAt} <= now()`,
      ))
      .returning({ id: bookings.id, clientId: bookings.clientId, counselorId: bookings.counselorId });

    await db.update(bookings)
      .set({ status: "completed" })
      .where(and(
        eq(bookings.status, "in_progress"),
        sql`${bookings.scheduledAt} + make_interval(mins => coalesce(${bookings.durationMinutes}, 50)) <= now()`,
      ));

    // 到点提醒（一次性，随状态迁移触发）
    for (const b of started) {
      try {
        const [c] = await db.select({ userId: counselors.userId, displayName: counselors.displayName })
          .from(counselors).where(eq(counselors.id, b.counselorId));
        const link = await db.select({ meetingLink: bookings.meetingLink })
          .from(bookings).where(eq(bookings.id, b.id));
        const ml = link[0]?.meetingLink;
        if (c?.userId) {
          await notifyUser({
            userId: c.userId,
            title: "咨询即将开始",
            body: `你与来访者的咨询已到预约时间，请进入咨询。`,
            data: { type: "session_start", bookingId: b.id },
          });
        }
        await notifyUser({
          userId: b.clientId,
          title: "咨询时间到了",
          body: ml ? `咨询即将开始，请点击咨询链接进入。` : `咨询即将开始，请注意查收咨询师发送的咨询链接。`,
          data: { type: "session_start", bookingId: b.id },
        });
      } catch { /* 提醒失败不影响主流程 */ }
    }
  } catch (e) {
    console.error("[syncBookingProgress]", e);
  }
}

export async function createBooking(data: {
  id: string;
  clientId: string;
  counselorId: string;
  scheduledAt: Date;
  durationMinutes?: number;
  sessionMode?: string;
  priceAmount?: number;
  clientNote?: string;
  applicationForm?: Record<string, unknown> | null;
  agreementSigned?: boolean;
  sessionNumber?: number;
  status?: string;
  paidAt?: Date;
  paymentMethod?: string;
  adjustRequest?: { message: string; acceptOther?: string } | null;
}) {
  const [b] = await db.insert(bookings).values(data).returning();
  return b;
}

export async function getClientBookings(clientId: string) {
  return db.select({
    id: bookings.id,
    status: bookings.status,
    scheduledAt: bookings.scheduledAt,
    durationMinutes: bookings.durationMinutes,
    sessionMode: bookings.sessionMode,
    priceAmount: bookings.priceAmount,
    clientNote: bookings.clientNote,
    counselorNote: bookings.counselorNote,
    meetingLink: bookings.meetingLink,
    adjustRequest: bookings.adjustRequest,
    paymentMethod: bookings.paymentMethod,
    createdAt: bookings.createdAt,
    rescheduleStatus: bookings.rescheduleStatus,
    counselor: {
      id: counselors.id,
      displayName: counselors.displayName,
      title: counselors.title,
      avatarUrl: counselors.avatarUrl,
    },
  })
  .from(bookings)
  .leftJoin(counselors, eq(bookings.counselorId, counselors.id))
  .where(eq(bookings.clientId, clientId))
  .orderBy(desc(bookings.scheduledAt));
}

export async function getCounselorBookings(counselorId: string) {
  return db.select({
    id: bookings.id,
    status: bookings.status,
    scheduledAt: bookings.scheduledAt,
    durationMinutes: bookings.durationMinutes,
    sessionMode: bookings.sessionMode,
    priceAmount: bookings.priceAmount,
    clientNote: bookings.clientNote,
    counselorNote: bookings.counselorNote,
    meetingLink: bookings.meetingLink,
    adjustRequest: bookings.adjustRequest,
    applicationForm: bookings.applicationForm,
    createdAt: bookings.createdAt,
    client: {
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    },
  })
  .from(bookings)
  .leftJoin(users, eq(bookings.clientId, users.id))
  .where(eq(bookings.counselorId, counselorId))
  .orderBy(desc(bookings.scheduledAt));
}

export async function updateBookingStatus(id: string, status: string, counselorNote?: string) {
  const [b] = await db.update(bookings)
    .set({ status, ...(counselorNote !== undefined ? { counselorNote } : {}) })
    .where(eq(bookings.id, id))
    .returning();
  return b;
}

export async function getAllBookings() {
  return db.select({
    id: bookings.id,
    status: bookings.status,
    scheduledAt: bookings.scheduledAt,
    durationMinutes: bookings.durationMinutes,
    sessionMode: bookings.sessionMode,
    priceAmount: bookings.priceAmount,
    createdAt: bookings.createdAt,
    counselor: {
      id: counselors.id,
      displayName: counselors.displayName,
    },
    client: {
      id: users.id,
      name: users.name,
      email: users.email,
    },
  })
  .from(bookings)
  .leftJoin(counselors, eq(bookings.counselorId, counselors.id))
  .leftJoin(users, eq(bookings.clientId, users.id))
  .orderBy(desc(bookings.createdAt));
}
