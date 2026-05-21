"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, MessageCircle, User, LayoutDashboard, Users, BookOpen } from "lucide-react";

const CLIENT_TABS = [
  { href: "/",              icon: Home,           label: "探索" },
  { href: "/my-bookings",   icon: BookOpen,       label: "预约" },
  { href: "/messages",      icon: MessageCircle,  label: "消息" },
  { href: "/profile",       icon: User,           label: "我的" },
];

const COUNSELOR_TABS = [
  { href: "/counselor/schedule",  icon: Calendar,       label: "档期" },
  { href: "/counselor/bookings",  icon: BookOpen,       label: "预约" },
  { href: "/counselor/messages",  icon: MessageCircle,  label: "消息" },
  { href: "/counselor/profile",   icon: User,           label: "档案" },
];

const ADMIN_TABS = [
  { href: "/admin",         icon: LayoutDashboard, label: "概览" },
  { href: "/admin/counselors", icon: Users,        label: "咨询师" },
];

const HIDE_BOTTOM_NAV = ["/booking-time", "/booking-success", "/chat/"];

export function AppShell({ children, role = "client" }: {
  children: React.ReactNode;
  role?: "client" | "counselor" | "admin";
}) {
  const path = usePathname();
  const hideBtmNav = HIDE_BOTTOM_NAV.some(p => path.startsWith(p));
  const tabs = role === "counselor" ? COUNSELOR_TABS : role === "admin" ? ADMIN_TABS : CLIENT_TABS;

  return (
    <div className="flex flex-col min-h-svh" style={{ background: "var(--color-mp-surface)" }}>
      <main className={`flex-1 ${hideBtmNav ? "" : "pb-16 md:pb-0 md:pl-56"}`}>
        {children}
      </main>

      {/* Desktop sidebar */}
      {!hideBtmNav && (
        <nav className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-56 border-r py-6 px-3 gap-1"
          style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}>
          <div className="px-3 mb-4">
            <span className="text-lg font-bold" style={{ color: "var(--color-mp-primary)" }}>MindPace</span>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--color-mp-faint)" }}>神经多样性友好平台</div>
          </div>
          {tabs.map(({ href, icon: Icon, label }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: active ? "var(--color-mp-secondary)" : "transparent",
                  color: active ? "var(--color-mp-primary)" : "var(--color-mp-muted)",
                }}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Mobile bottom tab bar */}
      {!hideBtmNav && (
        <nav className="fixed bottom-0 left-0 right-0 md:hidden flex border-t z-30"
          style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)",
                   paddingBottom: "env(safe-area-inset-bottom)" }}>
          {tabs.map(({ href, icon: Icon, label }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link key={href} href={href}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors"
                style={{ color: active ? "var(--color-mp-primary)" : "var(--color-mp-faint)" }}>
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
