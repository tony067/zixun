import type { InferSelectModel } from "drizzle-orm";
import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    email: varchar("email", { length: 256 }).unique(),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    /** bcrypt hash，独立部署注册/登录使用；Eazo 平台迁入的老用户此字段为 null */
    passwordHash: text("password_hash"),
    /** 用户角色：visitor（来访者）| counselor（咨询师）| support（客服，需显式授权）| admin（管理员） */
    role: varchar("role", { length: 32 }).default("visitor"),
    /** 账号状态：active（正常）| banned（封禁） */
    status: varchar("status", { length: 32 }).default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    createdAtIdx: index("users_created_at_idx").on(table.createdAt),
  })
);

export type User = InferSelectModel<typeof users>;
