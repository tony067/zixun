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

const TABS = [
  { key: "pending_confirmation", label: "待确认", statuses: ["pending_confirmation"], dot: "#D97706" },
  { key: "pending_payment",      label: "待支付", statuses: ["confirmed","pending_payment"], dot: "#2563EB" },
  { key: "upcoming",             label: "待咨询", statuses: ["paid"], dot: "#059669" },
  { key: "completed",            label: "已咨询", statuses: ["completed"], dot: "#6B7280" },
  { key: "cancelled",            label: "已取消", statuses: ["cancelled","rejected"], dot: "#9CA3AF" },
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
const modeIcon = (m: string) => m.includes("视频") ? <Video className="w-3.5 h-3.5"/> : m.includes("语音")||m.includes("电话") ? <Phone className="w-3.5 h-3.5"/> : null;

function BookingCard({ b, onUpdate }: { b: Booking; onUpdate: (id: string, status: string) => void }) {
  const [open, setOpen] = useState(false);
  const d = new Date(b.scheduledAt);
  const dateStr = `${d.getMonth()+1}月${d.getDate()}日 ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
  const name = b.client?.name || b.client?.email || "匿名来访";
  const st = STATUS_STYLE[b.status] ?? { color: "#6B7280", bg: "#F3F4F6" };

  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      className="bg-white rounded-2xl p-4 border border-[#EBE7DF]">
      <div className="flex items-start justify-between gap-3 mb-3" onClick={() => setOpen(v=>!v)}>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[#2C2420] text-base">{name}</div>
          <div className="flex items-center gap-2 mt-1 text-sm text-[#7D736A]">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />{dateStr}
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-[#7D736A]">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />{b.durationMinutes}分钟
            <span className="flex items-center gap-1">{modeIcon(b.sessionMode)}{b.sessionMode}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ color: st.color, background: st.bg }}>{STATUS_LABEL[b.status]}</span>
          <span className="text-sm font-semibold text-[#2C2420]">¥{b.priceAmount}</span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        {b.status === "pending_confirmation" && (<>
          <motion.button whileTap={{ scale:0.95 }} onClick={() => onUpdate(b.id,"confirmed")}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-[#9CB48A] flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4" />接受
          </motion.button>
          <motion.button whileTap={{ scale:0.95 }} onClick={() => onUpdate(b.id,"rejected")}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-[#EF4444] border border-[#FCA5A5] flex items-center justify-center gap-1.5">
            <X className="w-4 h-4" />拒绝
          </motion.button>
        </>)}
        {(b.status === "confirmed" || b.status === "pending_payment") && (
          <motion.button whileTap={{ scale:0.95 }} onClick={() => onUpdate(b.id,"cancelled")}
            className="flex-1 py-2 rounded-xl text-sm text-[#9B8E82] border border-[#EBE7DF]">
            取消预约
          </motion.button>
        )}
        {b.status === "paid" && (
          <motion.button whileTap={{ scale:0.95 }} onClick={() => onUpdate(b.id,"completed")}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-[#9CB48A]">
            标记已完成
          </motion.button>
        )}
        <motion.button whileTap={{ scale:0.92 }} onClick={() => setOpen(v=>!v)}
          className="w-9 h-9 rounded-xl border border-[#EBE7DF] flex items-center justify-center flex-shrink-0">
          <ChevronDown className={`w-4 h-4 text-[#9B8E82] transition-transform ${open?"rotate-180":""}`} />
        </motion.button>
      </div>

      {/* 展开详情 */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }} className="overflow-hidden">
            <div className="pt-3 mt-3 border-t border-[#EBE7DF] space-y-2">
              {b.clientNote && <div>
                <div className="text-xs text-[#9B8E82] mb-1">来访备注</div>
                <div className="text-sm text-[#2C2420]">{b.clientNote}</div>
              </div>}
              <div className="text-xs text-[#9B8E82]">预约ID：{b.id.slice(0,12)}…</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function CounselorBookingsScreen() {
  const user = useEazo((s) => s.auth.user);
  const loading_auth = useEazo((s) => s.auth.loading);
  const [tab, setTab] = useState("pending_confirmation");
  const [showDropdown, setShowDropdown] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    request("/api/counselor/bookings").then(r => r.json())
      .then(d => setBookings(Array.isArray(d) ? d : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [user]);

  const handleUpdate = async (id: string, status: string) => {
    await request(`/api/bookings/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  if (!loading_auth && !user) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-[#F5F0E8] px-6">
        <div className="text-center">
          <p className="text-base font-semibold text-[#2C2420] mb-2">请先登录</p>
          <motion.button whileTap={{ scale:0.96 }} onClick={() => auth.login()}
            className="px-6 py-2.5 rounded-2xl text-white text-sm font-semibold bg-[#9CB48A]">登录</motion.button>
        </div>
      </div>
    );
  }

  const currentTab = TABS.find(t => t.key === tab)!;
  const displayed = bookings.filter(b => currentTab.statuses.includes(b.status));
  const counts = Object.fromEntries(TABS.map(t => [t.key, bookings.filter(b => t.statuses.includes(b.status)).length]));

  return (
    <div className="min-h-svh bg-[#F5F0E8] pb-24">
      {/* 顶部标题 + 下拉状态选择器 */}
      <div className="sticky top-0 z-10 bg-[#F5F0E8] px-5 pt-12 md:pt-6 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-[#2C2420]">预约管理</h1>
          <span className="text-sm text-[#9B8E82]">{bookings.length} 个预约</span>
        </div>

        {/* 下拉选择器 */}
        <div className="relative">
          <motion.button whileTap={{ scale:0.98 }}
            onClick={() => setShowDropdown(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-[#EBE7DF]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: currentTab.dot }} />
              <span className="font-semibold text-[#2C2420]">{currentTab.label}</span>
              {counts[tab] > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#F0EDE8] text-[#7D736A]">{counts[tab]}</span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-[#9B8E82] transition-transform ${showDropdown?"rotate-180":""}`} />
          </motion.button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-4 }}
                className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-[#EBE7DF] shadow-lg z-20 overflow-hidden">
                {TABS.map(t => (
                  <motion.button key={t.key} whileTap={{ scale:0.98 }}
                    onClick={() => { setTab(t.key); setShowDropdown(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                      t.key === tab ? "bg-[#F5F0E8]" : "hover:bg-[#FAFAF8]"
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: t.dot }} />
                      <span className={`text-sm ${t.key === tab ? "font-semibold text-[#2C2420]" : "text-[#7D736A]"}`}>{t.label}</span>
                    </div>
                    {counts[t.key] > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#F0EDE8] text-[#7D736A]">{counts[t.key]}</span>
                    )}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 预约列表 */}
      <div className="px-5 space-y-3">
        {loading ? (
          <>{[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl skeleton" />)}</>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-10 h-10 text-[#C2BDB7] mx-auto mb-3" />
            <p className="text-sm text-[#9B8E82]">暂无{currentTab.label}预约</p>
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
