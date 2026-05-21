"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Video, Phone, Users, X, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { auth } from "@eazo/sdk";
import { request } from "@/lib/api/request";

type Booking = {
  id: string; status: string; scheduledAt: string; durationMinutes: number;
  sessionMode: string; priceAmount: number; clientNote: string | null;
  counselorNote: string | null;
  client: { id: string; name: string | null; email: string | null } | null;
};

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending_confirmation: { label: "待确认", color: "text-amber-600", bg: "bg-amber-50" },
  confirmed:           { label: "已确认", color: "text-[var(--color-mp-success)]", bg: "bg-green-50" },
  pending_payment:     { label: "待支付", color: "text-blue-600", bg: "bg-blue-50" },
  paid:                { label: "已支付", color: "text-[var(--color-mp-success)]", bg: "bg-green-50" },
  completed:           { label: "已完成", color: "text-[var(--color-mp-muted)]", bg: "bg-gray-50" },
  cancelled:           { label: "已取消", color: "text-[var(--color-mp-faint)]", bg: "bg-gray-50" },
  rejected:            { label: "已拒绝", color: "text-[var(--color-mp-error)]", bg: "bg-red-50" },
};

function BookingCard({ b, onUpdate }: { b: Booking; onUpdate: (id: string, status: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const s = STATUS[b.status] ?? STATUS.pending_confirmation;
  const dt = new Date(b.scheduledAt);
  return (
    <motion.div layout className="bg-[var(--color-mp-card)] rounded-3xl border border-[var(--color-mp-border)] overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-base font-semibold text-[var(--color-mp-text)]">{b.client?.name ?? b.client?.email ?? "来访者"}</p>
            <p className="text-xs text-[var(--color-mp-muted)] mt-0.5">{dt.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" })} {dt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.color} ${s.bg}`}>{s.label}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-[var(--color-mp-muted)]">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{b.durationMinutes}分钟</span>
          <span className="flex items-center gap-1">{b.sessionMode === "视频" ? <Video className="w-3.5 h-3.5" /> : b.sessionMode === "语音" ? <Phone className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}{b.sessionMode}</span>
          <span className="ml-auto font-semibold text-[var(--color-mp-text)]">¥{b.priceAmount}</span>
        </div>
        {b.clientNote && (
          <div className="mt-3 px-3 py-2.5 rounded-xl bg-[var(--color-mp-surface)] text-xs text-[var(--color-mp-muted)] leading-relaxed">{b.clientNote}</div>
        )}
      </div>
      {b.status === "pending_confirmation" && (
        <div className="px-5 pb-5 flex gap-2">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => onUpdate(b.id, "confirmed")}
            className="flex-1 py-2.5 rounded-2xl bg-[var(--color-mp-primary)] text-white text-sm font-semibold flex items-center justify-center gap-1">
            <Check className="w-4 h-4" />确认预约
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => onUpdate(b.id, "rejected")}
            className="py-2.5 px-4 rounded-2xl border border-[var(--color-mp-border)] text-sm text-[var(--color-mp-muted)] flex items-center justify-center gap-1">
            <X className="w-4 h-4" />拒绝
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

export default function CounselorBookingsPage() {
  const user = useEazo((s) => s.auth.user);
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    request("/api/counselor/bookings").then(r => r.json()).then(d => {
      setBookings(Array.isArray(d) ? d : []);
    }).finally(() => setLoading(false));
  }, [user]);

  const handleUpdate = async (id: string, status: string) => {
    await request(`/api/bookings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBookings(p => p.map(b => b.id === id ? { ...b, status } : b));
  };

  const displayed = tab === "pending"
    ? bookings.filter(b => b.status === "pending_confirmation")
    : bookings;

  if (!user) return (
    <div className="min-h-svh flex items-center justify-center bg-[var(--color-mp-surface)]">
      <div className="text-center"><p className="text-sm text-[var(--color-mp-muted)] mb-4">请先登录</p>
        <button onClick={() => auth.login()} className="px-6 py-2.5 rounded-2xl bg-[var(--color-mp-primary)] text-white text-sm">登录</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-svh bg-[var(--color-mp-surface)] pb-24">
      <div className="sticky top-0 z-10 bg-[var(--color-mp-surface)] px-5 pt-12 pb-4">
        <h1 className="text-xl font-semibold text-[var(--color-mp-text)] mb-4">预约管理</h1>
        <div className="flex gap-1 bg-[var(--color-mp-border)] p-1 rounded-2xl">
          {(["pending", "all"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t ? "bg-[var(--color-mp-card)] text-[var(--color-mp-text)] shadow-sm" : "text-[var(--color-mp-muted)]"}`}>
              {t === "pending" ? `待确认 (${bookings.filter(b => b.status === "pending_confirmation").length})` : "全部"}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 space-y-3">
        {loading ? [1,2].map(i => <div key={i} className="h-36 skeleton rounded-3xl" />) :
          displayed.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-10 h-10 text-[var(--color-mp-faint)] mx-auto mb-3" />
              <p className="text-sm text-[var(--color-mp-muted)]">{tab === "pending" ? "暂无待确认预约" : "暂无预约记录"}</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {displayed.map(b => <BookingCard key={b.id} b={b} onUpdate={handleUpdate} />)}
            </AnimatePresence>
          )
        }
      </div>
    </div>
  );
}
