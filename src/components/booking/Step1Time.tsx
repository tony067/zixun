"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getNextDays, TimeSlot,
  WEEKDAY_LABELS, PERIOD_LABELS,
} from "@/lib/booking-flow-data";

export type Step1Result = {
  mode: string;
  date: Date;
  slot: TimeSlot | null;
  /** 无合适时段时提交的时间调剂申请 */
  adjustRequest?: { message: string; acceptOther: string };
};

interface Props {
  counselorId: string;
  sessionModes: string[];
  durationMinutes: number;
  onNext: (data: Step1Result) => void;
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

const PERIOD_SVG: Record<string, React.ReactNode> = {
  morning: (
    <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.5" className="w-3.5 h-3.5">
      <circle cx="8" cy="9" r="3.5" stroke="#F59E0B"/>
      <path d="M8 2v1.5M8 13.5V15M2 9H3.5M12.5 9H14M3.757 4.757l1.06 1.06M11.182 11.182l1.06 1.06M3.757 13.243l1.06-1.06M11.182 6.818l1.06-1.06" stroke="#F59E0B"/>
    </svg>
  ),
  afternoon: (
    <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.5" className="w-3.5 h-3.5">
      <circle cx="8" cy="8" r="3.5" stroke="#F97316"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="#F97316"/>
    </svg>
  ),
  evening: (
    <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.5" className="w-3.5 h-3.5">
      <path d="M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5z" stroke="#6366F1"/>
    </svg>
  ),
};

export function Step1Time({ counselorId, sessionModes, durationMinutes, onNext }: Props) {
  const days = getNextDays(14);
  const [apiDays, setApiDays] = useState<{ date: string; label: string; weekday: string; slots: string[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<Record<string, TimeSlot[]>>({});

  useEffect(() => {
    fetch(`/api/counselors/${counselorId}/available-slots`)
      .then(r => r.json())
      .then(d => {
        const arr: { date: string; label: string; weekday: string; slots: string[] }[] = Array.isArray(d?.days) ? d.days : [];
        setApiDays(arr);
        // 转成 slots 字典
        const out: Record<string, TimeSlot[]> = {};
        for (const day of arr) {
          out[day.date] = day.slots.map((time) => {
            const [h, m] = time.split(":").map(Number);
            const startMin = h * 60 + (m || 0);
            const endMin = startMin + durationMinutes;
            const endH = Math.floor(endMin / 60);
            const endM = endMin % 60;
            const end = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
            const period: TimeSlot["period"] = startMin < 12 * 60 ? "morning" : startMin < 18 * 60 ? "afternoon" : "evening";
            return { id: `${day.date}-${time}`, start: time, end, period, available: true };
          });
        }
        setSlots(out);
        // 默认选中第一个有可约时段的日子
        const firstDay = days.find(d => (out[d.toISOString().slice(0, 10)] ?? []).length > 0);
        if (firstDay) setSelectedDay(firstDay);
      })
      .catch(() => setApiDays([]))
      .finally(() => setLoading(false));
  }, [counselorId, durationMinutes]);

  const [selectedMode, setSelectedMode] = useState<string | null>(
    sessionModes[0] ?? null
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

  // 下一步：选了时段，或已提交时间调剂申请
  const canNext = !!selectedMode && (!!selectedSlot || coordSent);

  function SlotGroup({ label, period, items }: { label: string; period: string; items: TimeSlot[] }) {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <p className="text-sm font-medium mb-2" style={{ color: "#5A4E44" }}>
          <span className="inline-flex items-center gap-1.5">{PERIOD_SVG[period]} {label}</span>
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
        {sessionModes.length > 0 && (
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
        {loading ? (
          <p className="text-sm text-center py-6" style={{ color: "#9B8E82" }}>加载可预约时段…</p>
        ) : (morning.length === 0 && afternoon.length === 0 && evening.length === 0) ? (
          <p className="text-sm text-center py-6" style={{ color: "#9B8E82" }}>
            该日期暂无可约时段，可提交时间调剂申请，由咨询师协调时间
          </p>
        ) : (
          <>
            <SlotGroup label="上午" period="morning"   items={morning}   />
            <SlotGroup label="下午" period="afternoon" items={afternoon} />
            <SlotGroup label="晚间" period="evening"   items={evening}   />
          </>
        )}

        {/* 时间调剂申请 — 无合适时段时提交，随订单一起给到咨询师 */}
        <div className="mt-2 mb-4">
          <button onClick={() => setShowCoordinate(v=>!v)}
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: "var(--color-primary)" }}>
            <svg viewBox="0 0 20 20" className="w-4 h-4 fill-none" strokeWidth="1.8" stroke="currentColor">
              <circle cx="10" cy="10" r="8.5" />
              <path d="M10 6v4.5l2.5 2" strokeLinecap="round" />
            </svg>
            没有合适的时间？提交时间调剂申请
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
                    <div className="py-2 text-center">
                      <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-primary)" }}>✓ 调剂申请已填写</p>
                      <p className="text-xs" style={{ color: "#9B8E82" }}>点击下方「下一步」继续，申请将随订单一起发送给咨询师</p>
                      <button onClick={() => setCoordSent(false)}
                        className="mt-2 text-xs underline" style={{ color: "#9B8E82" }}>
                        重新编辑
                      </button>
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
                        如果上述时间不可行，是否接受咨询师提供的其他时间？
                        <span style={{ color: "#E87070" }}> *</span>
                      </p>
                      <div className="flex gap-2 mb-4">
                        {(["是", "否"] as const).map(opt => {
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
                      <button disabled={!coordMsg.trim() || !coordAccept}
                        onClick={() => { setSelectedSlot(null); setCoordSent(true); }}
                        className="w-full py-3 rounded-xl text-sm font-bold"
                        style={{ background: coordMsg.trim() && coordAccept ? "var(--color-primary)" : "#C4BDB5", color: "white" }}>
                        填写调剂申请
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
        {selectedSlot ? (
          <p className="text-xs text-center mb-2" style={{ color: "#9B8E82" }}>
            已选：{selectedDay.getMonth()+1}/{selectedDay.getDate()} {selectedSlot.start}–{selectedSlot.end}
          </p>
        ) : coordSent ? (
          <p className="text-xs text-center mb-2" style={{ color: "#9B8E82" }}>
            将随订单提交时间调剂申请，支付后由咨询师协调确认时间
          </p>
        ) : null}
        <button disabled={!canNext}
          onClick={() => {
            if (!canNext || !selectedMode) return;
            if (selectedSlot) {
              onNext({ mode: selectedMode, date: selectedDay, slot: selectedSlot });
            } else {
              onNext({
                mode: selectedMode, date: selectedDay, slot: null,
                adjustRequest: { message: coordMsg.trim(), acceptOther: coordAccept ?? "是" },
              });
            }
          }}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-base"
          style={{ background: canNext ? "var(--color-primary)" : "#C4BDB5" }}>
          下一步：填写预约信息
        </button>
      </div>
    </div>
  );
}
