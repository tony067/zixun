"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Video, Phone, MessageCircle, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { request } from "@/lib/api/request";
import { localDateStr } from "@/lib/date";
import { statusMeta } from "@/lib/booking-status";

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
  meetingLink?: string | null;
  adjustRequest?: { message: string; acceptOther?: string } | null;
  client: { id: string; name: string | null; email: string | null } | null;
  rescheduleStatus: string | null;
  rescheduleNewTime: string | null;
  rescheduleReason: string | null;
  applicationForm?: ApplicationForm | null;
};

// 状态文案/配色统一来自 @/lib/booking-status（唯一规范来源）
const STATUS_OPTIONS = [
  { key: "pending_confirmation", label: "待确认", statuses: ["pending_confirmation", "pending_payment"], dot: statusMeta("pending_confirmation").color },
  { key: "upcoming",             label: "待咨询", statuses: ["paid"],                                   dot: statusMeta("paid").color },
  { key: "in_progress",          label: "进行中", statuses: ["in_progress"],                            dot: statusMeta("in_progress").color },
  { key: "completed",            label: "已咨询", statuses: ["completed", "refunded"],                  dot: statusMeta("completed").color },
];

function BookingCard({ b, onUpdate, onConfirm, onReschedule, onDirectReschedule, onContact, onRefund }: { b: Booking; onUpdate: (id: string, status: string) => void; onConfirm?: (b: Booking) => void; onReschedule?: (b: Booking) => void; onDirectReschedule?: (id: string) => void; onContact?: (b: Booking) => void; onRefund?: (id: string) => void }) {
  const dt = new Date(b.scheduledAt);
  const dateStr = dt.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });
  const timeStr = dt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  const st = statusMeta(b.status);
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
          {statusMeta(b.status).label}
        </span>
      </div>

      {/* 时间 + 方式 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
        <span className="flex items-center gap-1 whitespace-nowrap">
          <Calendar className="w-3.5 h-3.5 flex-none" />
          {dateStr}
        </span>
        <span className="flex items-center gap-1 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 flex-none" />
          {timeStr} · {b.durationMinutes}分钟
        </span>
        <span className="flex items-center gap-1 whitespace-nowrap">
          {b.sessionMode?.includes("视频") ? <Video className="w-3.5 h-3.5 flex-none" /> : <Phone className="w-3.5 h-3.5 flex-none" />}
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
                  <div className="flex gap-2 items-start mt-1">
                    <span className="text-[#9B8E82] w-20 flex-none shrink-0">安全评估</span>
                    <div className="flex flex-col gap-1">
                      {[
                        { key: "hasMentalDisease", label: "有精神科诊断", val: af.hasMentalDisease },
                        { key: "onMedication",     label: "正在服药",     val: af.onMedication },
                        { key: "hasSelfHarm",      label: "三个月内有自伤行为", val: af.hasSelfHarm },
                        { key: "hasSuicidalThought", label: "三个月内有自杀想法", val: af.hasSuicidalThought },
                        { key: "hasSuicidalBehavior", label: "三个月内有自杀行为", val: af.hasSuicidalBehavior },
                      ].map(({ key, label, val }) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <span className="text-[#9B8E82]">{label}：</span>
                          <span className={val ? "text-red-500 font-semibold" : "text-[#2C2420]"}>
                            {val ? "⚠ 是" : "否"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 调剂申请提示 */}
      {b.adjustRequest && (
        <div className="mt-3 rounded-xl px-3 py-2.5" style={{ background: "#FEF3C7" }}>
          <p className="text-xs font-semibold mb-0.5" style={{ color: "#D97706" }}>时间调剂申请（来访已支付）</p>
          <p className="text-xs whitespace-pre-wrap" style={{ color: "#5A4E44" }}>{b.adjustRequest.message}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t mt-3" style={{ borderColor: "var(--color-border)" }}>
        <span className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>¥{b.priceAmount}</span>
        <div className="flex flex-wrap gap-2">
          {(b.status === "pending_confirmation" || b.status === "pending_payment") && (<>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onContact && onContact(b)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface)" }}>
              <MessageCircle className="w-3.5 h-3.5" />联系来访
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onUpdate(b.id, "rejected")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface)" }}>
              <X className="w-3.5 h-3.5" />拒绝并退款
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onConfirm && onConfirm(b)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-white"
              style={{ background: "var(--color-primary)" }}>
              <Check className="w-3.5 h-3.5" />确认预约
            </motion.button>
          </>)}
          {b.status === "paid" && (<>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onContact && onContact(b)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface)" }}>
              <MessageCircle className="w-3.5 h-3.5" />联系来访
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onRefund && onRefund(b.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border"
              style={{ borderColor: "#F5E6C0", color: "#B07D2A", background: "#FEF9EE" }}>
              退款
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => onDirectReschedule && onDirectReschedule(b.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border"
              style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)", background: "white" }}>
              修改时间
            </motion.button>
            {b.rescheduleStatus === "pending" && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => onReschedule && onReschedule(b)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium"
                style={{ background: "#FEF3C7", color: "#D97706" }}>
                改期申请
              </motion.button>
            )}
          </>)}
          {b.status === "in_progress" && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onContact && onContact(b)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface)" }}>
              <MessageCircle className="w-3.5 h-3.5" />联系来访
            </motion.button>
          )}
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

  // 确认预约弹窗（发咨询链接 + 可改时间）
  const [confirmBooking, setConfirmBooking] = useState<Booking | null>(null);
  const [cNote, setCNote] = useState("");
  const [cLink, setCLink] = useState("");
  const [cSelDay, setCSelDay] = useState("");
  const [cSelTime, setCSelTime] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  const openConfirm = (b: Booking) => {
    setConfirmBooking(b);
    setCNote(""); setCLink(""); setCSelDay(""); setCSelTime(""); setConfirmError("");
  };

  const handleConfirm = async () => {
    if (!confirmBooking || confirming) return;
    setConfirming(true); setConfirmError("");
    try {
      const payload: Record<string, unknown> = { status: "paid" };
      if (cSelDay && cSelTime) payload.scheduledAt = `${cSelDay}T${cSelTime}:00`;
      if (cNote.trim()) payload.counselorNote = cNote.trim();
      if (cLink.trim()) payload.meetingLink = cLink.trim();
      const res = await request(`/api/bookings/${confirmBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === confirmBooking.id
          ? { ...b, status: "paid", meetingLink: cLink.trim() || b.meetingLink }
          : b));
        setConfirmBooking(null);
      } else {
        const d = await res.json().catch(() => ({}));
        setConfirmError(d.message ?? "确认失败，请稍后重试");
      }
    } catch {
      setConfirmError("网络异常，请稍后重试");
    } finally {
      setConfirming(false);
    }
  };

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

  // 退款：咨询师可退未开始的订单（待确认/待咨询），需二次确认
  const handleRefund = async (id: string) => {
    if (!confirm("确认退款吗？退款后订单将变为「已退款」，费用将退回来访（模拟支付未实际扣款）。")) return;
    const res = await request(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "refunded" }),
    });
    if (res.ok) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "refunded" } : b));
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.message ?? "退款失败，请稍后重试");
    }
  };

  // 联系来访：获取/创建与该来访的私信会话并跳转
  const [contactingId, setContactingId] = useState<string | null>(null);
  const handleContact = async (b: Booking) => {
    if (!b.client?.id || contactingId) return;
    setContactingId(b.id);
    try {
      const res = await request("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: b.client.id }),
      });
      const conv = await res.json().catch(() => null);
      if (res.ok && conv?.id) router.push(`/chat/${conv.id}`);
    } finally {
      setContactingId(null);
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
            {displayed.map(b => <BookingCard key={b.id} b={b} onUpdate={handleUpdate} onConfirm={openConfirm} onReschedule={setRescheduleBooking} onDirectReschedule={setShowDirectReschedule} onContact={handleContact} onRefund={handleRefund} />)}
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
                await request(`/api/bookings/${rescheduleBooking.id}/reschedule`, {
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
                await request(`/api/bookings/${rescheduleBooking.id}/reschedule`, {
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

      {/* 确认预约弹窗：告知咨询设置 + 发送咨询链接 + 可改时间 */}
      {confirmBooking && (() => {
        const WEEKDAY = ["日","一","二","三","四","五","六"];
        const days = Array.from({ length: 14 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() + i + 1);
          return { iso: localDateStr(d), label: `${d.getMonth()+1}/${d.getDate()}`, weekday: `周${WEEKDAY[d.getDay()]}` };
        });
        const TIME_SLOTS = ["09:00","10:00","11:00","14:00","15:00","16:00","19:00","20:00"];
        const needTime = !!confirmBooking.adjustRequest;
        const timePicked = !!(cSelDay && cSelTime);
        const canSubmit = confirming ? false : (needTime ? timePicked : true);

        return (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/50" onClick={() => !confirming && setConfirmBooking(null)} />
            <div className="relative bg-[var(--color-bg)] rounded-t-3xl px-5 pt-5 pb-10 z-10 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-[#2C2420]">确认预约</h3>
                <button onClick={() => setConfirmBooking(null)} className="w-8 h-8 rounded-full bg-[#EBE7DF] flex items-center justify-center text-[#5A4E44]">×</button>
              </div>

              {/* 订单摘要 */}
              <div className="rounded-2xl p-3.5 mb-4" style={{ background: "#F8F5F0" }}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: "#9B8E82" }}>来访者</span>
                  <span className="font-semibold" style={{ color: "#2C2420" }}>
                    {confirmBooking.applicationForm?.name || confirmBooking.client?.name || confirmBooking.client?.email?.split("@")[0] || "来访者"}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: "#9B8E82" }}>费用（已支付）</span>
                  <span className="font-semibold" style={{ color: "#2C2420" }}>¥{confirmBooking.priceAmount}</span>
                </div>
                {confirmBooking.adjustRequest ? (
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: "#EBE7DF" }}>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: "#D97706" }}>时间调剂申请</p>
                    <p className="text-xs whitespace-pre-wrap" style={{ color: "#5A4E44" }}>{confirmBooking.adjustRequest.message}</p>
                    <p className="text-xs mt-1" style={{ color: "#9B8E82" }}>需在下方为本次咨询指定时间</p>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "#9B8E82" }}>预约时间</span>
                    <span className="font-semibold" style={{ color: "#2C2420" }}>
                      {new Date(confirmBooking.scheduledAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
              </div>

              {/* 时间选择（调剂申请必选；常规预约可改） */}
              <p className="text-sm font-semibold text-[#2C2420] mb-1.5">
                咨询时间 {needTime ? <span style={{ color: "#E87070" }}>*</span> : <span className="text-xs font-normal text-[#9B8E82]">（不选则按预约时间）</span>}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
                {days.map(d => (
                  <button key={d.iso} onClick={() => { setCSelDay(d.iso); setCSelTime(""); }}
                    className="flex-none flex flex-col items-center px-3 py-2 rounded-2xl text-xs font-medium"
                    style={{ background: cSelDay===d.iso ? "var(--color-primary)" : "white", color: cSelDay===d.iso ? "white" : "#5A4E44", border:`1px solid ${cSelDay===d.iso ? "var(--color-primary)" : "#EBE7DF"}`, minWidth:52 }}>
                    <span>{d.weekday}</span><span className="mt-0.5">{d.label}</span>
                  </button>
                ))}
              </div>
              {cSelDay && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {TIME_SLOTS.map(t => (
                    <button key={t} onClick={() => setCSelTime(t)}
                      className="py-2 rounded-xl text-sm font-medium"
                      style={{ background: cSelTime===t ? "var(--color-primary)" : "#F5F0EA", color: cSelTime===t ? "white" : "#2C2420" }}>
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {/* 咨询说明 + 咨询链接 */}
              <p className="text-sm font-semibold text-[#2C2420] mb-1.5">告知来访者咨询设置</p>
              <textarea value={cNote} onChange={e => setCNote(e.target.value)} rows={2}
                placeholder="例如：咨询将使用腾讯会议，请提前 5 分钟进入，找安静环境…"
                className="w-full rounded-xl px-3 py-2.5 text-sm border mb-3"
                style={{ background: "#F8F5F0", borderColor: "#DDD8D0", resize: "none", color: "#2C2420" }} />
              <p className="text-sm font-semibold text-[#2C2420] mb-1.5">
                咨询链接 <span className="text-xs font-normal text-[#9B8E82]">（腾讯会议 / Zoom 等，选填）</span>
              </p>
              <input value={cLink} onChange={e => setCLink(e.target.value)}
                placeholder="https://meeting.tencent.com/..."
                className="w-full rounded-xl px-3 py-2.5 text-sm border mb-4"
                style={{ background: "#F8F5F0", borderColor: "#DDD8D0", color: "#2C2420" }} />

              {confirmError && <p className="text-xs text-red-500 mb-3">{confirmError}</p>}

              <button onClick={handleConfirm} disabled={!canSubmit}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}>
                {confirming ? "确认中…" : "确认预约并通知来访者"}
              </button>
            </div>
          </div>
        );
      })()}

      {/* 咨询师直接改期抽屉（直接生效，无需来访确认） */}
      {showDirectReschedule && (() => {
        const WEEKDAY = ["日","一","二","三","四","五","六"];
        const days = Array.from({ length: 14 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() + i + 1);
          return { iso: localDateStr(d), label: `${d.getMonth()+1}/${d.getDate()}`, weekday: `周${WEEKDAY[d.getDay()]}` };
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
