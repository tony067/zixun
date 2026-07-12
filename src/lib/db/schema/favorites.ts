import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const userFavoriteCounselors = pgTable(
  "user_favorite_counselors",
  {
    userId: text("user_id").notNull(),
    counselorId: text("counselor_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.counselorId] }),
  }),
);
