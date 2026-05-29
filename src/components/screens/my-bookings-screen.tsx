"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";
import Link from "next/link";

type Booking = {
  id: string; status: string; scheduledAt: string; durationMinutes: number;
  sessionMode: string; priceAmount: number;
  counselor: { id: string; displayName: string; counselorTypes?: string[] } | null;
};

const TABS = [
  { key: "pending",  label: "待确认", statuses: ["pending_confirmation"] },
  { key: "payment",  label: "待支付", statuses: ["confirmed","pending_payment"] },
  { key: "upcoming", label: "待咨询", statuses: ["paid"] },
  { key: "done",     label: "历史",   statuses: ["completed","cancelled","rejected"] },
];

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  pending_confirmation: { label: "待咨询师确认", color: "#D97706", bg: "#FEF3C7" },
  confirmed:            { label: "待支付",       color: "#2563EB", bg: "#DBEAFE" },
  pending_payment:      { label: "待支付",       color: "#2563EB", bg: "#DBEAFE" },
  paid:                 { label: "即将咨询",     color: "#059669", bg: "#D1FAE5" },
  completed:            { label: "已完成",       color: "#6B7280", bg: "#F3F4F6" },
  cancelled:            { label: "已取消",       color: "#9CA3AF", bg: "#F9FAFB" },
  rejected:             { label: "已拒绝",       color: "#DC2626", bg: "#FEF2F2" },
};

function BookingCard({ b }: { b: Booking }) {
  const badge = STATUS_BADGE[b.status] ?? { label: b.status, color: "#9B8E82", bg: "#F5F0E8" };
  const dt = b.scheduledAt ? new Date(b.scheduledAt) : null;
  const c = b.counselor;
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 mb-3" style={{ background: "white", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0"
          style={{ background: "#E8DFCC", color: "#7A6248" }}>{c ? c.displayName[0] : "?"}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#2C2420] truncate">{c?.displayName ?? "咨询师"}</p>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ color: badge.color, background: badge.bg }}>{badge.label}</span>
          </div>
          <p className="text-xs text-[#9B8E82] mt-0.5">{c?.counselorTypes?.join(" · ") ?? "心理咨询师"}</p>
        </div>
      </div>
      {dt && (
        <div className="flex items-center gap-4 text-xs text-[#9B8E82] mb-3 px-1">
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{dt.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" })}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{dt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      )}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#F0EBE3]">
        <span className="text-xs text-[#9B8E82]">{b.sessionMode} · {b.durationMinutes} 分钟</span>
        <span className="text-base font-bold text-[#2C2420]">¥{b.priceAmount}</span>
      </div>
      {b.status === "pending_confirmation" && (
        <div className="flex gap-2 mt-3">
          <button className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#FEF3C7", color: "#D97706" }}>等待确认中</button>
          <button className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#FEF2F2", color: "#DC2626" }}>取消预约</button>
        </div>
      )}
      {(b.status === "confirmed" || b.status === "pending_payment") && (
        <button className="w-full mt-3 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: "#9CB48A" }}>立即支付 ¥{b.priceAmount}</button>
      )}
      {b.status === "paid" && (
        <div className="mt-3 flex gap-2">
          <Link href="/messages" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center" style={{ background: "#F0F7EC", color: "#5A7A3A" }}>联系咨询师</Link>
          <button className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#EEF2FF", color: "#4F46E5" }}>申请改期</button>
        </div>
      )}
      {b.status === "completed" && (
        <button className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#F3F4F6", color: "#6B7280" }}>写咨询反馈</button>
      )}
    </motion.div>
  );
}

export default function MyBookingsScreen() {
  const user = useEazo((s) => s.auth.user);
  const [tab, setTab] = useState("pending");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    request("/api/bookings").then(r => r.json()).then(d => {
      setBookings(Array.isArray(d) ? d : []);
    }).finally(() => setLoading(false));
  }, [user]);

  const activeTab = TABS.find(t => t.key === tab)!;
  const displayed = bookings.filter(b => activeTab.statuses.includes(b.status));
  const countMap  = Object.fromEntries(TABS.map(t => [t.key, bookings.filter(b => t.statuses.includes(b.status)).length]));

  if (!user) return (
    <div className="min-h-svh flex flex-col items-center justify-center px-6 gap-3" style={{ background: "var(--color-surface)" }}>
      <AlertCircle className="w-10 h-10" style={{ color: "var(--color-text-muted)" }} />
      <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>请先登录后查看预约记录</p>
    </div>
  );

  return (
    <div className="min-h-svh pb-24" style={{ background: "var(--color-surface)" }}>
      <div className="sticky top-0 z-10 px-5 pt-14 pb-3" style={{ background: "var(--color-surface)" }}>
        <h1 className="text-xl font-bold text-[#2C2420] mb-4">我的预约</h1>
        <div className="grid grid-cols-4 gap-1.5">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="relative py-2 rounded-xl text-sm font-semibold"
              style={{
                background: tab === t.key ? "#9CB48A" : "white",
                color: tab === t.key ? "white" : "#9B8E82",
                boxShadow: tab === t.key ? "0 2px 8px rgba(156,180,138,0.4)" : "0 1px 4px rgba(0,0,0,0.06)",
              }}>
              {t.label}
              {countMap[t.key] > 0 && (
                <span className="absolute -top-1.5 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{ background: tab === t.key ? "white" : "#9CB48A", color: tab === t.key ? "#9CB48A" : "white" }}>
                  {countMap[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="px-5 pt-3">
        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="rounded-2xl h-32 skeleton" />)}</div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {tab === "pending" ? "暂无待确认的预约" : tab === "payment" ? "暂无待支付的订单" : tab === "upcoming" ? "暂无即将到来的咨询" : "暂无历史记录"}
            </p>
            {tab === "pending" && (
              <Link href="/" className="inline-block mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: "#9CB48A" }}>浏览咨询师</Link>
            )}
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
