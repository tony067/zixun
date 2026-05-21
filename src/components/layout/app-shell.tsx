"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useEazo } from "@eazo/sdk/react";
import { auth } from "@eazo/sdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Calendar, MessageCircle, User,
  LayoutDashboard, BookOpen, Settings,
  Users, BarChart2, ChevronDown, LogOut,
} from "lucide-react";

type Role = "client" | "counselor" | "admin";

const HIDE_BOTTOM_NAV = ["/booking-time", "/chat/"];

const CLIENT_TABS = [
  { href: "/",             icon: Search,        label: "探索" },
  { href: "/my-bookings",  icon: BookOpen,      label: "预约" },
  { href: "/messages",     icon: MessageCircle, label: "消息" },
  { href: "/profile",      icon: User,          label: "我" },
];

const COUNSELOR_TABS = [
  { href: "/counselor/bookings",  icon: BookOpen,       label: "预约" },
  { href: "/counselor/schedule",  icon: Calendar,       label: "档期" },
  { href: "/counselor/messages",  icon: MessageCircle,  label: "消息" },
  { href: "/counselor/stats",     icon: BarChart2,      label: "统计" },
];

const ADMIN_TABS = [
  { href: "/admin",          icon: LayoutDashboard, label: "概览" },
  { href: "/admin/counselors", icon: Users,         label: "咨询师" },
  { href: "/admin/bookings", icon: BookOpen,        label: "预约" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useEazo((s) => ({ user: s.auth.user }));
  const [role, setRole] = useState<Role>("client");
  const [showRolePicker, setShowRolePicker] = useState(false);

  const hideNav = HIDE_BOTTOM_NAV.some((p) => pathname.startsWith(p));

  const tabs = role === "counselor" ? COUNSELOR_TABS
             : role === "admin"     ? ADMIN_TABS
             : CLIENT_TABS;

  const roleLabel = role === "client" ? "来访者" : role === "counselor" ? "咨询师" : "管理员";

  return (
    <div className="flex flex-col min-h-svh bg-[#F5F1E8]">
      <main className="flex-1 pb-[calc(env(safe-area-inset-bottom)+64px)]">
        {children}
      </main>

      {!hideNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#EBE7DF]"
          style={{ background: "#FDFBF7", paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* 身份切换条 */}
          <div className="flex items-center justify-between px-4 pt-1.5 pb-0">
            <button
              onClick={() => setShowRolePicker((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-[#7D736A] hover:text-[#9CB48A] transition-colors"
            >
              {roleLabel}
              <ChevronDown className="w-3 h-3" />
            </button>
            {user ? (
              <button
                onClick={() => auth.logout?.()}
                className="flex items-center gap-1 text-[11px] text-[#C2BDB7] hover:text-[#7D736A] transition-colors"
              >
                <LogOut className="w-3 h-3" />退出
              </button>
            ) : (
              <button
                onClick={() => auth.login()}
                className="text-[11px] text-[#9CB48A] font-medium"
              >
                登录
              </button>
            )}
          </div>

          {/* tab bar */}
          <div className="flex items-center px-2 h-12">
            {tabs.map(({ href, icon: Icon, label }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
                    active ? "text-[#9CB48A]" : "text-[#C2BDB7]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{label}</span>
                  {active && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-1 w-1 h-1 rounded-full bg-[#9CB48A]"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Role picker sheet */}
      <AnimatePresence>
        {showRolePicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30"
              onClick={() => setShowRolePicker(false)}
            />
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 36 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-[#EBE7DF] p-5"
              style={{ background: "#FDFBF7", paddingBottom: "calc(env(safe-area-inset-bottom)+20px)" }}
            >
              <p className="text-xs text-[#7D736A] mb-3 font-medium">切换身份</p>
              {(["client", "counselor", "admin"] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => { setRole(r); setShowRolePicker(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl mb-2 text-sm font-medium transition-colors ${
                    role === r
                      ? "bg-[#9CB48A] text-white"
                      : "bg-[#F5F1E8] text-[#3B332C] hover:bg-[#EBE7DF]"
                  }`}
                >
                  {r === "client" ? "来访者" : r === "counselor" ? "咨询师" : "管理员"}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
