import { db } from "@/lib/db/client";
import { scheduleRules } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getRules(counselorId: string) {
  return db.select().from(scheduleRules)
    .where(and(eq(scheduleRules.counselorId, counselorId), eq(scheduleRules.isActive, true)))
    .orderBy(scheduleRules.createdAt);
}

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}
function minToTime(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

type OverlapResult = {
  id: string;
  startTime: string;
  endTime: string;
  weekday?: number;
  singleDate?: string | null;
};

/**
 * 检查新规则是否与已有规则时间重叠
 * - 循环规则 vs 循环规则：检查 weekday 集合是否有交集 + 时间段重叠
 * - 循环规则 vs 单次规则：检查单次日期是否落在循环 weekday + 时间段重叠
 * - 单次规则 vs 单次规则：检查同一日期 + 时间段重叠
 */
export async function findOverlappingRule(
  counselorId: string,
  newRule: {
    weekdays: string | null;          // "0,1,4" or ""
    startTime: string;
    durationMinutes: number;
    isSingle: boolean;
    singleDate: string | null;
    singleTime: string | null;
    validFrom?: string | null;        // "2026-08-01"
    validUntil?: string | null;       // "2026-08-31" or null=长期
    excludeId?: string;               // 更新时排除自身
  }
): Promise<OverlapResult | null> {
  const newStart = timeToMin(newRule.singleTime || newRule.startTime);
  const newEnd = newStart + (newRule.durationMinutes || 50);

  const existing = await db.select().from(scheduleRules)
    .where(and(eq(scheduleRules.counselorId, counselorId), eq(scheduleRules.isActive, true)));

  const newWeekdays = newRule.weekdays
    ? newRule.weekdays.split(",").map(n => parseInt(n)).filter(n => !isNaN(n))
    : [];

  for (const r of existing) {
    if (newRule.excludeId && r.id === newRule.excludeId) continue;

    const rStartStr = r.isSingle ? (r.singleTime || r.startTime) : r.startTime;
    if (!rStartStr) continue;
    const rStart = timeToMin(rStartStr);
    const rEnd = rStart + (r.durationMinutes || 50);
    const rEndStr = minToTime(rEnd);
    const base: OverlapResult = {
      id: r.id,
      startTime: rStartStr,
      endTime: rEndStr,
      singleDate: r.singleDate,
    };

    // ① 时段必须先有交集 [newStart, newEnd) ∩ [rStart, rEnd) ≠ ∅
    if (newStart >= rEnd || rStart >= newEnd) continue;

    // ② 已有规则的有效日期范围（按 existing 字段计算）
    const rValidFrom = r.validFrom ?? null;
    const rValidUntil = r.validUntil ?? null;
    const rWeekdays: number[] = r.weekdays && !r.isSingle
      ? r.weekdays.split(",").map(n => parseInt(n)).filter(n => !isNaN(n))
      : [];

    // ③ 找到两者日期都覆盖的"重叠日期集合"
    //    - 单次规则：日期集为 {singleDate}
    //    - 循环规则：日期集为 [validFrom, validUntil] 区间内匹配 weekdays 的所有天
    const overlapDates: { date: string; weekday: number }[] = [];

    if (newRule.isSingle && r.isSingle) {
      // 单次 vs 单次：日期必须完全相同
      if (newRule.singleDate && newRule.singleDate === r.singleDate) {
        overlapDates.push({ date: newRule.singleDate, weekday: -1 });
      }
    } else if (newRule.isSingle && !r.isSingle) {
      // 新单次 vs 已有循环：检查单次日期是否落在循环范围内且 weekday 匹配
      if (newRule.singleDate) {
        const inRange = inDateRange(newRule.singleDate, rValidFrom, rValidUntil);
        const d = new Date(newRule.singleDate);
        const wd = d.getDay() === 0 ? 6 : d.getDay() - 1;
        if (inRange && rWeekdays.includes(wd)) {
          overlapDates.push({ date: newRule.singleDate, weekday: wd });
        }
      }
    } else if (!newRule.isSingle && r.isSingle) {
      // 新循环 vs 已有单次：检查单次日期是否落在新循环范围内且 weekday 匹配
      if (r.singleDate) {
        const inRange = inDateRange(r.singleDate, newRule.validFrom ?? null, newRule.validUntil ?? null);
        const d = new Date(r.singleDate);
        const wd = d.getDay() === 0 ? 6 : d.getDay() - 1;
        if (inRange && newWeekdays.includes(wd)) {
          overlapDates.push({ date: r.singleDate, weekday: wd });
        }
      }
    } else {
      // 循环 vs 循环：枚举两者都覆盖的日期（最多往后90天，超出提示用户）
      overlapDates.push(...enumOverlappingDates(
        newRule.validFrom ?? null, newRule.validUntil ?? null, newWeekdays,
        rValidFrom, rValidUntil, rWeekdays,
      ));
    }

    if (overlapDates.length === 0) continue;  // 日期没交集就不冲突

    return { ...base, weekday: overlapDates[0].weekday, singleDate: overlapDates[0].date };
  }
  return null;
}

/** 检查 date 是否在 [from, until] 范围内（null = 无界） */
function inDateRange(date: string, from: string | null, until: string | null): boolean {
  if (from && date < from) return false;
  if (until && date > until) return false;
  return true;
}

/** 枚举两个循环规则在日期范围内同时生效的天 */
function enumOverlappingDates(
  aFrom: string | null, aUntil: string | null, aWeekdays: number[],
  bFrom: string | null, bUntil: string | null, bWeekdays: number[],
): { date: string; weekday: number }[] {
  // 取两者日期范围的交集
  const start = aFrom || bFrom || dateStrOffset(0);
  const end = aUntil || bUntil || dateStrOffset(180);
  if (start > end) return [];
  const commonWd = aWeekdays.filter(w => bWeekdays.includes(w));
  if (commonWd.length === 0) return [];

  const result: { date: string; weekday: number }[] = [];
  const cur = new Date(start + "T00:00:00");
  const endD = new Date(end + "T00:00:00");
  // 最多枚举366天
  let guard = 0;
  while (cur <= endD && guard < 400) {
    const wd = cur.getDay() === 0 ? 6 : cur.getDay() - 1;
    if (commonWd.includes(wd)) {
      result.push({ date: dateStrOf(cur), weekday: wd });
    }
    cur.setDate(cur.getDate() + 1);
    guard++;
  }
  return result;
}

function dateStrOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dateStrOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return dateStrOf(d);
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
  isActive?: boolean;
}) {
  const [r] = await db.insert(scheduleRules).values(data).returning();
  return r;
}

export async function deleteRule(id: string, counselorId: string) {
  await db.delete(scheduleRules)
    .where(and(eq(scheduleRules.id, id), eq(scheduleRules.counselorId, counselorId)));
}
