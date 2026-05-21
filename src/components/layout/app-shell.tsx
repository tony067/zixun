"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, CalendarDays, MessageCircle, User, LayoutDashboard, ClipboardList, Users } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { auth } from "@eazo/sdk";
import { UserBadge } from "@/components/user-profile/user-badge";

const CLIENT_TABS = [
  { href: "/",          icon: Search,        label: "探索" },
  { href: "/bookings",  icon: CalendarDays,  label: "预约" },
  { href: "/messages",  icon: MessageCircle, label: "消息" },
  { href: "/profile",   icon: User,          label: "我的" },
];

const COUNSELOR_TABS = [
  { href: "/counselor/bookings",  icon: ClipboardList, label: "预约" },
  { href: "/counselor/schedule",  icon: CalendarDays,  label: "档期" },
  { href: "/counselor/messages",  icon: MessageCircle, label: "消息" },
  { href: "/counselor/profile",   icon: User,          label: "我的" },
];

const ADMIN_TABS = [
  { href: "/admin",           icon: LayoutDashboard, label: "概览" },
  { href: "/admin/counselors",icon: Users,           label: "咨询师" },
  { href: "/admin/bookings",  icon: ClipboardList,   label: "预约" },
];

const HIDE_BOTTOM_NAV = ["/booking-time"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useEazo((s) => s.auth.user);

  const isCounselor = pathname.startsWith("/counselor");
  const isAdmin = pathname.startsWith("/admin");
  const tabs = isAdmin ? ADMIN_TABS : isCounselor ? COUNSELOR_TABS : CLIENT_TABS;
  const hideNav = HIDE_BOTTOM_NAV.some(p => pathname.startsWith(p));

  return (
    <div className="flex flex-col min-h-svh" style={{ background: "var(--color-mp-surface)" }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-5 pt-12 pb-3 border-b md:pt-4"
        style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)" }}
      >
        <span className="text-lg font-bold" style={{ color: "var(--color-mp-primary)" }}>MindPace</span>
        <div className="flex items-center gap-2">
          {/* Role switcher pill (dev helper) */}
          {!isAdmin && !isCounselor && (
            <Link href="/counselor/schedule" className="text-[11px] px-2 py-1 rounded-full border"
              style={{ borderColor: "var(--color-mp-border)", color: "var(--color-mp-muted)" }}>
              咨询师端
            </Link>
          )}
          {isCounselor && (
            <Link href="/" className="text-[11px] px-2 py-1 rounded-full border"
              style={{ borderColor: "var(--color-mp-border)", color: "var(--color-mp-muted)" }}>
              来访端
            </Link>
          )}
          <UserBadge />
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom nav */}
      {!hideNav && (
        <nav
          className="fixed bottom-0 inset-x-0 z-20 flex border-t md:hidden"
          style={{
            background: "var(--color-mp-card)",
            borderColor: "var(--color-mp-border)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {tabs.map(({ href, icon: Icon, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors"
                style={{ color: active ? "var(--color-mp-primary)" : "var(--color-mp-faint)" }}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
