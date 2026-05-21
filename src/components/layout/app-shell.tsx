"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, CalendarDays, MessageCircle, User, LayoutDashboard } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { cn } from "@/utils/utils";

const CLIENT_TABS = [
  { href: "/", icon: Search, label: "探索" },
  { href: "/my-bookings", icon: CalendarDays, label: "预约" },
  { href: "/messages", icon: MessageCircle, label: "消息" },
  { href: "/profile", icon: User, label: "我的" },
];

const COUNSELOR_TABS = [
  { href: "/counselor/bookings", icon: CalendarDays, label: "预约" },
  { href: "/counselor/schedule", icon: LayoutDashboard, label: "档期" },
  { href: "/messages", icon: MessageCircle, label: "消息" },
  { href: "/profile", icon: User, label: "我的" },
];

const HIDE_NAV = ["/booking-time", "/chat/"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useEazo((s) => s.auth.user);

  const hideNav = HIDE_NAV.some((p) => pathname.startsWith(p));

  const isCounselor = (user as any)?.role === "counselor";
  const isAdmin = (user as any)?.role === "admin";
  const tabs = isCounselor ? COUNSELOR_TABS : CLIENT_TABS;

  if (isAdmin) {
    return <div className="min-h-svh" style={{ background: "var(--color-mp-surface)" }}>{children}</div>;
  }

  return (
    <div className="min-h-svh flex flex-col" style={{ background: "var(--color-mp-surface)" }}>
      <main className={cn("flex-1", !hideNav && "pb-[calc(4rem+env(safe-area-inset-bottom))]")}>
        {children}
      </main>

      {!hideNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 flex border-t"
          style={{
            background: "var(--color-mp-card)",
            borderColor: "var(--color-mp-border)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {tabs.map(({ href, icon: Icon, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-[var(--color-mp-primary)]" : "text-[var(--color-mp-faint)]"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
