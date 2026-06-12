import { useState, useEffect, useRef } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Input, ScrollView, Image, Swiper, SwiperItem, Textarea } from '@tarojs/components'
import { request } from '../../api/request'
import { useAuthStore } from '../../store/authStore'

import { useState, useEffect } from "react";

type Booking = {
  id: string; status: string; scheduledAt: string | null;
  priceAmount: number | null; sessionMode: string | null;
  sessionNumber: number | null; durationMinutes: number | null;
  createdAt: string | null; rescheduleStatus: string | null;
  counselor: { id: string; displayName: string | null } | null;
  client: { id: string; name: string | null; email: string | null } | null;
};

const STATUS_OPTS = [
  { key: "all", label: "全部" },
  { key: "pending_confirmation", label: "待确认" },
  { key: "pending_payment", label: "待支付" },
  { key: "paid", label: "待咨询" },
  { key: "completed", label: "已完成" },
  { key: "cancelled", label: "已取消" },
];

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  pending_confirmation: { bg: "#FEF3C7", text: "#D97706", label: "待确认" },
  pending_payment:      { bg: "#EFF6FF", text: "#2563EB", label: "待支付" },
  paid:                 { bg: "#F0FDF4", text: "#16A34A", label: "待咨询" },
  completed:            { bg: "#F5F0EA", text: "#6B7280", label: "已完成" },
  cancelled:            { bg: "#FEE2E2", text: "#DC2626", label: "已取消" },
  rejected:             { bg: "#FEE2E2", text: "#DC2626", label: "已拒绝" },
};

export default function AdminOrdersScreen() {
  const router = useRouter();
  const [tab, setTab] = useState("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [processing, setProcessing] = useState(false);

  const load = () => {
    setLoading(true);
    const qs = tab !== "all" ? "?status="+tab : "";
    request("/api/admin/orders"+qs)
      .then(d => setBookings(Array.isArray(d) ? d : Array.isArray(d.bookings) ? d.bookings : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab]);

  const handleAction = async (id: string, status: string) => {
    setProcessing(true);
    await request("/api/bookings/"+id, { method: "PATCH", body: JSON.stringify({ status }) });
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
    setProcessing(false);
  };

  const fmt = (s: string | null) => {
    if (!s) return "—";
    const d = new Date(s);
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
  };

  const st = (status: string) => STATUS_MAP[status] ?? { bg: "#F5F0EA", text: "#9B8E82", label: status };

  return (
    <View className="min-h-screen pb-24" style={{ background: "var(--color-bg)" }}>
      <View className="px-5 pt-12 pb-3">
        <Text className="text-xl font-bold" style={{ color: "#2C2420" }}>订单管理</Text>
        <Text className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>共 {bookings.length} 笔</Text>
      </View>
      <View className="flex gap-2 px-4 overflow-x-auto pb-3">
        {STATUS_OPTS.map(opt => (
          <View key={opt.key} onClick={() => setTab(opt.key)}
            className="flex-none px-3.5 py-1.5 rounded-full text-xs font-medium"
            style={{ background: tab===opt.key?"var(--color-primary)":"#EBE7DF", color: tab===opt.key?"white":"#5A4E44" }}>
            {opt.label}
          </View>
        ))}
      </View>
      <View className="px-4 space-y-3">
        {loading ? (
          <View className="text-center py-16 text-sm" style={{ color: "#9B8E82" }}>加载中…</View>
        ) : bookings.length === 0 ? (
          <View className="text-center py-16 text-sm" style={{ color: "#9B8E82" }}>暂无订单</View>
        ) : bookings.map(b => {
          const s = st(b.status);
          return (
            <View key={b.id} onClick={() => router.push("/admin/orders/"+b.id)} className="w-full text-left rounded-2xl p-4"
              style={{ background: "white", border: "1px solid #EBE7DF" }}>
              <View className="flex items-start justify-between mb-2">
                <View>
                  <Text className="text-sm font-semibold" style={{ color: "#2C2420" }}>
                    {b.client?.name ?? "来访者"} → {b.counselor?.displayName ?? "咨询师"}
                  </Text>
                  <Text className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{fmt(b.scheduledAt)}</Text>
                </View>
                <Text className="text-xs px-2.5 py-1 rounded-full font-medium flex-none ml-2"
                  style={{ background: s.bg, color: s.text }}>{s.label}</Text>
              </View>
              <View className="flex items-center justify-between">
                <Text className="text-xs" style={{ color: "#9B8E82" }}>
                  {b.sessionMode} · {b.durationMinutes ?? 50}分钟
                  {b.rescheduleStatus === "pending" && <Text className="ml-2 text-orange-500"> ● 改期申请</Text>}
                </Text>
                <Text className="text-sm font-bold" style={{ color: "#2C2420" }}>¥{b.priceAmount ?? "—"}</Text>
              </View>
            </View>
          );
        })}
      </View>
      {selected && (
        <View className="fixed inset-0 z-50 flex flex-col justify-end">
          <View className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setSelected(null)} />
          <View className="relative rounded-t-3xl px-5 pt-5 pb-10 max-h-[88vh] overflow-y-auto" style={{ background: "var(--color-bg)", zIndex: 1 }}>
            <View className="flex items-center justify-between mb-4">
              <Text className="text-base font-bold" style={{ color: "#2C2420" }}>订单详情</Text>
              <View onClick={() => setSelected(null)} className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#EBE7DF", color: "#5A4E44", fontSize: 18 }}>×</View>
            </View>
            <View className="rounded-xl px-3 py-2 mb-4" style={{ background: st(selected.status).bg }}>
              <Text className="text-sm font-semibold" style={{ color: st(selected.status).text }}>{st(selected.status).label}</Text>
              {selected.rescheduleStatus === "pending" && <Text className="text-xs ml-2 text-orange-600">● 有改期申请</Text>}
            </View>
            <View className="space-y-3 mb-4">
              {[
                { icon: User, label: "来访者", primary: selected.client?.name ?? "—", secondary: selected.client?.email ?? "—" },
                { icon: User, label: "咨询师", primary: selected.counselor?.displayName ?? "—", secondary: null },
              ].map(({ icon: Icon, label, primary, secondary }) => (
                <View key={label} className="rounded-xl p-3" style={{ background: "white", border: "1px solid #EBE7DF" }}>
                  <View className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                    <Text className="text-xs font-semibold" style={{ color: "#9B8E82" }}>{label}</Text>
                  </View>
                  <Text className="text-sm font-bold" style={{ color: "#2C2420" }}>{primary}</Text>
                  {secondary && <Text className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{secondary}</Text>}
                </View>
              ))}
              <View className="rounded-xl p-3" style={{ background: "white", border: "1px solid #EBE7DF" }}>
                <View className="flex items-center gap-2 mb-2">
                  <Text>⏱</Text>
                  <Text className="text-xs font-semibold" style={{ color: "#9B8E82" }}>咨询信息</Text>
                </View>
                {[
                  ["时间", fmt(selected.scheduledAt)],
                  ["方式", selected.sessionMode ?? "—"],
                  ["时长", (selected.durationMinutes ?? 50)+"分钟"],
                  ["第几次", "第"+(selected.sessionNumber ?? 1)+"次"],
                ].map(([k,v]) => (
                  <View key={k} className="flex justify-between text-sm py-0.5">
                    <Text style={{ color: "#9B8E82" }}>{k}</Text>
                    <Text style={{ color: "#2C2420" }}>{v}</Text>
                  </View>
                ))}
              </View>
              <View className="rounded-xl p-3" style={{ background: "white", border: "1px solid #EBE7DF" }}>
                <View className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                  <Text className="text-xs font-semibold" style={{ color: "#9B8E82" }}>费用与订单</Text>
                </View>
                {[
                  ["咨询费用", "¥"+(selected.priceAmount ?? "—")],
                  ["订单编号", selected.id.slice(0,20)+"…"],
                  ["创建时间", fmt(selected.createdAt)],
                ].map(([k,v]) => (
                  <View key={k} className="flex justify-between text-sm py-0.5">
                    <Text style={{ color: "#9B8E82" }}>{k}</Text>
                    <Text style={{ color: "#2C2420" }}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View className="space-y-2">
              {selected.status === "pending_confirmation" && (
                <View className="flex gap-2">
                  <View onClick={() => handleAction(selected.id, "rejected")} disabled={processing}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold" style={{ background: "#FEE2E2", color: "#DC2626" }}>拒绝</View>
                  <View onClick={() => handleAction(selected.id, "pending_payment")} disabled={processing}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold text-white" style={{ background: "var(--color-primary)" }}>确认预约</View>
                </View>
              )}
              {selected.status === "paid" && (
                <View onClick={() => handleAction(selected.id, "completed")} disabled={processing}
                  className="w-full py-3 rounded-2xl text-sm font-bold text-white" style={{ background: "var(--color-primary)" }}>标记已完成</View>
              )}
              {!["cancelled","completed","rejected"].includes(selected.status) && (
                <View onClick={() => handleAction(selected.id, "cancelled")} disabled={processing}
                  className="w-full py-3 rounded-2xl text-sm font-bold" style={{ background: "#FEE2E2", color: "#DC2626" }}>取消订单</View>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
