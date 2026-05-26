"use client";
import { useEazo } from "@eazo/sdk/react";
import { auth } from "@eazo/sdk";
import { motion } from "framer-motion";
import Link from "next/link";
import { User, CalendarDays, MessageCircle, LogOut, Settings } from "lucide-react";

export default function ProfilePage() {
  const user = useEazo((s) => s.auth.user);
  const loading = useEazo((s) => s.auth.loading);

  if (loading) return (
    <div className="min-h-svh flex items-center justify-center" style={{ background: "#F5F1E8" }}>
      <div className="w-10 h-10 rounded-full skeleton" />
    </div>
  );

  if (!user) return (
    <div className="min-h-svh flex flex-col items-center justify-center px-6 text-center" style={{ background: "#F5F1E8" }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: "#EEF5EA" }}>
        <User size={36} style={{ color: "#9CB48A" }} />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: "#2C2420" }}>你好，来访者</h2>
      <p className="text-sm mb-6" style={{ color: "#9B8E82" }}>登录后可查看预约、消息和个人设置</p>
      <motion.button whileTap={{ scale: 0.97 }}
        onClick={() => auth.login()}
        className="px-8 py-3 rounded-2xl text-white font-semibold"
        style={{ background: "#9CB48A" }}>
        登录 / 注册
      </motion.button>
    </div>
  );

  const menuItems = [
    { href: "/my-bookings",  icon: CalendarDays,   label: "我的预约",   sub: "查看全部咨询预约" },
    { href: "/messages",     icon: MessageCircle,  label: "我的消息",   sub: "与咨询师沟通" },
    { href: "/settings",     icon: Settings,       label: "账号设置",   sub: "个人信息与偏好" },
  ];

  return (
    <div className="min-h-svh pb-20" style={{ background: "#F5F1E8" }}>
      {/* 顶部用户信息 */}
      <div className="px-5 pt-14 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
            style={{ background: "#EEF5EA", color: "#4A7A36" }}>
            {(user.name ?? user.email ?? "我")[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "#2C2420" }}>
              {user.name ?? "来访者"}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "#9B8E82" }}>
              {user.email ?? ""}
            </p>
          </div>
        </div>
      </div>

      {/* 菜单列表 */}
      <div className="px-5 space-y-2">
        {menuItems.map(({ href, icon: Icon, label, sub }) => (
          <Link key={href} href={href}>
            <motion.div whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
              style={{ background: "#FDFBF7", border: "1px solid #EBE7DF" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "#EEF5EA" }}>
                <Icon size={18} style={{ color: "#9CB48A" }} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: "#2C2420" }}>{label}</div>
                <div className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{sub}</div>
              </div>
              <span style={{ color: "#C2BDB7" }}>›</span>
            </motion.div>
          </Link>
        ))}

        {/* 退出登录 */}
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => auth.logout?.()}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl mt-4"
          style={{ background: "#FEF2F2", border: "1px solid #FEE2E2" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "#FEE2E2" }}>
            <LogOut size={18} style={{ color: "#DC2626" }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: "#DC2626" }}>退出登录</span>
        </motion.button>
      </div>
    </div>
  );
}
