"use client";
import { useState, useEffect } from "react";
import { useEazo } from "@eazo/sdk/react";
import { auth } from "@eazo/sdk";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronRight, Stethoscope, ShieldCheck, User, Calendar, Clock, Bell, Shield, HelpCircle, ChevronDown } from "lucide-react";
import { request } from "@/lib/api/request";

type Booking = {
  id: string; status: string; scheduledAt: string; durationMinutes: number;
  sessionMode: string; priceAmount: number;
  counselor: { id: string; displayName: string } | null;
};

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  pending_confirmation: { label: "待咨询师确认", color: "#D97706", bg: "#FEF3C7" },
  pending_payment:      { label: "待支付",       color: "#2563EB", bg: "#DBEAFE" },
  paid:                 { label: "即将咨询",     color: "#059669", bg: "#D1FAE5" },
  completed:            { label: "已完成",       color: "#6B7280", bg: "#F3F4F6" },
  cancelled:            { label: "已取消",       color: "#9CA3AF", bg: "#F9FAFB" },
};

export default function ProfilePage() {
  const user        = useEazo((s) => s.auth.user);
  const loading     = useEazo((s) => s.auth.loading);
  const router      = useRouter();
  const [showSwitch,    setShowSwitch]    = useState(false);
  const [settingsOpen,  setSettingsOpen]  = useState(false);
  const [bookings,      setBookings]      = useState<Booking[]>([]);

  useEffect(() => {
    if (!user) return;
    request("/api/bookings/my").then(r => r.json()).then(d => {
      setBookings(Array.isArray(d) ? d.filter((b: Booking) => !["completed","cancelled","rejected"].includes(b.status)) : []);
    }).catch(() => {});
  }, [user]);

  if (loading) return (
    <div className="min-h-svh flex items-center justify-center" style={{ background: "var(--color-surface)" }}>
      <div className="w-10 h-10 rounded-full skeleton" />
    </div>
  );

  if (!user) return (
    <div className="min-h-svh flex flex-col items-center justify-center px-6 gap-4" style={{ background: "var(--color-surface)" }}>
      <p className="text-base font-semibold text-[#2C2420]">请先登录</p>
      <button onClick={() => auth.login()} className="px-8 py-3 rounded-2xl text-white font-semibold" style={{ background: "#9CB48A" }}>登录</button>
    </div>
  );

  const PORTALS = [
    { icon: User,        label: "来访者端", href: "/" },
    { icon: Stethoscope, label: "咨询师端", href: "/counselor/bookings" },
    { icon: ShieldCheck, label: "管理员端", href: "/admin" },
  ];

  const SETTINGS = [
    { icon: User,       label: "个人资料", sub: "修改昵称和头像" },
    { icon: Bell,       label: "通知设置", sub: "预约提醒和消息通知" },
    { icon: Shield,     label: "隐私与安全", sub: "密码和授权管理" },
    { icon: HelpCircle, label: "帮助与反馈", sub: "常见问题和联系客服" },
  ];

  return (
    <div className="min-h-svh pb-32" style={{ background: "var(--color-surface)" }}>
      {/* 顶部 */}
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-xl font-bold text-[#2C2420] mb-4">我的</h1>
        <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ background: "#E8DFCC", color: "#7A6248" }}>
            {user.name?.[0] ?? user.email?.[0] ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-[#2C2420] truncate">{user.name ?? "未设置昵称"}</p>
            <p className="text-sm text-[#9B8E82] truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* 我的预约 */}
      <div className="px-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#2C2420]">我的预约</h2>
          <Link href="/my-bookings" className="text-xs font-medium" style={{ color: "#9CB48A" }}>查看全部 →</Link>
        </div>
        {bookings.length === 0 ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <CalendarDays className="w-8 h-8 mx-auto mb-2" style={{ color: "#C4BDB5" }} />
            <p className="text-sm text-[#9B8E82]">暂无进行中的预约</p>
            <Link href="/" className="inline-block mt-3 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#9CB48A" }}>浏览咨询师</Link>
          </div>
        ) : bookings.slice(0, 3).map(b => {
          const badge = STATUS_BADGE[b.status] ?? { label: b.status, color: "#9B8E82", bg: "#F5F0E8" };
          const dt = b.scheduledAt ? new Date(b.scheduledAt) : null;
          return (
            <div key={b.id} className="rounded-2xl p-4 mb-3" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0" style={{ background: "#E8DFCC", color: "#7A6248" }}>
                  {b.counselor ? b.counselor.displayName[0] : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-[#2C2420] truncate">{b.counselor?.displayName ?? "咨询师"}</p>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{ color: badge.color, background: badge.bg }}>{badge.label}</span>
                  </div>
                  {dt && (
                    <div className="flex items-center gap-3 text-xs text-[#9B8E82]">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{dt.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric", weekday: "short" })}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{dt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  )}
                </div>
              </div>
              {b.status === "pending_payment" && (
                <button className="w-full mt-3 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: "#9CB48A" }}>立即支付</button>
              )}
            </div>
          );
        })}
      </div>

      {/* 账号设置（可折叠） */}
      <div className="px-5 mb-5">
        <button className="flex items-center justify-between w-full mb-3" onClick={() => setSettingsOpen(!settingsOpen)}>
          <h2 className="text-base font-bold text-[#2C2420]">账号设置</h2>
          <ChevronDown className={`w-4 h-4 text-[#9B8E82] transition-transform ${settingsOpen ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {settingsOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                {SETTINGS.map((item, i) => (
                  <button key={item.label} className={`w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-50 ${i < SETTINGS.length - 1 ? "border-b border-[#F0EBE3]" : ""}`}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#F0F7EC" }}>
                      <item.icon className="w-4 h-4" style={{ color: "#9CB48A" }} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-[#2C2420]">{item.label}</p>
                      <p className="text-xs text-[#9B8E82]">{item.sub}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#C4BDB5]" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 退出登录 */}
      <div className="px-5 mb-10">
        <button onClick={() => { auth.logout(); router.push("/"); }} className="w-full py-3.5 rounded-2xl text-sm font-semibold" style={{ background: "#FEF2F2", color: "#DC2626" }}>
          退出登录
        </button>
      </div>

      {/* 隐秘切换端口 */}
      <div className="mx-5">
        <button onClick={() => setShowSwitch(!showSwitch)} className="text-[#D0C8C0] w-full text-center py-1 text-lg tracking-widest select-none">· · ·</button>
        <AnimatePresence>
          {showSwitch && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="rounded-2xl overflow-hidden mt-2 mb-4" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <p className="text-[10px] text-[#C4BDB5] px-4 pt-3 pb-1 uppercase tracking-wider">切换端口</p>
                {PORTALS.map((p, i) => (
                  <button key={p.href} onClick={() => { setShowSwitch(false); router.push(p.href); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 ${i < PORTALS.length - 1 ? "border-b border-[#F0EBE3]" : ""}`}>
                    <p.icon className="w-4 h-4 text-[#9B8E82]" />
                    <span className="text-sm text-[#2C2420]">{p.label}</span>
                    <ChevronRight className="w-4 h-4 text-[#C4BDB5] ml-auto" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
