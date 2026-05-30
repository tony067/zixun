"use client";
import { useState, useMemo } from "react";
import {
  getNextDays, generateMockSlots, TimeSlot,
  WEEKDAY_LABELS, PERIOD_LABELS,
} from "@/lib/booking-flow-data";

interface Props {
  sessionModes: string[];
  durationMinutes: number;
  onNext: (data: { mode: string; date: Date; slot: TimeSlot }) => void;
}

export function Step1Time({ sessionModes, durationMinutes, onNext }: Props) {
  const days = useMemo(() => getNextDays(14), []);
  const slots = useMemo(() => generateMockSlots(days), [days]);

  const [selectedMode, setSelectedMode] = useState<string | null>(
    sessionModes.length === 1 ? sessionModes[0] : null
  );
  const [selectedDay, setSelectedDay] = useState<Date>(days[0]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const dayKey = selectedDay.toISOString().slice(0, 10);
  const daySlots = slots[dayKey] ?? [];

  const morning = daySlots.filter(s => s.period === "morning");
  const afternoon = daySlots.filter(s => s.period === "afternoon");
  const evening = daySlots.filter(s => s.period === "evening");

  const canNext = selectedMode && selectedSlot;

  const modeIcon: Record<string, string> = { "视频咨询": "📹", "语音咨询": "📞", "面对面咨询": "🧑‍🤝‍🧑" };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* 咨询方式 */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-[#2C2420] mb-3">选择咨询方式</h3>
          <div className="flex gap-3">
            {sessionModes.map(m => (
              <button key={m}
                onClick={() => setSelectedMode(m)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: selectedMode === m ? "var(--color-primary)" : "white",
                  color: selectedMode === m ? "white" : "#5A4E44",
                  border: selectedMode === m ? "none" : "1.5px solid #E8E2D8",
                }}>
                <span>{modeIcon[m] ?? "💬"}</span>{m}
              </button>
            ))}
          </div>
        </div>

        {/* 日期选择 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2 mb-3">
            <h3 className="text-sm font-bold text-[#2C2420]">选择时间</h3>
            <span className="text-xs text-[#9B8E82]">最早可约24小时后 · 每次 {durationMinutes} 分钟</span>
          </div>

          {/* 横滑日期 */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-none">
            {days.map(d => {
              const key = d.toISOString().slice(0, 10);
              const isSelected = key === dayKey;
              const hasSlot = (slots[key] ?? []).some(s => s.available);
              return (
                <button key={key}
                  onClick={() => { setSelectedDay(d); setSelectedSlot(null); }}
                  className="flex-none flex flex-col items-center py-2.5 px-3 rounded-xl transition-all"
                  style={{
                    background: isSelected ? "var(--color-primary)" : "white",
                    color: isSelected ? "white" : "#5A4E44",
                    border: isSelected ? "none" : "1.5px solid #E8E2D8",
                    minWidth: 60,
                    opacity: hasSlot ? 1 : 0.5,
                  }}>
                  <span className="text-[11px] mb-0.5"
                    style={{ color: isSelected ? "rgba(255,255,255,0.8)" : "#9B8E82" }}>
                    {WEEKDAY_LABELS[d.getDay()]}
                  </span>
                  <span className="text-base font-bold">
                    {d.getMonth() + 1}.{d.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 时段 */}
        {(["morning", "afternoon", "evening"] as const).map(period => {
          const periodSlots = period === "morning" ? morning : period === "afternoon" ? afternoon : evening;
          const hasAny = periodSlots.length > 0;
          return (
            <div key={period} className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs">{period === "morning" ? "☀️" : period === "afternoon" ? "🌤" : "🌙"}</span>
                <span className="text-sm font-semibold text-[#5A4E44]">{PERIOD_LABELS[period]}</span>
              </div>
              {!hasAny && (
                <p className="text-sm text-[#9B8E82]">暂无可约时段</p>
              )}
              <div className="flex flex-wrap gap-2">
                {periodSlots.map(slot => {
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <button key={slot.id}
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(isSelected ? null : slot)}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: !slot.available ? "#F5F0EA" : isSelected ? "var(--color-primary)" : "white",
                        color: !slot.available ? "#C4BDB5" : isSelected ? "white" : "#3A3330",
                        border: isSelected ? "none" : "1.5px solid #E8E2D8",
                        textDecoration: !slot.available ? "line-through" : "none",
                      }}>
                      {slot.start}–{slot.end}
                    </button>
                  );
                })}
              </div>
              {hasAny && periodSlots.every(s => !s.available) && (
                <p className="text-xs text-[#9B8E82] mt-1">时间已约满</p>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部按钮 */}
      <div className="px-5 pb-8 pt-3 border-t" style={{ borderColor: "#EBE7DF", background: "var(--color-bg)" }}>
        {selectedSlot && selectedMode && (
          <p className="text-xs text-[#9B8E82] mb-2 text-center">
            已选：{selectedMode} · {selectedDay.getMonth() + 1}/{selectedDay.getDate()} {selectedSlot.start}–{selectedSlot.end}
          </p>
        )}
        <button
          disabled={!canNext}
          onClick={() => canNext && onNext({ mode: selectedMode!, date: selectedDay, slot: selectedSlot! })}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-base transition-opacity"
          style={{ background: canNext ? "var(--color-primary)" : "#C4BDB5" }}>
          下一步：填写申请信息
        </button>
      </div>
    </div>
  );
}
