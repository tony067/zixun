"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Video, ChevronRight, MessageCircle } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";

type Booking = {
  id: string; status: string; scheduledAt: string; durationMinutes: number;
  sessionMode: string; priceAmount: number;
  counselor: { id: string; displayName: string; avatarUrl?: string; counselorTypes?: string[] } | null;
};

const TABS = [
  { key: "pending_confirmation", label: "待确认", statuses: ["pending_confirmation"] },
  { key: "pending_payment",      label: "待支付", statuses: ["pending_payment"] },
  { key: "upcoming",             label: "待咨询", statuses: ["paid"] },
  { key: "past",                 label: "已完成",   statuses: ["completed","cancelled","rejected"] },
];

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  pending_confirmation: { label: "待咨询师确认", color: "#D97706", bg: "#FEF3C7" },
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
      className="rounded-2xl p-4 mb-3" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0"
          style={{ background: "#E8DFCC", color: "#7A6248" }}>
          {c ? c.displayName[0] : "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="text-sm font-bold text-[#2C2420]">{c?.displayName ?? "咨询师"}</p>
              {c?.counselorTypes && (c.counselorTypes as string[]).length > 0 && (
                <p className="text-xs text-[#9B8E82] mt-0.5">{(c.counselorTypes as string[]).join(" · ")}</p>
              )}
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ color: badge.color, background: badge.bg }}>{badge.label}</span>
          </div>
          {dt && (
            <div className="flex items-center gap-3 text-xs text-[#9B8E82] mt-1.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {dt.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {dt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[#9B8E82] flex items-center gap-1">
              <Video className="w-3.5 h-3.5" />{b.durationMinutes} 分钟 · {b.sessionMode}
            </span>
            <span className="text-sm font-bold text-[#2C2420]">¥{b.priceAmount}</span>
          </div>
        </div>
      </div>
      {b.status === "pending_confirmation" && (
        <button className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold border"
          style={{ borderColor: "#E0D8CE", color: "#9B8E82" }}>取消预约</button>
      )}
      {b.status === "pending_payment" && (
        <div className="flex gap-2 mt-3">
          <button className="flex-1 py-2.5 rounded-xl text-sm font-semibold border flex items-center justify-center gap-1"
            style={{ borderColor: "#9CB48A", color: "#9CB48A" }}>
            <MessageCircle className="w-4 h-4" />私信咨询师</button>
          <button className="flex-[2] py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: "#9CB48A" }}>立即支付 ¥{b.priceAmount}</button>
        </div>
      )}
      {b.status === "paid" && (
        <div className="flex gap-2 mt-3">
          <button className="flex-1 py-2.5 rounded-xl text-sm font-semibold border flex items-center justify-center gap-1"
            style={{ borderColor: "#9CB48A", color: "#9CB48A" }}>
            <MessageCircle className="w-4 h-4" />私信咨询师</button>
          <button className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
            style={{ borderColor: "#E0D8CE", color: "#9B8E82" }}>申请改期</button>
        </div>
      )}
      {b.status === "completed" && (
        <button className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold border"
          style={{ borderColor: "#E0D8CE", color: "#9B8E82" }}>写咨询反馈</button>
      )}
    </motion.div>
  );
}

export default function MyBookingsScreen() {
  const user = useEazo((s) => s.auth.user);
  const [tab, setTab] = useState(TABS[0].key);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    request("/api/bookings/my").then(r => r.json()).then(d => {
      setAllBookings(Array.isArray(d) ? d : []);
    }).finally(() => setLoading(false));
  }, [user]);

  const currentTab = TABS.find(t => t.key === tab)!;
  const displayed = allBookings.filter(b => currentTab.statuses.includes(b.status));
  const counts = Object.fromEntries(TABS.map(t => [
    t.key, allBookings.filter(b => t.statuses.includes(b.status)).length
  ]));

  return (
    <div className="h-svh flex flex-col" style={{ background: "var(--color-surface)" }}>
      <div className="flex-none sticky top-0 px-5 pb-0 z-20"
        style={{ background: "rgba(245,240,232,0.97)", backdropFilter: "blur(10px)", borderBottom: "1px solid #EBE7DF", paddingTop: 14 }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => window.history.back()}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#EBE7DF" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A4E44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-base font-bold" style={{ color: "#2C2420" }}>全部预约</h1>
        </div>
        <h1 className="text-xl font-bold text-[#2C2420] mb-4">我的预约</h1>
        <div className="flex gap-1.5 pb-3 border-b border-[#EBE7DF]">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold relative transition-all"
              style={{
                background: tab === t.key ? "#9CB48A" : "#F0EBE3",
                color: tab === t.key ? "white" : "#9B8E82",
              }}>
              {t.label}
              {counts[t.key] > 0 && tab !== t.key && (
                <span className="absolute -top-1.5 -right-0.5 w-4 h-4 rounded-full text-[10px] flex items-center justify-center text-white"
                  style={{ background: "#E07B54" }}>{counts[t.key]}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-28 rounded-2xl skeleton" />)}</div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: "#C4BDB5" }} />
            <p className="text-sm text-[#9B8E82]">暂无记录</p>
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
