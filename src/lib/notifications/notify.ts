/**
 * MindPace 通知触发器 - 独立版本
 * 使用数据库存储通知，不依赖 Eazo 平台
 */
import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env" });
const sql = postgres(process.env.DATABASE_URL ?? "postgresql://localhost:5432/mindpace_db");

type NotifyPayload = {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

export async function notifyUser({ userId, title, body, data = {} }: NotifyPayload) {
  try {
    await sql`
      INSERT INTO notifications (user_id, title, body, data, created_at, is_read)
      VALUES (${userId}, ${title}, ${body}, ${JSON.stringify(data)}, NOW(), false)
    `;
  } catch (e) {
    console.error("[notify] failed:", e);
  }
}

// ── 来访端通知 ──

/** 咨询师确认订单 → 通知来访（含咨询设置/链接提示） */
export async function notifyClientBookingConfirmed(opts: {
  clientUserId: string;
  counselorName: string;
  scheduledAt: string;
  bookingId: string;
}) {
  await notifyUser({
    userId: opts.clientUserId,
    title: "咨询师已确认你的预约 ✓",
    body: `${opts.counselorName} 已确认你的预约（${opts.scheduledAt}），请前往订单详情查看咨询设置与咨询链接。`,
    data: { type: "booking_confirmed", bookingId: opts.bookingId },
  });
}

/** 咨询师拒绝订单 → 通知来访（模拟退款提示） */
export async function notifyClientBookingRejected(opts: {
  clientUserId: string;
  counselorName: string;
  bookingId: string;
}) {
  await notifyUser({
    userId: opts.clientUserId,
    title: "预约未能确认",
    body: `${opts.counselorName} 无法接受本次预约，你已支付的费用将原路退回（模拟支付，未实际扣款）。`,
    data: { type: "booking_rejected", bookingId: opts.bookingId },
  });
}

/** 待支付订单快超时 → 提醒来访尽快支付 */
export async function notifyClientPaymentReminder(opts: {
  clientUserId: string;
  counselorName: string;
  bookingId: string;
}) {
  await notifyUser({
    userId: opts.clientUserId,
    title: "支付提醒 ⏰",
    body: `你与 ${opts.counselorName} 的预约还差 1 小时就超时取消，请尽快完成支付。`,
    data: { type: "payment_reminder", bookingId: opts.bookingId },
  });
}

/** 咨询前 72 小时提醒来访 */
export async function notifyClientSession72h(opts: {
  clientUserId: string;
  counselorName: string;
  scheduledAt: string;
  bookingId: string;
}) {
  await notifyUser({
    userId: opts.clientUserId,
    title: "咨询提醒 — 3 天后",
    body: `提醒你：与 ${opts.counselorName} 的咨询将于 ${opts.scheduledAt} 开始，请提前安排好时间。`,
    data: { type: "session_reminder_72h", bookingId: opts.bookingId },
  });
}

/** 咨询前 24 小时提醒来访 */
export async function notifyClientSession24h(opts: {
  clientUserId: string;
  counselorName: string;
  scheduledAt: string;
  bookingId: string;
}) {
  await notifyUser({
    userId: opts.clientUserId,
    title: "明天有咨询 🌿",
    body: `你与 ${opts.counselorName} 的咨询明天 ${opts.scheduledAt} 开始，记得按时上线。`,
    data: { type: "session_reminder_24h", bookingId: opts.bookingId },
  });
}

/** 咨询完成后 2 天 → 提醒续约 */
export async function notifyClientRenewReminder2d(opts: {
  clientUserId: string;
  counselorName: string;
  counselorId: string;
}) {
  await notifyUser({
    userId: opts.clientUserId,
    title: "感觉怎么样？",
    body: `上次与 ${opts.counselorName} 的咨询结束了，如果感觉不错，可以预约下一次。`,
    data: { type: "renew_2d", counselorId: opts.counselorId },
  });
}

/** 咨询完成后 1 周 → 续约提醒 */
export async function notifyClientRenewReminder1w(opts: {
  clientUserId: string;
  counselorName: string;
  counselorId: string;
}) {
  await notifyUser({
    userId: opts.clientUserId,
    title: "距上次咨询已过一周",
    body: `如果你想继续，${opts.counselorName} 的档期还有空位，现在可以预约。`,
    data: { type: "renew_1w", counselorId: opts.counselorId },
  });
}

/** 咨询完成后 2 周 → 续约提醒 */
export async function notifyClientRenewReminder2w(opts: {
  clientUserId: string;
  counselorName: string;
  counselorId: string;
}) {
  await notifyUser({
    userId: opts.clientUserId,
    title: "两周没有咨询了",
    body: `你已经有两周没有预约咨询了。如果准备好了，随时可以回来。`,
    data: { type: "renew_2w", counselorId: opts.counselorId },
  });
}

/** 咨询完成后 1 个月 → 续约提醒 */
export async function notifyClientRenewReminder1m(opts: {
  clientUserId: string;
  counselorName: string;
  counselorId: string;
}) {
  await notifyUser({
    userId: opts.clientUserId,
    title: "一个月前，你完成了一次咨询",
    body: `如果你觉得还有需要，${opts.counselorName} 随时欢迎你回来。`,
    data: { type: "renew_1m", counselorId: opts.counselorId },
  });
}

/** 改期结果通知来访 */
export async function notifyClientRescheduleResult(opts: {
  clientUserId: string;
  counselorName: string;
  accepted: boolean;
  newTime?: string;
  bookingId: string;
}) {
  await notifyUser({
    userId: opts.clientUserId,
    title: opts.accepted ? "改期已确认 ✓" : "改期申请未通过",
    body: opts.accepted
      ? `${opts.counselorName} 已确认改期，新的咨询时间为 ${opts.newTime}。`
      : `${opts.counselorName} 暂时无法接受改期，请与咨询师协商其他时间。`,
    data: { type: "reschedule_result", bookingId: opts.bookingId },
  });
}

// ── 咨询师端通知 ──

/** 新预约订单（已支付）→ 提醒咨询师确认 */
export async function notifyCounselorNewBooking(opts: {
  counselorUserId: string;
  clientName: string;
  scheduledAt: string;
  bookingId: string;
  isAdjustRequest?: boolean;
}) {
  await notifyUser({
    userId: opts.counselorUserId,
    title: opts.isAdjustRequest ? "新的时间调剂申请" : "新预约等待确认",
    body: opts.isAdjustRequest
      ? `${opts.clientName} 已支付并提交了时间调剂申请（期望：${opts.scheduledAt}），请前往预约管理确认。`
      : `${opts.clientName} 已支付，预约了你 ${opts.scheduledAt} 的咨询，请前往预约管理确认并发送咨询链接。`,
    data: { type: "new_booking", bookingId: opts.bookingId },
  });
}

/** 咨询前一天 → 提醒咨询师日程 */
export async function notifyCounselorSessionReminder(opts: {
  counselorUserId: string;
  clientName: string;
  scheduledAt: string;
  bookingId: string;
}) {
  await notifyUser({
    userId: opts.counselorUserId,
    title: "明天有咨询安排",
    body: `提醒：你与 ${opts.clientName} 的咨询明天 ${opts.scheduledAt} 开始。`,
    data: { type: "counselor_session_reminder", bookingId: opts.bookingId },
  });
}

/** 来访申请改期 → 通知咨询师 */
export async function notifyCounselorRescheduleRequest(opts: {
  counselorUserId: string;
  clientName: string;
  requestedTime: string;
  bookingId: string;
}) {
  await notifyUser({
    userId: opts.counselorUserId,
    title: "来访申请改期",
    body: `${opts.clientName} 申请将咨询改到 ${opts.requestedTime}，请前往预约管理确认。`,
    data: { type: "reschedule_request", bookingId: opts.bookingId },
  });
}

/** 来访取消订单 → 通知咨询师 */
export async function notifyCounselorBookingCancelled(opts: {
  counselorUserId: string;
  clientName: string;
  scheduledAt: string;
  bookingId: string;
}) {
  await notifyUser({
    userId: opts.counselorUserId,
    title: "来访取消了预约",
    body: `${opts.clientName} 取消了 ${opts.scheduledAt} 的咨询预约。`,
    data: { type: "booking_cancelled", bookingId: opts.bookingId },
  });
}

/** 档案审核结果 → 通知咨询师 */
export async function notifyCounselorReviewResult(opts: {
  counselorUserId: string;
  approved: boolean;
  reason?: string;
}) {
  await notifyUser({
    userId: opts.counselorUserId,
    title: opts.approved ? "档案审核通过 🎉" : "档案审核未通过",
    body: opts.approved
      ? "恭喜！你的咨询师档案已通过审核，现在可以在平台上接受来访预约了。"
      : `你的档案审核未通过：${opts.reason || "请联系平台了解详情"}。`,
    data: { type: "review_result", approved: String(opts.approved) },
  });
}

// ── 管理员端通知 ──

/** 新入驻申请 → 提醒管理员审核 */
export async function notifyAdminNewCounselorApplication(opts: {
  adminUserId: string;
  counselorName: string;
  counselorId: string;
}) {
  await notifyUser({
    userId: opts.adminUserId,
    title: "新咨询师入驻申请",
    body: `${opts.counselorName} 提交了入驻申请，请及时前往审核。`,
    data: { type: "new_application", counselorId: opts.counselorId },
  });
}
