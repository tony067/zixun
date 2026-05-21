"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Calendar, MessageCircle, User, LayoutDashboard, Users } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";

const CLIENT_TABS = [
  { href: "/", icon: Home, label: "首页" },
  { href: "/my-bookings", icon: Calendar, label: "预约" },
  { href: "/messages", icon: MessageCircle, label: "消息" },
  { href: "/profile", icon: User, label: "我的" },
];
const COUNSELOR_TABS = [
  { href: "/counselor/bookings", icon: LayoutDashboard, label: "预约" },
  { href: "/counselor/schedule", icon: Calendar, label: "档期" },
  { href: "/messages", icon: MessageCircle, label: "消息" },
  { href: "/profile", icon: User, label: "我的" },
];
const ADMIN_TABS = [
  { href: "/admin", icon: LayoutDashboard, label: "总览" },
  { href: "/admin/counselors", icon: Users, label: "咨询师" },
  { href: "/messages", icon: MessageCircle, label: "消息" },
];

const HIDE_NAV = ["/chat/", "/booking-time/", "/booking-success"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useEazo((s) => s.auth.user);

  const hideNav = HIDE_NAV.some(p => pathname.startsWith(p));

  // Role detection from path prefix or user
  const isCounselor = pathname.startsWith("/counselor") || (user as any)?.role === "counselor";
  const isAdmin = pathname.startsWith("/admin") || (user as any)?.role === "admin";
  const tabs = isAdmin ? ADMIN_TABS : isCounselor ? COUNSELOR_TABS : CLIENT_TABS;

  return (
    <div className="flex flex-col min-h-svh max-w-2xl mx-auto relative">
      {children}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center">
          <div className="w-full max-w-2xl flex border-t"
            style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}>
            {tabs.map(tab => {
              const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
              return (
                <Link key={tab.href} href={tab.href}
                  className="flex-1 flex flex-col items-center gap-0.5 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)]"
                  style={{ color: active ? "var(--color-mp-primary)" : "var(--color-mp-faint)" }}>
                  <tab.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
