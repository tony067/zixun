"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ── 类型 ────────────────────────────────────────────────────────────────
export type RuleType = "available" | "blocked" | "fixed";

export interface ScheduleRule {
  id: string;
  type: RuleType;
  weekdays?: string;       // "0,1,4"  0=周一
  startTime?: string;      // "09:00"
  durationMinutes?: number;
  validFrom?: string;
  validUntil?: string;
  fixedClientId?: string;
  blockNote?: string;
  isSingle?: boolean;
  singleDate?: string;
  singleTime?: string;
  isActive?: boolean;
}

// ── 颜色映射 ────────────────────────────────────────────────────────────
const TYPE_COLOR: Record<RuleType, { bg: string; border: string; text: string; label: string }> = {
  available: { bg: "#DCFCE7", border: "#86EFAC", text: "#15803D", label: "可预约" },
  blocked:   { bg: "#FEE2E2", border: "#FCA5A5", text: "#B91C1C", label: "已屏蔽" },
  fixed:     { bg: "#FEF3C7", border: "#FCD34D", text: "#92400E", label: "固定档期" },
};

// ── 工具函数 ────────────────────────────────────────────────────────────
function getWeekDates(offset = 0): Date[] {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function dateStr(d: Date): string {
  return d.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function parseHM(t: string): { h: number; m: number } {
  const [h, m] = t.split(":").map(Number);
  return { h: h ?? 0, m: m ?? 0 };
}

interface Slot {
  date: string;   // YYYY-MM-DD
  startH: number; // fractional hours from 00:00
  duration: number; // hours
  type: RuleType;
  label?: string;
}

function expandRules(rules: ScheduleRule[], weekDates: Date[]): Slot[] {
  const slots: Slot[] = [];
  for (const rule of rules) {
    if (rule.isActive === false) continue;
    const dur = (rule.durationMinutes ?? 50) / 60;

    if (rule.isSingle && rule.singleDate && rule.singleTime) {
      if (weekDates.some(d => isoDate(d) === rule.singleDate)) {
        const { h, m } = parseHM(rule.singleTime);
        slots.push({
          date: rule.singleDate,
          startH: h + m / 60,
          duration: dur,
          type: rule.type,
          label: rule.blockNote ?? rule.fixedClientId,
        });
      }
      continue;
    }

    if (!rule.weekdays || !rule.startTime) continue;
    const days = rule.weekdays.split(",").map(Number); // 0=周一
    const { h, m } = parseHM(rule.startTime);
    const validFrom = rule.validFrom ? new Date(rule.validFrom + "T00:00:00") : new Date(0);
    const validUntil = rule.validUntil ? new Date(rule.validUntil + "T23:59:59") : new Date(9999, 0);

    for (const d of weekDates) {
      if (d < validFrom || d > validUntil) continue;
      // js getDay() 0=Sun → ruleDay: Mon=0 … Sun=6
      const jsDay = d.getDay();
      const ruleDay = jsDay === 0 ? 6 : jsDay - 1;
      if (!days.includes(ruleDay)) continue;
      slots.push({
        date: isoDate(d),
        startH: h + m / 60,
        duration: dur,
        type: rule.type,
        label: rule.blockNote ?? rule.fixedClientId,
      });
    }
  }
  return slots;
}

// ── 常量 ────────────────────────────────────────────────────────────────
const HOUR_START = 8;
const HOUR_END   = 21;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const HOUR_HEIGHT = 60; // px per hour
const TOTAL_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;
const WEEKDAY_SHORT = ["周一","周二","周三","周四","周五","周六","周日"];

// ── 主组件 ────────────────────────────────────────────────────────────
export function WeekCalendar({ rules }: { rules: ScheduleRule[] }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const weekDates = getWeekDates(weekOffset);
  const slots = expandRules(rules, weekDates);
  const today = isoDate(new Date());

  // 自动滚动到当前时间
  useEffect(() => {
    const now = new Date();
    const pct = (now.getHours() + now.getMinutes() / 60 - HOUR_START) / TOTAL_HOURS;
    const top = Math.max(0, pct * TOTAL_HEIGHT - 80);
    scrollRef.current?.scrollTo({ top, behavior: "smooth" });
  }, []);

  const weekLabel = (() => {
    if (weekOffset === 0) return "本周";
    if (weekOffset === 1) return "下周";
    if (weekOffset === -1) return "上周";
    return `${weekOffset > 0 ? "+" : ""}${weekOffset} 周`;
  })();

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "var(--color-mp-surface)" }}>
      {/* ── 顶部导航 ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
        style={{ borderColor: "var(--color-mp-border)", background: "var(--color-mp-card)" }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setWeekOffset(o => o - 1)}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "var(--color-mp-surface)" }}>
          <ChevronLeft className="w-4 h-4" style={{ color: "var(--color-mp-muted)" }} />
        </motion.button>
        <div className="text-center">
          <div className="text-sm font-semibold" style={{ color: "var(--color-mp-text)" }}>
            {weekLabel}
          </div>
          <div className="text-xs" style={{ color: "var(--color-mp-muted)" }}>
            {weekDates[0].toLocaleDateString("zh-CN", { month: "long", day: "numeric" })} –{" "}
            {weekDates[6].toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setWeekOffset(o => o + 1)}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "var(--color-mp-surface)" }}>
          <ChevronRight className="w-4 h-4" style={{ color: "var(--color-mp-muted)" }} />
        </motion.button>
      </div>

      {/* ── 星期头 ── */}
      <div className="flex flex-shrink-0 border-b"
        style={{ borderColor: "var(--color-mp-border)", background: "var(--color-mp-card)" }}>
        <div className="w-10 flex-shrink-0" />
        {weekDates.map((d, i) => {
          const isToday = isoDate(d) === today;
          return (
            <div key={i} className="flex-1 flex flex-col items-center py-1.5 text-xs">
              <span style={{ color: "var(--color-mp-muted)" }}>{WEEKDAY_SHORT[i]}</span>
              <span className={`mt-0.5 w-6 h-6 flex items-center justify-center rounded-full text-sm font-medium ${isToday ? "text-white" : ""}`}
                style={{ background: isToday ? "var(--color-mp-primary)" : "transparent",
                         color: isToday ? "#fff" : "var(--color-mp-text)" }}>
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── 时间轴主体 ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex" style={{ height: TOTAL_HEIGHT }}>
          {/* 时间刻度列 */}
          <div className="w-10 flex-shrink-0 relative select-none">
            {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
              <div key={i} className="absolute flex items-start justify-end pr-1.5"
                style={{ top: i * HOUR_HEIGHT - 6, height: HOUR_HEIGHT, right: 0 }}>
                <span className="text-[10px]" style={{ color: "var(--color-mp-faint)" }}>
                  {(HOUR_START + i).toString().padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>

          {/* 7天列 */}
          {weekDates.map((d, colIdx) => {
            const dateKey = isoDate(d);
            const colSlots = slots.filter(s => s.date === dateKey);
            const isToday = dateKey === today;

            return (
              <div key={colIdx} className="flex-1 relative border-l"
                style={{ borderColor: "var(--color-mp-border)", background: isToday ? "rgba(156,180,138,0.04)" : "transparent" }}>
                {/* 整点线 */}
                {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
                  <div key={i} className="absolute left-0 right-0 border-t"
                    style={{ top: i * HOUR_HEIGHT, borderColor: "var(--color-mp-border)", opacity: 0.5 }} />
                ))}

                {/* 当前时间线（仅今天） */}
                {isToday && (() => {
                  const now = new Date();
                  const pct = (now.getHours() + now.getMinutes() / 60 - HOUR_START) / TOTAL_HOURS;
                  if (pct < 0 || pct > 1) return null;
                  return (
                    <div className="absolute left-0 right-0 z-10 flex items-center"
                      style={{ top: pct * TOTAL_HEIGHT }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-mp-primary)", marginLeft: -4 }} />
                      <div className="flex-1 h-px" style={{ background: "var(--color-mp-primary)" }} />
                    </div>
                  );
                })()}

                {/* 时间槽 */}
                {colSlots.map((slot, si) => {
                  const topPx = (slot.startH - HOUR_START) * HOUR_HEIGHT;
                  const heightPx = Math.max(slot.duration * HOUR_HEIGHT, 20);
                  const c = TYPE_COLOR[slot.type];
                  return (
                    <div key={si} className="absolute left-0.5 right-0.5 rounded-md overflow-hidden"
                      style={{
                        top: topPx, height: heightPx,
                        background: c.bg,
                        border: `1px solid ${c.border}`,
                        zIndex: 2,
                      }}>
                      <div className="px-1 pt-0.5">
                        <div className="text-[9px] font-semibold leading-tight truncate"
                          style={{ color: c.text }}>{c.label}</div>
                        {slot.label && (
                          <div className="text-[8px] truncate opacity-75" style={{ color: c.text }}>
                            {slot.label}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 图例 ── */}
      <div className="flex gap-3 px-4 py-2 flex-shrink-0 border-t"
        style={{ borderColor: "var(--color-mp-border)", background: "var(--color-mp-card)" }}>
        {(Object.entries(TYPE_COLOR) as [RuleType, typeof TYPE_COLOR[RuleType]][]).map(([type, c]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c.bg, border: `1px solid ${c.border}` }} />
            <span className="text-[10px]" style={{ color: "var(--color-mp-muted)" }}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
