import { useState, useEffect, useRef } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Input, ScrollView, Image, Swiper, SwiperItem, Textarea } from '@tarojs/components'
import { request } from '../../api/request'
import { useAuthStore } from '../../store/authStore'

import { useState, useEffect } from "react";

type Booking = {
  id: string; status: string; scheduledAt: string; durationMinutes: number;
  sessionMode: string; priceAmount: number; clientNote: string | null;
  client: { id: string; name: string | null; email: string | null } | null;
  rescheduleStatus: string | null;
  rescheduleNewTime: string | null;
  rescheduleReason: string | null;
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

function BookingCard({ b, onUpdate, onReschedule, onDirectReschedule }: { b: Booking; onUpdate: (id: string, status: string) => void; onReschedule?: (b: Booking) => void; onDirectReschedule?: (id: string) => void }) {
  const dt = new Date(b.scheduledAt);
  const dateStr = dt.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });
  const timeStr = dt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  const st = STATUS_STYLE[b.status] ?? { color: "#6B7280", bg: "#F3F4F6" };
  const clientName = b.client?.name || b.client?.email?.split("@")[0] || "来访者";

  return (
    <View}}} layout
      className="rounded-3xl p-5 border border-[var(--color-border)]"
      style={{ background: "var(--color-card)" }}
    >
      {/* 顶部：来访者 + 状态 */}
      <View className="flex items-start justify-between mb-3">
        <View className="flex items-center gap-3">
          <View className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold"
            style={{ background: "var(--color-secondary)", color: "var(--color-text-secondary)" }}>
            {clientName[0]}
          </View>
          <View>
            <View className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{clientName}</View>
            {b.clientNote && (
              <View className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--color-text-muted)" }}>{b.clientNote}</View>
            )}
          </View>
        </View>
        <Text className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ color: st.color, background: st.bg }}>
          {STATUS_LABEL[b.status] ?? b.status}
        </Text>
      </View>

      {/* 时间 + 方式 */}
      <View className="flex items-center gap-4 text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
        <Text className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {dateStr}
        </Text>
        <Text className="flex items-center gap-1.5">
          <Text>⏱</Text>
          {timeStr} · {b.durationMinutes}分钟
        </Text>
        <Text className="flex items-center gap-1.5">
          {b.sessionMode?.includes("视频") ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
          {b.sessionMode}
        </Text>
      </View>

      {/* 金额 + 操作 */}
      <View className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
        <Text className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>¥{b.priceAmount}</Text>
        <View className="flex gap-2">
          {b.status === "pending_confirmation" && (<>
            <View} onClick={() => onUpdate(b.id, "rejected")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface)" }}>
              <Text>✕</Text>拒绝
            </View>
            <View} onClick={() => onUpdate(b.id, "confirmed")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-white"
              style={{ background: "var(--color-primary)" }}>
              <Text>✓</Text>接受
            </View>
          </>)}
          {(b.status === "confirmed" || b.status === "pending_payment") && (
            <View} onClick={() => onUpdate(b.id, "cancelled")}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface)" }}>
              取消预约
            </View>
          )}
          {b.status === "paid" && (<>
            <View}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface)" }}>
              <Text>💬</Text>私信
            </View>
            <View}
              onClick={() => onDirectReschedule && onDirectReschedule(b.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border"
              style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)", background: "white" }}>
              修改时间
            </View>
            <View} onClick={() => onUpdate(b.id, "completed")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-white"
              style={{ background: "var(--color-primary)" }}>
              <Text>✓</Text>标记完成
            </View>
            {b.rescheduleStatus === "pending" && (
              <View} onClick={() => onReschedule && onReschedule(b)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium"
                style={{ background: "#FEF3C7", color: "#D97706" }}>
                改期申请
              </View>
            )}
          </>)}
        </View>
      </View>
    </View>
  );
}

export default function CounselorBookingsScreen() {
  const { user } = useAuthStore() => s.auth.user);
  const loadingAuth = useEazo((s) => s.auth.loading);
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
    request("/api/counselor/bookings")
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
      <View className="min-h-svh flex items-center justify-center px-6" style={{ background: "var(--color-surface)" }}>
        <View className="text-center">
          <Text className="text-base font-medium mb-4" style={{ color: "var(--color-text-primary)" }}>请先登录</Text>
          <View onClick={() => Taro.showToast({title: '请先登录', icon: 'none'})} className="px-6 py-2.5 rounded-2xl text-white text-sm font-medium"
            style={{ background: "var(--color-primary)" }}>登录</View>
        </View>
      </View>
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
    <View className="min-h-svh pb-28" style={{ background: "var(--color-surface)" }}>
      {/* 顶部标题 */}
      <View className="px-5 pt-14 pb-4" style={{ background: "var(--color-surface)" }}>
        <Text className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>预约管理</Text>
      </View>

      {/* 4个平铺 Tab */}
      <View className="flex gap-1.5 px-5 mb-4">
        {STATUS_OPTIONS.map(opt => (
          <View key={opt.key} onClick={() => { setSelectedKey(opt.key); markSeen(opt.key, counts[opt.key] ?? 0); }}
            className="flex-1 flex flex-col items-center py-2.5 rounded-2xl text-xs font-semibold transition-all relative"
            style={{
              background: selectedKey === opt.key ? "var(--color-primary)" : "var(--color-card)",
              color:      selectedKey === opt.key ? "white" : "var(--color-text-secondary)",
              border:     selectedKey === opt.key ? "none" : "1px solid var(--color-border)",
            }}>
            {opt.label}
            {counts[opt.key] > 0 && counts[opt.key] > (seenTabs[opt.key] ?? 0) && (
              <Text className="absolute -top-1.5 -right-1 text-[10px] w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: opt.dot }}>{counts[opt.key]}</Text>
            )}
          </View>
        ))}
      </View>

      {/* 预约列表 */}
      <View className="px-5 space-y-3">
        {loading ? (
          <>{[1,2,3].map(i => <View key={i} className="h-40 rounded-3xl skeleton" />)}</>
        ) : displayed.length === 0 ? (
          <View className="text-center py-20">
            <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
            <Text className="text-sm" style={{ color: "var(--color-text-secondary)" }}>暂无{currentOpt.label}预约</Text>
          </View>
        ) : (
          <View>
            {displayed.map(b => <BookingCard key={b.id} b={b} onUpdate={handleUpdate} onReschedule={setRescheduleBooking} onDirectReschedule={setShowDirectReschedule} />)}
          </View>
        )}
      </View>

      {/* 改期确认弹窗 */}
      {rescheduleBooking && (
        <View className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setRescheduleBooking(null)}>
          <View className="rounded-t-3xl px-5 pt-6 pb-10" style={{ background: "var(--color-bg)" }}
            onClick={e => e.stopPropagation()}>
            <View className="flex items-center justify-between mb-4">
              <Text className="text-base font-bold" style={{ color: "#2C2420" }}>来访改期申请</Text>
              <View onClick={() => setRescheduleBooking(null)} className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#EBE7DF", color: "#5A4E44", fontSize: 18 }}>×</View>
            </View>
            <View className="rounded-xl p-3 mb-4" style={{ background: "#F8F5F0" }}>
              <Text className="text-xs mb-1" style={{ color: "#9B8E82" }}>申请改到</Text>
              <Text className="text-sm font-bold" style={{ color: "#2C2420" }}>
                {rescheduleBooking.rescheduleNewTime
                  ? new Date(rescheduleBooking.rescheduleNewTime).toLocaleString("zh-CN", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" })
                  : "未指定"}
              </Text>
              {rescheduleBooking.rescheduleReason && (
                <Text className="text-xs mt-1" style={{ color: "#9B8E82" }}>原因：{rescheduleBooking.rescheduleReason}</Text>
              )}
            </View>
            <Text className="text-sm font-medium mb-2" style={{ color: "#2C2420" }}>回复（可选）</Text>
            <Textarea value={rescheduleNote} onChange={e => setRescheduleNote(e.target.value)}
              rows={2} placeholder="可附上确认说明或说明无法接受的原因…"
              className="w-full rounded-xl px-3 py-2.5 text-sm border mb-4"
              style={{ background: "#F8F5F0", borderColor: "#DDD8D0", resize: "none", color: "#2C2420" }} />
            <View className="flex gap-3">
              <View onClick={async () => {
                await request(`/api/bookings/\${rescheduleBooking.id}/reschedule`, {
                  method: "PATCH",
                  body: JSON.stringify({ action: "reject", note: rescheduleNote }),
                });
                setBookings(prev => prev.map(b => b.id === rescheduleBooking.id ? { ...b, rescheduleStatus: "rejected" } : b));
                setRescheduleBooking(null); setRescheduleNote("");
              }} className="flex-1 py-3 rounded-2xl text-sm font-bold"
                style={{ background: "#FEE2E2", color: "#DC2626" }}>
                拒绝改期
              </View>
              <View onClick={async () => {
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
              </View>
            </View>
          </View>
        </View>
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
          <View className="fixed inset-0 z-50 flex flex-col justify-end">
            <View className="absolute inset-0 bg-black/50" onClick={() => setShowDirectReschedule(null)} />
            <View className="relative bg-[var(--color-bg)] rounded-t-3xl px-5 pt-5 pb-10 z-10 max-h-[80vh] overflow-y-auto">
              <View className="flex items-center justify-between mb-3">
                <Text className="text-base font-bold text-[#2C2420]">修改咨询时间</Text>
                <View onClick={() => setShowDirectReschedule(null)} className="w-8 h-8 rounded-full bg-[#EBE7DF] flex items-center justify-center text-[#5A4E44]">×</View>
              </View>
              <Text className="text-xs text-[#9B8E82] mb-4">选择新时间后直接生效，来访端将显示更新后的时间。</Text>
              <View className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                {days.map(d => (
                  <View key={d.iso} onClick={() => { setDSelDay(d.iso); setDSelTime(""); }}
                    className="flex-none flex flex-col items-center px-3 py-2 rounded-2xl text-xs font-medium"
                    style={{ background: dSelDay===d.iso ? "var(--color-primary)" : "white", color: dSelDay===d.iso ? "white" : "#5A4E44", border:`1px solid ${dSelDay===d.iso ? "var(--color-primary)" : "#EBE7DF"}`, minWidth:52 }}>
                    <Text>{d.weekday}</Text><Text className="mt-0.5">{d.label}</Text>
                  </View>
                ))}
              </View>
              {dSelDay && (
                <View className="grid grid-cols-4 gap-2 mb-4">
                  {TIME_SLOTS.map(t => (
                    <View key={t} onClick={() => setDSelTime(t)}
                      className="py-2 rounded-xl text-sm font-medium"
                      style={{ background: dSelTime===t ? "var(--color-primary)" : "#F5F0EA", color: dSelTime===t ? "white" : "#2C2420" }}>
                      {t}
                    </View>
                  ))}
                </View>
              )}
              {dSelDay && dSelTime && (
                <View className="mb-4 px-3 py-2.5 rounded-xl bg-[#E4F0DC]">
                  <Text className="text-sm text-[#3A6228] font-medium">新时间：{days.find(d=>d.iso===dSelDay)?.weekday} {days.find(d=>d.iso===dSelDay)?.label} {dSelTime}</Text>
                </View>
              )}
              <View onClick={handleDirectSubmit} disabled={!dSelDay || !dSelTime || submittingDirect}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}>
                {submittingDirect ? "更新中…" : "确认修改（直接生效）"}
              </View>
            </View>
          </View>
        );
      })()}
    </View>
  );
}
