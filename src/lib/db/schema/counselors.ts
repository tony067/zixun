import { pgTable, text, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";

export const counselors = pgTable("counselors", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  title: text("title").default(""),
  bio: text("bio").default(""),
  tagline: text("tagline").default(""),
  specialties: text("specialties").array().default([]),     // 擅长领域
  approaches: text("approaches").array().default([]),       // 咨询取向
  workingGroups: text("working_groups").array().default([]),// 工作人群
  sessionModes: text("session_modes").array().default([]),  // 视频/语音/面谈
  sessionDuration: integer("session_duration").default(50),
  pricePerSession: integer("price_per_session").default(300),
  currency: text("currency").default("CNY"),
  languages: text("languages").array().default([]),
  location: text("location").default(""),
  avatarUrl: text("avatar_url"),
  isAccepting: boolean("is_accepting").default(true),
  counselorTypes: text("counselor_types").array().default([]), // 心理咨询师/ADHD教练/特教老师
  isSupervisor: boolean("is_supervisor").default(false),
  reviewStatus: text("review_status").default("approved"),    // draft/pending/approved/rejected
  totalHours: integer("total_hours").default(0),
  totalSessions: integer("total_sessions").default(0),
  rating: integer("rating").default(45),                      // 4.5 stored as 45
  // 详情页扩展字段（JSON 字符串数组存储）
  qualifications: text("qualifications").array().default([]), // 从业资质
  education: text("education").array().default([]),           // 教育背景
  trainings: text("trainings").array().default([]),           // 受训经历
  workExperiences: text("work_experiences").array().default([]), // 工作经验
  sessionDescription: text("session_description").default(""), // 咨询过程与方式
  createdAt: timestamp("created_at").defaultNow(),
});
