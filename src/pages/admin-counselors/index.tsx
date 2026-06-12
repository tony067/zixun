import { useState, useEffect, useRef } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Input, ScrollView, Image, Swiper, SwiperItem, Textarea } from '@tarojs/components'
import { request } from '../../api/request'
import { useAuthStore } from '../../store/authStore'

import { useState, useEffect } from "react";

type Counselor = {
  id: string; displayName: string; counselorTypes: string[] | null;
  location: string | null; status: string; createdAt: string;
  bio: string | null; qualifications: {id:string;value:string}[] | null;
};

const STATUS_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  pending:  { bg: "#FEF3C7", text: "#D97706", label: "待审核" },
  approved: { bg: "#DCFCE7", text: "#16A34A", label: "已通过" },
  rejected: { bg: "#FEE2E2", text: "#DC2626", label: "已拒绝" },
  active:   { bg: "#DCFCE7", text: "#16A34A", label: "已上线" },
};

export default function AdminCounselorsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"pending"|"approved"|"rejected">("pending");
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Counselor | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    setLoading(true);
    request(`/api/admin/counselors?status=${tab}&t=${Date.now()}`)
      .then(d => { setCounselors(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tab]);

  const approve = async (id: string) => {
    await request(`/api/admin/counselors/${id}`, { method: "PATCH", body: JSON.stringify({ action: "approve" }) });
    setCounselors(c => c.filter(x => x.id !== id));
    setSelected(null);
  };
  const reject = async (id: string) => {
    await request(`/api/admin/counselors/${id}`, { method: "PATCH", body: JSON.stringify({ action: "reject", reason: rejectReason }) });
    setCounselors(c => c.filter(x => x.id !== id));
    setSelected(null); setShowReject(false); setRejectReason("");
  };

  return (
    <View className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      {/* 顶栏 */}
      <View className="flex items-center gap-3 px-4 pt-12 pb-4">
        <View onClick={() => Taro.navigateTo({url: '/pages/admin-overview/index'})} className="p-1.5 rounded-full" style={{ background: "#EBE7DF" }}>
          <Text>←</Text>
        </View>
        <Text className="text-base font-bold" style={{ color: "#2C2420" }}>咨询师审核</Text>
      </View>

      {/* Tab */}
      <View className="flex px-4 gap-2 mb-4">
        {(["pending","approved","rejected"] as const).map(t => (
          <View key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-full text-sm font-medium"
            style={{ background: tab === t ? "var(--color-primary)" : "#EBE7DF",
              color: tab === t ? "white" : "#5A4E44" }}>
            {t === "pending" ? "待审核" : t === "approved" ? "已通过" : "已拒绝"}
          </View>
        ))}
      </View>

      {/* 列表 */}
      <View className="px-4 space-y-3 pb-10">
        {loading && <Text className="text-center text-sm py-10" style={{ color: "#9B8E82" }}>加载中…</Text>}
        {!loading && counselors.length === 0 && (
          <Text className="text-center text-sm py-10" style={{ color: "#9B8E82" }}>暂无记录</Text>
        )}
        {counselors.map(c => {
          const st = STATUS_COLOR[c.status ?? "pending"] ?? STATUS_COLOR.pending;
          return (
            <View key={c.id} onClick={() => Taro.navigateTo({url: '/pages/admin-overview/index?id=counselors/${c.id}'})}
              className="rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
              style={{ background: "white", border: "1px solid #EBE7DF" }}>
              <View className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold text-white flex-none"
                style={{ background: "var(--color-primary)" }}>{(c.displayName || "?")[0]}</View>
              <View className="flex-1 min-w-0">
                <View className="flex items-center gap-2 mb-0.5">
                  <Text className="text-sm font-bold" style={{ color: "#2C2420" }}>{c.displayName || "未填写"}</Text>
                  <Text className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.text }}>{st.label}</Text>
                </View>
                <Text className="text-xs" style={{ color: "#9B8E82" }}>
                  {(c.counselorTypes ?? []).join(" · ")} {c.location ? `· ${c.location}` : ""}
                </Text>
                <Text className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>
                  申请时间：{new Date(c.createdAt).toLocaleDateString("zh-CN")}
                </Text>
              </View>
              <Text>›</Text>
            </View>
          );
        })}
      </View>

      {/* 详情弹窗 */}
      {selected && (
        <View className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => { setSelected(null); setShowReject(false); }}>
          <View className="rounded-t-3xl px-5 pt-6 pb-10 overflow-y-auto" style={{ background: "var(--color-bg)", maxHeight: "85vh" }}
            onClick={e => e.stopPropagation()}>
            <View className="flex items-center justify-between mb-4">
              <Text className="text-base font-bold" style={{ color: "#2C2420" }}>{selected.displayName}</Text>
              <View onClick={() => setSelected(null)} className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#EBE7DF", color: "#5A4E44", fontSize: 18 }}>×</View>
            </View>
            <View className="space-y-3 mb-6">
              <View className="rounded-xl p-3" style={{ background: "#F8F5F0" }}>
                <Text className="text-xs mb-1" style={{ color: "#9B8E82" }}>咨询师类别</Text>
                <Text className="text-sm" style={{ color: "#2C2420" }}>{(selected.counselorTypes ?? []).join("、") || "未填写"}</Text>
              </View>
              <View className="rounded-xl p-3" style={{ background: "#F8F5F0" }}>
                <Text className="text-xs mb-1" style={{ color: "#9B8E82" }}>个人简介</Text>
                <Text className="text-sm" style={{ color: "#2C2420" }}>{selected.bio || "未填写"}</Text>
              </View>
              <View className="rounded-xl p-3" style={{ background: "#F8F5F0" }}>
                <Text className="text-xs mb-1" style={{ color: "#9B8E82" }}>从业资质</Text>
                {(selected.qualifications ?? []).map((q, i) => (
                  <Text key={i} className="text-sm" style={{ color: "#2C2420" }}>• {q.value}</Text>
                ))}
                {(selected.qualifications ?? []).length === 0 && <Text className="text-sm" style={{ color: "#9B8E82" }}>未填写</Text>}
              </View>
            </View>
            {tab === "pending" && !showReject && (
              <View className="flex gap-3">
                <View onClick={() => setShowReject(true)}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                  style={{ background: "#FEE2E2", color: "#DC2626" }}>
                  <Text>✕</Text> 驳回
                </View>
                <View onClick={() => approve(selected.id)}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 text-white"
                  style={{ background: "var(--color-primary)" }}>
                  <Text>✓</Text> 通过
                </View>
              </View>
            )}
            {tab === "pending" && showReject && (
              <View>
                <Text className="text-sm font-medium mb-2" style={{ color: "#2C2420" }}>驳回原因</Text>
                <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  rows={3} placeholder="请填写驳回原因，将通知到咨询师…"
                  className="w-full rounded-xl px-3 py-2.5 text-sm border mb-3"
                  style={{ background: "#F8F5F0", borderColor: "#DDD8D0", color: "#2C2420", resize: "none" }} />
                <View className="flex gap-3">
                  <View onClick={() => setShowReject(false)}
                    className="flex-1 py-3 rounded-2xl text-sm font-medium"
                    style={{ background: "#EBE7DF", color: "#5A4E44" }}>取消</View>
                  <View onClick={() => reject(selected.id)} disabled={!rejectReason.trim()}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                    style={{ background: rejectReason.trim() ? "#DC2626" : "#C4BDB5" }}>确认驳回</View>
                </View>
              </View>
            )}
            {tab === "approved" && (
              <View onClick={() => approve(selected.id)}
                className="w-full py-3 rounded-2xl text-sm font-bold text-white"
                style={{ background: "#DC2626" }}>下架该咨询师</View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
