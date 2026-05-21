import { db } from "@/lib/db/client";
import { scheduleRules } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getRules(counselorId: string) {
  return db.select().from(scheduleRules)
    .where(and(eq(scheduleRules.counselorId, counselorId), eq(scheduleRules.isActive, true)))
    .orderBy(scheduleRules.createdAt);
}

export async function createRule(data: {
  id: string;
  counselorId: string;
  type: string;
  weekdays?: string;
  startTime?: string;
  durationMinutes?: number;
  validFrom?: string;
  validUntil?: string;
  fixedClientId?: string;
  blockNote?: string;
  isSingle?: boolean;
  singleDate?: string;
  singleTime?: string;
}) {
  const [r] = await db.insert(scheduleRules).values(data).returning();
  return r;
}

export async function deleteRule(id: string, counselorId: string) {
  await db.delete(scheduleRules)
    .where(and(eq(scheduleRules.id, id), eq(scheduleRules.counselorId, counselorId)));
}
