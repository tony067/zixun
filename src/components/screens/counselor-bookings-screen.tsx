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
  { key: "pending_confirmation", label: "待确认", statuses: ["pending_confirmation"] },
  { key: "pending_payment",      label: "待支付", statuses: ["confirmed", "pending_payment"] },
  { key: "upcoming",             label: "待咨询", statuses: ["paid"] },
  { key: "completed",            label: "已咨询", statuses: ["completed"] },
  { key: "cancelled",            label: "已取消", statuses: ["cancelled", "rejected"] },
];

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  pending_confirmation: { color: "#D97706", bg: "#FEF3C7" },
  confirmed:            { color: "#059669", bg: "#D1FAE5" },
  pending_payment:      { color: "#2563EB", bg: "#DBEAFE" },
  paid:                 { color: "#059669", bg: "#D1FAE5" },
  completed:            { color: "#6B7280", bg: "#F3F4F6" },
  cancelled:            { color: "#9CA3AF", bg: "#F9FAFB" },
  rejected:             { color: "#DC2626", bg: "#FEE2E2" },
};
const STATUS_LABEL: Record<string, string> = {
  pending_confirmation:"待确认", confirmed:"已确认", pending_payment:"待支付",
  paid:"已支付", completed:"已完成", cancelled:"已取消", rejected:"已拒绝",
};

function modeIcon(mode: string) {
  if (mode?.includes("视频")) return <Video className="w-3.5 h-3.5" />;
  if (mode?.includes("语音") || mode?.includes("电话")) return <Phone className="w-3.5 h-3.5" />;
  return <MessageCircle className="w-3.5 h-3.5" />;
}

function BookingCard({ b, onUpdate }: { b: Booking; onUpdate: (id: string, st: string) => void }) {
  const [open, setOpen] = useState(false);
  const dt = new Date(b.scheduledAt);
  const dateStr = `${dt.getMonth()+1}月${dt.getDate()}日 ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
  const st = STATUS_STYLE[b.status] ?? { color: "#6B7280", bg: "#F3F4F6" };
  const name = b.client?.name ?? b.client?.email ?? "来访者";
  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      className="bg-[#FDFBF7] rounded-2xl border border-[#EBE7DF] overflow-hidden mb-3">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="font-semibold text-[#2C2420] text-base">{name}</div>
            <div className="flex items-center gap-2 mt-1 text-sm text-[#7D736A]">
              <Calendar className="w-3.5 h-3.5" />{dateStr}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-[#7D736A]">
              <Clock className="w-3.5 h-3.5" />{b.durationMinutes}分钟
              <span className="flex items-center gap-1">{modeIcon(b.sessionMode)}{b.sessionMode}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ color: st.color, background: st.bg }}>{STATUS_LABEL[b.status]}</span>
            <span className="text-sm font-semibold text-[#2C2420]">¥{b.priceAmount}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {b.status === "pending_confirmation" && (<>
            <motion.button whileTap={{ scale:0.95 }} onClick={() => onUpdate(b.id,"confirmed")}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-[#9CB48A] flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" />接受预约
            </motion.button>
            <motion.button whileTap={{ scale:0.95 }} onClick={() => onUpdate(b.id,"rejected")}
              className="flex-1 py-2 rounded-xl text-sm font-semibold border border-[#EBE7DF] text-[#7D736A] flex items-center justify-center gap-1.5">
              <X className="w-4 h-4" />拒绝
            </motion.button>
          </>)}
          {(b.status==="confirmed"||b.status==="pending_payment") && (
            <motion.button whileTap={{ scale:0.95 }} onClick={() => onUpdate(b.id,"cancelled")}
              className="flex-1 py-2 rounded-xl text-sm font-semibold border border-[#EBE7DF] text-[#7D736A]">
              取消预约
            </motion.button>
          )}
          {b.status==="paid" && (
            <motion.button whileTap={{ scale:0.95 }} onClick={() => onUpdate(b.id,"completed")}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-[#9CB48A] flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" />标记已完成
            </motion.button>
          )}
          <motion.button whileTap={{ scale:0.95 }} onClick={() => setOpen(!open)}
            className="w-10 h-10 rounded-xl border border-[#EBE7DF] flex items-center justify-center text-[#9B8E82]">
            <ChevronDown className={`w-4 h-4 transition-transform ${open?"rotate-180":""}`} />
          </motion.button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
              exit={{ height:0, opacity:0 }} className="overflow-hidden">
              <div className="pt-3 mt-3 border-t border-[#EBE7DF] space-y-2">
                {b.clientNote && <div>
                  <div className="text-xs text-[#9B8E82] mb-1">来访备注</div>
                  <div className="text-sm text-[#2C2420]">{b.clientNote}</div>
                </div>}
                <div className="text-xs text-[#9B8E82]">预约ID：{b.id}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function CounselorBookingsScreen() {
  const user = useEazo((s) => s.auth.user);
  const loadingAuth = useEazo((s) => s.auth.loading);
  const [tab, setTab] = useState("pending_confirmation");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    request("/api/counselor/bookings").then(r => r.json())
      .then(d => setBookings(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [user]);

  const handleUpdate = async (id: string, status: string) => {
    await request(`/api/bookings/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBookings(p => p.map(b => b.id === id ? { ...b, status } : b));
  };

  if (!loadingAuth && !user) return (
    <div className="min-h-svh bg-[#F5F1E8] flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-base font-semibold text-[#2C2420] mb-4">请先登录咨询师账号</p>
        <button onClick={() => auth.login()}
          className="px-6 py-2.5 rounded-2xl bg-[#9CB48A] text-white font-semibold text-sm">登录</button>
      </div>
    </div>
  );

  const currentStatuses = TABS.find(t => t.key === tab)?.statuses ?? [];
  const displayed = bookings.filter(b => currentStatuses.includes(b.status));
  const countMap = Object.fromEntries(
    TABS.map(t => [t.key, bookings.filter(b => t.statuses.includes(b.status)).length])
  );

  return (
    <div className="min-h-svh bg-[#F5F1E8]">
      <div className="bg-[#F5F1E8] px-5 pt-14 pb-3">
        <h1 className="text-2xl font-bold text-[#2C2420]">预约管理</h1>
      </div>
      <div className="px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(t => (
            <motion.button key={t.key} whileTap={{ scale:0.95 }} onClick={() => setTab(t.key)}
              className={["flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold transition-all",
                tab===t.key ? "bg-[#9CB48A] text-white shadow-sm" : "bg-[#FDFBF7] text-[#7D736A] border border-[#EBE7DF]"
              ].join(" ")}>
              {t.label}
              {countMap[t.key] > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  tab===t.key ? "bg-white/30" : "bg-[#9CB48A]/15 text-[#9CB48A]"}`}>
                  {countMap[t.key]}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>
      <div className="px-5 pb-28">
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl skeleton" />)}</div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-10 h-10 text-[#C2BDB7] mx-auto mb-3" />
            <p className="text-sm text-[#9B8E82]">暂无{TABS.find(t=>t.key===tab)?.label}预约</p>
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
