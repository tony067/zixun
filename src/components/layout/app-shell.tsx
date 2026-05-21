"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, CalendarDays, MessageCircle, User, LayoutDashboard } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";

const CLIENT_TABS = [
  { href: "/",               icon: Search,          label: "探索" },
  { href: "/my-bookings",    icon: CalendarDays,    label: "预约" },
  { href: "/messages",       icon: MessageCircle,   label: "消息" },
  { href: "/profile",        icon: User,            label: "我的" },
];

const COUNSELOR_TABS = [
  { href: "/counselor/bookings",  icon: CalendarDays,    label: "预约" },
  { href: "/counselor/schedule",  icon: LayoutDashboard, label: "档期" },
  { href: "/messages",            icon: MessageCircle,   label: "消息" },
  { href: "/profile",             icon: User,            label: "我的" },
];

const ADMIN_TABS = [
  { href: "/admin",     icon: LayoutDashboard, label: "管理台" },
  { href: "/messages",  icon: MessageCircle,   label: "消息" },
  { href: "/profile",   icon: User,            label: "我的" },
];

const HIDE_NAV = ["/booking-time", "/chat/"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useEazo((s) => s.auth.user);

  const hideNav = HIDE_NAV.some(p => pathname.startsWith(p));

  // role detection — counselors and admins arrive via /counselor/* or /admin/*
  const isAdmin     = pathname.startsWith("/admin");
  const isCounselor = pathname.startsWith("/counselor");
  const tabs = isAdmin ? ADMIN_TABS : isCounselor ? COUNSELOR_TABS : CLIENT_TABS;

  return (
    <div className="flex flex-col min-h-svh" style={{ background: "var(--color-mp-surface)" }}>
      <main className={`flex-1 ${hideNav ? "" : "pb-20 md:pb-0"}`}>{children}</main>

      {!hideNav && (
        <>
          {/* Mobile bottom tab bar */}
          <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden"
            style={{ background: "var(--color-mp-card)", borderTop: "1px solid var(--color-mp-border)" }}>
            <div className="flex pb-[env(safe-area-inset-bottom)]">
              {tabs.map(({ href, icon: Icon, label }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link key={href} href={href}
                    className="flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors"
                    style={{ color: active ? "var(--color-mp-primary)" : "var(--color-mp-faint)" }}>
                    <Icon className="w-5 h-5" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Desktop sidebar */}
          <aside className="hidden md:flex fixed left-0 top-0 h-full w-52 flex-col pt-8 pb-4 px-3 gap-1"
            style={{ background: "var(--color-mp-card)", borderRight: "1px solid var(--color-mp-border)" }}>
            <div className="px-3 mb-6">
              <span className="text-base font-bold" style={{ color: "var(--color-mp-primary)" }}>MindPace</span>
            </div>
            {tabs.map(({ href, icon: Icon, label }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link key={href} href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: active ? "var(--color-mp-primary)" : "transparent",
                    color: active ? "#fff" : "var(--color-mp-muted)",
                  }}>
                  <Icon className="w-4 h-4" />{label}
                </Link>
              );
            })}
          </aside>
        </>
      )}
    </div>
  );
}
