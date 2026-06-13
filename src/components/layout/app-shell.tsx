"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, CalendarDays, MessageCircle, User,
  LayoutDashboard, ClipboardList, ShieldCheck, Users,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const CLIENT_TABS = [
  { href: "/",            icon: Home,          label: "首页" },
  { href: "/messages",    icon: MessageCircle, label: "消息" },
];

const COUNSELOR_TABS = [
  { href: "/counselor/bookings",  icon: ClipboardList, label: "预约" },
  { href: "/counselor/schedule",  icon: CalendarDays,  label: "档期" },
  { href: "/counselor/messages",  icon: MessageCircle, label: "消息" },
  { href: "/counselor/profile",   icon: User,          label: "档案" },
];

const ADMIN_TABS = [
  { href: "/admin",              icon: LayoutDashboard, label: "总览" },
  { href: "/admin/counselors",   icon: ShieldCheck,     label: "审核" },
  { href: "/admin/orders",       icon: ClipboardList,   label: "订单" },
  { href: "/admin/users",        icon: Users,           label: "用户" },
];

const HIDE_NAV = ["/booking/", "/chat/", "/counselor/profile", "/counselors/", "/my-bookings", "/settings", "/support", "/favorites"];

type Role = "client" | "counselor" | "admin";

function detectRole(path: string): Role {
  if (path.startsWith("/counselor")) return "counselor";
  if (path.startsWith("/admin"))     return "admin";
  return "client";
}

const MY_ROUTE: Record<Role, string> = {
  client:    "/profile",
  counselor: "/counselor/bookings",
  admin:     "/admin",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  client: (
    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#E4F2F0" }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3A9B8E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
  ),
  counselor: (
    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#E8F0FB" }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4A72C4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.4 2 2 0 0 1 3.05 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 17z"/>
        <path d="M14.5 2a4.5 4.5 0 0 1 4.5 4.5"/>
        <path d="M14.5 6a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1"/>
      </svg>
    </div>
  ),
  admin: (
    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#FEF3C7" }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    </div>
  ),
};

function ClientIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="9" r="4.5" stroke="#4A9B8E" strokeWidth="1.8" fill="none"/>
      <path d="M5 24c0-4.418 4.03-8 9-8s9 3.582 9 8" stroke="#4A9B8E" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  );
}
function CounselorIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 5C10 5 7 8 7 11.5c0 2.5 1.4 4.7 3.5 5.9L14 23l3.5-5.6C19.6 16.2 21 14 21 11.5 21 8 18 5 14 5z" stroke="#7AAF5A" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
      <circle cx="14" cy="11.5" r="2.5" stroke="#7AAF5A" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}
function AdminIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 4L6 7.5v6C6 17.9 9.5 22.3 14 24c4.5-1.7 8-6.1 8-10.5v-6L14 4z" stroke="#6B8EC9" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
      <path d="M10.5 13.5l2.5 2.5 4.5-4.5" stroke="#6B8EC9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const ROLE_ITEMS = [
  { role: "client"   as Role, label: "来访者", sub: "浏览咨询师・预约・消息", Icon: ClientIcon },
  { role: "counselor"as Role, label: "咨询师", sub: "管理预约・档期・档案",  Icon: CounselorIcon },
  { role: "admin"    as Role, label: "管理员", sub: "审核・数据・系统设置",  Icon: AdminIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user } = useAuth();

  // 根据数据库里的 role 字段决定用户能看到哪些端口
  const userDbRole = (user as any)?.role ?? "visitor";
  const visibleRoleItems = ROLE_ITEMS.filter(item => {
    if (item.role === "client")    return true;
    if (item.role === "counselor") return userDbRole === "counselor" || userDbRole === "admin";
    if (item.role === "admin")     return userDbRole === "admin";
    return false;
  });

  const role = detectRole(pathname);
  const tabs = role === "counselor" ? COUNSELOR_TABS
             : role === "admin"     ? ADMIN_TABS
             : CLIENT_TABS;

  const hideNav = HIDE_NAV.some(p => pathname.startsWith(p));

  const [showRolePicker, setShowRolePicker] = useState(false);

  function switchRole(targetRole: Role) {
    setShowRolePicker(false);
    if (!user) {
      router.push("/login");
      return;
    }
    router.push(MY_ROUTE[targetRole]);
  }

  return (
    <div className="relative min-h-svh flex flex-col" style={{ background: "var(--color-surface, #F5F1E8)" }}>
      {/* Main content */}
      <main className={`flex-1 ${hideNav ? "" : "pb-20"}`}>
        {children}
      </main>

      {/* Bottom navigation */}
      {!hideNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 flex items-center px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)]"
          style={{ background: "rgba(245,241,232,0.96)", backdropFilter: "blur(12px)", borderTop: "1px solid #EBE7DF" }}
        >
          {/* 已登录：显示对应角色的 tabs */}
          {user && tabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
            return (
              <Link key={tab.href} href={tab.href} className="flex-1 flex flex-col items-center gap-0.5 py-1">
                <tab.icon
                  size={22}
                  style={{ color: isActive ? "#9CB48A" : "#9B8E82" }}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span className="text-[10px] font-medium" style={{ color: isActive ? "#9CB48A" : "#9B8E82" }}>
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* 未登录：只显示首页 */}
          {!user && (
            <Link href="/" className="flex-1 flex flex-col items-center gap-0.5 py-1">
              <Home size={22} style={{ color: pathname === "/" ? "#9CB48A" : "#9B8E82" }} strokeWidth={pathname === "/" ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium" style={{ color: pathname === "/" ? "#9CB48A" : "#9B8E82" }}>首页</span>
            </Link>
          )}

          {/* 我的 按钮：普通用户直接跳个人页，咨询师/管理员弹切换面板，未登录跳登录页 */}
          <button
            className="flex-1 flex flex-col items-center gap-0.5 py-1"
            onClick={() => {
              if (!user) { router.push("/login"); return; }
              if (userDbRole === "visitor") { router.push("/profile"); return; }
              setShowRolePicker(true);
            }}
          >
            <User
              size={22}
              style={{ color: pathname === "/profile" ? "#9CB48A" : "#9B8E82" }}
              strokeWidth={pathname === "/profile" ? 2.2 : 1.8}
            />
            <span className="text-[10px] font-medium" style={{ color: pathname === "/profile" ? "#9CB48A" : "#9B8E82" }}>我的</span>
          </button>
          {tabs.map(tab => {
            const Icon    = tab.icon;
            const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
            return (
              <Link key={tab.href} href={tab.href}
                className="flex-1 flex flex-col items-center gap-0.5 py-1"
              >
                <Icon
                  size={22}
                  style={{ color: isActive ? "#9CB48A" : "#9B8E82" }}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span className="text-[10px] font-medium" style={{ color: isActive ? "#9CB48A" : "#9B8E82" }}>
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* 我的 按钮：普通用户直接跳个人页，咨询师/管理员才弹切换面板 */}
          <button
            className="flex-1 flex flex-col items-center gap-0.5 py-1"
            onClick={() => {
              if (userDbRole === "visitor") {
                router.push("/profile");
              } else {
                setShowRolePicker(true);
              }
            }}
          >
            <User
              size={22}
              style={{ color: "#9B8E82" }}
              strokeWidth={1.8}
            />
            <span className="text-[10px] font-medium" style={{ color: "#9B8E82" }}>我的</span>
          </button>
        </nav>
      )}

      {/* Role picker modal */}
      <AnimatePresence>
        {showRolePicker && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.3)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRolePicker(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
              style={{ background: "#FDFBF7" }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="px-5 pt-5 pb-2 flex items-center justify-between">
                <span className="text-base font-bold" style={{ color: "#2C2420" }}>切换端口</span>
                <button onClick={() => setShowRolePicker(false)}>
                  <ChevronRight size={20} className="rotate-90" style={{ color: "#9B8E82" }} />
                </button>
              </div>
              <div className="px-5 pb-4 space-y-2">
                {visibleRoleItems.map(item => {
                  const isActive = item.role === role;
                  return (
                    <button
                      key={item.role}
                      onClick={() => switchRole(item.role)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors"
                      style={{
                        background: isActive ? "#F0F7EC" : "#F9F6F1",
                        border: `1px solid ${isActive ? "#9CB48A" : "#EBE7DF"}`,
                      }}
                    >
                      {ROLE_ICONS[item.role]}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-semibold" style={{ color: "#2C2420" }}>{item.label}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{item.sub}</div>
                      </div>
                      {isActive
                        ? <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#9CB48A", color: "#fff" }}>当前</span>
                        : <ChevronRight size={16} style={{ color: "#C2BDB7" }} />
                      }
                    </button>
                  );
                })}
              </div>
              <div className="pb-8 px-5 pt-2">
                <button
                  onClick={() => setShowRolePicker(false)}
                  className="w-full py-2.5 rounded-2xl text-sm font-medium"
                  style={{ background: "#F0EDE8", color: "#7D736A" }}
                >
                  取消
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
