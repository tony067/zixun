import { pgTable, text, integer, timestamp, json } from "drizzle-orm/pg-core";

// 个性服务商品（评估类等非咨询业务）
// type=assessment：问卷+报告模式，无时段预约
export const services = pgTable("services", {
  id: text("id").primaryKey(),
  counselorId: text("counselor_id").notNull(),   // 挂靠的老师
  type: text("type").notNull().default("assessment"),
  name: text("name").notNull(),
  tagline: text("tagline"),                      // 一句话简介
  description: text("description"),              // 详细介绍（多段文本，\n 分段）
  price: integer("price").notNull().default(0),  // 元
  // 问卷题目数组：[{ id, type: "single"|"multi"|"text"|"scale", title, options?: string[], required?: boolean }]
  questions: json("questions").default([]),
  // 外链问卷（可选）：老师在外部工具（问卷星/腾讯文档等）做好问卷，填链接后来访订单页直接跳转填写
  questionnaireLink: text("questionnaire_link"),
  status: text("status").notNull().default("active"), // active 上架 | inactive 下架
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 个性服务订单
// 状态流：pending_payment → paid(待作答) → submitted(待报告) → completed(可看报告)；refunded / cancelled
export const serviceOrders = pgTable("service_orders", {
  id: text("id").primaryKey(),
  serviceId: text("service_id").notNull(),
  counselorId: text("counselor_id").notNull(),
  clientId: text("client_id").notNull(),
  price: integer("price").notNull().default(0),
  status: text("status").notNull().default("pending_payment"),
  paymentMethod: text("payment_method"),          // wechat/alipay/card/offline
  paidAt: timestamp("paid_at", { withTimezone: true }),
  answers: json("answers"),                       // [{ questionId, value }] value: string|string[]|number
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  report: text("report"),                         // 老师撰写的评估报告
  reportAt: timestamp("report_at", { withTimezone: true }),
  // 订单级问卷链接（老师针对该订单发送/更新，优先于服务级链接）
  questionnaireLink: text("questionnaire_link"),
  // 报告外链（如腾讯文档）与报告文件（老师上传 PDF/图片）
  reportLink: text("report_link"),
  reportFileUrl: text("report_file_url"),
  // 服务名称快照（防止商品改名影响历史订单显示）
  serviceName: text("service_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
