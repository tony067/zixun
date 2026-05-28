"use client";
import { useState } from "react";
import { useEazo } from "@eazo/sdk/react";
import { auth } from "@eazo/sdk";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, CalendarDays, MessageCircle, Settings, LogOut, ChevronRight, Stethoscope, ShieldCheck } from "lucide-react";

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
    <div className="min-h-svh flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "var(--color-surface)" }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: "var(--color-secondary)" }}>
        <User size={36} style={{ color: "var(--color-primary)" }} />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>你好</h2>
      <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>登录后可查看预约、消息和个人设置</p>
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => auth.login()}
        className="px-8 py-3 rounded-2xl text-white font-semibold"
        style={{ background: "var(--color-primary)" }}>
        登录 / 注册
      </motion.button>
    </div>
  );

  const name    = user.name || user.email?.split("@")[0] || "来访者";
  const initial = name[0].toUpperCase();

  const menuItems = [
    { icon: CalendarDays, label: "我的预约", sub: "查看和管理预约记录", href: "/my-bookings" },
    { icon: MessageCircle, label: "我的消息", sub: "与咨询师的对话记录", href: "/messages" },
    { icon: Settings, label: "账号设置",  sub: "修改资料和偏好设置",   href: "/settings" },
  ];

  const roles = [
    { key: "client",    label: "来访者",   icon: User,        href: "/",                    color: "#9CB48A" },
    { key: "counselor", label: "咨询师端", icon: Stethoscope, href: "/counselor/bookings",  color: "#7BA3C4" },
    { key: "admin",     label: "管理员端", icon: ShieldCheck, href: "/admin",               color: "#B07DB0" },
  ];

  return (
    <div className="min-h-svh pb-28" style={{ background: "var(--color-surface)" }}>
      <div className="px-5 pt-14 pb-2">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>我的</h1>
      </div>

      {/* 用户信息卡 */}
      <div className="mx-5 mb-4 rounded-3xl p-5 border border-[var(--color-border)]"
        style={{ background: "var(--color-card)" }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{ background: "var(--color-secondary)", color: "var(--color-primary)" }}>
            {initial}
          </div>
          <div>
            <div className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>{name}</div>
            <div className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>{user.email}</div>
          </div>
        </div>
      </div>

      {/* 菜单列表 */}
      <div className="mx-5 rounded-3xl overflow-hidden border border-[var(--color-border)]"
        style={{ background: "var(--color-card)" }}>
        {menuItems.map((item, i) => (
          <Link key={item.href} href={item.href}>
            <motion.div whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--color-surface)]"
              style={{ borderBottom: i < menuItems.length - 1 ? "1px solid var(--color-border)" : "none" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--color-secondary)" }}>
                <item.icon size={18} style={{ color: "var(--color-primary)" }} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{item.label}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{item.sub}</div>
              </div>
              <ChevronRight size={16} style={{ color: "var(--color-text-muted)" }} />
            </motion.div>
          </Link>
        ))}
      </div>

      {/* 切换端口（折叠） */}
      <div className="mx-5 mt-4">
        <motion.button whileTap={{ scale: 0.98 }}
          onClick={() => setShowSwitch(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>切换端口</span>
          <ChevronRight size={16} style={{
            color: "var(--color-text-muted)",
            transform: showSwitch ? "rotate(90deg)" : "none",
            transition: "transform 0.2s"
          }} />
        </motion.button>

        <AnimatePresence>
          {showSwitch && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="pt-2 space-y-2">
                {roles.map(r => (
                  <motion.button key={r.key} whileTap={{ scale: 0.97 }}
                    onClick={() => { setShowSwitch(false); router.push(r.href); }}
                    className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl border"
                    style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: r.color + "22" }}>
                      <r.icon size={17} style={{ color: r.color }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{r.label}</span>
                    <ChevronRight size={15} className="ml-auto" style={{ color: "var(--color-text-muted)" }} />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 退出登录 */}
      <div className="mx-5 mt-4">
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => auth.logout()}
          className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl"
          style={{ background: "#FEF2F2", border: "1px solid #FEE2E2" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FEE2E2" }}>
            <LogOut size={17} style={{ color: "#DC2626" }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: "#DC2626" }}>退出登录</span>
        </motion.button>
      </div>
    </div>
  );
}
