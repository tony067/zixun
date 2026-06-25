"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Video, Phone, MessageCircle, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { request } from "@/lib/api/request";

type ApplicationForm = {
  name?: string; phone?: string; wechat?: string;
  purposes?: string[]; purposeOther?: string;
  additionalNote?: string; emergencyName?: string; emergencyPhone?: string;
  hasMentalDisease?: boolean; onMedication?: boolean;
  hasSelfHarm?: boolean; hasSuicidalThought?: boolean; hasSuicidalBehavior?: boolean;
};

type Booking = {
  id: string; status: string; scheduledAt: string; durationMinutes: number;
  sessionMode: string; priceAmount: number; clientNote: string | null;
  client: { id: string; name: string | null; email: string | null } | null;
  rescheduleStatus: string | null;
  rescheduleNewTime: string | null;
  rescheduleReason: string | null;
  applicationForm?: ApplicationForm | null;
};

// 4个平铺Tab，去掉「已取消」
const STATUS_OPTIONS = [
  { key: "pending_confirmation", label: "待确认", statuses: ["pending_confirmation","pending"], dot: "#D97706" },
  { key: "pending_payment",      label: "待支付", statuses: ["confirmed","pending_payment"], dot: "#2563EB" },
  { key: "upcoming",             label: "待咨询", statuses: ["paid"], dot: "#059669" },
  { key: "completed",            label: "已咨询", statuses: ["completed"], dot: "#6B7280" },
];

const STATUS_LABEL: Record<string, string> = {
  pending_confirmation: "待确认", pending: "待确认", confirmed: "待支付", pending_payment: "待支付",
  paid: "待咨询", completed: "已咨询", cancelled: "已取消", rejected: "已拒绝",
};
const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  pending_confirmation: { color: "#D97706", bg: "#FEF3C7" },
  pending:              { color: "#D97706", bg: "#FEF3C7" },
  confirmed:            { color: "#2563EB", bg: "#DBEAFE" },
  pending_payment:      { color: "#2563EB", bg: "#DBEAFE" },
  paid:                 { color: "#059669", bg: "#D1FAE5" },
  completed:            { color: "#6B7280", bg: "#F3F4F6" },
  cancelled:            { color: "#9CA3AF", bg: "#F9FAFB" },
  rejected:             { color: "#EF4444", bg: "#FEE2E2" },
};

function BookingCard({ b, onUpdate, onReschedule, onDirectReschedule }: { b: Booking; onUpdate: (id: string, status: string) => void; onReschedule?: (b: Booking) => void; onDirectReschedule?: (id: string) => void }) {
  const dt = new Date(b.scheduledAt);
  const dateStr = dt.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });
  const timeStr = dt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  const st = STATUS_STYLE[b.status] ?? { color: "#6B7280", bg: "#F3F4F6" };
  const af = b.applicationForm;
  const clientName = af?.name || b.client?.name || b.client?.email?.split("@")[0] || "来访者";
  const [showForm, setShowForm] = useState(false);

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
      {/* 来访者预约表单（可折叠） */}
      {af && (
        <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium w-full text-left"
            style={{ color: "var(--color-primary)" }}>
            <span>{showForm ? "▲" : "▼"}</span>
            {showForm ? "收起来访信息" : "查看来访信息"}
          </button>
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden">
                <div className="mt-3 rounded-2xl p-4 space-y-2.5 text-xs" style={{ background: "#F8F5F0" }}>
                  {af.name && <div className="flex gap-2"><span className="text-[#9B8E82] w-20 flex-none">真实姓名</span><span className="text-[#2C2420] font-medium">{af.name}</span></div>}
                  {af.phone && <div className="flex gap-2"><span className="text-[#9B8E82] w-20 flex-none">手机号</span><span className="text-[#2C2420]">{af.phone}</span></div>}
                  {af.wechat && <div className="flex gap-2"><span className="text-[#9B8E82] w-20 flex-none">微信号</span><span className="text-[#2C2420]">{af.wechat}</span></div>}
                  {af.purposes && af.purposes.length > 0 && (
                    <div className="flex gap-2">
                      <span className="text-[#9B8E82] w-20 flex-none">咨询目的</span>
                      <span className="text-[#2C2420]">
                        {af.purposes.join("、")}{af.purposeOther ? `、${af.purposeOther}` : ""}
                      </span>
                    </div>
                  )}
                  {af.additionalNote && <div className="flex gap-2"><span className="text-[#9B8E82] w-20 flex-none">背景说明</span><span className="text-[#2C2420]">{af.additionalNote}</span></div>}
                  {af.emergencyName && (
                    <div className="flex gap-2">
                      <span className="text-[#9B8E82] w-20 flex-none">紧急联系人</span>
                      <span className="text-[#2C2420]">{af.emergencyName}{af.emergencyPhone ? ` · ${af.emergencyPhone}` : ""}</span>
                    </div>
                  )}
                  {(af.hasMentalDisease || af.hasSelfHarm || af.hasSuicidalThought || af.hasSuicidalBehavior) && (
                    <div className="flex gap-2 items-start">
                      <span className="text-[#9B8E82] w-20 flex-none">安全评估</span>
                      <div className="flex flex-col gap-0.5">
                        {af.hasMentalDisease && <span className="text-red-500 text-xs">⚠ 有精神科诊断</span>}
                        {af.hasSelfHarm && <span className="text-red-500 text-xs">⚠ 近期有自伤行为</span>}
                        {af.hasSuicidalThought && <span className="text-red-500 text-xs">⚠ 近期有自杀想法</span>}
                        {af.hasSuicidalBehavior && <span className="text-red-500 text-xs">⚠ 近期有自杀行为</span>}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t mt-3" style={{ borderColor: "var(--color-border)" }}>
        <span className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>¥{b.priceAmount}</span>
        <div className="flex gap-2">
          {(b.status === "pending_confirmation" || b.status === "pending") && (<>
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
          {(b.status === "confirmed" || b.status === "pending_payment") && (<>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => { window.location.href = `/messages?clientId=${b.client?.id}`; }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-white"
              style={{ background: "var(--color-primary)" }}>
              联系来访
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onUpdate(b.id, "cancelled")}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface)" }}>
              取消预约
            </motion.button>
          </>)}
          {b.status === "paid" && (<>
            <motion.button whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface)" }}>
              <MessageCircle className="w-3.5 h-3.5" />私信
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => onDirectReschedule && onDirectReschedule(b.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border"
              style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)", background: "white" }}>
              修改时间
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onUpdate(b.id, "completed")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-white"
              style={{ background: "var(--color-primary)" }}>
              <Check className="w-3.5 h-3.5" />标记完成
            </motion.button>
            {b.rescheduleStatus === "pending" && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => onReschedule && onReschedule(b)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium"
                style={{ background: "#FEF3C7", color: "#D97706" }}>
                改期申请
              </motion.button>
            )}
          </>)}
        </div>
      </div>
    </motion.div>
  );
}

export function CounselorBookingsScreen() {
  const { user, loading: loadingAuth } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState("pending_confirmation");
  const [seenTabs, setSeenTabs] = useState<Record<string,number>>(() => {
    try { return JSON.parse(localStorage.getItem("cb_seen") || "{}"); } catch { return {}; }
  });
  const markSeen = (key: string, count: number) => {
    setSeenTabs(prev => {
      const next = { ...prev, [key]: count };
      try { localStorage.setItem("cb_seen", JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [rescheduleNote, setRescheduleNote] = useState("");
  const [showDirectReschedule, setShowDirectReschedule] = useState<string | null>(null);
  const [dSelDay, setDSelDay] = useState("");
  const [dSelTime, setDSelTime] = useState("");
  const [submittingDirect, setSubmittingDirect] = useState(false);

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
          <button onClick={() => router.push("/login")} className="px-6 py-2.5 rounded-2xl text-white text-sm font-medium"
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

      {/* 4个平铺 Tab */}
      <div className="flex gap-1.5 px-5 mb-4">
        {STATUS_OPTIONS.map(opt => (
          <button key={opt.key} onClick={() => { setSelectedKey(opt.key); markSeen(opt.key, counts[opt.key] ?? 0); }}
            className="flex-1 flex flex-col items-center py-2.5 rounded-2xl text-xs font-semibold transition-all relative"
            style={{
              background: selectedKey === opt.key ? "var(--color-primary)" : "var(--color-card)",
              color:      selectedKey === opt.key ? "white" : "var(--color-text-secondary)",
              border:     selectedKey === opt.key ? "none" : "1px solid var(--color-border)",
            }}>
            {opt.label}
            {counts[opt.key] > 0 && counts[opt.key] > (seenTabs[opt.key] ?? 0) && (
              <span className="absolute -top-1.5 -right-1 text-[10px] w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: opt.dot }}>{counts[opt.key]}</span>
            )}
          </button>
        ))}
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
            {displayed.map(b => <BookingCard key={b.id} b={b} onUpdate={handleUpdate} onReschedule={setRescheduleBooking} onDirectReschedule={setShowDirectReschedule} />)}
          </AnimatePresence>
        )}
      </div>

      {/* 改期确认弹窗 */}
      {rescheduleBooking && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setRescheduleBooking(null)}>
          <div className="rounded-t-3xl px-5 pt-6 pb-10" style={{ background: "var(--color-bg)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: "#2C2420" }}>来访改期申请</h2>
              <button onClick={() => setRescheduleBooking(null)} className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#EBE7DF", color: "#5A4E44", fontSize: 18 }}>×</button>
            </div>
            <div className="rounded-xl p-3 mb-4" style={{ background: "#F8F5F0" }}>
              <p className="text-xs mb-1" style={{ color: "#9B8E82" }}>申请改到</p>
              <p className="text-sm font-bold" style={{ color: "#2C2420" }}>
                {rescheduleBooking.rescheduleNewTime
                  ? new Date(rescheduleBooking.rescheduleNewTime).toLocaleString("zh-CN", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" })
                  : "未指定"}
              </p>
              {rescheduleBooking.rescheduleReason && (
                <p className="text-xs mt-1" style={{ color: "#9B8E82" }}>原因：{rescheduleBooking.rescheduleReason}</p>
              )}
            </div>
            <p className="text-sm font-medium mb-2" style={{ color: "#2C2420" }}>回复（可选）</p>
            <textarea value={rescheduleNote} onChange={e => setRescheduleNote(e.target.value)}
              rows={2} placeholder="可附上确认说明或说明无法接受的原因…"
              className="w-full rounded-xl px-3 py-2.5 text-sm border mb-4"
              style={{ background: "#F8F5F0", borderColor: "#DDD8D0", resize: "none", color: "#2C2420" }} />
            <div className="flex gap-3">
              <button onClick={async () => {
                await request(`/api/bookings/\${rescheduleBooking.id}/reschedule`, {
                  method: "PATCH",
                  body: JSON.stringify({ action: "reject", note: rescheduleNote }),
                });
                setBookings(prev => prev.map(b => b.id === rescheduleBooking.id ? { ...b, rescheduleStatus: "rejected" } : b));
                setRescheduleBooking(null); setRescheduleNote("");
              }} className="flex-1 py-3 rounded-2xl text-sm font-bold"
                style={{ background: "#FEE2E2", color: "#DC2626" }}>
                拒绝改期
              </button>
              <button onClick={async () => {
                await request(`/api/bookings/\${rescheduleBooking.id}/reschedule`, {
                  method: "PATCH",
                  body: JSON.stringify({ action: "approve", note: rescheduleNote }),
                });
                if (rescheduleBooking.rescheduleNewTime) {
                  setBookings(prev => prev.map(b => b.id === rescheduleBooking.id
                    ? { ...b, rescheduleStatus: "approved", scheduledAt: rescheduleBooking.rescheduleNewTime! }
                    : b));
                }
                setRescheduleBooking(null); setRescheduleNote("");
              }} className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ background: "var(--color-primary)" }}>
                确认改期
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 咨询师直接改期抽屉（直接生效，无需来访确认） */}
      {showDirectReschedule && (() => {
        const WEEKDAY = ["日","一","二","三","四","五","六"];
        const days = Array.from({ length: 14 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() + i + 1);
          return { iso: d.toISOString().slice(0,10), label: `${d.getMonth()+1}/${d.getDate()}`, weekday: `周${WEEKDAY[d.getDay()]}` };
        });
        const TIME_SLOTS = ["09:00","10:00","11:00","14:00","15:00","16:00","19:00","20:00"];

        const handleDirectSubmit = async () => {
          if (!dSelDay || !dSelTime || submittingDirect) return;
          setSubmittingDirect(true);
          try {
            await request(`/api/bookings/${showDirectReschedule}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ scheduledAt: `${dSelDay}T${dSelTime}:00` }),
            });
            setBookings(prev => prev.map(b => b.id === showDirectReschedule
              ? { ...b, scheduledAt: `${dSelDay}T${dSelTime}:00` } : b));
            setShowDirectReschedule(null); setDSelDay(""); setDSelTime("");
          } finally { setSubmittingDirect(false); }
        };

        return (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowDirectReschedule(null)} />
            <div className="relative bg-[var(--color-bg)] rounded-t-3xl px-5 pt-5 pb-10 z-10 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-[#2C2420]">修改咨询时间</h3>
                <button onClick={() => setShowDirectReschedule(null)} className="w-8 h-8 rounded-full bg-[#EBE7DF] flex items-center justify-center text-[#5A4E44]">×</button>
              </div>
              <p className="text-xs text-[#9B8E82] mb-4">选择新时间后直接生效，来访端将显示更新后的时间。</p>
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                {days.map(d => (
                  <button key={d.iso} onClick={() => { setDSelDay(d.iso); setDSelTime(""); }}
                    className="flex-none flex flex-col items-center px-3 py-2 rounded-2xl text-xs font-medium"
                    style={{ background: dSelDay===d.iso ? "var(--color-primary)" : "white", color: dSelDay===d.iso ? "white" : "#5A4E44", border:`1px solid ${dSelDay===d.iso ? "var(--color-primary)" : "#EBE7DF"}`, minWidth:52 }}>
                    <span>{d.weekday}</span><span className="mt-0.5">{d.label}</span>
                  </button>
                ))}
              </div>
              {dSelDay && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {TIME_SLOTS.map(t => (
                    <button key={t} onClick={() => setDSelTime(t)}
                      className="py-2 rounded-xl text-sm font-medium"
                      style={{ background: dSelTime===t ? "var(--color-primary)" : "#F5F0EA", color: dSelTime===t ? "white" : "#2C2420" }}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
              {dSelDay && dSelTime && (
                <div className="mb-4 px-3 py-2.5 rounded-xl bg-[#E4F0DC]">
                  <p className="text-sm text-[#3A6228] font-medium">新时间：{days.find(d=>d.iso===dSelDay)?.weekday} {days.find(d=>d.iso===dSelDay)?.label} {dSelTime}</p>
                </div>
              )}
              <button onClick={handleDirectSubmit} disabled={!dSelDay || !dSelTime || submittingDirect}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}>
                {submittingDirect ? "更新中…" : "确认修改（直接生效）"}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
