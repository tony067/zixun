import { db } from "@/lib/db/client";
import { scheduleRules, bookings } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";

/**
 * 档期/可约时段共享计算库
 * 约定：所有档期规则的日期与时刻均为「北京时间（UTC+8）」墙钟；
 *       bookings.scheduledAt 为带时区的绝对时间（timestamptz），
 *       与规则比对时统一转换为北京墙钟。
 */

const CST_OFFSET_MS = 8 * 60 * 60 * 1000;

export const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function minToTime(m: number): string {
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

/** 绝对时间 → 北京时间日期串 "YYYY-MM-DD" */
export function cstDateStr(d: Date): string {
  const s = new Date(d.getTime() + CST_OFFSET_MS);
  return `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}`;
}

/** 绝对时间 → 北京时间的当日分钟数 */
export function cstMinutesOfDay(d: Date): number {
  const s = new Date(d.getTime() + CST_OFFSET_MS);
  return s.getUTCHours() * 60 + s.getUTCMinutes();
}

/** 绝对时间 → 北京时间星期（0=周一 … 6=周日） */
export function cstWeekdayMon0(d: Date): number {
  const s = new Date(d.getTime() + CST_OFFSET_MS);
  const js = s.getUTCDay();
  return js === 0 ? 6 : js - 1;
}

type Interval = { start: number; end: number };

type RuleRow = typeof scheduleRules.$inferSelect;
type BookingRow = { scheduledAt: Date; durationMinutes: number | null };

function ruleStart(r: RuleRow): string | null {
  return r.isSingle ? (r.singleTime || r.startTime) : r.startTime;
}

function parseWeekdays(w: string | null): number[] {
  if (!w) return [];
  return w.split(",").map(n => parseInt(n)).filter(n => !isNaN(n));
}

/** 该规则在该日期是否处于生效范围（含 validFrom/validUntil，null 视为无界） */
function inRuleDateRange(ds: string, r: RuleRow): boolean {
  if (r.validFrom && ds < r.validFrom) return false;
  if (r.validUntil && ds > r.validUntil) return false;
  return true;
}

/** 屏蔽规则在该日期是否命中（循环屏蔽允许 weekdays 为空 = 每天屏蔽） */
function blockedRuleHits(r: RuleRow, ds: string, wd: number): boolean {
  if (r.isSingle) return r.singleDate === ds;
  if (!inRuleDateRange(ds, r)) return false;
  const wds = parseWeekdays(r.weekdays);
  return wds.length === 0 || wds.includes(wd);
}

async function loadScheduleData(counselorId: string, excludeBookingId?: string) {
  const rules = await db.select().from(scheduleRules)
    .where(and(eq(scheduleRules.counselorId, counselorId), eq(scheduleRules.isActive, true)));

  const existing = await db.select({
    id: bookings.id,
    scheduledAt: bookings.scheduledAt,
    durationMinutes: bookings.durationMinutes,
  }).from(bookings).where(and(
    eq(bookings.counselorId, counselorId),
    ne(bookings.status, "cancelled"),
    ne(bookings.status, "rejected"),
  ));

  const bookedByDate = new Map<string, { id: string; intervals: Interval[] }>();
  for (const b of existing) {
    if (!b.scheduledAt) continue;
    if (excludeBookingId && b.id === excludeBookingId) continue;
    const ds = cstDateStr(new Date(b.scheduledAt));
    const sMin = cstMinutesOfDay(new Date(b.scheduledAt));
    const eMin = sMin + (b.durationMinutes || 50);
    const entry = bookedByDate.get(ds) ?? { id: "", intervals: [] };
    entry.intervals.push({ start: sMin, end: eMin });
    bookedByDate.set(ds, entry);
  }
  return { rules, bookedByDate };
}

export type DaySlots = { date: string; label: string; weekday: string; slots: string[] };

/** 计算未来 days 天的可约时段（北京时间） */
export async function computeAvailableDays(counselorId: string, days = 30): Promise<DaySlots[]> {
  const { rules, bookedByDate } = await loadScheduleData(counselorId);

  const today = new Date();
  const todayCst = cstDateStr(today);

  const result: DaySlots[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today.getTime() + CST_OFFSET_MS + i * 24 * 60 * 60 * 1000);
    // 用 UTC 分量构造北京日历日
    const ds = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    const jsDay = d.getUTCDay();
    const wd = jsDay === 0 ? 6 : jsDay - 1;

    const availableStarts: { time: string; duration: number }[] = [];
    for (const r of rules) {
      if (r.type !== "available") continue;
      const start = ruleStart(r);
      if (!start) continue;
      if (!inRuleDateRange(ds, r)) continue;
      if (r.isSingle) {
        if (r.singleDate === ds) availableStarts.push({ time: start, duration: r.durationMinutes || 50 });
      } else {
        const wds = parseWeekdays(r.weekdays);
        if (wds.includes(wd)) availableStarts.push({ time: start, duration: r.durationMinutes || 50 });
      }
    }

    const blockedIntervals: Interval[] = [];
    for (const r of rules) {
      if (r.type !== "blocked") continue;
      const start = ruleStart(r);
      if (!start) continue;
      if (!blockedRuleHits(r, ds, wd)) continue;
      const sMin = timeToMin(start);
      blockedIntervals.push({ start: sMin, end: sMin + (r.durationMinutes || 50) });
    }

    const bookedIntervals = bookedByDate.get(ds)?.intervals ?? [];

    const slots: string[] = [];
    const seen = new Set<string>();
    for (const a of availableStarts) {
      if (seen.has(a.time)) continue;
      const sMin = timeToMin(a.time);
      const eMin = sMin + a.duration;
      if (blockedIntervals.some(b => sMin < b.end && eMin > b.start)) continue;
      if (bookedIntervals.some(b => sMin < b.end && eMin > b.start)) continue;
      // 过去时间不显示（北京时间）
      if (ds === todayCst && sMin <= cstMinutesOfDay(today)) continue;
      seen.add(a.time);
      slots.push(a.time);
    }
    slots.sort();

    // label/weekday 需要按北京日历日展示
    const labelDate = new Date(`${ds}T12:00:00+08:00`);
    result.push({
      date: ds,
      label: `${labelDate.getUTCMonth() + 1}/${labelDate.getUTCDate()}`,
      weekday: `周${WEEKDAY_LABELS[jsDay]}`,
      slots,
    });
  }
  return result;
}

/** 校验某个具体时间是否可预约（服务端防冲突/防重复）
 *  opts.ignoreRules: 跳过档期规则与屏蔽规则校验（用于咨询师确认调剂申请时自定时间），仅检查与已有预约冲突
 */
export async function checkSlotAvailable(
  counselorId: string,
  scheduledAt: Date,
  durationMinutes: number,
  excludeBookingId?: string,
  opts?: { ignoreRules?: boolean },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const now = new Date();
  if (scheduledAt.getTime() <= now.getTime()) {
    return { ok: false, reason: "不能选择过去的时间" };
  }

  const { rules, bookedByDate } = await loadScheduleData(counselorId, excludeBookingId);

  const ds = cstDateStr(scheduledAt);
  const wd = cstWeekdayMon0(scheduledAt);
  const sMin = cstMinutesOfDay(scheduledAt);
  const eMin = sMin + (durationMinutes || 50);

  if (!opts?.ignoreRules) {
    // 1. 必须落在某条可约规则内
    const covered = rules.some(r => {
      if (r.type !== "available") return false;
      const start = ruleStart(r);
      if (!start) return false;
      const rStart = timeToMin(start);
      const rEnd = rStart + (r.durationMinutes || 50);
      if (sMin < rStart || eMin > rEnd) return false;
      if (r.isSingle) return r.singleDate === ds;
      if (!inRuleDateRange(ds, r)) return false;
      return parseWeekdays(r.weekdays).includes(wd);
    });
    if (!covered) {
      return { ok: false, reason: "该时间不在咨询师的开放档期内" };
    }

    // 2. 不得与屏蔽规则冲突
    const blockedHit = rules.some(r => {
      if (r.type !== "blocked") return false;
      const start = ruleStart(r);
      if (!start) return false;
      if (!blockedRuleHits(r, ds, wd)) return false;
      const bStart = timeToMin(start);
      const bEnd = bStart + (r.durationMinutes || 50);
      return sMin < bEnd && eMin > bStart;
    });
    if (blockedHit) {
      return { ok: false, reason: "该时段已被咨询师屏蔽" };
    }
  }

  // 3. 不得与已有预约重叠
  const booked = bookedByDate.get(ds)?.intervals ?? [];
  if (booked.some(b => sMin < b.end && eMin > b.start)) {
    return { ok: false, reason: "该时段与已有咨询安排冲突" };
  }

  return { ok: true };
}
