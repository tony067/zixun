"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Video, Phone, X, CheckCircle } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";

type Booking = {
  id: string; status: string; scheduledAt: string; durationMinutes: number;
  sessionMode: string; priceAmount: number; clientNote: string | null;
  counselor: { id: string; displayName: string; title: string; avatarUrl: string | null } | null;
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_confirmation: { label: "待确认", color: "bg-amber-100 text-amber-700" },
  confirmed: { label: "已确认", color: "bg-green-100 text-green-700" },
  pending_payment: { label: "待支付", color: "bg-blue-100 text-blue-700" },
  paid: { label: "已支付", color: "bg-green-100 text-green-700" },
  completed: { label: "已完成", color: "bg-[var(--color-mp-secondary)] text-[var(--color-mp-muted)]" },
  cancelled: { label: "已取消", color: "bg-gray-100 text-gray-500" },
  rejected: { label: "已拒绝", color: "bg-red-100 text-red-600" },
};

const TABS = [
  { id: "upcoming", label: "即将到来" },
  { id: "past", label: "历史记录" },
];

export function MyBookingsScreen() {
  const user = useEazo((s) => s.auth.user);
  const loading_auth = useEazo((s) => s.auth.loading);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");

  useEffect(() => {
    if (!user) return;
    request("/api/bookings").then(r => r.json())
      .then(d => setBookings(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [user]);

  const now = new Date();
  const upcoming = bookings.filter(b => new Date(b.scheduledAt) >= now && !["cancelled","rejected","completed"].includes(b.status));
  const past = bookings.filter(b => new Date(b.scheduledAt) < now || ["cancelled","rejected","completed"].includes(b.status));
  const displayed = tab === "upcoming" ? upcoming : past;

  if (!loading_auth && !user) return (
    <div className="min-h-svh flex items-center justify-center bg-[var(--color-mp-surface)] px-6">
      <div className="text-center">
        <Calendar className="w-12 h-12 text-[var(--color-mp-faint)] mx-auto mb-3" />
        <p className="text-sm text-[var(--color-mp-muted)] mb-5">登录后查看预约</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-svh bg-[var(--color-mp-surface)] pb-24">
      <div className="sticky top-0 z-10 bg-[var(--color-mp-surface)] px-5 pt-12 pb-0 border-b border-[var(--color-mp-border)]">
        <h1 className="text-xl font-semibold text-[var(--color-mp-text)] pb-4">我的预约</h1>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? "border-[var(--color-mp-primary)] text-[var(--color-mp-primary)]" : "border-transparent text-[var(--color-mp-faint)]"}`}>
              {t.label}
              {t.id === "upcoming" && upcoming.length > 0 && (
                <span className="ml-1.5 text-xs bg-[var(--color-mp-primary)] text-white rounded-full px-1.5 py-0.5">{upcoming.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-28 skeleton rounded-3xl" />)
        ) : displayed.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <Calendar className="w-10 h-10 text-[var(--color-mp-faint)] mx-auto mb-3" />
            <p className="text-sm text-[var(--color-mp-muted)]">{tab === "upcoming" ? "暂无即将到来的预约" : "暂无历史记录"}</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {displayed.map(b => {
              const st = STATUS_MAP[b.status] ?? { label: b.status, color: "bg-gray-100 text-gray-500" };
              const dt = new Date(b.scheduledAt);
              return (
                <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} layout
                  className="bg-[var(--color-mp-card)] rounded-3xl p-5 border border-[var(--color-mp-border)]">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-mp-secondary)] flex items-center justify-center text-sm font-semibold text-[var(--color-mp-muted)]">
                        {(b.counselor?.displayName ?? "?")[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-mp-text)]">{b.counselor?.displayName ?? "未知咨询师"}</p>
                        <p className="text-xs text-[var(--color-mp-faint)]">{b.counselor?.title}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--color-mp-muted)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {dt.toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {dt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="flex items-center gap-1">
                      {b.sessionMode === "视频" ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                      {b.sessionMode}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-mp-border)]">
                    <span className="text-xs text-[var(--color-mp-faint)]">¥{b.priceAmount}</span>
                    {["pending_confirmation","confirmed"].includes(b.status) && (
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                          await request(`/api/bookings/${b.id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ status: "cancelled" }) });
                          setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: "cancelled" } : x));
                        }}
                        className="text-xs text-[var(--color-mp-error)] px-3 py-1.5 rounded-full border border-[var(--color-mp-error)]/30">
                        取消预约
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
