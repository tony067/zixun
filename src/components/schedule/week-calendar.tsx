"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CalSlot = {
  id: string;
  type: "available" | "blocked" | "fixed";
  startTime: string;  // "09:00"
  durationMinutes: number;
  label?: string;
  weekdays?: string;  // "0,1,4" (0=Mon)
  isSingle?: boolean;
  singleDate?: string;  // "2026-05-28"
  singleTime?: string;  // "10:00"
  validFrom?: string;
  validUntil?: string;
  isActive?: boolean;
};

const SLOT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  available: { bg: "rgba(156,180,138,0.85)", border: "#6a9860", text: "#fff" },
  blocked:   { bg: "rgba(220,38,38,0.75)",  border: "#b91c1c", text: "#fff" },
  fixed:     { bg: "rgba(217,119,6,0.80)",  border: "#b45309", text: "#fff" },
};

const HOUR_START = 8;   // 08:00
const HOUR_END   = 21;  // 21:00 (last row = 20:xx)
const TOTAL_HOURS = HOUR_END - HOUR_START;
const ROW_PX = 56;      // each hour = 56px

function getWeekDates(offset: number): Date[] {
  const now = new Date();
  const jsDay = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - (jsDay === 0 ? 6 : jsDay - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Expand rules to (dateStr → slot[]) map for the given week */
function expandToWeek(slots: CalSlot[], weekDates: Date[]) {
  const map: Record<string, { slot: CalSlot; top: number; height: number }[]> = {};
  weekDates.forEach(d => { map[d.toISOString().slice(0, 10)] = []; });

  for (const slot of slots) {
    if (slot.isActive === false) continue;

    if (slot.isSingle && slot.singleDate) {
      // single occurrence
      if (!map[slot.singleDate]) continue;
      const top = (timeToMinutes(slot.singleTime ?? slot.startTime ?? "09:00") - HOUR_START * 60) / 60 * ROW_PX;
      const height = Math.max((slot.durationMinutes / 60) * ROW_PX, 20);
      if (top < 0) continue;
      map[slot.singleDate].push({ slot, top, height });
    } else if (slot.weekdays) {
      // recurring
      const wdNums = slot.weekdays.split(",").map(Number);
      for (const d of weekDates) {
        const dateStr = d.toISOString().slice(0, 10);
        const jsDay = d.getDay();
        const ruleDay = jsDay === 0 ? 6 : jsDay - 1; // convert to 0=Mon
        if (!wdNums.includes(ruleDay)) continue;
        if (slot.validFrom && dateStr < slot.validFrom) continue;
        if (slot.validUntil && dateStr > slot.validUntil) continue;
        const top = (timeToMinutes(slot.startTime ?? "09:00") - HOUR_START * 60) / 60 * ROW_PX;
        const height = Math.max((slot.durationMinutes / 60) * ROW_PX, 20);
        if (top < 0) continue;
        map[dateStr].push({ slot, top, height });
      }
    }
  }
  return map;
}

const WEEKDAY_SHORT = ["一","二","三","四","五","六","日"];

export function WeekCalendar({ slots = [] }: { slots: CalSlot[] }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const slotMap = useMemo(() => expandToWeek(slots, weekDates), [slots, weekDates]);

  const today = new Date().toISOString().slice(0, 10);
  const totalHeight = TOTAL_HOURS * ROW_PX;

  const weekLabel = (() => {
    if (weekOffset === 0) return "本周";
    if (weekOffset === 1) return "下周";
    const d = weekDates[0];
    return `${d.getMonth() + 1}/${d.getDate()} 起`;
  })();

  return (
    <div className="flex flex-col" style={{ background: "var(--color-mp-surface)" }}>
      {/* Nav bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--color-mp-border)" }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setWeekOffset(w => w - 1)}
          className="w-8 h-8 rounded-xl border flex items-center justify-center"
          style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}>
          <ChevronLeft className="w-4 h-4" style={{ color: "var(--color-mp-muted)" }} />
        </motion.button>
        <span className="text-sm font-medium" style={{ color: "var(--color-mp-text)" }}>{weekLabel}</span>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setWeekOffset(w => w + 1)}
          className="w-8 h-8 rounded-xl border flex items-center justify-center"
          style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}>
          <ChevronRight className="w-4 h-4" style={{ color: "var(--color-mp-muted)" }} />
        </motion.button>
      </div>

      {/* Day header row */}
      <div className="flex border-b" style={{ borderColor: "var(--color-mp-border)" }}>
        <div className="w-10 flex-shrink-0" /> {/* time gutter */}
        {weekDates.map((d, i) => {
          const ds = d.toISOString().slice(0, 10);
          const isToday = ds === today;
          return (
            <div key={i} className="flex-1 py-2 text-center">
              <div className="text-[10px] mb-0.5" style={{ color: "var(--color-mp-faint)" }}>{WEEKDAY_SHORT[i]}</div>
              <div className={`text-sm font-semibold mx-auto w-7 h-7 rounded-full flex items-center justify-center ${isToday ? "text-white" : ""}`}
                style={{ background: isToday ? "var(--color-mp-primary)" : "transparent", color: isToday ? "#fff" : "var(--color-mp-text)" }}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline grid */}
      <div className="overflow-y-auto flex-1" style={{ maxHeight: "calc(100svh - 260px)" }}>
        <div className="flex relative" style={{ height: totalHeight }}>
          {/* Time gutter */}
          <div className="w-10 flex-shrink-0 relative">
            {Array.from({ length: TOTAL_HOURS }, (_, i) => (
              <div key={i} className="absolute left-0 right-0 text-right pr-1.5"
                style={{ top: i * ROW_PX - 8, height: ROW_PX }}>
                <span className="text-[9px]" style={{ color: "var(--color-mp-faint)" }}>
                  {String(HOUR_START + i).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDates.map((d, di) => {
            const ds = d.toISOString().slice(0, 10);
            const isToday = ds === today;
            const daySlots = slotMap[ds] ?? [];

            return (
              <div key={di} className="flex-1 relative border-l"
                style={{ borderColor: "var(--color-mp-border)", background: isToday ? "rgba(156,180,138,0.03)" : "transparent" }}>
                {/* Hour grid lines */}
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div key={i} className="absolute left-0 right-0 border-t"
                    style={{ top: i * ROW_PX, borderColor: "var(--color-mp-border)", opacity: 0.5 }} />
                ))}

                {/* Slot blocks */}
                {daySlots.map(({ slot, top, height }, si) => {
                  const col = SLOT_COLORS[slot.type] ?? SLOT_COLORS.available;
                  return (
                    <div key={si} className="absolute left-1 right-1 rounded-lg overflow-hidden cursor-pointer"
                      style={{ top: top + 1, height: height - 2, background: col.bg, border: `1px solid ${col.border}` }}>
                      <div className="px-1.5 py-1">
                        <div className="text-[10px] font-semibold leading-tight" style={{ color: col.text }}>
                          {slot.startTime}
                        </div>
                        {height > 36 && (
                          <div className="text-[9px] leading-tight opacity-90" style={{ color: col.text }}>
                            {slot.durationMinutes}分钟
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

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t"
        style={{ borderColor: "var(--color-mp-border)" }}>
        {[
          { type: "available", label: "可预约" },
          { type: "fixed",     label: "固定档期" },
          { type: "blocked",   label: "已屏蔽" },
        ].map(({ type, label }) => {
          const col = SLOT_COLORS[type];
          return (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ background: col.bg, border: `1px solid ${col.border}` }} />
              <span className="text-[11px]" style={{ color: "var(--color-mp-muted)" }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
