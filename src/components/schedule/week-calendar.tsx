"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CalRule = {
  id: string;
  type: "available" | "blocked" | "fixed";
  weekdays?: string | null;    // "0,1,4"  (0=周一)
  startTime?: string | null;   // "09:00"
  durationMinutes?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  isSingle?: boolean | null;
  singleDate?: string | null;
  singleTime?: string | null;
};

const HOUR_START = 7;
const HOUR_END = 22;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const PX_PER_HOUR = 60; // px

const COLORS = {
  available: { bg: "#9CB48A", text: "#fff",    label: "可预约" },
  fixed:     { bg: "#D97706", text: "#fff",    label: "固定档期" },
  blocked:   { bg: "#DC2626", text: "#fff",    label: "已屏蔽" },
  booked:    { bg: "#4f7bcb", text: "#fff",    label: "已预约" },
};

const WEEKDAY_SHORT = ["一", "二", "三", "四", "五", "六", "日"];

function getWeekDates(offset: number): Date[] {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toDateStr(d: Date): string {
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
    .replace(/\//g, "-");
}

type Slot = {
  top: number;   // px from HOUR_START
  height: number;
  type: CalRule["type"];
  label?: string;
};

function expandRules(rules: CalRule[], dates: Date[]): Map<string, Slot[]> {
  const map = new Map<string, Slot[]>();
  for (const d of dates) map.set(toDateStr(d), []);

  for (const rule of rules) {
    if (!rule.id) continue;
    const dur = rule.durationMinutes ?? 50;

    if (rule.isSingle && rule.singleDate && rule.singleTime) {
      // 单次规则
      const slots = map.get(rule.singleDate);
      if (!slots) continue;
      const [h, m] = rule.singleTime.split(":").map(Number);
      if (h < HOUR_START || h >= HOUR_END) continue;
      slots.push({
        top: (h - HOUR_START + m / 60) * PX_PER_HOUR,
        height: (dur / 60) * PX_PER_HOUR,
        type: rule.type,
      });
      continue;
    }

    if (!rule.weekdays || !rule.startTime) continue;
    const weekdayNums = rule.weekdays.split(",").map(Number); // 0=周一
    const [sh, sm] = rule.startTime.split(":").map(Number);
    if (sh < HOUR_START || sh >= HOUR_END) continue;
    const validFrom = rule.validFrom ?? "2000-01-01";
    const validUntil = rule.validUntil ?? "2099-12-31";

    for (const d of dates) {
      const dateStr = toDateStr(d);
      if (dateStr < validFrom || dateStr > validUntil) continue;
      // js 0=Sun → rule 0=Mon
      const jsDay = d.getDay();
      const ruleDay = jsDay === 0 ? 6 : jsDay - 1;
      if (!weekdayNums.includes(ruleDay)) continue;

      const slots = map.get(dateStr)!;
      slots.push({
        top: (sh - HOUR_START + sm / 60) * PX_PER_HOUR,
        height: (dur / 60) * PX_PER_HOUR,
        type: rule.type,
        label: rule.type === "fixed" ? "固定" : undefined,
      });
    }
  }
  return map;
}

export function WeekCalendar({ rules }: { rules: CalRule[] }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const dates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const slotMap = useMemo(() => expandRules(rules, dates), [rules, dates]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekLabel = useMemo(() => {
    const first = dates[0];
    const last = dates[6];
    return `${first.toLocaleDateString("zh-CN", { month: "long", day: "numeric" })} — ${last.toLocaleDateString("zh-CN", { day: "numeric" })}`;
  }, [dates]);

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i);

  return (
    <div className="flex flex-col" style={{ background: "var(--color-mp-card)" }}>
      {/* 周导航 */}
      <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 z-10"
        style={{ borderColor: "var(--color-mp-border)", background: "var(--color-mp-card)" }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setWeekOffset(w => w - 1)}
          className="w-8 h-8 rounded-xl border flex items-center justify-center"
          style={{ borderColor: "var(--color-mp-border)", background: "var(--color-mp-surface)" }}>
          <ChevronLeft className="w-4 h-4" style={{ color: "var(--color-mp-muted)" }} />
        </motion.button>
        <div className="text-sm font-medium" style={{ color: "var(--color-mp-text)" }}>
          {weekOffset === 0 ? "本周 · " : weekOffset === 1 ? "下周 · " : ""}{weekLabel}
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setWeekOffset(w => w + 1)}
          className="w-8 h-8 rounded-xl border flex items-center justify-center"
          style={{ borderColor: "var(--color-mp-border)", background: "var(--color-mp-surface)" }}>
          <ChevronRight className="w-4 h-4" style={{ color: "var(--color-mp-muted)" }} />
        </motion.button>
      </div>

      {/* 列标题 */}
      <div className="flex border-b sticky top-[49px] z-10"
        style={{ borderColor: "var(--color-mp-border)", background: "var(--color-mp-card)" }}>
        <div className="w-10 flex-shrink-0" />
        {dates.map((d, i) => {
          const isToday = d.getTime() === today.getTime();
          return (
            <div key={i} className="flex-1 flex flex-col items-center py-2 gap-0.5">
              <span className="text-[10px]" style={{ color: "var(--color-mp-faint)" }}>
                {WEEKDAY_SHORT[i]}
              </span>
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{
                  background: isToday ? "var(--color-mp-primary)" : "transparent",
                  color: isToday ? "#fff" : "var(--color-mp-text)",
                }}
              >
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* 时间轴主体 */}
      <div className="flex overflow-y-auto" style={{ maxHeight: "calc(100svh - 200px)" }}>
        {/* 时间刻度 */}
        <div className="w-10 flex-shrink-0 relative" style={{ height: TOTAL_HOURS * PX_PER_HOUR }}>
          {hours.map(h => (
            <div
              key={h}
              className="absolute right-2 text-[9px] leading-none"
              style={{
                top: (h - HOUR_START) * PX_PER_HOUR - 5,
                color: "var(--color-mp-faint)",
              }}
            >
              {h}:00
            </div>
          ))}
        </div>

        {/* 7 天列 */}
        <div className="flex flex-1 relative">
          {/* 横向小时线 */}
          <div className="absolute inset-0 pointer-events-none">
            {hours.map(h => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t"
                style={{
                  top: (h - HOUR_START) * PX_PER_HOUR,
                  borderColor: "var(--color-mp-border)",
                  opacity: 0.6,
                }}
              />
            ))}
          </div>

          {dates.map((d, di) => {
            const dateStr = toDateStr(d);
            const slots = slotMap.get(dateStr) ?? [];
            return (
              <div
                key={di}
                className="flex-1 relative border-l"
                style={{
                  height: TOTAL_HOURS * PX_PER_HOUR,
                  borderColor: "var(--color-mp-border)",
                  opacity: d.getTime() < today.getTime() ? 0.55 : 1,
                }}
              >
                {slots.map((slot, si) => {
                  const col = COLORS[slot.type];
                  return (
                    <div
                      key={si}
                      className="absolute left-0.5 right-0.5 rounded-md flex items-start px-1 pt-0.5 overflow-hidden"
                      style={{
                        top: slot.top,
                        height: Math.max(slot.height, 18),
                        background: col.bg,
                        color: col.text,
                      }}
                    >
                      <span className="text-[9px] font-semibold leading-tight truncate">
                        {slot.label ?? col.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* 图例 */}
      <div className="flex gap-4 px-4 py-3 border-t text-[10px]"
        style={{ borderColor: "var(--color-mp-border)", color: "var(--color-mp-muted)" }}>
        {Object.entries(COLORS).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: v.bg }} />
            {v.label}
          </span>
        ))}
      </div>
    </div>
  );
}
