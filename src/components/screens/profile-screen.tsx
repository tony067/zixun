"use client";
import { useState, useEffect } from "react";
import { useEazo } from "@eazo/sdk/react";
import { auth } from "@eazo/sdk";
import { useRouter } from "next/navigation";
import { Heart, HeadphonesIcon, BookOpen, LogOut, Settings, Calendar, ChevronRight } from "lucide-react";
import { request } from "@/lib/api/request";

type Booking = {
  id: string; status: string; scheduledAt: string; durationMinutes: number;
  sessionMode: string; priceAmount: number; sessionNumber?: number;
  counselor: { id: string; displayName: string } | null;
};

// 主页只显示进行中的订单（待确认+待支付+待咨询）
const ACTIVE_STATUSES = ["pending_confirmation","pending_payment","paid","upcoming","confirmed"];

const STATUS_BADGE: Record<string,{label:string;color:string;bg:string}> = {
  pending_confirmation: { label:"待确认",   color:"#D97706", bg:"#FEF3C7" },
  pending_payment:      { label:"待支付",   color:"#2563EB", bg:"#DBEAFE" },
  paid:                 { label:"即将咨询", color:"#059669", bg:"#D1FAE5" },
  completed:            { label:"已完成",   color:"#6B7280", bg:"#F3F4F6" },
  cancelled:            { label:"已取消",   color:"#9B8E82", bg:"#F5F0EA" },
  rejected:             { label:"已拒绝",   color:"#9B8E82", bg:"#F5F0EA" },
};

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth()+1}月${d.getDate()}日 ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
}

const QUICK_ACTIONS = [
  { icon: Heart,          label: "收藏的咨询师", sub: "我关注的咨询师",  href: "/favorites" },
  { icon: Settings,       label: "更多设置",     sub: "账号·密码·通知",  href: "/settings" },
  { icon: HeadphonesIcon, label: "联系客服",     sub: "有问题找我们",    href: "/support" },
  { icon: BookOpen,       label: "新手必读",     sub: "了解咨询的一切",  href: "/guide" },
];

export default function ProfileScreen() {
  const user   = useEazo((s) => s.auth.user);
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!user) return;
    request("/api/bookings/my").then(r => r.json()).then((d: { bookings?: Booking[] }) => {
      const list: Booking[] = d.bookings ?? [];
      setBookings(list);
      const c: Record<string,number> = {};
      BOOKING_TABS.forEach(t => { c[t.key] = list.filter(b => t.statuses.includes(b.status)).length; });
      setCounts(c);
    }).catch(() => {});
  }, [user]);

  const filtered = bookings.filter(b =>
    BOOKING_TABS.find(t => t.key === activeTab)?.statuses.includes(b.status)
  );

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 pb-24" style={{ background:"var(--color-bg)" }}>
      <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl" style={{ background:"#EBE7DF" }}>👤</div>
      <p className="text-base font-semibold" style={{ color:"#2C2420" }}>登录后查看你的预约</p>
      <button onClick={() => auth.login()} className="px-8 py-3 rounded-2xl text-white font-bold text-sm" style={{ background:"var(--color-primary)" }}>
        登录 / 注册
      </button>
    </div>
  );

  const initials = (user as any).displayName?.[0] ?? (user as any).nickname?.[0] ?? user.email?.[0] ?? "我";
  const displayName = (user as any).displayName ?? (user as any).nickname ?? user.email ?? "";

  return (
    <div className="min-h-screen pb-32" style={{ background:"var(--color-bg)" }}>

      {/* ── 个人信息区（大头像）── */}
      <div className="px-5 pt-8 pb-5 flex items-center gap-4">
        <div className="relative flex-none">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-md"
            style={{ background:"var(--color-primary)" }}>
            {initials.toUpperCase()}
          </div>
          <button className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center shadow"
            style={{ background:"white", border:"1.5px solid #EBE7DF" }}
            onClick={() => router.push("/settings/profile")}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#5A7A3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold truncate" style={{ color:"#2C2420" }}>{displayName}</p>
            <button onClick={() => router.push("/settings/profile")} className="flex-none">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#BDB6AD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
          <p className="text-xs mt-0.5 truncate" style={{ color:"#9B8E82" }}>{user.email}</p>
        </div>
      </div>

      {/* ── 我的预约（重点区域）── */}
      <div className="mx-5 rounded-2xl overflow-hidden mb-4" style={{ background:"white", border:"1px solid #EBE7DF" }}>
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color:"var(--color-primary)" }} />
            <span className="text-sm font-bold" style={{ color:"#2C2420" }}>我的预约</span>
          </div>
          <button onClick={() => router.push("/my-bookings")} className="flex items-center gap-0.5 text-xs" style={{ color:"var(--color-primary)" }}>
            全部 <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab 行 */}
        <div className="flex border-b" style={{ borderColor:"#F0EBE4" }}>
          {BOOKING_TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className="flex-1 py-2.5 text-xs font-medium relative"
              style={{ color: activeTab === t.key ? "var(--color-primary)" : "#9B8E82" }}>
              {t.label}
              {(counts[t.key] ?? 0) > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full text-white flex items-center justify-center"
                  style={{ background:"#EF4444", fontSize:9 }}>{counts[t.key]}</span>
              )}
              {activeTab === t.key && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full" style={{ background:"var(--color-primary)" }} />
              )}
            </button>
          ))}
        </div>

        {/* 订单列表 */}
        <div className="px-4 py-3 space-y-2.5" style={{ minHeight:110 }}>
          {filtered.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color:"#BDB6AD" }}>
              暂无{BOOKING_TABS.find(t=>t.key===activeTab)?.label}订单
            </p>
          ) : filtered.slice(0,3).map(b => {
            const st = STATUS_BADGE[b.status] ?? { label:b.status, color:"#9B8E82", bg:"#F5F0EA" };
            return (
              <button key={b.id} onClick={() => router.push(`/my-bookings/${b.id}`)}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left"
                style={{ background:"#F8F5F0" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-base font-bold text-white flex-none"
                  style={{ background:"var(--color-primary)" }}>
                  {b.counselor?.displayName?.[0] ?? "咨"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color:"#2C2420" }}>
                    第{b.sessionNumber ?? 1}次 · {b.counselor?.displayName ?? "咨询师"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color:"#9B8E82" }}>
                    {b.scheduledAt ? fmt(b.scheduledAt) : "待定"} · {b.sessionMode}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-none"
                  style={{ background:st.bg, color:st.color }}>{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 常用功能四宫格 ── */}
      <div className="mx-5 grid grid-cols-2 gap-3 mb-4">
        {QUICK_ACTIONS.map(a => (
          <button key={a.label} onClick={() => router.push(a.href)}
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left"
            style={{ background:"white", border:"1px solid #EBE7DF" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-none" style={{ background:"#E8DFCC" }}>
              <a.icon className="w-4 h-4" style={{ color:"var(--color-primary)" }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color:"#2C2420" }}>{a.label}</p>
              <p className="text-xs truncate" style={{ color:"#9B8E82" }}>{a.sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── 退出登录 ── */}
      <div className="mx-5">
        <button onClick={() => auth.logout?.()}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold"
          style={{ background:"white", border:"1px solid #EBE7DF", color:"#EF4444" }}>
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>

    </div>
  );
}
