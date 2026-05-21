"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Calendar, MessageCircle, User, ClipboardList, BarChart2, Users } from "lucide-react";

type Role = "client" | "counselor" | "admin";

function getRole(path: string): Role {
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/counselor")) return "counselor";
  return "client";
}

const CLIENT_TABS = [
  { href: "/",           icon: Home,          label: "探索" },
  { href: "/bookings",   icon: ClipboardList, label: "预约" },
  { href: "/messages",   icon: MessageCircle, label: "消息" },
  { href: "/profile",    icon: User,          label: "我" },
];

const COUNSELOR_TABS = [
  { href: "/counselor/bookings",  icon: ClipboardList, label: "预约" },
  { href: "/counselor/schedule",  icon: Calendar,      label: "档期" },
  { href: "/counselor/messages",  icon: MessageCircle, label: "消息" },
  { href: "/counselor/stats",     icon: BarChart2,     label: "统计" },
];

const ADMIN_TABS = [
  { href: "/admin",               icon: BarChart2,     label: "总览" },
  { href: "/admin/counselors",    icon: Users,         label: "咨询师" },
  { href: "/admin/bookings",      icon: ClipboardList, label: "预约" },
  { href: "/admin/messages",      icon: MessageCircle, label: "消息" },
];

const HIDE_NAV = ["/booking-time", "/chat/"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const role = getRole(pathname);
  const tabs = role === "counselor" ? COUNSELOR_TABS : role === "admin" ? ADMIN_TABS : CLIENT_TABS;
  const hideNav = HIDE_NAV.some((p) => pathname.startsWith(p));

  return (
    <div className="flex flex-col min-h-svh" style={{ background: "var(--color-mp-surface)" }}>
      <main className={`flex-1 ${hideNav ? "" : "pb-[calc(64px+env(safe-area-inset-bottom))]"}`}>
        {children}
      </main>

      {!hideNav && (
        <nav
          className="fixed bottom-0 inset-x-0 z-30 flex border-t border-[#EBE7DF]"
          style={{
            background: "#FDFBF7",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {tabs.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
                style={{ color: active ? "var(--color-mp-primary)" : "var(--color-mp-faint)" }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}

          {/* Role switcher (dev convenience) */}
          <div className="absolute right-2 top-1 flex gap-1">
            {([["来", "/"], ["师", "/counselor/bookings"], ["管", "/admin"]] as const).map(([lbl, href]) => (
              <Link key={href} href={href}
                className="text-[9px] px-1.5 py-0.5 rounded-full border"
                style={{
                  background: pathname.startsWith(href === "/" ? "/" : href) && href !== "/" || (href === "/" && role === "client")
                    ? "var(--color-mp-primary)" : "var(--color-mp-surface)",
                  color: pathname.startsWith(href === "/" ? "/" : href) && href !== "/" || (href === "/" && role === "client")
                    ? "#fff" : "var(--color-mp-muted)",
                  borderColor: "var(--color-mp-border)",
                }}>
                {lbl}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
