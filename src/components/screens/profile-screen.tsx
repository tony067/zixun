"use client";
import { useState, useEffect } from "react";
import { useEazo } from "@eazo/sdk/react";
import { auth } from "@eazo/sdk";
import { useRouter } from "next/navigation";
import { Settings, Heart, HeadphonesIcon, BookOpen, MessageCircle, LogOut, ChevronRight, Calendar } from "lucide-react";
import { request } from "@/lib/api/request";

type Booking = {
  id: string; status: string; scheduledAt: string; durationMinutes: number;
  sessionMode: string; priceAmount: number; sessionNumber?: number;
  counselor: { id: string; displayName: string } | null;
};

const BOOKING_TABS = [
  { key: "pending_confirmation", label: "待确认", statuses: ["pending_confirmation"] },
  { key: "pending_payment",      label: "待支付", statuses: ["pending_payment"] },
  { key: "upcoming",             label: "待咨询", statuses: ["paid"] },
  { key: "past",                 label: "已完成",  statuses: ["completed","cancelled","rejected"] },
];

const STATUS_BADGE: Record<string,{label:string;color:string;bg:string}> = {
  pending_confirmation: { label:"待确认",   color:"#D97706", bg:"#FEF3C7" },
  pending_payment:      { label:"待支付",   color:"#2563EB", bg:"#DBEAFE" },
  paid:                 { label:"即将咨询", color:"#059669", bg:"#D1FAE5" },
  completed:            { label:"已完成",   color:"#6B7280", bg:"#F3F4F6" },
  cancelled:            { label:"已取消",   color:"#9CA3AF", bg:"#F3F4F6" },
  rejected:             { label:"已拒绝",   color:"#9CA3AF", bg:"#F3F4F6" },
};

const MODE_LABEL: Record<string,string> = { "视频":"视频咨询", "面谈":"面对面咨询", "语音":"语音咨询" };

export default function ProfileScreen() {
  const router = useRouter();
  const user = useEazo((s) => s.auth.user);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState("pending_confirmation");
  const [seenTabs, setSeenTabs] = useState<Record<string,number>>({});

  useEffect(() => {
    const saved = localStorage.getItem("client_seen_tabs");
    if (saved) try { setSeenTabs(JSON.parse(saved)); } catch {}
  }, []);

  useEffect(() => {
    if (!user) return;
    request("/api/bookings/my").then(r => r.json()).then(d => setBookings(d.bookings ?? []));
  }, [user]);

  function markSeen(tab: string) {
    const count = bookingsForTab(tab).length;
    const next = { ...seenTabs, [tab]: count };
    setSeenTabs(next);
    localStorage.setItem("client_seen_tabs", JSON.stringify(next));
  }

  function bookingsForTab(tab: string) {
    const t = BOOKING_TABS.find(t => t.key === tab);
    if (!t) return [];
    return bookings.filter(b => t.statuses.includes(b.status));
  }

  function getBadge(tab: string) {
    const count = bookingsForTab(tab).length;
    const seen = seenTabs[tab] ?? 0;
    return count > seen ? count : 0;
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return `${d.getMonth()+1}月${d.getDate()}日 ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
  }

  const tabBookings = bookingsForTab(activeTab);

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 pb-24" style={{ background:"var(--color-bg)" }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl" style={{ background:"#EBE7DF" }}>👤</div>
      <p className="text-base font-semibold" style={{ color:"#2C2420" }}>登录后查看你的预约</p>
      <button onClick={() => auth.login()} className="px-8 py-3 rounded-2xl text-white font-bold text-sm"
        style={{ background:"var(--color-primary)" }}>
        登录 / 注册
      </button>
    </div>
  );

  const initials = user.nickname?.[0] ?? user.email?.[0] ?? "我";

  return (
    <div className="min-h-screen pb-32" style={{ background:"var(--color-bg)" }}>

      {/* ── 个人信息区 ── */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white flex-none"
          style={{ background:"var(--color-primary)" }}>
          {initials.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold truncate" style={{ color:"#2C2420" }}>{user.nickname ?? user.email}</p>
          <p className="text-xs truncate" style={{ color:"#9B8E82" }}>{user.email}</p>
        </div>
        <button onClick={() => router.push("/settings")}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background:"#EBE7DF" }}>
          <Settings className="w-4 h-4" style={{ color:"#5A4E44" }} />
        </button>
      </div>

      {/* ── 我的预约（重点区域）── */}
      <div className="mx-5 rounded-2xl overflow-hidden mb-4" style={{ background:"white", border:"1px solid #EBE7DF" }}>
        {/* 标题行 */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color:"var(--color-primary)" }} />
            <span className="text-sm font-bold" style={{ color:"#2C2420" }}>我的预约</span>
          </div>
          <button onClick={() => router.push("/my-bookings")} className="text-xs" style={{ color:"var(--color-primary)" }}>
            全部 ›
          </button>
        </div>

        {/* 4个Tab */}
        <div className="flex border-b" style={{ borderColor:"#F0EBE3" }}>
          {BOOKING_TABS.map(tab => (
            <button key={tab.key}
              onClick={() => { setActiveTab(tab.key); markSeen(tab.key); }}
              className="flex-1 flex flex-col items-center py-2 relative text-xs font-medium transition-colors"
              style={{ color: activeTab === tab.key ? "var(--color-primary)" : "#9B8E82" }}>
              {tab.label}
              {getBadge(tab.key) > 0 && (
                <span className="absolute top-1 right-2 w-4 h-4 rounded-full text-[10px] text-white flex items-center justify-center"
                  style={{ background:"#EF4444" }}>{getBadge(tab.key)}</span>
              )}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ background:"var(--color-primary)" }} />
              )}
            </button>
          ))}
        </div>

        {/* 订单列表 */}
        {tabBookings.length === 0 ? (
          <div className="py-8 flex flex-col items-center gap-2">
            <p className="text-sm" style={{ color:"#C4BDB5" }}>暂无{BOOKING_TABS.find(t=>t.key===activeTab)?.label}订单</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor:"#F5F0EA" }}>
            {tabBookings.slice(0,3).map(bk => {
              const badge = STATUS_BADGE[bk.status] ?? { label:bk.status, color:"#9B8E82", bg:"#F3F4F6" };
              return (
                <div key={bk.id} onClick={() => router.push(`/my-bookings/${bk.id}`)}
                  className="px-4 py-3 cursor-pointer active:bg-gray-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color:"#2C2420" }}>
                      第{bk.sessionNumber ?? 1}次 {MODE_LABEL[bk.sessionMode] ?? bk.sessionMode}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background:badge.bg, color:badge.color }}>{badge.label}</span>
                  </div>
                  <p className="text-xs" style={{ color:"#9B8E82" }}>
                    {bk.counselor?.displayName} · {bk.scheduledAt ? formatTime(bk.scheduledAt) : "时间待定"}
                  </p>
                </div>
              );
            })}
            {tabBookings.length > 3 && (
              <button onClick={() => router.push("/my-bookings")} className="w-full py-2.5 text-xs text-center"
                style={{ color:"var(--color-primary)" }}>
                查看全部 {tabBookings.length} 条 ›
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 常用功能四宫格 ── */}
      <div className="mx-5 grid grid-cols-2 gap-3 mb-4">
        {[
          { icon: Heart,           label:"收藏的咨询师", sub:"我关注的咨询师", href:"/favorites",  color:"#E8DFCC" },
          { icon: MessageCircle,   label:"我的消息",     sub:"与咨询师的对话", href:"/messages",   color:"#E4F0DC" },
          { icon: HeadphonesIcon,  label:"联系客服",     sub:"有问题找我们",   href:"/support",    color:"#E4F0DC" },
          { icon: BookOpen,        label:"新手必读",     sub:"了解咨询的一切", href:"/guide",      color:"#E8DFCC" },
        ].map(item => (
          <button key={item.label} onClick={() => router.push(item.href)}
            className="flex items-center gap-3 rounded-2xl p-4 text-left"
            style={{ background:"white", border:"1px solid #EBE7DF" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none"
              style={{ background:item.color }}>
              <item.icon className="w-4 h-4" style={{ color:"var(--color-primary)" }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color:"#2C2420" }}>{item.label}</p>
              <p className="text-xs truncate" style={{ color:"#9B8E82" }}>{item.sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── 退出登录 ── */}
      <div className="mx-5 mb-4">
        <button onClick={() => auth.logout?.()}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium"
          style={{ background:"white", border:"1px solid #EBE7DF", color:"#E53E3E" }}>
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>

      {/* ── 端口切换（隐藏，三点展开）── */}
      <div className="mx-5">
        <button onClick={() => router.push("/settings")}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm"
          style={{ background:"white", border:"1px solid #EBE7DF", color:"#9B8E82" }}>
          <span>账号与设置</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
