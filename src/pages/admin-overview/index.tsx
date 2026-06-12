import { useState, useEffect, useRef } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Input, ScrollView, Image, Swiper, SwiperItem, Textarea } from '@tarojs/components'
import { request } from '../../api/request'
import { useAuthStore } from '../../store/authStore'

import { useEffect, useState } from "react";

type Stats = {
  totalUsers: number; monthUsers: number; userChange: number;
  monthOrders: number; orderChange: number; totalOrders: number;
  activeCounselors: number; pendingCounselors: number;
  monthRevenue: number; totalRevenue: number;
};

const SHORTCUTS = [
  { label: "审核申请", sub: "咨询师入驻审核", href: "/admin/counselors", color: "#E8A87C", badgeKey: "pendingCounselors" },
  { label: "订单管理", sub: "查看全部订单", href: "/admin/orders", color: "#8BB5C8", badgeKey: "monthOrders" },
  { label: "用户管理", sub: "来访与咨询师", href: "/admin/users", color: "#9CB48A", badgeKey: null },
];

type RecentAction = {
  time: string; text: string; href: string;
  type: "counselor" | "order" | "user"; targetId?: string;
};

const RECENT_ACTIONS: RecentAction[] = [
  { time: "10分钟前", text: "新咨询师入驻申请等待审核", href: "/admin/counselors", type: "counselor" },
  { time: "30分钟前", text: "来访者 #u_221 完成注册", href: "/admin/users", type: "user" },
  { time: "1小时前", text: "订单 #bk_002 等待来访支付", href: "/admin/orders/bk_002", type: "order", targetId: "bk_002" },
  { time: "2小时前", text: "咨询师档案审核通过上线", href: "/admin/counselors", type: "counselor" },
  { time: "3小时前", text: "订单 #bk_003 咨询已完成", href: "/admin/orders/bk_003", type: "order", targetId: "bk_003" },
];

export default function AdminOverviewScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    request("/api/admin/stats")
      
      .then(d => { if (!d.error) setStats(d); })
      .catch(() => {});
  }, []);

  const fmt = (n: number) => n >= 10000 ? `${(n / 10000).toFixed(1)}万` : n.toLocaleString();
  const fmtMoney = (n: number) => n >= 10000 ? `¥${(n / 10000).toFixed(1)}万` : `¥${n.toLocaleString()}`;

  const STATS_DATA = stats ? [
    { label: "平台用户", value: fmt(stats.totalUsers), sub: `本月新增 +${stats.monthUsers}`, icon: Users, color: "#9CB48A", href: "/admin/users" },
    { label: "本月订单", value: fmt(stats.monthOrders), sub: stats.orderChange >= 0 ? `较上月 +${stats.orderChange}%` : `较上月 ${stats.orderChange}%`, icon: ClipboardList, color: "#B8A99A", href: "/admin/orders" },
    { label: "咨询师已上线", value: fmt(stats.activeCounselors), sub: "入驻审核通过", icon: Star, color: "#9CB48A", href: "/admin/counselors" },
    { label: "本月应收", value: fmtMoney(stats.monthRevenue), sub: "已完成订单", icon: TrendingUp, color: "#8BB5C8", href: "/admin/billing?type=monthly" },
    { label: "累计订单", value: fmt(stats.totalOrders), sub: "历史总计", icon: BarChart2, color: "#C4A0C0", href: "/admin/orders" },
    { label: "累计应收", value: fmtMoney(stats.totalRevenue), sub: "历史总计", icon: DollarSign, color: "#E8A87C", href: "/admin/billing?type=total" },
  ] : [
    { label: "平台用户", value: "—", sub: "加载中…", icon: Users, color: "#9CB48A", href: "/admin/users" },
    { label: "本月订单", value: "—", sub: "加载中…", icon: ClipboardList, color: "#B8A99A", href: "/admin/orders" },
    { label: "咨询师已上线", value: "—", sub: "加载中…", icon: Star, color: "#9CB48A", href: "/admin/counselors" },
    { label: "本月应收", value: "—", sub: "加载中…", icon: TrendingUp, color: "#8BB5C8", href: "/admin/billing?type=monthly" },
    { label: "累计订单", value: "—", sub: "加载中…", icon: BarChart2, color: "#C4A0C0", href: "/admin/orders" },
    { label: "累计应收", value: "—", sub: "加载中…", icon: DollarSign, color: "#E8A87C", href: "/admin/billing?type=total" },
  ];

  const getBadge = (key: string | null) => {
    if (!key || !stats) return 0;
    return (stats as unknown as Record<string, number>)[key] ?? 0;
  };

  return (
    <View className="min-h-screen pb-24" style={{ background: "var(--color-bg)" }}>
      <View className="px-5 pt-12 pb-4">
        <Text className="text-2xl font-bold" style={{ color: "#1A1512" }}>管理后台</Text>
        <Text className="text-sm mt-0.5" style={{ color: "#9B8E82" }}>MindPace 平台数据总览</Text>
      </View>

      {/* 统计格 */}
      <View className="px-5 grid grid-cols-2 gap-3 mb-6">
        {STATS_DATA.map(s => (
          <View key={s.label} onClick={() => router.push(s.href)}
            className="rounded-2xl p-4 text-left border active:scale-95 transition-transform"
            style={{ background: "white", borderColor: "#EBE7DF" }}>
            <View className="flex items-center gap-2 mb-2">
              <View className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${s.color}22` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </View>
              <Text className="text-xs" style={{ color: "#9B8E82" }}>{s.label}</Text>
            </View>
            <Text className="text-xl font-bold mb-0.5" style={{ color: "#1A1512" }}>{s.value}</Text>
            <Text className="text-xs" style={{ color: "#9B8E82" }}>{s.sub}</Text>
          </View>
        ))}
      </View>

      {/* 快捷操作 */}
      <View className="px-5 mb-6">
        <Text className="text-sm font-semibold mb-3" style={{ color: "#5A4E44" }}>快捷操作</Text>
        <View className="grid grid-cols-3 gap-3">
          {SHORTCUTS.map(s => {
            const badge = getBadge(s.badgeKey);
            return (
              <View key={s.label} onClick={() => router.push(s.href)}
                className="relative rounded-2xl p-3 flex flex-col items-center gap-1.5 border active:scale-95 transition-transform"
                style={{ background: "white", borderColor: "#EBE7DF" }}>
                {badge > 0 && (
                  <Text className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    style={{ background: "#F87171" }}>{badge > 99 ? "99+" : badge}</Text>
                )}
                <View className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${s.color}22` }}>
                  <View className="w-5 h-5 rounded-full" style={{ background: s.color }} />
                </View>
                <Text className="text-xs font-semibold" style={{ color: "#2C2420" }}>{s.label}</Text>
                <Text className="text-[10px] text-center leading-tight" style={{ color: "#9B8E82" }}>{s.sub}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 最近动态 */}
      <View className="px-5">
        <Text className="text-sm font-semibold mb-3" style={{ color: "#5A4E44" }}>最近动态</Text>
        <View className="rounded-2xl overflow-hidden border" style={{ background: "white", borderColor: "#EBE7DF" }}>
          {RECENT_ACTIONS.map((a, i) => (
            <View key={i} onClick={() => router.push(a.href)}
              className="w-full flex items-start gap-3 px-4 py-3.5 border-b last:border-0 text-left active:bg-gray-50"
              style={{ borderColor: "#F0EBE4" }}>
              <View className="w-1.5 h-1.5 rounded-full mt-2 flex-none" style={{ background: "var(--color-primary)" }} />
              <View className="flex-1 min-w-0">
                <Text className="text-sm" style={{ color: "#2C2420" }}>{a.text}</Text>
                <Text className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{a.time}</Text>
              </View>
              <Text style={{ color: "#C4BDB5", fontSize: 16, marginTop: 2 }}>›</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
