"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, CalendarDays, MessageCircle, User,
  LayoutDashboard, ClipboardList, ShieldCheck, Users,
  ChevronRight,
} from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { useEffect } from "react";

const CLIENT_TABS = [
  { href: "/",            icon: Home,          label: "首页" },
  { href: "/messages",    icon: MessageCircle, label: "消息" },
  { href: "/profile",     icon: User,          label: "我的" },
];

const COUNSELOR_TABS = [
  { href: "/counselor/bookings",  icon: ClipboardList, label: "预约" },
  { href: "/counselor/schedule",  icon: CalendarDays,  label: "档期" },
  { href: "/counselor/messages",  icon: MessageCircle, label: "消息" },
  { href: "/counselor/profile",   icon: User,          label: "档案" },
];

const ADMIN_TABS = [
  { href: "/admin",              icon: LayoutDashboard, label: "总览" },
  { href: "/admin/counselors",   icon: ShieldCheck,     label: "审核" },
  { href: "/admin/orders",       icon: ClipboardList,   label: "订单" },
  { href: "/admin/users",        icon: Users,           label: "用户" },
];

const HIDE_NAV = ["/booking/", "/chat/", "/counselor/profile", "/counselors/", "/my-bookings/", "/settings", "/support"];

type Role = "client" | "counselor" | "admin";

function detectRole(path: string): Role {
  if (path.startsWith("/counselor")) return "counselor";
  if (path.startsWith("/admin"))     return "admin";
  return "client";
}

const MY_ROUTE: Record<Role, string> = {
  client:    "/profile",
  counselor: "/counselor/bookings",
  admin:     "/admin",
};

const ROLE_ITEMS = [
  { role: "client"   as Role, icon: "👤", label: "来访者",  sub: "浏览咨询师・预约・消息" },
  { role: "counselor"as Role, icon: "🧑‍⚕️", label: "咨询师",  sub: "管理预约・档期・档案" },
  { role: "admin"    as Role, icon: "🛠",  label: "管理员",  sub: "审核・数据・系统设置" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const user     = useEazo((s) => s.auth.user);
  const auth     = useEazo((s) => s.auth);

  const role = detectRole(pathname);
  const tabs = role === "counselor" ? COUNSELOR_TABS
             : role === "admin"     ? ADMIN_TABS
             : CLIENT_TABS;

  const hideNav = HIDE_NAV.some(p => pathname.startsWith(p));

  const [showRolePicker, setShowRolePicker] = useState(false);

  function switchRole(targetRole: Role) {
    setShowRolePicker(false);
    if (!user) {
      auth.login();
      return;
    }
    router.push(MY_ROUTE[targetRole]);
  }

  return (
    <div className="relative min-h-svh flex flex-col" style={{ background: "var(--color-surface, #F5F1E8)" }}>
      {/* Main content */}
      <main className={`flex-1 ${hideNav ? "" : "pb-20"}`}>
        {children}
      </main>

      {/* Bottom navigation */}
      {!hideNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 flex items-center px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)]"
          style={{ background: "rgba(245,241,232,0.96)", backdropFilter: "blur(12px)", borderTop: "1px solid #EBE7DF" }}
        >
          {tabs.map(tab => {
            const Icon    = tab.icon;
            const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
            return (
              <Link key={tab.href} href={tab.href}
                className="flex-1 flex flex-col items-center gap-0.5 py-1"
              >
                <Icon
                  size={22}
                  style={{ color: isActive ? "#9CB48A" : "#9B8E82" }}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span className="text-[10px] font-medium" style={{ color: isActive ? "#9CB48A" : "#9B8E82" }}>
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* 我的 按钮 */}
          <button
            className="flex-1 flex flex-col items-center gap-0.5 py-1"
            onClick={() => setShowRolePicker(true)}
          >
            <User
              size={22}
              style={{ color: "#9B8E82" }}
              strokeWidth={1.8}
            />
            <span className="text-[10px] font-medium" style={{ color: "#9B8E82" }}>我的</span>
          </button>
        </nav>
      )}

      {/* Role picker modal */}
      <AnimatePresence>
        {showRolePicker && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.3)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRolePicker(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
              style={{ background: "#FDFBF7" }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="px-5 pt-5 pb-2 flex items-center justify-between">
                <span className="text-base font-bold" style={{ color: "#2C2420" }}>切换端口</span>
                <button onClick={() => setShowRolePicker(false)}>
                  <ChevronRight size={20} className="rotate-90" style={{ color: "#9B8E82" }} />
                </button>
              </div>
              <div className="px-5 pb-4 space-y-2">
                {ROLE_ITEMS.map(item => {
                  const isActive = item.role === role;
                  return (
                    <button
                      key={item.role}
                      onClick={() => switchRole(item.role)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors"
                      style={{
                        background: isActive ? "#F0F7EC" : "#F9F6F1",
                        border: `1px solid ${isActive ? "#9CB48A" : "#EBE7DF"}`,
                      }}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-semibold" style={{ color: "#2C2420" }}>{item.label}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{item.sub}</div>
                      </div>
                      {isActive
                        ? <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#9CB48A", color: "#fff" }}>当前</span>
                        : <ChevronRight size={16} style={{ color: "#C2BDB7" }} />
                      }
                    </button>
                  );
                })}
              </div>
              <div className="pb-8 px-5 pt-2">
                <button
                  onClick={() => setShowRolePicker(false)}
                  className="w-full py-2.5 rounded-2xl text-sm font-medium"
                  style={{ background: "#F0EDE8", color: "#7D736A" }}
                >
                  取消
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
