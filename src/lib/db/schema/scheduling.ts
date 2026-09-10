import { pgTable, text, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";

// 循环档期规则
export const scheduleRules = pgTable("schedule_rules", {
  id: text("id").primaryKey(),
  counselorId: text("counselor_id").notNull(),
  type: text("type").notNull().default("available"), // available | blocked | fixed
  // recurring fields
  weekdays: text("weekdays"),       // "0,1,4" (0=周一…6=周日)
  startTime: text("start_time"),    // "09:00"
  durationMinutes: integer("duration_minutes").default(50),
  validFrom: text("valid_from"),    // "2026-01-01"
  validUntil: text("valid_until"),  // nullable = 长期
  // fixed slot fields
  fixedClientId: text("fixed_client_id"),
  blockNote: text("block_note"),
  // single occurrence
  isSingle: boolean("is_single").default(false),
  singleDate: text("single_date"),  // "2026-05-28"
  singleTime: text("single_time"),  // "10:00"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 预约记录
export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  counselorId: text("counselor_id").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").default(50),
  sessionMode: text("session_mode").default("视频"),
  priceAmount: integer("price_amount").default(0),
  status: text("status").default("pending_confirmation"),
  // pending_confirmation | pending_payment | paid | completed | cancelled | rejected
  paidAt: timestamp("paid_at", { withTimezone: true }),
  paymentMethod: text("payment_method"),
  // 咨询师确认时填写的咨询链接（腾讯会议等）
  meetingLink: text("meeting_link"),
  // 时间调剂申请（无可约时段时来访提交）：{ message, acceptOther }
  adjustRequest: json("adjust_request"),
  clientNote: text("client_note"),
  counselorNote: text("counselor_note"),
  sessionNumber: integer("session_number").default(1),
  applicationForm: json("application_form"),
  agreementSigned: boolean("agreement_signed").default(false),
  // 改期相关
  rescheduleStatus: text("reschedule_status"),
  rescheduleRequestedAt: timestamp("reschedule_requested_at", { withTimezone: true }),
  rescheduleNewTime: timestamp("reschedule_new_time", { withTimezone: true }),
  rescheduleReason: text("reschedule_reason"),
  rescheduleNote: text("reschedule_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 会话（私信）
export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  participantAId: text("participant_a_id").notNull(),
  participantBId: text("participant_b_id").notNull(),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 消息
export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull(),
  senderId: text("sender_id").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
