"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, CalendarDays, MessageCircle, User, LayoutDashboard, ClipboardList, BookOpen, BarChart2, Settings } from "lucide-react";

const CLIENT_TABS = [
  { href: "/", icon: Search, label: "探索" },
  { href: "/my-bookings", icon: CalendarDays, label: "预约" },
  { href: "/messages", icon: MessageCircle, label: "消息" },
];

const COUNSELOR_TABS = [
  { href: "/counselor/bookings", icon: ClipboardList, label: "预约" },
  { href: "/counselor/schedule", icon: CalendarDays, label: "档期" },
  { href: "/counselor/stats", icon: BarChart2, label: "统计" },
  { href: "/messages", icon: MessageCircle, label: "消息" },
];

const ADMIN_TABS = [
  { href: "/admin", icon: LayoutDashboard, label: "总览" },
  { href: "/messages", icon: MessageCircle, label: "消息" },
];

const HIDE_NAV = ["/booking/", "/chat/"];

type Role = "client" | "counselor" | "admin";

function detectRole(path: string): Role {
  if (path.startsWith("/counselor")) return "counselor";
  if (path.startsWith("/admin")) return "admin";
  return "client";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const role = detectRole(pathname);
  const tabs = role === "counselor" ? COUNSELOR_TABS : role === "admin" ? ADMIN_TABS : CLIENT_TABS;
  const hideNav = HIDE_NAV.some(p => pathname.includes(p));

  return (
    <div className="min-h-svh flex flex-col" style={{ background: "var(--color-mp-surface)" }}>
      <main className={`flex-1 w-full max-w-2xl mx-auto px-0 ${hideNav ? "" : "pb-20"}`}>
        {children}
      </main>

      {!hideNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 flex justify-around px-2 pb-[env(safe-area-inset-bottom)]"
          style={{
            background: "var(--color-mp-card)",
            borderTop: "1px solid var(--color-mp-border)",
            boxShadow: "0 -4px 16px rgba(59,51,44,0.06)",
          }}
        >
          {tabs.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 py-2.5 px-4 transition-colors"
                style={{ color: active ? "var(--color-mp-primary)" : "var(--color-mp-faint)" }}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}

          {/* 角色切换 */}
          <button
            onClick={() => {
              const next = role === "client" ? "/counselor/bookings" : role === "counselor" ? "/admin" : "/";
              window.location.href = next;
            }}
            className="flex flex-col items-center gap-0.5 py-2.5 px-3 transition-colors opacity-40"
          >
            <User size={18} strokeWidth={1.6} style={{ color: "var(--color-mp-muted)" }} />
            <span className="text-[9px]" style={{ color: "var(--color-mp-faint)" }}>
              {role === "client" ? "来访" : role === "counselor" ? "咨询师" : "管理"}
            </span>
          </button>
        </nav>
      )}
    </div>
  );
}
