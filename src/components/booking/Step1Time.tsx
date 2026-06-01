"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getNextDays, generateMockSlots, TimeSlot,
  WEEKDAY_LABELS, PERIOD_LABELS,
} from "@/lib/booking-flow-data";

interface Props {
  sessionModes: string[];
  durationMinutes: number;
  onNext: (data: { mode: string; date: Date; slot: TimeSlot }) => void;
}

const VIDEO_ICON = (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none" strokeWidth="1.6" stroke="currentColor">
    <rect x="2" y="6" width="14" height="12" rx="2" />
    <polyline points="16,10 22,7 22,17 16,14" />
  </svg>
);
const FACE_ICON = (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none" strokeWidth="1.6" stroke="currentColor">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const MODE_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  "视频":    { label: "视频咨询",   icon: VIDEO_ICON },
  "视频咨询": { label: "视频咨询",   icon: VIDEO_ICON },
  "语音":    { label: "面对面咨询", icon: FACE_ICON },
  "语音咨询": { label: "面对面咨询", icon: FACE_ICON },
  "面谈":    { label: "面对面咨询", icon: FACE_ICON },
  "面对面咨询":{ label: "面对面咨询",icon: FACE_ICON },
  "面对面":  { label: "面对面咨询", icon: FACE_ICON },
};

const PERIOD_ICON: Record<string, string> = {
  morning: "🌤",
  afternoon: "🌿",
  evening: "🌙",
};

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
  const [coordSent, setCoordSent] = useState(false);
  const [coordAccept, setCoordAccept] = useState<string | null>(null);

  const dayKey = selectedDay.toISOString().slice(0, 10);
  const daySlots = slots[dayKey] ?? [];
  const morning   = daySlots.filter(s => s.period === "morning");
  const afternoon = daySlots.filter(s => s.period === "afternoon");
  const evening   = daySlots.filter(s => s.period === "evening");

  const canNext = selectedMode && selectedSlot;

  function SlotGroup({ label, period, items }: { label: string; period: string; items: TimeSlot[] }) {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <p className="text-sm font-medium mb-2" style={{ color: "#5A4E44" }}>
          {PERIOD_ICON[period]} {label}
        </p>
        <div className="flex flex-wrap gap-2">
          {items.map(s => {
            const active = selectedSlot?.id === s.id;
            const booked = !s.available;
            return (
              <button key={s.id} disabled={booked}
                onClick={() => !booked && setSelectedSlot(s)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  background: booked ? "#F5F0EA" : active ? "var(--color-primary)" : "white",
                  color:      booked ? "#C4BDB5"  : active ? "white"                : "#5A4E44",
                  opacity:    booked ? 0.6 : 1,
                  border:     `1.5px solid ${booked ? "#EBE7DF" : active ? "var(--color-primary)" : "#D8D2C8"}`,
                  textDecoration: booked ? "line-through" : "none",
                }}>
                {s.start}–{s.end}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4">
        {/* 咨询方式 */}
        {sessionModes.length > 1 && (
          <div className="mb-5">
            <p className="text-sm font-semibold mb-2.5" style={{ color: "#2C2420" }}>选择咨询方式</p>
            <div className="flex gap-3">
              {sessionModes.map(m => {
                const info = MODE_MAP[m] ?? { label: m, icon: VIDEO_ICON };
                const active = selectedMode === m;
                return (
                  <button key={m} onClick={() => setSelectedMode(m)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl flex-1 justify-center text-sm font-medium"
                    style={{
                      background: active ? "var(--color-primary)" : "white",
                      color: active ? "white" : "#5A4E44",
                      border: `1.5px solid ${active ? "var(--color-primary)" : "#D8D2C8"}`,
                    }}>
                    <span style={{ color: active ? "white" : "var(--color-primary)" }}>{info.icon}</span>
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 日期选择 */}
        <div className="mb-4">
          <p className="text-sm font-semibold mb-1" style={{ color: "#2C2420" }}>
            选择时间
            <span className="ml-2 text-xs font-normal" style={{ color: "#9B8E82" }}>
              最早可约24小时后 · 每次 {durationMinutes} 分钟
            </span>
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {days.map(d => {
              const k = d.toISOString().slice(0,10);
              const hasFree = (slots[k]??[]).some(s=>s.available);
              const active = k === dayKey;
              return (
                <button key={k} onClick={() => { setSelectedDay(d); setSelectedSlot(null); }}
                  className="flex flex-col items-center rounded-2xl flex-none py-2.5 px-3 transition-all"
                  style={{
                    background: active ? "var(--color-primary)" : "white",
                    color: active ? "white" : hasFree ? "#2C2420" : "#C4BDB5",
                    border: `1.5px solid ${active ? "var(--color-primary)" : "#D8D2C8"}`,
                    minWidth: 54,
                  }}>
                  <span className="text-xs mb-0.5" style={{ opacity: 0.75 }}>
                    {WEEKDAY_LABELS[d.getDay()]}
                  </span>
                  <span className="text-base font-bold leading-none">
                    {d.getMonth()+1}.{d.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 时段列表 */}
        <SlotGroup label="上午" period="morning"   items={morning}   />
        <SlotGroup label="下午" period="afternoon" items={afternoon} />
        <SlotGroup label="晚间" period="evening"   items={evening}   />

        {/* 与咨询师协调时间 — 内嵌展开区域（参考截图） */}
        <div className="mt-2 mb-4">
          <button onClick={() => setShowCoordinate(v=>!v)}
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: "var(--color-primary)" }}>
            <svg viewBox="0 0 20 20" className="w-4 h-4 fill-none" strokeWidth="1.8" stroke="currentColor">
              <circle cx="10" cy="10" r="8.5" />
              <path d="M10 6v4.5l2.5 2" strokeLinecap="round" />
            </svg>
            与咨询师协调时间
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 transition-transform" stroke="currentColor"
              style={{ transform: showCoordinate ? "rotate(180deg)" : "none" }}>
              <polyline points="3,5 8,11 13,5" strokeWidth="2" fill="none" />
            </svg>
          </button>

          <AnimatePresence>
            {showCoordinate && (
              <motion.div key="coord"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}>
                <div className="mt-3 rounded-2xl px-4 pt-4 pb-4"
                  style={{ background: "white", border: "1.5px solid var(--color-border)" }}>
                  {coordSent ? (
                    <div className="py-4 text-center">
                      <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-primary)" }}>✓ 已发送给咨询师</p>
                      <p className="text-xs" style={{ color: "#9B8E82" }}>咨询师确认后会通过消息通知你</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-medium mb-1" style={{ color: "#5A4E44" }}>
                        你方便的时间 <span style={{ color: "#E87070" }}>*</span>
                        <span className="ml-1 font-normal" style={{ color: "#9B8E82" }}>（请尽量具体）</span>
                      </p>
                      <p className="text-xs mb-2" style={{ color: "#9B8E82" }}>
                        建议申请48小时之后的时间，咨询师更可能接受
                      </p>
                      <textarea value={coordMsg} onChange={e=>setCoordMsg(e.target.value)}
                        placeholder={"例如：\n周一至周三 下午 14:00–18:00\n周六全天均可\n请尽量提供 2-3 个备选时间"}
                        rows={4}
                        className="w-full rounded-xl px-3 py-2.5 text-sm resize-none outline-none mb-3"
                        style={{ background: "#F8F5F0", color: "#2C2420", border: "1.5px solid var(--color-border)" }} />
                      {/* 是否接受咨询师提供的时间 — 在时间填写下方 */}
                      <p className="text-xs font-medium mb-2" style={{ color: "#5A4E44" }}>
                        是否接受咨询师提供的时间？
                      </p>
                      <div className="flex gap-2 mb-4">
                        {(["接受，只要咨询师有空就好", "我需要确认再决定"] as const).map(opt => {
                          const active = coordAccept === opt;
                          return (
                            <button key={opt}
                              onClick={() => setCoordAccept(opt)}
                              className="flex-1 py-2 rounded-xl text-xs font-medium border transition-colors"
                              style={{
                                background: active ? "#E4F0DC" : "white",
                                color: active ? "#3A6228" : "#5A4E44",
                                borderColor: active ? "#9CB48A" : "#D8D2C8",
                              }}>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs font-medium mb-1" style={{ color: "#5A4E44" }}>
                        你方便的时间 <span style={{ color: "#E87070" }}>*</span>
                        <span className="ml-1 font-normal" style={{ color: "#9B8E82" }}>（请尽量具体）</span>
                      </p>
                      <p className="text-xs mb-2" style={{ color: "#9B8E82" }}>
                        建议申请48小时之后的时间，咨询师更可能接受
                      </p>
                      <textarea value={coordMsg} onChange={e=>setCoordMsg(e.target.value)}
                        placeholder={"例如：\n周一至周三 下午 14:00–18:00\n周六全天均可\n请尽量提供 2-3 个备选时间"}
                        rows={4}
                        className="w-full rounded-xl px-3 py-2.5 text-sm resize-none outline-none mb-3"
                        style={{ background: "#F8F5F0", color: "#2C2420", border: "1.5px solid var(--color-border)" }} />
                      <p className="text-xs font-medium mb-1.5" style={{ color: "#5A4E44" }}>
                        补充说明 <span className="font-normal" style={{ color: "#9B8E82" }}>（可选）</span>
                      </p>
                      <input type="text" value={coordNote} onChange={e=>setCoordNote(e.target.value)}
                        placeholder="如特殊要求、偏好咨询方式等"
                        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none mb-3"
                        style={{ background: "#F8F5F0", color: "#2C2420", border: "1.5px solid var(--color-border)" }} />
                      <button disabled={!coordMsg.trim()}
                        onClick={() => { setCoordSent(true); }}
                        className="w-full py-3 rounded-xl text-sm font-bold"
                        style={{ background: coordMsg.trim() ? "var(--color-primary)" : "#C4BDB5", color: "white" }}>
                        发送给咨询师
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 底部固定操作区 */}
      <div className="px-5 pb-6 pt-3 border-t flex-none" style={{ borderColor: "var(--color-border)" }}>
        {selectedSlot && (
          <p className="text-xs text-center mb-2" style={{ color: "#9B8E82" }}>
            已选：{selectedDay.getMonth()+1}/{selectedDay.getDate()} {selectedSlot.start}–{selectedSlot.end}
          </p>
        )}
        <button disabled={!canNext}
          onClick={() => canNext && onNext({ mode: selectedMode!, date: selectedDay, slot: selectedSlot! })}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-base"
          style={{ background: canNext ? "var(--color-primary)" : "#C4BDB5" }}>
          下一步：填写预约信息
        </button>
      </div>
    </div>
  );
}
