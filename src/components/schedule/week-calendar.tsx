"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// 工具：将 0=周一 … 6=周日 的规则 weekday 转换为本周某天的日期
function getWeekDates(offsetWeeks = 0): Date[] {
  const now = new Date();
  const jsDay = now.getDay(); // 0=周日
  const mondayDiff = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayDiff + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const WEEKDAY_LABELS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 07:00 – 21:00
const HOUR_HEIGHT = 60; // px per hour

export type CalendarSlot = {
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "HH:MM"
  durationMinutes: number;
  type: "available" | "blocked" | "fixed";
  label?: string;
};

const TYPE_COLOR = {
  available: { bg: "#9CB48A", text: "#fff", label: "可预约" },
  blocked:   { bg: "#EF4444", text: "#fff", label: "已屏蔽" },
  fixed:     { bg: "#F59E0B", text: "#fff", label: "固定档期" },
};

interface WeekCalendarProps {
  slots?: CalendarSlot[];
}

export default function WeekCalendar({ slots = [] }: WeekCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const today = new Date().toISOString().slice(0, 10);
  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    if (weekOffset === 0) return "本周";
    if (weekOffset === 1) return "下周";
    return `${start.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}`;
  }, [weekDates, weekOffset]);

  // 将 slots 按 "YYYY-MM-DD" 分组，并计算像素偏移
  const slotsByDate = useMemo(() => {
    const map: Record<string, CalendarSlot[]> = {};
    for (const s of slots) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [slots]);

  function slotToStyle(s: CalendarSlot) {
    const [h, m] = s.startTime.split(":").map(Number);
    const topFromHour7 = (h - 7 + m / 60) * HOUR_HEIGHT;
    const height = Math.max((s.durationMinutes / 60) * HOUR_HEIGHT, 20);
    return { top: topFromHour7, height };
  }

  return (
    <div className="flex flex-col" style={{ background: "var(--color-mp-card)", borderRadius: "1rem", overflow: "hidden" }}>
      {/* 周导航 */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--color-mp-border)" }}
      >
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setWeekOffset((w) => w - 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--color-mp-surface)" }}
        >
          <ChevronLeft className="w-4 h-4" style={{ color: "var(--color-mp-muted)" }} />
        </motion.button>

        <div className="text-sm font-semibold" style={{ color: "var(--color-mp-text)" }}>
          {weekLabel}
          <span className="ml-2 text-xs font-normal" style={{ color: "var(--color-mp-faint)" }}>
            {weekDates[0].toLocaleDateString("zh-CN", { month: "long" })}
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setWeekOffset((w) => w + 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--color-mp-surface)" }}
        >
          <ChevronRight className="w-4 h-4" style={{ color: "var(--color-mp-muted)" }} />
        </motion.button>
      </div>

      {/* 星期标题行 */}
      <div className="flex border-b" style={{ borderColor: "var(--color-mp-border)" }}>
        {/* 时间轴占位 */}
        <div className="w-12 flex-shrink-0" />
        {weekDates.map((d, i) => {
          const dateStr = d.toISOString().slice(0, 10);
          const isToday = dateStr === today;
          return (
            <div
              key={i}
              className="flex-1 text-center py-2"
            >
              <div className="text-[10px] font-medium" style={{ color: "var(--color-mp-faint)" }}>
                {WEEKDAY_LABELS[i]}
              </div>
              <div
                className="mx-auto w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5"
                style={isToday
                  ? { background: "var(--color-mp-primary)", color: "#fff" }
                  : { color: "var(--color-mp-text)" }}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* 时间轴 + 日列 */}
      <div className="flex overflow-y-auto" style={{ maxHeight: "520px" }}>
        {/* 时间轴 */}
        <div className="w-12 flex-shrink-0 relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute w-full text-right pr-2 text-[10px]"
              style={{
                top: (h - 7) * HOUR_HEIGHT - 6,
                color: "var(--color-mp-faint)",
              }}
            >
              {h.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* 日列 */}
        {weekDates.map((d, colIdx) => {
          const dateStr = d.toISOString().slice(0, 10);
          const daySlots = slotsByDate[dateStr] ?? [];
          const isPast = d < new Date(new Date().setHours(0, 0, 0, 0));

          return (
            <div
              key={colIdx}
              className="flex-1 relative border-l"
              style={{
                height: HOURS.length * HOUR_HEIGHT,
                borderColor: "var(--color-mp-border)",
                opacity: isPast ? 0.55 : 1,
              }}
            >
              {/* 整点分隔线 */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute w-full border-t"
                  style={{
                    top: (h - 7) * HOUR_HEIGHT,
                    borderColor: "var(--color-mp-border)",
                  }}
                />
              ))}

              {/* 时间槽色块 */}
              {daySlots.map((s, si) => {
                const { top, height } = slotToStyle(s);
                const color = TYPE_COLOR[s.type];
                return (
                  <motion.div
                    key={si}
                    initial={{ opacity: 0, scaleY: 0.8 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    style={{
                      position: "absolute",
                      top: top + 1,
                      left: 2,
                      right: 2,
                      height: height - 2,
                      background: color.bg,
                      color: color.text,
                      borderRadius: "6px",
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "2px 4px",
                      overflow: "hidden",
                      zIndex: 1,
                    }}
                    title={`${s.startTime} ${color.label}${s.label ? ` · ${s.label}` : ""}`}
                  >
                    {height >= 28 && (
                      <span>
                        {s.startTime}
                        {s.label ? ` ${s.label}` : ""}
                      </span>
                    )}
                  </motion.div>
                );
              })}

              {/* 当前时间红线（仅今天） */}
              {dateStr === today && (() => {
                const now = new Date();
                const topNow = (now.getHours() - 7 + now.getMinutes() / 60) * HOUR_HEIGHT;
                if (topNow < 0 || topNow > HOURS.length * HOUR_HEIGHT) return null;
                return (
                  <div
                    style={{
                      position: "absolute",
                      top: topNow,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: "#EF4444",
                      zIndex: 2,
                    }}
                  />
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* 图例 */}
      <div
        className="flex gap-4 px-4 py-2.5 border-t text-xs"
        style={{ borderColor: "var(--color-mp-border)", color: "var(--color-mp-muted)" }}
      >
        {Object.entries(TYPE_COLOR).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block flex-shrink-0" style={{ background: v.bg }} />
            {v.label}
          </span>
        ))}
      </div>
    </div>
  );
}
