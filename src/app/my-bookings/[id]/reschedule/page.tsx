"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock } from "lucide-react";
import { request } from "@/lib/api/request";
import { motion } from "framer-motion";

const WEEKDAY = ["日", "一", "二", "三", "四", "五", "六"];

function genDays(n = 14) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      date: d,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      weekday: `周${WEEKDAY[d.getDay()]}`,
      iso: d.toISOString().slice(0, 10),
    };
  });
}

const TIME_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "19:00", "20:00"];

export default function ReschedulePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<{ counselorName: string; scheduledAt: string } | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const days = genDays();

  useEffect(() => {
    request(`/api/bookings/${id}`).then(r => r.json()).then(d => {
      if (d.booking) setBooking({
        counselorName: d.booking.counselor?.displayName ?? "咨询师",
        scheduledAt: d.booking.scheduledAt,
      });
    });
  }, [id]);

  const canSubmit = selectedDay && selectedTime && reason.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const newTime = new Date(`${selectedDay}T${selectedTime}:00`).toISOString();
    await request(`/api/bookings/${id}/reschedule`, {
      method: "POST",
      body: JSON.stringify({ newTime, reason }),
    });
    setSubmitting(false);
    setDone(true);
  };

  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--color-bg)" }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: "#E4F0DC" }}>
        <CalendarDays className="w-8 h-8" style={{ color: "var(--color-primary)" }} />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: "#2C2420" }}>改期申请已发送</h2>
      <p className="text-sm text-center mb-8" style={{ color: "#9B8E82" }}>
        咨询师收到后会确认新时间，确认后订单时间将自动更新。
      </p>
      <button onClick={() => router.push("/profile")}
        className="w-full py-3.5 rounded-2xl text-white font-bold"
        style={{ background: "var(--color-primary)" }}>
        返回我的预约
      </button>
    </div>
  );

  return (
    <div className="min-h-screen pb-10" style={{ background: "var(--color-bg)" }}>
      {/* 顶栏 */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 sticky top-0 z-10 border-b"
        style={{ background: "rgba(245,240,232,0.95)", backdropFilter: "blur(8px)", borderColor: "#EBE7DF" }}>
        <button onClick={() => router.back()} className="p-1.5 rounded-full" style={{ background: "#EBE7DF" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "#5A4E44" }} />
        </button>
        <h1 className="text-base font-bold" style={{ color: "#2C2420" }}>申请改期</h1>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* 当前预约 */}
        {booking && (
          <div className="rounded-2xl p-4" style={{ background: "#E8DFCC" }}>
            <p className="text-xs mb-1" style={{ color: "#5A4E44" }}>当前预约</p>
            <p className="text-sm font-bold" style={{ color: "#2C2420" }}>{booking.counselorName}</p>
            <p className="text-xs mt-0.5" style={{ color: "#5A4E44" }}>
              {new Date(booking.scheduledAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        )}

        {/* 选择新日期 */}
        <div>
          <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#2C2420" }}>
            <CalendarDays className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
            选择新日期
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {days.map(d => (
              <button key={d.iso} onClick={() => setSelectedDay(d.iso)}
                className="flex-none flex flex-col items-center py-3 px-4 rounded-2xl"
                style={{
                  background: selectedDay === d.iso ? "var(--color-primary)" : "white",
                  border: `1.5px solid ${selectedDay === d.iso ? "var(--color-primary)" : "#EBE7DF"}`,
                  color: selectedDay === d.iso ? "white" : "#2C2420",
                }}>
                <span className="text-xs mb-1" style={{ opacity: 0.8 }}>{d.weekday}</span>
                <span className="text-sm font-bold">{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 选择新时间 */}
        {selectedDay && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#2C2420" }}>
              <Clock className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
              选择新时间
            </p>
            <div className="flex flex-wrap gap-2">
              {TIME_SLOTS.map(t => (
                <button key={t} onClick={() => setSelectedTime(t)}
                  className="px-4 py-2 rounded-full text-sm font-medium"
                  style={{
                    background: selectedTime === t ? "var(--color-primary)" : "white",
                    border: `1.5px solid ${selectedTime === t ? "var(--color-primary)" : "#EBE7DF"}`,
                    color: selectedTime === t ? "white" : "#2C2420",
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* 改期原因 */}
        <div>
          <p className="text-sm font-semibold mb-2" style={{ color: "#2C2420" }}>改期原因 *</p>
          <textarea value={reason} onChange={e => setReason(e.target.value)}
            rows={4} placeholder="请简述需要改期的原因，咨询师收到后会尽快确认…"
            className="w-full rounded-2xl px-4 py-3 text-sm border"
            style={{ background: "white", borderColor: "#EBE7DF", color: "#2C2420", resize: "none" }} />
        </div>

        {/* 提交 */}
        <button onClick={handleSubmit} disabled={!canSubmit || submitting}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-sm"
          style={{ background: canSubmit && !submitting ? "var(--color-primary)" : "#C4BDB5" }}>
          {submitting ? "发送中…" : "发送改期申请"}
        </button>

        <p className="text-xs text-center" style={{ color: "#9B8E82" }}>
          咨询师确认后，订单时间将自动更新。若咨询师拒绝，原时间保持不变。
        </p>
      </div>
    </div>
  );
}
