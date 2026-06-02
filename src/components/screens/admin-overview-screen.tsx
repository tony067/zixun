"use client";
import { useRouter } from "next/navigation";
import { Users, ClipboardList, ShieldCheck, TrendingUp, Clock, Star } from "lucide-react";

const STATS = [
  { label: "平台用户", value: "1,284", sub: "本月新增 +38", icon: Users, color: "#9CB48A", href: "/admin/users" },
  { label: "本月订单", value: "216", sub: "较上月 +12%", icon: ClipboardList, color: "#B8A99A", href: "/admin/orders" },
  { label: "待审核", value: "7", sub: "咨询师申请", icon: ShieldCheck, color: "#E8A87C", href: "/admin/counselors" },
  { label: "本月营收", value: "¥64,800", sub: "较上月 +8%", icon: TrendingUp, color: "#8BB5C8", href: "/admin/orders" },
  { label: "累计咨询", value: "3,421 h", sub: "总咨询时长", icon: Clock, color: "#C4A0C0", href: "/admin/orders" },
  { label: "咨询师", value: "48", sub: "已上线", icon: Star, color: "#9CB48A", href: "/admin/counselors" },
];

const RECENT_ACTIONS = [
  { time: "10分钟前", text: "咨询师「陈晓雯」申请入驻，待审核", href: "/admin/counselors" },
  { time: "32分钟前", text: "订单 #bk_089 来访申请退款", href: "/admin/orders" },
  { time: "1小时前", text: "咨询师「林诗涵」信息变更，待审核", href: "/admin/counselors" },
  { time: "2小时前", text: "新用户注册 18 位", href: "/admin/users" },
  { time: "3小时前", text: "订单 #bk_076 咨询已完成", href: "/admin/orders" },
];

const SHORTCUTS = [
  { label: "咨询师审核", sub: "7 个待审核", href: "/admin/counselors", badge: 7, color: "#E8A87C" },
  { label: "订单管理", sub: "查看全部订单", href: "/admin/orders", badge: 0, color: "#8BB5C8" },
  { label: "用户管理", sub: "来访与咨询师", href: "/admin/users", badge: 0, color: "#9CB48A" },
];

export default function AdminOverviewScreen() {
  const router = useRouter();
  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--color-bg)" }}>
      <div className="px-5 pt-12 pb-4">
        <p className="text-xs mb-1" style={{ color: "#9B8E82" }}>管理员控制台</p>
        <h1 className="text-2xl font-bold" style={{ color: "#2C2420" }}>MindPace</h1>
      </div>

      {/* 数据格 */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-5">
        {STATS.map(s => {
          const Icon = s.icon;
          return (
            <button key={s.label} onClick={() => router.push(s.href)}
              className="rounded-2xl p-4 text-left" style={{ background: "white", border: "1px solid #EBE7DF" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: s.color+"22" }}>
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-xl font-bold" style={{ color: "#2C2420" }}>{s.value}</p>
              <p className="text-xs mt-0.5 font-medium" style={{ color: "#5A4E44" }}>{s.label}</p>
              <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{s.sub}</p>
            </button>
          );
        })}
      </div>

      {/* 快捷入口 */}
      <div className="px-4 mb-5">
        <p className="text-xs font-semibold mb-3" style={{ color: "#9B8E82" }}>快捷入口</p>
        <div className="space-y-2">
          {SHORTCUTS.map(s => (
            <button key={s.label} onClick={() => router.push(s.href)}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left"
              style={{ background: "white", border: "1px solid #EBE7DF" }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#2C2420" }}>{s.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{s.sub}</p>
              </div>
              <div className="flex items-center gap-2">
                {s.badge > 0 && (
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "#E8A87C" }}>{s.badge}</span>
                )}
                <span style={{ color: "#C4BDB5", fontSize: 18 }}>›</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 最近动态 */}
      <div className="px-4">
        <p className="text-xs font-semibold mb-3" style={{ color: "#9B8E82" }}>最近动态</p>
        <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #EBE7DF" }}>
          {RECENT_ACTIONS.map((a, i) => (
            <button key={i} onClick={() => router.push(a.href)}
              className="w-full flex items-start gap-3 px-4 py-3.5 text-left border-b last:border-0"
              style={{ borderColor: "#F5F0EA" }}>
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
