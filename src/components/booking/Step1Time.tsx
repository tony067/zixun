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
  const [showCoordinate, setShowCoordinate] = useState(false);
  const [coordMsg, setCoordMsg] = useState("");
  const [coordNote, setCoordNote] = useState("");

  const dayKey = selectedDay.toISOString().slice(0, 10);
  const daySlots = slots[dayKey] ?? [];

  const morning = daySlots.filter(s => s.period === "morning");
  const afternoon = daySlots.filter(s => s.period === "afternoon");
  const evening = daySlots.filter(s => s.period === "evening");

  const allBooked = days.every(d => {
    const k = d.toISOString().slice(0,10);
    const sl = slots[k] ?? [];
    return sl.length === 0 || sl.every(s => s.booked);
  });
  const canNext = selectedMode && selectedSlot;

  // SVG icons matching counselor detail page style
  const modeIconSvg: Record<string, React.ReactNode> = {
    "视频": (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none" strokeWidth="1.6" stroke="currentColor">
        <rect x="2" y="6" width="14" height="12" rx="2" />
        <polyline points="16,10 22,7 22,17 16,14" />
      </svg>
    ),
    "视频咨询": (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none" strokeWidth="1.6" stroke="currentColor">
        <rect x="2" y="6" width="14" height="12" rx="2" />
        <polyline points="16,10 22,7 22,17 16,14" />
      </svg>
    ),
    "语音": (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none" strokeWidth="1.6" stroke="currentColor">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    "语音咨询": (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none" strokeWidth="1.6" stroke="currentColor">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    "面谈": (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none" strokeWidth="1.6" stroke="currentColor">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    "面对面": (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none" strokeWidth="1.6" stroke="currentColor">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    "面对面咨询": (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none" strokeWidth="1.6" stroke="currentColor">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  };

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
                {modeIconSvg[m] ?? null}{{ "视频": "视频咨询", "语音": "面对面咨询", "面谈": "面对面咨询", "视频咨询": "视频咨询", "语音咨询": "面对面咨询", "面对面咨询": "面对面咨询" }[m] ?? m}
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
        {/* 协调时间入口 */}
        <button onClick={() => setShowCoordinate(true)}
          className="w-full py-3 rounded-2xl text-sm font-medium border mb-2"
          style={{ borderColor: "var(--color-border)", color: "#5A4E44", background: "white" }}>
          15天内没有合适的时间？与咨询师协调
        </button>

        <button
          disabled={!canNext}
          onClick={() => canNext && onNext({ mode: selectedMode!, date: selectedDay, slot: selectedSlot! })}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-base transition-opacity"
          style={{ background: canNext ? "var(--color-primary)" : "#C4BDB5" }}>
          下一步：填写预约信息
        </button>

        {/* 协调时间弹窗 */}
        {showCoordinate && (
          <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setShowCoordinate(false)}>
            <div className="w-full rounded-t-3xl px-5 pt-6 pb-10"
              style={{ background: "var(--color-bg)" }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold" style={{ color: "#2C2420" }}>与咨询师协调时间</h3>
                <button onClick={() => setShowCoordinate(false)} className="text-xl font-light" style={{ color: "#9B8E82" }}>×</button>
              </div>
              <p className="text-sm mb-4" style={{ color: "#9B8E82" }}>
                你可以告诉咨询师你方便的时间段，由咨询师确认后为你预留档期。
              </p>
              <div className="mb-3">
                <p className="text-xs font-medium mb-1.5" style={{ color: "#5A4E44" }}>你方便的时间（请尽量具体）</p>
                <textarea value={coordMsg} onChange={e => setCoordMsg(e.target.value)}
                  placeholder={"例如：\n周一至周三 下午 14:00–18:00\n周六全天均可\n请尽量提供 2-3 个备选时间"}
                  rows={5}
                  className="w-full rounded-2xl px-4 py-3 text-sm resize-none outline-none"
                  style={{ background: "white", border: "1.5px solid var(--color-border)", color: "#2C2420" }} />
              </div>
              <div className="mb-4">
                <p className="text-xs font-medium mb-1.5" style={{ color: "#5A4E44" }}>补充说明（可选）</p>
                <input type="text" value={coordNote} onChange={e => setCoordNote(e.target.value)}
                  placeholder="如特殊要求、偏好咨询方式等"
                  className="w-full rounded-2xl px-4 py-2.5 text-sm outline-none"
                  style={{ background: "white", border: "1.5px solid var(--color-border)", color: "#2C2420" }} />
              </div>
              <button
                disabled={!coordMsg.trim()}
                onClick={() => { alert("已发送给咨询师，请等待对方回复确认。"); setShowCoordinate(false); setCoordMsg(""); setCoordNote(""); }}
                className="w-full py-3.5 rounded-2xl text-white font-bold"
                style={{ background: coordMsg.trim() ? "var(--color-primary)" : "#C4BDB5" }}>
                发送给咨询师
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
