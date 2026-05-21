"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Video, Phone, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";

type Counselor = { id: string; displayName: string; sessionDuration: number; pricePerSession: number; sessionModes: string[] };
type DaySlot = { date: string; slots: string[] }; // simple time strings

const STEP_LABELS = ["选择时间", "选择方式", "确认"];
const MOODS = ["😌 平静", "😟 焦虑", "😔 低落", "😤 烦躁", "😶 麻木"];

function getDaysAhead(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function getTimeSlots() {
  return ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "19:00", "20:00"];
}

export function BookingScreen({ counselorId }: { counselorId: string }) {
  const router = useRouter();
  const user = useEazo((s) => s.auth.user);
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [step, setStep] = useState(0);
  const [selectedDate, setDate] = useState("");
  const [selectedTime, setTime] = useState("");
  const [selectedMode, setMode] = useState("");
  const [selectedMood, setMood] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const days = getDaysAhead(14);
  const slots = getTimeSlots();

  useEffect(() => {
    fetch(`/api/counselors/${counselorId}`).then(r => r.json()).then(setCounselor);
  }, [counselorId]);

  const canNext = step === 0
    ? (selectedDate && selectedTime)
    : step === 1 ? selectedMode : true;

  const handleConfirm = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const dt = new Date(`${selectedDate}T${selectedTime}:00`);
      await request("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counselorId,
          scheduledAt: dt.toISOString(),
          sessionMode: selectedMode,
          priceAmount: counselor?.pricePerSession ?? 0,
          clientNote: [selectedMood, note].filter(Boolean).join(" · "),
        }),
      });
      router.push("/my-bookings");
    } finally {
      setSubmitting(false);
    }
  };

  if (!counselor) return <div className="min-h-svh bg-[var(--color-mp-surface)] p-5"><div className="h-8 skeleton rounded-xl" /></div>;

  return (
    <div className="min-h-svh bg-[var(--color-mp-surface)] pb-28">
      <div className="sticky top-0 z-10 bg-[var(--color-mp-surface)]/95 backdrop-blur px-4 pt-12 pb-3 flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
          className="w-9 h-9 rounded-full bg-[var(--color-mp-card)] border border-[var(--color-mp-border)] flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-[var(--color-mp-muted)]" />
        </motion.button>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--color-mp-text)]">预约 {counselor.displayName}</p>
          <div className="flex gap-1 mt-1">
            {STEP_LABELS.map((l, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-[var(--color-mp-primary)]" : "bg-[var(--color-mp-border)]"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              {/* date */}
              <div>
                <p className="text-sm font-semibold text-[var(--color-mp-text)] mb-3">选择日期</p>
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {days.map(d => {
                    const dt = new Date(d + "T00:00:00");
                    return (
                      <motion.button key={d} whileTap={{ scale: 0.93 }} onClick={() => setDate(d)}
                        className={`flex-none flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-2xl border text-xs transition-all ${d === selectedDate ? "bg-[var(--color-mp-primary)] text-white border-transparent" : "bg-[var(--color-mp-card)] border-[var(--color-mp-border)] text-[var(--color-mp-muted)]"}`}>
                        <span className="font-medium">{dt.toLocaleDateString("zh-CN", { weekday: "short" })}</span>
                        <span className="text-[11px]">{dt.getMonth()+1}/{dt.getDate()}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              {/* time */}
              {selectedDate && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="text-sm font-semibold text-[var(--color-mp-text)] mb-3">选择时间</p>
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(t => (
                      <motion.button key={t} whileTap={{ scale: 0.93 }} onClick={() => setTime(t)}
                        className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${t === selectedTime ? "bg-[var(--color-mp-primary)] text-white border-transparent" : "bg-[var(--color-mp-card)] border-[var(--color-mp-border)] text-[var(--color-mp-muted)]"}`}>
                        {t}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
              {/* mood */}
              <div>
                <p className="text-sm font-semibold text-[var(--color-mp-text)] mb-3">今天状态（可选）</p>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map(m => (
                    <motion.button key={m} whileTap={{ scale: 0.93 }} onClick={() => setMood(p => p === m ? "" : m)}
                      className={`text-sm px-3 py-1.5 rounded-full border transition-all ${m === selectedMood ? "bg-[var(--color-mp-primary)] text-white border-transparent" : "bg-[var(--color-mp-card)] border-[var(--color-mp-border)] text-[var(--color-mp-text)]"}`}>
                      {m}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <p className="text-sm font-semibold text-[var(--color-mp-text)]">咨询方式</p>
              {counselor.sessionModes.map(m => (
                <motion.button key={m} whileTap={{ scale: 0.97 }} onClick={() => setMode(m)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${m === selectedMode ? "border-[var(--color-mp-primary)] bg-[var(--color-mp-primary)]/5" : "border-[var(--color-mp-border)] bg-[var(--color-mp-card)]"}`}>
                  {m === "视频" ? <Video className="w-5 h-5 text-[var(--color-mp-primary)]" /> : m === "语音" ? <Phone className="w-5 h-5 text-[var(--color-mp-primary)]" /> : <Clock className="w-5 h-5 text-[var(--color-mp-primary)]" />}
                  <div>
                    <p className="text-sm font-medium text-[var(--color-mp-text)]">{m}咨询</p>
                    <p className="text-xs text-[var(--color-mp-faint)]">{counselor.sessionDuration} 分钟 · ¥{counselor.pricePerSession}</p>
                  </div>
                  {m === selectedMode && <Check className="w-4 h-4 text-[var(--color-mp-primary)] ml-auto" />}
                </motion.button>
              ))}
              <div>
                <p className="text-sm font-semibold text-[var(--color-mp-text)] mb-2">来访说明（可选）</p>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="简单说说这次来访的期待或背景…"
                  className="w-full px-4 py-3 rounded-2xl border border-[var(--color-mp-border)] bg-[var(--color-mp-card)] text-sm text-[var(--color-mp-text)] placeholder:text-[var(--color-mp-faint)] focus:outline-none focus:border-[var(--color-mp-primary)] resize-none" />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <p className="text-sm font-semibold text-[var(--color-mp-text)]">确认预约信息</p>
              <div className="bg-[var(--color-mp-card)] rounded-3xl p-5 border border-[var(--color-mp-border)] space-y-3">
                {[
                  ["咨询师", counselor.displayName],
                  ["日期", selectedDate],
                  ["时间", selectedTime],
                  ["方式", selectedMode],
                  ["费用", `¥${counselor.pricePerSession}`],
                  ...(note ? [["说明", note]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between">
                    <span className="text-xs text-[var(--color-mp-faint)]">{k}</span>
                    <span className="text-sm font-medium text-[var(--color-mp-text)] text-right max-w-[60%]">{v}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[var(--color-mp-faint)] text-center">预约提交后咨询师将确认，请保持手机畅通。</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 inset-x-0 px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)] bg-gradient-to-t from-[var(--color-mp-surface)] via-[var(--color-mp-surface)]/90 to-transparent z-20">
        <motion.button whileTap={{ scale: 0.97 }}
          disabled={!canNext || submitting}
          onClick={() => step < 2 ? setStep(s => s + 1) : handleConfirm()}
          className={`w-full h-13 rounded-2xl text-sm font-semibold transition-all ${canNext ? "bg-[var(--color-mp-primary)] text-white shadow-md" : "bg-[var(--color-mp-border)] text-[var(--color-mp-faint)]"}`}>
          {submitting ? "提交中…" : step < 2 ? "下一步" : "确认预约"}
        </motion.button>
      </div>
    </div>
  );
}
