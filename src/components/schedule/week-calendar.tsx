"use client";

import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CalRule = {
  id: string;
  type: "available" | "blocked" | "fixed";
  weekdays?: string;   // "0,1,4" 0=周一…6=周日
  startTime?: string;  // "09:00"
  durationMinutes?: number;
  validFrom?: string;
  validUntil?: string;
  isSingle?: boolean;
  singleDate?: string;
  singleTime?: string;
  isActive?: boolean;
};

const COLORS = {
  available: { bg: "#9CB48A", text: "#fff", border: "#7a9a6a" },
  blocked:   { bg: "#DC2626", text: "#fff", border: "#b91c1c" },
  fixed:     { bg: "#D97706", text: "#fff", border: "#b45309" },
};

const HOUR_START = 8;
const HOUR_END   = 21;
const TOTAL_HRS  = HOUR_END - HOUR_START;   // 13 hours
const PX_PER_MIN = 1.6;                      // each minute = 1.6px → 1hr = 96px
const HOUR_H     = 60 * PX_PER_MIN;

function getWeekDates(weekOffset: number): Date[] {
  const now = new Date();
  const dow = now.getDay();  // 0=Sun
  const mon = new Date(now);
  mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + weekOffset * 7);
  mon.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function expandRules(rules: CalRule[], dates: Date[]): Map<string, { top: number; h: number; type: "available" | "blocked" | "fixed" }[]> {
  const result = new Map<string, { top: number; h: number; type: "available"|"blocked"|"fixed" }[]>();

  for (const rule of rules) {
    if (rule.isActive === false) continue;

    if (rule.isSingle && rule.singleDate && rule.singleTime) {
      const [hh, mm] = rule.singleTime.split(":").map(Number);
      const dur = rule.durationMinutes ?? 50;
      const top = (hh - HOUR_START) * HOUR_H + mm * PX_PER_MIN;
      if (top < 0 || top > TOTAL_HRS * HOUR_H) continue;
      const key = rule.singleDate;
      if (!result.has(key)) result.set(key, []);
      result.get(key)!.push({ top, h: dur * PX_PER_MIN, type: rule.type as "available"|"blocked"|"fixed" });
      continue;
    }

    if (!rule.weekdays || !rule.startTime) continue;
    const wdays = rule.weekdays.split(",").map(Number);
    const [hh, mm] = rule.startTime.split(":").map(Number);
    const dur = rule.durationMinutes ?? 50;
    const top = (hh - HOUR_START) * HOUR_H + mm * PX_PER_MIN;
    if (top < 0) continue;

    for (const date of dates) {
      const jsDay = date.getDay();
      const ruleDay = jsDay === 0 ? 6 : jsDay - 1; // convert to 0=Mon
      if (!wdays.includes(ruleDay)) continue;

      const dateStr = date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
        .replace(/\//g, "-");
      // validFrom / validUntil check
      if (rule.validFrom) {
        const from = new Date(rule.validFrom + "T00:00:00");
        if (date < from) continue;
      }
      if (rule.validUntil) {
        const until = new Date(rule.validUntil + "T23:59:59");
        if (date > until) continue;
      }

      const key = date.toISOString().slice(0, 10);
      if (!result.has(key)) result.set(key, []);
      result.get(key)!.push({ top, h: dur * PX_PER_MIN, type: rule.type as "available"|"blocked"|"fixed" });
    }
  }
  return result;
}

const WEEKDAYS_ZH = ["一", "二", "三", "四", "五", "六", "日"];

interface WeekCalendarProps {
  rules: CalRule[];
  weekOffset: number;
  onWeekChange: (offset: number) => void;
}

export function WeekCalendar({ rules, weekOffset, onWeekChange }: WeekCalendarProps) {
  const dates  = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const slotMap = useMemo(() => expandRules(rules, dates), [rules, dates]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().slice(0, 10);
  const totalH = TOTAL_HRS * HOUR_H;

  const weekLabel = () => {
    const [s, e] = [dates[0], dates[6]];
    const sm = s.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
    const em = e.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
    return `${sm} — ${em}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#EBE7DF] shrink-0"
        style={{ background: "#FDFBF7" }}>
        <button onClick={() => onWeekChange(weekOffset - 1)}
          className="w-8 h-8 rounded-xl border border-[#EBE7DF] flex items-center justify-center"
          style={{ background: "#F5F1E8" }}>
          <ChevronLeft className="w-4 h-4 text-[#7D736A]" />
        </button>
        <span className="text-sm font-medium text-[#3B332C]">
          {weekOffset === 0 ? `本周 · ${weekLabel()}` : weekLabel()}
        </span>
        <button onClick={() => onWeekChange(weekOffset + 1)}
          className="w-8 h-8 rounded-xl border border-[#EBE7DF] flex items-center justify-center"
          style={{ background: "#F5F1E8" }}>
          <ChevronRight className="w-4 h-4 text-[#7D736A]" />
        </button>
      </div>

      {/* Day headers */}
      <div className="flex shrink-0 border-b border-[#EBE7DF]" style={{ background: "#FDFBF7" }}>
        <div className="w-10 shrink-0" />
        {dates.map((d, i) => {
          const isToday = d.toISOString().slice(0, 10) === today;
          return (
            <div key={i} className="flex-1 flex flex-col items-center py-1.5">
              <span className="text-[10px] text-[#7D736A]">{WEEKDAYS_ZH[i]}</span>
              <span className={`text-sm font-semibold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${
                isToday ? "bg-[#9CB48A] text-white" : "text-[#3B332C]"
              }`}>
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="flex relative" style={{ height: totalH }}>
          {/* Time axis */}
          <div className="w-10 shrink-0 relative">
            {Array.from({ length: TOTAL_HRS + 1 }, (_, i) => (
              <div key={i} className="absolute w-full flex items-center justify-end pr-1"
                style={{ top: i * HOUR_H - 6, height: 12 }}>
                <span className="text-[9px] text-[#C2BDB7]">{HOUR_START + i}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {dates.map((d, i) => {
            const key = d.toISOString().slice(0, 10);
            const slots = slotMap.get(key) ?? [];
            const isToday = key === today;
            return (
              <div key={i} className="flex-1 relative border-l border-[#EBE7DF]">
                {/* Hour lines */}
                {Array.from({ length: TOTAL_HRS + 1 }, (_, hi) => (
                  <div key={hi} className="absolute w-full border-t border-[#EBE7DF]/50"
                    style={{ top: hi * HOUR_H }} />
                ))}

                {/* Today highlight */}
                {isToday && <div className="absolute inset-0 bg-[#9CB48A]/[0.04]" />}

                {/* Slots */}
                {slots.map((s, si) => {
                  const col = COLORS[s.type];
                  return (
                    <motion.div
                      key={si}
                      initial={{ opacity: 0, scaleY: 0.8 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0.5 right-0.5 rounded-md px-1 py-0.5 overflow-hidden"
                      style={{
                        top: s.top,
                        height: Math.max(s.h, 18),
                        background: col.bg,
                        border: `1px solid ${col.border}`,
                      }}
                    >
                      {s.h >= 20 && (
                        <span className="text-[9px] font-medium leading-tight" style={{ color: col.text }}>
                          {s.type === "available" ? "可约" : s.type === "blocked" ? "屏蔽" : "固定"}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 px-4 py-2 border-t border-[#EBE7DF] shrink-0 text-[10px] text-[#7D736A]"
        style={{ background: "#FDFBF7" }}>
        {(["available", "blocked", "fixed"] as const).map((t) => (
          <span key={t} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: COLORS[t].bg }} />
            {t === "available" ? "可预约" : t === "blocked" ? "已屏蔽" : "固定档期"}
          </span>
        ))}
      </div>
    </div>
  );
}
