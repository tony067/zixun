"use client";
import { useRouter } from "next/navigation";
import { Users, ClipboardList, ShieldCheck, TrendingUp, Clock, Star } from "lucide-react";

const STATS = [
  { label: "平台用户", value: "1,284", sub: "本月新增 +38", icon: Users, color: "#9CB48A" },
  { label: "本月订单", value: "216", sub: "较上月 +12%", icon: ClipboardList, color: "#B8A99A" },
  { label: "待审核", value: "7", sub: "咨询师申请", icon: ShieldCheck, color: "#E8A87C" },
  { label: "本月营收", value: "¥64,800", sub: "较上月 +8%", icon: TrendingUp, color: "#8BB5C8" },
  { label: "累计咨询", value: "3,421 h", sub: "总咨询时长", icon: Clock, color: "#C4A0C0" },
  { label: "咨询师", value: "48", sub: "已上线", icon: Star, color: "#9CB48A" },
];

const RECENT_ACTIONS = [
  { time: "10分钟前", text: "咨询师「陈晓雯」申请入驻，待审核" },
  { time: "32分钟前", text: "订单 #bk_089 来访申请退款" },
  { time: "1小时前", text: "咨询师「林诗涵」信息变更，待审核" },
  { time: "2小时前", text: "新用户注册 18 位" },
  { time: "3小时前", text: "订单 #bk_076 咨询已完成" },
];

export default function AdminOverviewScreen() {
  const router = useRouter();
  return (
    <div className="min-h-screen pb-10" style={{ background: "var(--color-bg)" }}>
      {/* 顶栏 */}
      <div className="px-5 pt-12 pb-4">
        <p className="text-xs mb-1" style={{ color: "#9B8E82" }}>管理员控制台</p>
        <h1 className="text-2xl font-bold" style={{ color: "#2C2420" }}>MindPace</h1>
      </div>

      {/* 数据格 */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-6">
        {STATS.map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #EBE7DF" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: s.color + "22" }}>
                <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              </div>
              <span className="text-xs" style={{ color: "#9B8E82" }}>{s.label}</span>
            </div>
            <p className="text-xl font-bold mb-0.5" style={{ color: "#2C2420" }}>{s.value}</p>
            <p className="text-xs" style={{ color: "#9B8E82" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* 快捷入口 */}
      <div className="px-4 mb-6">
        <p className="text-sm font-semibold mb-3" style={{ color: "#2C2420" }}>快捷操作</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "审核申请", badge: 7, href: "/admin/counselors" },
            { label: "订单管理", badge: 0, href: "/admin/orders" },
            { label: "用户管理", badge: 0, href: "/admin/users" },
          ].map(item => (
            <button key={item.label} onClick={() => router.push(item.href)}
              className="relative rounded-2xl py-4 flex flex-col items-center gap-1.5"
              style={{ background: "white", border: "1px solid #EBE7DF" }}>
              {item.badge > 0 && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center"
                  style={{ background: "#E87070" }}>{item.badge}</span>
              )}
              <span className="text-sm font-medium" style={{ color: "#2C2420" }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 最近动态 */}
      <div className="px-4">
        <p className="text-sm font-semibold mb-3" style={{ color: "#2C2420" }}>最近动态</p>
        <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #EBE7DF" }}>
          {RECENT_ACTIONS.map((a, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3 border-b last:border-0" style={{ borderColor: "#F5F0EA" }}>
              <div className="w-1.5 h-1.5 rounded-full mt-2 flex-none" style={{ background: "var(--color-primary)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: "#2C2420" }}>{a.text}</p>
                <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
