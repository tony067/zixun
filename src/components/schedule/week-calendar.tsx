"use client";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

/* ── 时间轴参数 ───────────────────────────────────────────── */
const HOUR_START = 8;   // 08:00
const HOUR_END   = 21;  // 21:00 (不含)
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
const PX_PER_HOUR = 60; // 每小时 60px

type SlotType = "available" | "blocked" | "fixed";

interface CalSlot {
  startIso: string;  // "HH:MM" on a given date
  date: string;      // "YYYY-MM-DD"
  durationMinutes: number;
  type: SlotType;
  label?: string;
}

interface Rule {
  id: string;
  type: SlotType;
  weekdays?: string | null;  // "0,1,4" — 0=周一…6=周日
  startTime?: string | null; // "09:00"
  durationMinutes?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  fixedClientId?: string | null;
  isSingle?: boolean | null;
  singleDate?: string | null;
  singleTime?: string | null;
  isActive?: boolean | null;
}

/* ── 颜色 ─────────────────────────────────────────────────── */
const TYPE_COLOR: Record<SlotType, { bg: string; border: string; text: string }> = {
  available: { bg: "#D1FAE5", border: "#6EE7B7", text: "#065F46" },
  blocked:   { bg: "#FEE2E2", border: "#FCA5A5", text: "#991B1B" },
  fixed:     { bg: "#FEF3C7", border: "#FCD34D", text: "#92400E" },
};

/* ── 工具 ─────────────────────────────────────────────────── */
function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMondayOfWeek(offset: number): Date {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(today);
  mon.setDate(today.getDate() + diffToMon + offset * 7);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function getWeekDates(offset: number): Date[] {
  const mon = getMondayOfWeek(offset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/* 从规则展开本周所有 slots */
function expandRules(rules: Rule[], weekDates: Date[]): CalSlot[] {
  const slots: CalSlot[] = [];

  for (const rule of rules) {
    if (!rule.isActive) continue;

    if (rule.isSingle) {
      // 单次规则
      const d = rule.singleDate;
      const t = rule.singleTime;
      if (!d || !t) continue;
      if (!weekDates.some(wd => isoDate(wd) === d)) continue;
      slots.push({
        date: d,
        startIso: t,
        durationMinutes: rule.durationMinutes ?? 50,
        type: rule.type,
      });
    } else {
      // 循环规则
      if (!rule.weekdays || !rule.startTime) continue;
      const days = rule.weekdays.split(",").map(Number); // 0=周一
      const validFrom = rule.validFrom ?? isoDate(new Date(0));
      const validUntil = rule.validUntil ?? "9999-12-31";

      for (const wd of weekDates) {
        const dateStr = isoDate(wd);
        if (dateStr < validFrom || dateStr > validUntil) continue;
        // JS getDay: 0=Sun,1=Mon… → 0=周一: jsDay===0?6:jsDay-1
        const jsDay = wd.getDay();
        const ruleDay = jsDay === 0 ? 6 : jsDay - 1;
        if (!days.includes(ruleDay)) continue;

        slots.push({
          date: dateStr,
          startIso: rule.startTime,
          durationMinutes: rule.durationMinutes ?? 50,
          type: rule.type,
          label: rule.fixedClientId ?? undefined,
        });
      }
    }
  }

  return slots;
}

/* ── WeekCalendar component ──────────────────────────────── */
export function WeekCalendar({ rules }: { rules: Rule[] }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const slots = useMemo(() => expandRules(rules, weekDates), [rules, weekDates]);

  const today = isoDate(new Date());

  const weekLabel = (() => {
    const mon = weekDates[0];
    const sun = weekDates[6];
    if (weekOffset === 0) return "本周";
    const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
    return `${fmt(mon)} – ${fmt(sun)}`;
  })();

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden border"
      style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}
    >
      {/* ── 头部：周导航 ── */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--color-mp-border)" }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setWeekOffset(w => w - 1)}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "var(--color-mp-surface)", color: "var(--color-mp-muted)" }}
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>
        <span className="text-sm font-semibold" style={{ color: "var(--color-mp-text)" }}>
          {weekLabel}
        </span>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setWeekOffset(w => w + 1)}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "var(--color-mp-surface)", color: "var(--color-mp-muted)" }}
        >
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* ── 星期表头 ── */}
      <div
        className="grid border-b"
        style={{
          gridTemplateColumns: "44px repeat(7, 1fr)",
          borderColor: "var(--color-mp-border)",
        }}
      >
        <div /> {/* 时间轴占位 */}
        {weekDates.map((d, i) => {
          const isToday = isoDate(d) === today;
          return (
            <div key={i} className="flex flex-col items-center py-2 gap-0.5">
              <span
                className="text-[10px] font-medium"
                style={{ color: "var(--color-mp-muted)" }}
              >
                {["周一", "周二", "周三", "周四", "周五", "周六", "周日"][i]}
              </span>
              <span
                className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "text-white" : ""}`}
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

      {/* ── 时间轴主体 ── */}
      <div className="overflow-y-auto" style={{ maxHeight: "480px" }}>
        <div
          className="relative grid"
          style={{
            gridTemplateColumns: "44px repeat(7, 1fr)",
            height: `${HOURS.length * PX_PER_HOUR}px`,
          }}
        >
          {/* 时间刻度列 */}
          <div className="relative">
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute right-2 text-[10px] leading-none"
                style={{
                  top: `${(h - HOUR_START) * PX_PER_HOUR - 6}px`,
                  color: "var(--color-mp-faint)",
                }}
              >
                {String(h).padStart(2, "0")}
              </div>
            ))}
          </div>

          {/* 7天竖列 */}
          {weekDates.map((wd, colIdx) => {
            const dateStr = isoDate(wd);
            const daySlots = slots.filter(s => s.date === dateStr);
            return (
              <div
                key={colIdx}
                className="relative border-l"
                style={{ borderColor: "var(--color-mp-border)" }}
              >
                {/* 整点横线 */}
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="absolute w-full border-t"
                    style={{
                      top: `${(h - HOUR_START) * PX_PER_HOUR}px`,
                      borderColor: `${colIdx === 0 ? "var(--color-mp-border)" : "transparent"}`,
                    }}
                  />
                ))}
                {/* 通用横线 — 每小时在所有列 */}
                {HOURS.map(h => (
                  <div
                    key={`line-${h}`}
                    className="absolute w-full"
                    style={{
                      top: `${(h - HOUR_START) * PX_PER_HOUR}px`,
                      height: "1px",
                      background: "var(--color-mp-border)",
                      opacity: 0.5,
                    }}
                  />
                ))}

                {/* 时间槽方块 */}
                {daySlots.map((slot, si) => {
                  const startMin = timeToMinutes(slot.startIso);
                  const topPx = (startMin / 60 - HOUR_START) * PX_PER_HOUR;
                  const heightPx = Math.max((slot.durationMinutes / 60) * PX_PER_HOUR, 20);
                  const c = TYPE_COLOR[slot.type];
                  return (
                    <motion.div
                      key={si}
                      initial={{ opacity: 0, scaleY: 0.8 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="absolute inset-x-0.5 rounded-md overflow-hidden border-l-2 px-1 py-0.5"
                      style={{
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                        background: c.bg,
                        borderLeftColor: c.border,
                        borderTopColor: c.border,
                        borderTopWidth: "1px",
                        borderRightColor: c.border,
                        borderRightWidth: "1px",
                        borderBottomColor: c.border,
                        borderBottomWidth: "1px",
                      }}
                    >
                      <p
                        className="text-[9px] font-semibold leading-tight truncate"
                        style={{ color: c.text }}
                      >
                        {slot.startIso}
                        {slot.label ? ` · ${slot.label}` : ""}
                      </p>
                      {heightPx >= 32 && (
                        <p className="text-[8px] leading-tight truncate" style={{ color: c.text, opacity: 0.7 }}>
                          {slot.durationMinutes} 分钟
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* 图例 */}
      <div
        className="flex items-center gap-4 px-4 py-2 border-t text-[10px]"
        style={{ borderColor: "var(--color-mp-border)", color: "var(--color-mp-muted)" }}
      >
        {(["available", "fixed", "blocked"] as SlotType[]).map(t => (
          <span key={t} className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-sm border-l-2 inline-block"
              style={{ background: TYPE_COLOR[t].bg, borderLeftColor: TYPE_COLOR[t].border }}
            />
            {{ available: "可预约", fixed: "固定档期", blocked: "已屏蔽" }[t]}
          </span>
        ))}
      </div>
    </div>
  );
}
