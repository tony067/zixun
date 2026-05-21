"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Calendar, MessageCircle, User, LayoutDashboard, BookOpen, Settings } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { UserBadge } from "@/components/user-profile/user-badge";

// 不显示底部导航的路径
const HIDE_NAV = ["/chat/"];

// 来访端 tab
const CLIENT_TABS = [
  { href: "/", icon: Search, label: "探索" },
  { href: "/my-bookings", icon: BookOpen, label: "预约" },
  { href: "/messages", icon: MessageCircle, label: "消息" },
  { href: "/profile", icon: User, label: "我的" },
];

// 咨询师端 tab
const COUNSELOR_TABS = [
  { href: "/counselor/bookings", icon: BookOpen, label: "预约" },
  { href: "/counselor/schedule", icon: Calendar, label: "档期" },
  { href: "/messages", icon: MessageCircle, label: "消息" },
  { href: "/counselor/profile", icon: User, label: "我的" },
];

// 管理端 tab
const ADMIN_TABS = [
  { href: "/admin", icon: LayoutDashboard, label: "概览" },
  { href: "/admin/counselors", icon: User, label: "咨询师" },
  { href: "/messages", icon: MessageCircle, label: "消息" },
  { href: "/admin/settings", icon: Settings, label: "设置" },
];

function getTabsForPath(pathname: string) {
  if (pathname.startsWith("/admin")) return ADMIN_TABS;
  if (pathname.startsWith("/counselor")) return COUNSELOR_TABS;
  return CLIENT_TABS;
}

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useEazo((s) => s.auth.user);
  const hideNav = HIDE_NAV.some((p) => pathname.startsWith(p));
  const tabs = getTabsForPath(pathname);

  return (
    <div className="flex flex-col min-h-svh" style={{ background: "var(--color-mp-surface)" }}>
      {/* 顶部 header（桌面侧边栏候选区域，移动端只有 logo + user） */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-4 h-14 border-b md:hidden"
        style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <span className="text-base font-bold" style={{ color: "var(--color-mp-primary)" }}>MindPace</span>
        </Link>
        <UserBadge />
      </header>

      {/* 内容区 */}
      <main className="flex-1 w-full max-w-2xl mx-auto pb-[calc(env(safe-area-inset-bottom)+64px)] md:pb-8">
        {children}
      </main>

      {/* 底部导航（移动端） */}
      {!hideNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-20 flex md:hidden border-t"
          style={{
            background: "var(--color-mp-card)",
            borderColor: "var(--color-mp-border)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {tabs.map((tab) => {
            const active = isActive(tab.href, pathname);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[52px]"
              >
                <tab.icon
                  className="w-5 h-5"
                  style={{ color: active ? "var(--color-mp-primary)" : "var(--color-mp-faint)" }}
                />
                <span
                  className="text-[10px] font-medium"
                  style={{ color: active ? "var(--color-mp-primary)" : "var(--color-mp-faint)" }}
                >
                  {tab.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="nav-dot"
                    className="absolute bottom-1 w-1 h-1 rounded-full"
                    style={{ background: "var(--color-mp-primary)" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
