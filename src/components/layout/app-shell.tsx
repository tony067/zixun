"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEazo } from "@eazo/sdk/react";
import { cn } from "@/lib/utils";
import {
  Search, CalendarDays, MessageCircle, User,
  LayoutDashboard, ClipboardList, Settings,
} from "lucide-react";

// 不显示底部导航的路由
const HIDE_NAV = ["/chat/"];

type Role = "client" | "counselor" | "admin";

function getRole(path: string): Role {
  if (path.startsWith("/counselor")) return "counselor";
  if (path.startsWith("/admin")) return "admin";
  return "client";
}

const CLIENT_TABS = [
  { href: "/",           icon: Search,        label: "探索" },
  { href: "/bookings",   icon: CalendarDays,  label: "预约" },
  { href: "/messages",   icon: MessageCircle, label: "消息" },
  { href: "/profile",    icon: User,          label: "我" },
];

const COUNSELOR_TABS = [
  { href: "/counselor/schedule",  icon: CalendarDays,   label: "档期" },
  { href: "/counselor/bookings",  icon: ClipboardList,  label: "预约" },
  { href: "/counselor/messages",  icon: MessageCircle,  label: "消息" },
  { href: "/counselor/profile",   icon: User,           label: "我" },
];

const ADMIN_TABS = [
  { href: "/admin",         icon: LayoutDashboard, label: "总览" },
  { href: "/admin/counselors", icon: Settings,     label: "咨询师" },
  { href: "/admin/bookings",   icon: ClipboardList, label: "预约" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = HIDE_NAV.some(p => pathname.startsWith(p));
  const role = getRole(pathname);

  const tabs = role === "counselor" ? COUNSELOR_TABS
             : role === "admin"     ? ADMIN_TABS
             : CLIENT_TABS;

  return (
    <div className="flex flex-col min-h-svh" style={{ background: "var(--color-mp-surface)" }}>
      {/* Main content */}
      <main className={cn("flex-1", !hideNav && "pb-[env(safe-area-inset-bottom,0px)] pb-16 md:pb-0 md:pl-60")}>
        {children}
      </main>

      {/* Desktop sidebar */}
      {!hideNav && (
        <nav
          className="hidden md:flex flex-col fixed inset-y-0 left-0 w-60 border-r z-20 px-3 py-6 gap-1"
          style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}
        >
          <div className="px-3 mb-6">
            <span className="text-xl font-bold" style={{ color: "var(--color-mp-primary)" }}>MindPace</span>
          </div>

          {/* Role switcher pills */}
          <div className="flex gap-1 mb-4 px-1">
            {(["client","counselor","admin"] as Role[]).map(r => (
              <Link
                key={r}
                href={r === "client" ? "/" : r === "counselor" ? "/counselor/schedule" : "/admin"}
                className={cn(
                  "flex-1 text-center py-1 rounded-full text-[11px] font-semibold transition-colors",
                  role === r
                    ? "text-white"
                    : "text-[var(--color-mp-muted)] hover:text-[var(--color-mp-text)]"
                )}
                style={role === r ? { background: "var(--color-mp-primary)" } : {}}
              >
                {r === "client" ? "来访" : r === "counselor" ? "咨询师" : "管理"}
              </Link>
            ))}
          </div>

          {tabs.map(tab => {
            const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "text-white"
                    : "text-[var(--color-mp-muted)] hover:text-[var(--color-mp-text)] hover:bg-[var(--color-mp-surface)]"
                )}
                style={active ? { background: "var(--color-mp-primary)" } : {}}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Mobile bottom tab bar */}
      {!hideNav && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-20 flex border-t pb-[env(safe-area-inset-bottom,0px)]"
          style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}
        >
          {tabs.map(tab => {
            const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors"
                style={{ color: active ? "var(--color-mp-primary)" : "var(--color-mp-faint)" }}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </Link>
            );
          })}

          {/* 角色切换小按钮 */}
          <div className="absolute -top-8 right-3 flex gap-1">
            {(["client","counselor","admin"] as Role[]).map(r => (
              <Link
                key={r}
                href={r === "client" ? "/" : r === "counselor" ? "/counselor/schedule" : "/admin"}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors",
                  role === r ? "text-white border-transparent" : "border-[var(--color-mp-border)] text-[var(--color-mp-faint)]"
                )}
                style={role === r ? { background: "var(--color-mp-primary)" } : { background: "var(--color-mp-card)" }}
              >
                {r === "client" ? "来访" : r === "counselor" ? "咨询" : "管理"}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
