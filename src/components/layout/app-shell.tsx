"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, CalendarDays, MessageCircle, User,
  LayoutDashboard, ClipboardList, BarChart2,
  X, ChevronRight,
} from "lucide-react";
import { useEazo } from "@eazo/sdk/react";

const CLIENT_TABS = [
  { href: "/",            icon: Home,          label: "首页" },
  { href: "/my-bookings", icon: CalendarDays,  label: "预约" },
  { href: "/messages",    icon: MessageCircle, label: "消息" },
];

const COUNSELOR_TABS = [
  { href: "/counselor/bookings",  icon: ClipboardList, label: "预约" },
  { href: "/counselor/schedule",  icon: CalendarDays,  label: "档期" },
  { href: "/messages",            icon: MessageCircle, label: "消息" },
  { href: "/counselor/profile",   icon: User,          label: "档案" },
];

const ADMIN_TABS = [
  { href: "/admin",    icon: LayoutDashboard, label: "总览" },
  { href: "/messages", icon: MessageCircle,   label: "消息" },
];

const HIDE_NAV = ["/booking/", "/chat/"];

type Role = "client" | "counselor" | "admin";

function detectRole(path: string): Role {
  if (path.startsWith("/counselor")) return "counselor";
  if (path.startsWith("/admin"))     return "admin";
  return "client";
}

// 各端口「我的」页面路由
const MY_ROUTE: Record<Role, string> = {
  client:    "/profile",
  counselor: "/counselor/profile",
  admin:     "/admin/settings",
};

const ROLE_OPTIONS: { role: Role; label: string; sub: string; icon: string }[] = [
  { role: "client",    label: "来访者",  sub: "浏览咨询师、管理预约",   icon: "🌿" },
  { role: "counselor", label: "咨询师",  sub: "档期管理、接受来访预约",  icon: "🧠" },
  { role: "admin",     label: "管理员",  sub: "平台总览、咨询师审核",    icon: "🛡️" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const user     = useEazo((s) => s.auth.user);

  const role    = detectRole(pathname);
  const tabs    = role === "counselor" ? COUNSELOR_TABS : role === "admin" ? ADMIN_TABS : CLIENT_TABS;
  const hideNav = HIDE_NAV.some((p) => pathname.startsWith(p));

  const [showRolePicker, setShowRolePicker] = useState(false);

  const myRoute  = MY_ROUTE[role];
  const myActive = pathname === myRoute || pathname.startsWith(myRoute + "/");

  const handleMyPress = () => {
    // 始终先弹出端口选择器，让用户选择后跳转
    setShowRolePicker(true);
  };

  return (
    <div className="flex flex-col min-h-svh" style={{ background: "#F5F1E8" }}>
      {/* 主内容 */}
      <main className={`flex-1 ${hideNav ? "" : "pb-[calc(56px+env(safe-area-inset-bottom))]"}`}>
        {children}
      </main>

      {/* 底部导航 */}
      {!hideNav && (
        <nav
          className="fixed bottom-0 inset-x-0 z-20 flex border-t"
          style={{
            background: "#FDFBF7",
            borderColor: "#EBE7DF",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {/* 前3个常规 tab */}
          {tabs.map(({ href, icon: Icon, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href} href={href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors"
                style={{ color: active ? "#9CB48A" : "#C2BDB7" }}
              >
                <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}

          {/* 「我的」按钮（第4个）*/}
          <button
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative"
            style={{ color: myActive ? "#9CB48A" : "#C2BDB7" }}
            onClick={handleMyPress}
          >
            <User size={22} strokeWidth={myActive ? 2.2 : 1.8} />
            <span className="text-[10px] font-medium">我的</span>
            {/* 当前端口小徽标 */}
            <span className="absolute top-1.5 right-[calc(50%-18px)] text-[8px] leading-none px-1 py-0.5 rounded-full"
              style={{ background: "#F0EBF8", color: "#A030A0" }}>
              {role === "client" ? "来访" : role === "counselor" ? "咨询师" : "管理"}
            </span>
          </button>
        </nav>
      )}

      {/* 端口选择弹窗 */}
      <AnimatePresence>
        {showRolePicker && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/30 z-40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRolePicker(false)}
            />
            <motion.div
              className="fixed bottom-0 inset-x-0 z-50 rounded-t-3xl"
              style={{ background: "#FDFBF7" }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-2" style={{ background: "#DDD8D0" }} />
              <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#EBE7DF" }}>
                <span className="text-base font-semibold" style={{ color: "#2C2420" }}>切换身份</span>
                <button onClick={() => setShowRolePicker(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "#F5F1E8" }}>
                  <X size={16} style={{ color: "#7D736A" }} />
                </button>
              </div>
              <div className="px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+16px)] space-y-2">
                {ROLE_OPTIONS.map((item) => {
                  const isActive = item.role === role;
                  const dest     = MY_ROUTE[item.role];
                  return (
                    <Link key={item.role} href={dest}
                      onClick={() => setShowRolePicker(false)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-colors"
                      style={{
                        background: isActive ? "rgba(156,180,138,0.08)" : "#F5F1E8",
                        borderColor: isActive ? "#9CB48A" : "#EBE7DF",
                      }}>
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold" style={{ color: "#2C2420" }}>{item.label}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{item.sub}</div>
                      </div>
                      {isActive
                        ? <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "#9CB48A", color: "#fff" }}>当前</span>
                        : <ChevronRight size={16} style={{ color: "#C2BDB7" }} />
                      }
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
