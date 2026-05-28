"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Video, Phone, MessageCircle, Check, X, ChevronDown } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { auth } from "@eazo/sdk";
import { request } from "@/lib/api/request";

type Booking = {
  id: string; status: string; scheduledAt: string; durationMinutes: number;
  sessionMode: string; priceAmount: number; clientNote: string | null;
  client: { id: string; name: string | null; email: string | null } | null;
};

// 4个平铺Tab，去掉「已取消」
const STATUS_OPTIONS = [
  { key: "pending_confirmation", label: "待确认", statuses: ["pending_confirmation"], dot: "#D97706" },
  { key: "pending_payment",      label: "待支付", statuses: ["confirmed","pending_payment"], dot: "#2563EB" },
  { key: "upcoming",             label: "待咨询", statuses: ["paid"], dot: "#059669" },
  { key: "completed",            label: "已咨询", statuses: ["completed"], dot: "#6B7280" },
];

const STATUS_LABEL: Record<string, string> = {
  pending_confirmation: "待确认", confirmed: "待支付", pending_payment: "待支付",
  paid: "待咨询", completed: "已咨询", cancelled: "已取消", rejected: "已拒绝",
};
const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  pending_confirmation: { color: "#D97706", bg: "#FEF3C7" },
  confirmed:            { color: "#2563EB", bg: "#DBEAFE" },
  pending_payment:      { color: "#2563EB", bg: "#DBEAFE" },
  paid:                 { color: "#059669", bg: "#D1FAE5" },
  completed:            { color: "#6B7280", bg: "#F3F4F6" },
  cancelled:            { color: "#9CA3AF", bg: "#F9FAFB" },
  rejected:             { color: "#EF4444", bg: "#FEE2E2" },
};

function BookingCard({ b, onUpdate }: { b: Booking; onUpdate: (id: string, status: string) => void }) {
  const dt = new Date(b.scheduledAt);
  const dateStr = dt.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });
  const timeStr = dt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  const st = STATUS_STYLE[b.status] ?? { color: "#6B7280", bg: "#F3F4F6" };
  const clientName = b.client?.name || b.client?.email?.split("@")[0] || "来访者";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }} layout
      className="rounded-3xl p-5 border border-[var(--color-border)]"
      style={{ background: "var(--color-card)" }}
    >
      {/* 顶部：来访者 + 状态 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold"
            style={{ background: "var(--color-secondary)", color: "var(--color-text-secondary)" }}>
            {clientName[0]}
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{clientName}</div>
            {b.clientNote && (
              <div className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--color-text-muted)" }}>{b.clientNote}</div>
            )}
          </div>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ color: st.color, background: st.bg }}>
          {STATUS_LABEL[b.status] ?? b.status}
        </span>
      </div>

      {/* 时间 + 方式 */}
      <div className="flex items-center gap-4 text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {dateStr}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {timeStr} · {b.durationMinutes}分钟
        </span>
        <span className="flex items-center gap-1.5">
          {b.sessionMode?.includes("视频") ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
          {b.sessionMode}
        </span>
      </div>

      {/* 金额 + 操作 */}
      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
        <span className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>¥{b.priceAmount}</span>
        <div className="flex gap-2">
          {b.status === "pending_confirmation" && (<>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onUpdate(b.id, "rejected")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface)" }}>
              <X className="w-3.5 h-3.5" />拒绝
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onUpdate(b.id, "confirmed")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-white"
              style={{ background: "var(--color-primary)" }}>
              <Check className="w-3.5 h-3.5" />接受
            </motion.button>
          </>)}
          {(b.status === "confirmed" || b.status === "pending_payment") && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onUpdate(b.id, "cancelled")}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface)" }}>
              取消预约
            </motion.button>
          )}
          {b.status === "paid" && (<>
            <motion.button whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface)" }}>
              <MessageCircle className="w-3.5 h-3.5" />私信
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onUpdate(b.id, "completed")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-white"
              style={{ background: "var(--color-primary)" }}>
              <Check className="w-3.5 h-3.5" />标记完成
            </motion.button>
          </>)}
        </div>
      </div>
    </motion.div>
  );
}

export function CounselorBookingsScreen() {
  const user = useEazo((s) => s.auth.user);
  const loadingAuth = useEazo((s) => s.auth.loading);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState("pending_confirmation");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    request("/api/counselor/bookings").then(r => r.json())
      .then(d => setBookings(Array.isArray(d) ? d : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [user]);

  const handleUpdate = async (id: string, status: string) => {
    const res = await request(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    }
  };

  if (!loadingAuth && !user) {
    return (
      <div className="min-h-svh flex items-center justify-center px-6" style={{ background: "var(--color-surface)" }}>
        <div className="text-center">
          <p className="text-base font-medium mb-4" style={{ color: "var(--color-text-primary)" }}>请先登录</p>
          <button onClick={() => auth.login()} className="px-6 py-2.5 rounded-2xl text-white text-sm font-medium"
            style={{ background: "var(--color-primary)" }}>登录</button>
        </div>
      </div>
    );
  }

  const currentOpt = STATUS_OPTIONS.find(o => o.key === selectedKey)!;
  const displayed = bookings.filter(b => currentOpt.statuses.includes(b.status));

  // 各状态数量
  const counts: Record<string, number> = {};
  STATUS_OPTIONS.forEach(o => {
    counts[o.key] = bookings.filter(b => o.statuses.includes(b.status)).length;
  });

  return (
    <div className="min-h-svh pb-28" style={{ background: "var(--color-surface)" }}>
      {/* 顶部标题 */}
      <div className="px-5 pt-14 pb-4" style={{ background: "var(--color-surface)" }}>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>预约管理</h1>
      </div>

      {/* 状态下拉选择器 */}
      <div className="px-5 mb-4 relative z-20">
        <button
          onClick={() => setDropdownOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: currentOpt.dot }} />
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {currentOpt.label}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-secondary)", color: "var(--color-text-secondary)" }}>
              {counts[selectedKey]}
            </span>
          </div>
          <ChevronDown className="w-4 h-4" style={{ color: "var(--color-text-muted)", transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="absolute left-5 right-5 mt-1 rounded-2xl border overflow-hidden shadow-lg z-30"
              style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.key}
                  onClick={() => { setSelectedKey(opt.key); setDropdownOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--color-surface)] transition-colors"
                  style={{ borderBottom: opt.key !== "cancelled" ? `1px solid var(--color-border)` : "none" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: opt.dot }} />
                    <span className="text-sm" style={{ color: opt.key === selectedKey ? "var(--color-primary)" : "var(--color-text-primary)", fontWeight: opt.key === selectedKey ? 600 : 400 }}>
                      {opt.label}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-secondary)", color: "var(--color-text-secondary)" }}>
                    {counts[opt.key]}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 预约列表 */}
      <div className="px-5 space-y-3">
        {loading ? (
          <>{[1,2,3].map(i => <div key={i} className="h-40 rounded-3xl skeleton" />)}</>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>暂无{currentOpt.label}预约</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {displayed.map(b => <BookingCard key={b.id} b={b} onUpdate={handleUpdate} />)}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
