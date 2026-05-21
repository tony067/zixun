"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────
export type SlotType = "available" | "blocked" | "fixed";
export type RuleMode = "recurring" | "single";

export interface Rule {
  id: string;
  type: SlotType;
  weekdays?: string;       // "0,2,4" (0=周一…6=周日)
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

// ── Config ─────────────────────────────────────────────────────
const HOUR_START = 7;
const HOUR_END   = 22;
const TOTAL_HOURS = HOUR_END - HOUR_START; // 15
const PX_PER_HOUR = 60;                    // px height for 1 hour
const TOTAL_HEIGHT = TOTAL_HOURS * PX_PER_HOUR;

const COLORS = {
  available: { bg: "var(--color-mp-primary)",   light: "#dcf3d4", text: "#fff" },
  blocked:   { bg: "var(--color-mp-error)",     light: "#fee2e2", text: "#fff" },
  fixed:     { bg: "var(--color-mp-warning)",   light: "#fef3c7", text: "#fff" },
};

const WEEKDAY_SHORT = ["一","二","三","四","五","六","日"];
const TYPE_LABEL: Record<SlotType, string> = {
  available: "可预约",
  blocked:   "已屏蔽",
  fixed:     "固定档期",
};

// ── Date helpers ───────────────────────────────────────────────
function getMondayOfWeek(offset = 0) {
  const now = new Date();
  const day = now.getDay(); // 0=Sunday
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff + offset * 7);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function getWeekDates(weekOffset: number): Date[] {
  const mon = getMondayOfWeek(weekOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function dateStr(d: Date) {
  return d.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function isToday(d: Date) {
  const t = new Date();
  return d.getFullYear() === t.getFullYear() &&
         d.getMonth() === t.getMonth() &&
         d.getDate() === t.getDate();
}

// ── Expand rules → positioned blocks ──────────────────────────
interface Block {
  top: number;   // px from top of grid
  height: number;
  type: SlotType;
  label: string;
  dateKey: string; // "YYYY-MM-DD"
  colIndex: number; // 0-6
}

function expandRules(rules: Rule[], weekDates: Date[]): Block[] {
  const blocks: Block[] = [];

  for (const rule of rules) {
    if (rule.isActive === false) continue;

    if (rule.isSingle && rule.singleDate && rule.singleTime) {
      // Single occurrence
      const colIndex = weekDates.findIndex(d => isoDate(d) === rule.singleDate);
      if (colIndex === -1) continue;
      const [h, m] = rule.singleTime.split(":").map(Number);
      const topH = h - HOUR_START + m / 60;
      if (topH < 0 || topH >= TOTAL_HOURS) continue;
      const durationH = (rule.durationMinutes ?? 50) / 60;
      blocks.push({
        top: topH * PX_PER_HOUR,
        height: Math.max(durationH * PX_PER_HOUR, 18),
        type: rule.type,
        label: TYPE_LABEL[rule.type],
        dateKey: rule.singleDate,
        colIndex,
      });
    } else if (rule.weekdays && rule.startTime) {
      // Recurring
      const ruleWeekdays = rule.weekdays.split(",").map(Number); // 0=Monday
      const [h, m] = rule.startTime.split(":").map(Number);
      const topH = h - HOUR_START + m / 60;
      if (topH < 0 || topH >= TOTAL_HOURS) continue;
      const durationH = (rule.durationMinutes ?? 50) / 60;

      weekDates.forEach((d, colIndex) => {
        // Convert JS getDay (0=Sunday) to 0=Monday
        const jsDay = d.getDay();
        const ruleDay = jsDay === 0 ? 6 : jsDay - 1;
        if (!ruleWeekdays.includes(ruleDay)) return;

        // Check validFrom / validUntil
        const key = isoDate(d);
        if (rule.validFrom && key < rule.validFrom) return;
        if (rule.validUntil && key > rule.validUntil) return;

        blocks.push({
          top: topH * PX_PER_HOUR,
          height: Math.max(durationH * PX_PER_HOUR, 18),
          type: rule.type,
          label: TYPE_LABEL[rule.type],
          dateKey: key,
          colIndex,
        });
      });
    }
  }
  return blocks;
}

// ── Component ──────────────────────────────────────────────────
interface WeekCalendarProps {
  rules: Rule[];
}

export function WeekCalendar({ rules }: WeekCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const weekDates = getWeekDates(weekOffset);
  const blocks = expandRules(rules, weekDates);

  // Scroll to 8 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (8 - HOUR_START) * PX_PER_HOUR;
    }
  }, []);

  const mon = getMondayOfWeek(weekOffset);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const headerLabel = `${mon.toLocaleDateString("zh-CN", { month: "long", day: "numeric" })} — ${sun.toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}`;

  return (
    <div
      className="flex flex-col rounded-2xl border overflow-hidden"
      style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--color-mp-border)" }}
      >
        <button
          onClick={() => setWeekOffset(w => w - 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ background: "var(--color-mp-surface)" }}
        >
          <ChevronLeft className="w-4 h-4" style={{ color: "var(--color-mp-muted)" }} />
        </button>
        <span className="text-sm font-semibold" style={{ color: "var(--color-mp-text)" }}>
          {weekOffset === 0 ? "本周" : weekOffset === 1 ? "下周" : weekOffset === -1 ? "上周" : headerLabel}
        </span>
        <button
          onClick={() => setWeekOffset(w => w + 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ background: "var(--color-mp-surface)" }}
        >
          <ChevronRight className="w-4 h-4" style={{ color: "var(--color-mp-muted)" }} />
        </button>
      </div>

      {/* ── Day headers ── */}
      <div className="flex border-b" style={{ borderColor: "var(--color-mp-border)" }}>
        {/* Time gutter */}
        <div className="w-10 flex-shrink-0" />
        {weekDates.map((d, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center py-2 gap-0.5"
          >
            <span
              className="text-[10px] font-medium"
              style={{ color: "var(--color-mp-faint)" }}
            >
              {WEEKDAY_SHORT[i]}
            </span>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold"
              style={
                isToday(d)
                  ? { background: "var(--color-mp-primary)", color: "#fff" }
                  : { color: "var(--color-mp-text)" }
              }
            >
              {d.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* ── Scrollable grid ── */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: "calc(100svh - 280px)" }}>
        <div className="flex relative" style={{ height: TOTAL_HEIGHT }}>

          {/* Time labels */}
          <div className="w-10 flex-shrink-0 relative">
            {Array.from({ length: TOTAL_HOURS }, (_, i) => (
              <div
                key={i}
                className="absolute right-1 text-[9px] leading-none"
                style={{ top: i * PX_PER_HOUR - 5, color: "var(--color-mp-faint)" }}
              >
                {HOUR_START + i}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDates.map((_, colIndex) => (
            <div key={colIndex} className="flex-1 relative border-l" style={{ borderColor: "var(--color-mp-border)" }}>
              {/* Hour lines */}
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div
                  key={i}
                  className="absolute inset-x-0 border-t"
                  style={{
                    top: i * PX_PER_HOUR,
                    borderColor: i === 0 ? "transparent" : "var(--color-mp-border)",
                    borderStyle: "dashed",
                    opacity: 0.5,
                  }}
                />
              ))}

              {/* Slot blocks */}
              {blocks
                .filter(b => b.colIndex === colIndex)
                .map((b, idx) => {
                  const color = COLORS[b.type];
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scaleY: 0.8 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="absolute inset-x-0.5 rounded-md px-1 overflow-hidden flex items-start pt-0.5"
                      style={{
                        top: b.top,
                        height: b.height,
                        background: color.bg,
                        zIndex: 2,
                      }}
                      title={b.label}
                    >
                      <span className="text-[9px] font-semibold leading-tight text-white truncate">
                        {b.label}
                      </span>
                    </motion.div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Legend ── */}
      <div
        className="flex gap-4 px-4 py-2.5 border-t text-[10px]"
        style={{ borderColor: "var(--color-mp-border)", color: "var(--color-mp-muted)" }}
      >
        {(["available","blocked","fixed"] as SlotType[]).map(t => (
          <span key={t} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: COLORS[t].bg }} />
            {TYPE_LABEL[t]}
          </span>
        ))}
      </div>
    </div>
  );
}
