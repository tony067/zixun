"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, CalendarDays, MessageCircle, User,
  LayoutDashboard, ClipboardList, BarChart2,
  ChevronUp,
} from "lucide-react";

// 来访端 tab
const CLIENT_TABS = [
  { href: "/",            icon: Home,          label: "首页" },
  { href: "/my-bookings", icon: CalendarDays,  label: "预约" },
  { href: "/messages",    icon: MessageCircle, label: "消息" },
];

// 咨询师端 tab
const COUNSELOR_TABS = [
  { href: "/counselor/bookings",  icon: ClipboardList, label: "预约" },
  { href: "/counselor/schedule",  icon: CalendarDays,  label: "档期" },
  { href: "/counselor/stats",     icon: BarChart2,     label: "统计" },
  { href: "/messages",            icon: MessageCircle, label: "消息" },
];

// 管理员端 tab
const ADMIN_TABS = [
  { href: "/admin",    icon: LayoutDashboard, label: "总览" },
  { href: "/messages", icon: MessageCircle,   label: "消息" },
];

// 路由不显示底部导航
const HIDE_NAV = ["/booking/", "/chat/"];

type Role = "client" | "counselor" | "admin";

function detectRole(path: string): Role {
  if (path.startsWith("/counselor")) return "counselor";
  if (path.startsWith("/admin"))     return "admin";
  return "client";
}

// 各端口「我的」页面路由
const MY_ROUTE: Record<Role, string> = {
  client:    "/profile",
  counselor: "/counselor/profile",
  admin:     "/admin/settings",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const role = detectRole(pathname);
  const tabs = role === "counselor" ? COUNSELOR_TABS
             : role === "admin"     ? ADMIN_TABS
             : CLIENT_TABS;
  const hideNav = HIDE_NAV.some((p) => pathname.startsWith(p));

  const [showRolePicker, setShowRolePicker] = useState(false);

  // 「我的」按钮是否高亮（在自己的我的页面时）
  const myRoute = MY_ROUTE[role];
  const myActive = pathname === myRoute;

  return (
    <div className="flex flex-col min-h-svh" style={{ background: "var(--color-mp-surface)" }}>
      {/* 主内容 */}
      <main className={`flex-1 ${hideNav ? "" : "pb-[calc(56px+env(safe-area-inset-bottom))]"}`}>
        {children}
      </main>

      {/* 底部导航 */}
      {!hideNav && (
        <nav
          className="fixed bottom-0 inset-x-0 z-30 flex"
          style={{
            background: "var(--color-mp-card)",
            borderTop: "1px solid var(--color-mp-border)",
            paddingBottom: "env(safe-area-inset-bottom)",
            height: "calc(56px + env(safe-area-inset-bottom))",
          }}
        >
          {/* 常规 tab */}
          {tabs.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors"
                style={{ color: active ? "var(--color-mp-primary)" : "var(--color-mp-faint)" }}
              >
                <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}

          {/* 我的按钮（第4个，打开角色选择弹窗或跳我的页面） */}
          <button
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors relative"
            style={{ color: myActive ? "var(--color-mp-primary)" : "var(--color-mp-faint)" }}
            onClick={() => setShowRolePicker((v) => !v)}
          >
            <User size={22} strokeWidth={myActive ? 2.2 : 1.8} />
            <span className="text-[10px] font-medium">我的</span>
          </button>
        </nav>
      )}

      {/* 角色/我的 选择弹窗 */}
      <AnimatePresence>
        {showRolePicker && (
          <>
            {/* 遮罩 */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/20"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRolePicker(false)}
            />
            {/* 弹出面板 */}
            <motion.div
              className="fixed bottom-0 inset-x-0 z-50 rounded-t-2xl px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)]"
              style={{ background: "var(--color-mp-card)" }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--color-mp-border)" }} />
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--color-mp-muted)" }}>选择身份 · 跳转我的页面</p>
              <div className="space-y-2">
                {([
                  { role: "client",    label: "来访者",  sub: "查看预约、收藏咨询师",   href: "/profile",             active: role === "client" },
                  { role: "counselor", label: "咨询师",  sub: "档案、档期、预约管理",   href: "/counselor/bookings",  active: role === "counselor" },
                  { role: "admin",     label: "管理员",  sub: "平台管理控制台",         href: "/admin",               active: role === "admin" },
                ] as const).map((item) => (
                  <Link
                    key={item.role}
                    href={item.href}
                    onClick={() => setShowRolePicker(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-2xl transition-colors"
                    style={{
                      background: item.active ? "rgba(156,180,138,0.12)" : "var(--color-mp-surface)",
                      border: `1px solid ${item.active ? "var(--color-mp-primary)" : "var(--color-mp-border)"}`,
                    }}
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-mp-text)" }}>{item.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-mp-muted)" }}>{item.sub}</p>
                    </div>
                    {item.active && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "var(--color-mp-primary)", color: "#fff" }}>当前</span>
                    )}
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
