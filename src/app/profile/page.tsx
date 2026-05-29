"use client";
import { useState } from "react";
import { useEazo } from "@eazo/sdk/react";
import { auth } from "@eazo/sdk";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Settings, ChevronRight, Stethoscope, ShieldCheck, User } from "lucide-react";

export default function ProfilePage() {
  const user    = useEazo((s) => s.auth.user);
  const loading = useEazo((s) => s.auth.loading);
  const router  = useRouter();
  const [showSwitch, setShowSwitch] = useState(false);

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

  const MENU = [
    { href: "/my-bookings", icon: CalendarDays, label: "我的预约", sub: "查看和管理预约记录" },
    { href: "/settings",    icon: Settings,     label: "账号设置", sub: "修改资料和偏好设置" },
  ];

  const PORTALS = [
    { icon: User,        label: "来访者端", href: "/" },
    { icon: Stethoscope, label: "咨询师端", href: "/counselor/bookings" },
    { icon: ShieldCheck, label: "管理员端", href: "/admin" },
  ];

  return (
    <div className="min-h-svh pb-32" style={{ background: "var(--color-surface)" }}>
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-xl font-bold text-[#2C2420]">我的</h1>
      </div>

      {/* 用户信息卡 */}
      <div className="mx-5 mb-4 rounded-2xl p-4 flex items-center gap-4"
        style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
          style={{ background: "#E8DFCC", color: "#7A6248" }}>
          {user.name?.[0] ?? user.email?.[0] ?? "?"}
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-[#2C2420] truncate">{user.name ?? "未设置昵称"}</p>
          <p className="text-sm text-[#9B8E82] truncate">{user.email}</p>
        </div>
      </div>

      {/* 功能菜单 */}
      <div className="mx-5 rounded-2xl overflow-hidden mb-4"
        style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
        {MENU.map((item, i) => (
          <Link key={item.href} href={item.href}>
            <div className={`flex items-center gap-4 px-4 py-4 active:bg-gray-50 ${i < MENU.length - 1 ? "border-b border-[#F0EBE3]" : ""}`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#F0F7EC" }}>
                <item.icon className="w-5 h-5" style={{ color: "#9CB48A" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2C2420]">{item.label}</p>
                <p className="text-xs text-[#9B8E82]">{item.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#C4BDB5]" />
            </div>
          </Link>
        ))}
      </div>

      {/* 退出登录 */}
      <div className="mx-5 mb-10">
        <button onClick={() => { auth.logout(); router.push("/"); }}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold"
          style={{ background: "#FEF2F2", color: "#DC2626" }}>
          退出登录
        </button>
      </div>

      {/* 切换端口 — 隐秘入口，点三个点才展开 */}
      <div className="mx-5">
        <button onClick={() => setShowSwitch(!showSwitch)}
          className="text-[#D0C8C0] w-full text-center py-1 text-lg tracking-widest select-none">
          · · ·
        </button>
        <AnimatePresence>
          {showSwitch && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="rounded-2xl overflow-hidden mt-2 mb-4"
                style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
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
