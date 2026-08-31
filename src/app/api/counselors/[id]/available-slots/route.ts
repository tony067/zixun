import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { scheduleRules, bookings } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}
function minToTime(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * 公开接口：返回指定咨询师未来 N 天的可预约时间
 * 根据循环规则 + 单次规则，减去已被屏蔽、已预约的时段
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const url = new URL(req.url);
  const days = Math.min(60, Math.max(1, parseInt(url.searchParams.get("days") || "30")));

  // 1. 拉档期规则
  const rules = await db.select().from(scheduleRules)
    .where(and(eq(scheduleRules.counselorId, id), eq(scheduleRules.isActive, true)));

  // 2. 拉已存在的 booking（未取消的）→ 这些时段不能被预约
  // 状态: pending_confirmation | confirmed | pending_payment | paid | completed
  const existingBookings = await db.select({
    scheduledAt: bookings.scheduledAt,
    durationMinutes: bookings.durationMinutes,
    status: bookings.status,
  }).from(bookings).where(and(
    eq(bookings.counselorId, id),
    ne(bookings.status, "cancelled"),
    ne(bookings.status, "rejected"),
  ));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result: { date: string; label: string; weekday: string; slots: string[] }[] = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const ds = dateStr(d);
    const jsDay = d.getDay();
    const wd = jsDay === 0 ? 6 : jsDay - 1;

    // 收集该天的所有可预约时间段
    const availableStarts: { time: string; duration: number; ruleId: string }[] = [];

    for (const r of rules) {
      if (r.type !== "available") continue;
      const start = r.isSingle ? (r.singleTime || r.startTime) : r.startTime;
      if (!start) continue;

      if (r.validFrom && ds < r.validFrom) continue;
      if (r.validUntil && ds > r.validUntil) continue;

      if (!r.isSingle && r.weekdays) {
        const wds: number[] = r.weekdays.split(",").map(n => parseInt(n)).filter(n => !isNaN(n));
        if (!wds.includes(wd)) continue;
        availableStarts.push({ time: start, duration: r.durationMinutes || 50, ruleId: r.id });
      } else if (r.isSingle && r.singleDate === ds) {
        availableStarts.push({ time: start, duration: r.durationMinutes || 50, ruleId: r.id });
      }
    }

    // 屏蔽时间
    const blockedIntervals: { start: number; end: number }[] = [];
    for (const r of rules) {
      if (r.type !== "blocked") continue;
      const start = r.isSingle ? (r.singleTime || r.startTime) : r.startTime;
      if (!start) continue;
      const sMin = timeToMin(start);
      const eMin = sMin + (r.durationMinutes || 50);
      if (r.isSingle) {
        if (r.singleDate === ds) blockedIntervals.push({ start: sMin, end: eMin });
      } else if (r.weekdays) {
        const wds: number[] = r.weekdays.split(",").map(n => parseInt(n)).filter(n => !isNaN(n));
        if (wds.includes(wd)) blockedIntervals.push({ start: sMin, end: eMin });
      }
    }

    // 已预约时间（在该天范围内的）
    const bookedIntervals: { start: number; end: number }[] = [];
    for (const b of existingBookings) {
      if (!b.scheduledAt) continue;
      const bt = new Date(b.scheduledAt);
      const bds = dateStr(bt);
      if (bds !== ds) continue;
      const sMin = bt.getHours() * 60 + bt.getMinutes();
      const eMin = sMin + (b.durationMinutes || 50);
      bookedIntervals.push({ start: sMin, end: eMin });
    }

    // 计算最终可用 slots
    const slots: string[] = [];
    const seen = new Set<string>();
    const now = new Date();
    for (const a of availableStarts) {
      if (seen.has(a.time)) continue;
      const sMin = timeToMin(a.time);
      const eMin = sMin + a.duration;
      const isBlocked = blockedIntervals.some(b => sMin < b.end && eMin > b.start);
      if (isBlocked) continue;
      const isBooked = bookedIntervals.some(b => sMin < b.end && eMin > b.start);
      if (isBooked) continue;
      // 过去时间不显示
      const slotDate = new Date(d);
      const [hh, mm] = a.time.split(":").map(Number);
      slotDate.setHours(hh, mm, 0, 0);
      if (slotDate.getTime() <= now.getTime()) continue;
      seen.add(a.time);
      slots.push(a.time);
    }
    slots.sort();

    result.push({
      date: ds,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      weekday: `周${WEEKDAY_LABELS[jsDay]}`,
      slots,
    });
  }

  return NextResponse.json({ days: result });
}
