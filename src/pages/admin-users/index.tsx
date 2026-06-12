import { useState, useEffect, useRef } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Input, ScrollView, Image, Swiper, SwiperItem, Textarea } from '@tarojs/components'
import { request } from '../../api/request'
import { useAuthStore } from '../../store/authStore'

import { useState, useEffect } from "react";

const MOCK_USERS = [
  { id: "u001", name: "张婧", email: "zhang@example.com", role: "client", bookings: 3, joined: "2026-03-12", status: "active", phone: "138****1234" },
  { id: "u002", name: "王明浩", email: "wang@example.com", role: "client", bookings: 1, joined: "2026-04-05", status: "active", phone: "139****5678" },
  { id: "u003", name: "李晓月", email: "li@example.com", role: "client", bookings: 7, joined: "2026-01-20", status: "active", phone: "137****9012" },
  { id: "u006", name: "刘海涛", email: "liu@example.com", role: "client", bookings: 0, joined: "2026-05-28", status: "banned", phone: "136****3456" },
  { id: "u004", name: "陈晓雯", email: "chen@example.com", role: "counselor", bookings: 42, joined: "2026-02-01", status: "active", phone: "135****7890" },
  { id: "u005", name: "林诗涵", email: "lin@example.com", role: "counselor", bookings: 31, joined: "2026-02-15", status: "active", phone: "134****2345" },
];

type User = typeof MOCK_USERS[0];

export default function AdminUsersScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"client" | "counselor">("client");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [users, setUsers] = useState(MOCK_USERS);

  const filtered = users
    .filter(u => u.role === tab)
    .filter(u => !search || u.name.includes(search) || u.email.includes(search));

  const toggleBan = (u: User) => {
    const next = { ...u, status: u.status === "active" ? "banned" : "active" };
    setUsers(prev => prev.map(x => x.id === u.id ? next : x));
    setSelected(next);
  };

  return (
    <View className="min-h-screen pb-24" style={{ background: "var(--color-bg)" }}>
      {/* 顶栏 */}
      <View className="sticky top-0 z-10 px-4 pt-12 pb-3"
        style={{ background: "rgba(245,240,232,0.96)", backdropFilter: "blur(8px)", borderBottom: "1px solid #EBE7DF" }}>
        <View className="flex items-center gap-3 mb-3">
          <View onClick={() => Taro.navigateBack()} className="p-1.5 rounded-full" style={{ background: "#EBE7DF" }}>
            <Text>←</Text>
          </View>
          <Text className="text-base font-bold" style={{ color: "#2C2420" }}>用户管理</Text>
        </View>
        {/* Tab */}
        <View className="flex gap-2 mb-3">
          {[["client","来访者"],["counselor","咨询师"]].map(([k,label]) => (
            <View key={k} onClick={() => setTab(k as "client"|"counselor")}
              className="px-5 py-1.5 rounded-full text-sm font-medium"
              style={{ background: tab===k ? "var(--color-primary)" : "#EBE7DF", color: tab===k ? "white" : "#5A4E44" }}>
              {label}
            </View>
          ))}
        </View>
        {/* 搜索 */}
        <View className="flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: "white", border: "1px solid #EBE7DF" }}>
          <Text>🔍</Text>
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索姓名或邮箱…" className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: "#2C2420" }} />
        </View>
      </View>

      {/* 用户列表 */}
      <View className="px-4 pt-3 space-y-2">
        {filtered.map(u => (
          <View key={u.id} onClick={() => router.push("/admin/users/"+u.id)}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left"
            style={{ background: "white", border: "1px solid #EBE7DF" }}>
            <View className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-none"
              style={{ background: u.status === "banned" ? "#D1D5DB" : "var(--color-primary)" }}>
              {u.name[0]}
            </View>
            <View className="flex-1 min-w-0">
              <View className="flex items-center gap-2">
                <Text className="text-sm font-semibold" style={{ color: "#2C2420" }}>{u.name}</Text>
                {u.status === "banned" && (
                  <Text className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "#FEE2E2", color: "#DC2626" }}>已封禁</Text>
                )}
              </View>
              <Text className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{u.email}</Text>
              <Text className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>
                {u.role === "client" ? `预约 ${u.bookings} 次` : `完成 ${u.bookings} 次咨询`} · 加入 {u.joined}
              </Text>
            </View>
            <Text style={{ color: "#C4BDB5", fontSize: 18 }}>›</Text>
          </View>
        ))}
        {filtered.length === 0 && (
          <Text className="text-center py-12 text-sm" style={{ color: "#9B8E82" }}>没有符合条件的用户</Text>
        )}
      </View>

      {/* 用户详情弹窗 → 改为底部完整面板 */}
      {mounted && selected && 
        <View style={{ position:"fixed", inset:0, zIndex:99999, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}
          onClick={() => setSelected(null)}>
          <View style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)" }} />
          <View className="relative rounded-t-3xl px-5 pt-5 pb-10"
            style={{ background: "var(--color-bg)", zIndex: 1, maxHeight: "80vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            {/* 头部 */}
            <View className="flex items-center justify-between mb-4">
              <View className="flex items-center gap-3">
                <View className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white"
                  style={{ background: selected.status === "banned" ? "#D1D5DB" : "var(--color-primary)" }}>
                  {selected.name[0]}
                </View>
                <View>
                  <View className="flex items-center gap-2">
                    <Text className="text-base font-bold" style={{ color: "#2C2420" }}>{selected.name}</Text>
                    {selected.status === "banned" && (
                      <Text className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "#FEE2E2", color: "#DC2626" }}>已封禁</Text>
                    )}
                  </View>
                  <Text className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>
                    {selected.role === "client" ? "来访者" : "咨询师"}
                  </Text>
                </View>
              </View>
              <View onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                style={{ background: "#EBE7DF", color: "#5A4E44" }}>×</View>
            </View>

            {/* 信息列表 */}
            <View className="rounded-2xl overflow-hidden mb-4" style={{ background: "white", border: "1px solid #EBE7DF" }}>
              {[
                ["邮箱", selected.email],
                ["手机", selected.phone],
                ["角色", selected.role === "client" ? "来访者" : "咨询师"],
                ["注册时间", selected.joined],
                [selected.role === "client" ? "预约次数" : "完成咨询", String(selected.bookings) + (selected.role === "client" ? " 次" : " 次")],
                ["账号状态", selected.status === "active" ? "正常" : "已封禁"],
              ].map(([k, v]) => (
                <View key={k} className="flex justify-between items-center px-4 py-3 border-b last:border-0"
                  style={{ borderColor: "#F5F0EA" }}>
                  <Text className="text-sm" style={{ color: "#9B8E82" }}>{k}</Text>
                  <Text className="text-sm font-medium" style={{ color: k === "账号状态" && v === "已封禁" ? "#DC2626" : "#2C2420" }}>{v}</Text>
                </View>
              ))}
            </View>

            {/* 操作按钮 */}
            <View className="space-y-2">
              {selected.role === "counselor" && (
                <View onClick={() => { setSelected(null); Taro.navigateTo({url: '/pages/admin-overview/index?id=counselors'}); }}
                  className="w-full py-3 rounded-2xl text-sm font-bold"
                  style={{ background: "#E4F0DC", color: "var(--color-primary)" }}>
                  查看咨询师档案
                </View>
              )}
              <View onClick={() => toggleBan(selected)}
                className="w-full py-3 rounded-2xl text-sm font-bold"
                style={{ background: selected.status === "active" ? "#FEE2E2" : "#DCFCE7",
                  color: selected.status === "active" ? "#DC2626" : "#16A34A" }}>
                {selected.status === "active" ? "封禁该用户" : "解除封禁"}
              </View>
            </View>
          </View>
        </View>
      }
    </View>
  );
}
