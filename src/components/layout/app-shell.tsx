"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/utils/utils";
import { useEazo } from "@eazo/sdk/react";
import UserBadge from "@/components/user-profile/user-badge";

// 底部导航配置（三端自适应）
const CLIENT_TABS = [
  { href: "/",              label: "探索",   icon: "🔍" },
  { href: "/my-bookings",   label: "预约",   icon: "📅" },
  { href: "/messages",      label: "消息",   icon: "💬" },
  { href: "/profile",       label: "我的",   icon: "👤" },
];

const COUNSELOR_TABS = [
  { href: "/counselor/bookings",  label: "预约",  icon: "📋" },
  { href: "/counselor/schedule",  label: "档期",  icon: "🗓️" },
  { href: "/messages",            label: "消息",  icon: "💬" },
  { href: "/counselor/stats",     label: "统计",  icon: "📊" },
];

const ADMIN_TABS = [
  { href: "/admin",         label: "总览",   icon: "🏠" },
  { href: "/admin/counselors", label: "咨询师", icon: "👥" },
  { href: "/admin/bookings",   label: "预约",  icon: "📋" },
];

// 不显示底部导航的页面
const HIDE_NAV = ["/booking-time", "/chat/"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useEazo((s) => s.auth.user);

  const hideNav = HIDE_NAV.some((p) => pathname.startsWith(p));

  // 根据路径判断当前端
  const isCounselor = pathname.startsWith("/counselor");
  const isAdmin = pathname.startsWith("/admin");
  const tabs = isAdmin ? ADMIN_TABS : isCounselor ? COUNSELOR_TABS : CLIENT_TABS;

  return (
    <div className="min-h-svh flex flex-col" style={{ background: "var(--color-mp-surface)" }}>
      {/* 顶栏 */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 pt-safe-top pb-3 border-b"
        style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ background: "var(--color-mp-primary)" }}
          >M</div>
          <span className="text-base font-semibold" style={{ color: "var(--color-mp-text)" }}>
            MindPace
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* 角色切换 */}
          {user && (
            <div className="flex gap-1 text-xs">
              <Link href="/" className={cn(
                "px-2.5 py-1 rounded-full transition-colors",
                !isCounselor && !isAdmin
                  ? "text-white font-semibold"
                  : "text-[var(--color-mp-muted)] hover:text-[var(--color-mp-text)]"
              )}
              style={!isCounselor && !isAdmin ? { background: "var(--color-mp-primary)" } : {}}>
                来访端
              </Link>
              <Link href="/counselor/bookings" className={cn(
                "px-2.5 py-1 rounded-full transition-colors",
                isCounselor
                  ? "text-white font-semibold"
                  : "text-[var(--color-mp-muted)] hover:text-[var(--color-mp-text)]"
              )}
              style={isCounselor ? { background: "var(--color-mp-primary)" } : {}}>
                咨询师
              </Link>
              <Link href="/admin" className={cn(
                "px-2.5 py-1 rounded-full transition-colors",
                isAdmin
                  ? "text-white font-semibold"
                  : "text-[var(--color-mp-muted)] hover:text-[var(--color-mp-text)]"
              )}
              style={isAdmin ? { background: "var(--color-mp-primary)" } : {}}>
                管理员
              </Link>
            </div>
          )}
          <UserBadge />
        </div>
      </header>

      {/* 主内容 */}
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>

      {/* 底部导航 */}
      {!hideNav && (
        <nav
          className="sticky bottom-0 z-30 flex border-t pb-safe-bottom"
          style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}
        >
          {tabs.map((tab) => {
            const active = tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-[var(--color-mp-primary)]" : "text-[var(--color-mp-faint)]"
                )}
              >
                <span className="text-xl leading-none">{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
