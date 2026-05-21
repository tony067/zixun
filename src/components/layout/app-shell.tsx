"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Calendar, MessageCircle, User, Briefcase, BarChart2 } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { UserBadge } from "@/components/user-profile/user-badge";

const HIDE_SHELL = ["/chat/"];

// Client-side role detection: URLs starting with /counselor → counselor; /admin → admin; else client
function useRole() {
  const path = usePathname();
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/counselor")) return "counselor";
  return "client";
}

const CLIENT_TABS = [
  { href: "/", label: "探索", Icon: Home },
  { href: "/my-bookings", label: "预约", Icon: Calendar },
  { href: "/messages", label: "消息", Icon: MessageCircle },
  { href: "/profile", label: "我", Icon: User },
];

const COUNSELOR_TABS = [
  { href: "/counselor/bookings", label: "预约", Icon: Calendar },
  { href: "/counselor/schedule", label: "档期", Icon: Briefcase },
  { href: "/counselor/stats", label: "统计", Icon: BarChart2 },
  { href: "/messages", label: "消息", Icon: MessageCircle },
];

const ADMIN_TABS = [
  { href: "/admin", label: "概览", Icon: BarChart2 },
  { href: "/admin/counselors", label: "咨询师", Icon: User },
  { href: "/messages", label: "消息", Icon: MessageCircle },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const role = useRole();

  if (HIDE_SHELL.some(p => path.startsWith(p))) {
    return <>{children}</>;
  }

  const tabs = role === "admin" ? ADMIN_TABS : role === "counselor" ? COUNSELOR_TABS : CLIENT_TABS;

  return (
    <div className="flex flex-col min-h-svh" style={{ background: "var(--color-mp-surface)" }}>
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 pt-safe-top py-3 border-b"
        style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}>
        <span className="text-base font-semibold" style={{ color: "var(--color-mp-primary)" }}>MindPace</span>
        <div className="flex items-center gap-3">
          {/* Role switcher for demo */}
          <div className="flex gap-1 text-[10px]">
            {[["client","/"],["counselor","/counselor/bookings"],["admin","/admin"]].map(([r,href])=>(
              <Link key={r} href={href}
                className="px-2 py-0.5 rounded-full border transition-colors"
                style={role===r
                  ? { background:"var(--color-mp-primary)", color:"#fff", borderColor:"var(--color-mp-primary)" }
                  : { background:"transparent", color:"var(--color-mp-muted)", borderColor:"var(--color-mp-border)" }
                }>
                {r==="client"?"来访":r==="counselor"?"咨询师":"管理"}
              </Link>
            ))}
          </div>
          <UserBadge />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t pb-safe-bottom"
        style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}>
        {tabs.map(({ href, label, Icon }) => {
          const active = path === href || (href !== "/" && path.startsWith(href));
          return (
            <Link key={href} href={href} className="flex-1 flex flex-col items-center gap-0.5 py-2 transition-opacity"
              style={{ color: active ? "var(--color-mp-primary)" : "var(--color-mp-faint)" }}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
