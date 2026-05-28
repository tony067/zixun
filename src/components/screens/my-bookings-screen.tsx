"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Video, Phone } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";

type Booking = {
  id: string; status: string; scheduledAt: string; durationMinutes: number;
  sessionMode: string; priceAmount: number;
  counselor: { id: string; displayName: string; avatarUrl?: string; counselorTypes?: string[] } | null;
};

const TABS = [
  { key: "upcoming", label: "即将到来", statuses: ["paid","confirmed","pending_payment","pending_confirmation"] },
  { key: "past",     label: "历史记录", statuses: ["completed","cancelled","rejected"] },
];

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  pending_confirmation: { label: "待咨询师确认", color: "#D97706", bg: "#FEF3C7" },
  confirmed:            { label: "待支付",       color: "#2563EB", bg: "#DBEAFE" },
  pending_payment:      { label: "待支付",       color: "#2563EB", bg: "#DBEAFE" },
  paid:                 { label: "即将咨询",     color: "#059669", bg: "#D1FAE5" },
  completed:            { label: "已完成",       color: "#6B7280", bg: "#F3F4F6" },
  cancelled:            { label: "已取消",       color: "#9CA3AF", bg: "#F9FAFB" },
  rejected:             { label: "已拒绝",       color: "#EF4444", bg: "#FEE2E2" },
};

const AV_BG   = ["#d4e8c8","#c8dce0","#dcd0e8","#e4d8c0","#e0dcc4","#e8e0d0"];
const AV_TEXT = ["#3a6228","#26505a","#4a3060","#5a4020","#4a4020","#4a3a28"];

function BookingCard({ b }: { b: Booking }) {
  const dt = new Date(b.scheduledAt);
  const dateStr = dt.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });
  const timeStr = dt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  const badge = STATUS_BADGE[b.status] ?? { label: b.status, color: "#6B7280", bg: "#F3F4F6" };
  const name  = b.counselor?.displayName ?? "咨询师";
  const idx   = name.charCodeAt(0) % AV_BG.length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} layout
      className="rounded-3xl p-5 border border-[var(--color-border)]"
      style={{ background: "var(--color-card)" }}>

      {/* 咨询师信息 + 状态 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0"
            style={{ background: AV_BG[idx], color: AV_TEXT[idx] }}>{name[0]}</div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{name}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {b.counselor?.counselorTypes?.join(" · ") ?? "心理咨询师"}
            </div>
          </div>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-2"
          style={{ color: badge.color, background: badge.bg }}>{badge.label}</span>
      </div>

      {/* 时间 + 方式 */}
      <div className="flex flex-wrap gap-3 text-xs mb-4" style={{ color: "var(--color-text-secondary)" }}>
        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{dateStr}</span>
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{timeStr} · {b.durationMinutes}分钟</span>
        <span className="flex items-center gap-1">
          {b.sessionMode?.includes("视频") ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
          {b.sessionMode}
        </span>
      </div>

      {/* 金额 + 操作 */}
      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
        <span className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>¥{b.priceAmount}</span>
        <div className="flex gap-2">
          {(b.status === "confirmed" || b.status === "pending_payment") && (
            <motion.button whileTap={{ scale: 0.95 }}
              className="text-xs px-4 py-2 rounded-2xl text-white font-medium"
              style={{ background: "#2563EB" }}>立即支付</motion.button>
          )}
          {b.status === "paid" && (
            <motion.button whileTap={{ scale: 0.95 }}
              className="text-xs px-4 py-2 rounded-2xl text-white font-medium"
              style={{ background: "var(--color-primary)" }}>进入咨询</motion.button>
          )}
          {b.status === "completed" && (
            <motion.button whileTap={{ scale: 0.95 }}
              className="text-xs px-4 py-2 rounded-2xl font-medium border"
              style={{ color: "var(--color-text-secondary)", borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
              写反馈
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function MyBookingsScreen() {
  const user  = useEazo((s) => s.auth.user);
  const [tab, setTab]         = useState("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    request("/api/bookings").then(r => r.json())
      .then(d => setBookings(Array.isArray(d) ? d : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [user]);

  const cur       = TABS.find(t => t.key === tab)!;
  const displayed = bookings.filter(b => cur.statuses.includes(b.status));

  return (
    <div className="min-h-svh pb-28" style={{ background: "var(--color-surface)" }}>
      <div className="px-5 pt-14 pb-2">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>我的预约</h1>
      </div>

      {/* 两个 Tab */}
      <div className="flex gap-2 px-5 py-3">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all"
            style={{
              background: tab === t.key ? "var(--color-primary)" : "var(--color-card)",
              color:      tab === t.key ? "white" : "var(--color-text-secondary)",
              border:     tab === t.key ? "none"  : "1px solid var(--color-border)",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-5 space-y-3 mt-1">
        {loading ? (
          <>{[1,2].map(i => <div key={i} className="h-44 rounded-3xl skeleton" />)}</>
        ) : displayed.length === 0 ? (
          <div className="text-center py-24">
            <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {tab === "upcoming" ? "暂无即将到来的预约" : "暂无历史记录"}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {displayed.map(b => <BookingCard key={b.id} b={b} />)}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
