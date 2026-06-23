"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Users, ClipboardList, Star, TrendingUp, BarChart2, DollarSign } from "lucide-react";
import { request } from "@/lib/api/request";

type Stats = {
  totalUsers: number; monthUsers: number; userChange: number;
  monthOrders: number; orderChange: number; totalOrders: number;
  activeCounselors: number; pendingCounselors: number;
  monthRevenue: number; totalRevenue: number;
};

const SHORTCUTS = [
  { label: "审核申请", sub: "咨询师入驻审核", href: "/admin/counselors", color: "#E8A87C", badgeKey: "pendingCounselors" },
  { label: "订单管理", sub: "查看全部订单", href: "/admin/orders", color: "#8BB5C8", badgeKey: "monthOrders" },
  { label: "账单导出", sub: "月度收入明细", href: "/admin/billing", color: "#9CB48A", badgeKey: null },
  { label: "用户管理", sub: "来访与咨询师", href: "/admin/users", color: "#C4A0C0", badgeKey: null },
];

type RecentAction = {
  time: string; text: string; href: string;
  type: "counselor" | "order" | "user"; targetId?: string;
};

export default function AdminOverviewScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    request("/api/admin/stats")
      .then(r => r.json())
      .then(d => { if (!d.error) setStats(d); })
      .catch(() => {});
    request("/api/admin/recent-actions")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setRecentActions(d); })
      .catch(() => {});
  }, [user]);

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
    <div className="min-h-screen pb-24" style={{ background: "var(--color-bg)" }}>
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-2xl font-bold" style={{ color: "#1A1512" }}>管理后台</h1>
        <p className="text-sm mt-0.5" style={{ color: "#9B8E82" }}>MindPace 平台数据总览</p>
      </div>

      {/* 统计格 */}
      <div className="px-5 grid grid-cols-2 gap-3 mb-6">
        {STATS_DATA.map(s => (
          <button key={s.label} onClick={() => router.push(s.href)}
            className="rounded-2xl p-4 text-left border active:scale-95 transition-transform"
            style={{ background: "white", borderColor: "#EBE7DF" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${s.color}22` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <span className="text-xs" style={{ color: "#9B8E82" }}>{s.label}</span>
            </div>
            <p className="text-xl font-bold mb-0.5" style={{ color: "#1A1512" }}>{s.value}</p>
            <p className="text-xs" style={{ color: "#9B8E82" }}>{s.sub}</p>
          </button>
        ))}
      </div>

      {/* 快捷操作 */}
      <div className="px-5 mb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "#5A4E44" }}>快捷操作</h2>
        <div className="grid grid-cols-3 gap-3">
          {SHORTCUTS.map(s => {
            const badge = getBadge(s.badgeKey);
            return (
              <button key={s.label} onClick={() => router.push(s.href)}
                className="relative rounded-2xl p-3 flex flex-col items-center gap-1.5 border active:scale-95 transition-transform"
                style={{ background: "white", borderColor: "#EBE7DF" }}>
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    style={{ background: "#F87171" }}>{badge > 99 ? "99+" : badge}</span>
                )}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${s.color}22` }}>
                  <div className="w-5 h-5 rounded-full" style={{ background: s.color }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: "#2C2420" }}>{s.label}</span>
                <span className="text-[10px] text-center leading-tight" style={{ color: "#9B8E82" }}>{s.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 最近动态 */}
      <div className="px-5">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "#5A4E44" }}>最近动态</h2>
        <div className="rounded-2xl overflow-hidden border" style={{ background: "white", borderColor: "#EBE7DF" }}>
          {recentActions.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "#C4BDB5" }}>暂无动态</p>
          ) : recentActions.map((a, i) => (
            <button key={i} onClick={() => router.push(a.href)}
              className="w-full flex items-start gap-3 px-4 py-3.5 border-b last:border-0 text-left active:bg-gray-50"
              style={{ borderColor: "#F0EBE4" }}>
              <div className="w-1.5 h-1.5 rounded-full mt-2 flex-none" style={{ background: "var(--color-primary)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: "#2C2420" }}>{a.text}</p>
                <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{a.time}</p>
              </div>
              <span style={{ color: "#C4BDB5", fontSize: 16, marginTop: 2 }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
