"use client";
import { useState } from "react";
import { useEazo } from "@eazo/sdk/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, User, Bell, Shield, HelpCircle, ChevronRight, Check, MessageCircle, Mail, Phone } from "lucide-react";

type Section = "main" | "profile" | "notifications" | "privacy" | "help";

export default function SettingsPage() {
  const user   = useEazo((s) => s.auth.user);
  const router = useRouter();
  const [section, setSection] = useState<Section>("main");
  const [notif, setNotif] = useState({ booking: true, reminder: true, message: true, news: false });
  const [name, setName] = useState(user?.name ?? "");
  const [saved, setSaved] = useState(false);

  const back = () => {
    if (section === "main") router.back();
    else setSection("main");
  };

  const saveProfile = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-svh pb-20" style={{ background: "var(--color-surface)" }}>
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-5 pt-12 pb-4"
        style={{ background: "var(--color-surface)", borderBottom: "1px solid #EBE7DF" }}>
        <button onClick={back} className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "#F0EBE3" }}>
          <ChevronLeft className="w-5 h-5 text-[#5A4E44]" />
        </button>
        <h1 className="text-base font-bold text-[#2C2420]">
          {section === "main"          ? "账号设置" :
           section === "profile"       ? "个人资料" :
           section === "notifications" ? "通知设置" :
           section === "privacy"       ? "隐私与安全" : "帮助与反馈"}
        </h1>
      </div>

      <AnimatePresence mode="wait">
        {/* 主菜单 */}
        {section === "main" && (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-5 pt-6 space-y-3">
            {[
              { id: "notifications", icon: Bell,       label: "通知设置",  sub: "预约提醒和消息通知" },
              { id: "privacy",       icon: Shield,     label: "隐私与安全", sub: "密码和授权管理" },
              { id: "help",          icon: HelpCircle, label: "帮助与反馈", sub: "常见问题和联系客服" },
            ].map(item => (
              <button key={item.id} onClick={() => setSection(item.id as Section)}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl"
                style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#F0F7EC" }}>
                  <item.icon className="w-5 h-5" style={{ color: "#9CB48A" }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-[#2C2420]">{item.label}</p>
                  <p className="text-xs text-[#9B8E82]">{item.sub}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#C4BDB5]" />
              </button>
            ))}
          </motion.div>
        )}

        {/* 个人资料 */}
        {section === "profile" && (
          <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="px-5 pt-6 space-y-4">
            {/* 头像 */}
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold"
                style={{ background: "#E8DFCC", color: "#7A6248" }}>
                {(name || user?.email || "?")[0]}
              </div>
              <button className="text-sm font-medium" style={{ color: "#9CB48A" }}>更换头像</button>
            </div>
            <div>
              <label className="text-xs text-[#9B8E82] mb-1.5 block">昵称</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="输入昵称"
                className="w-full px-4 py-3 rounded-xl text-sm text-[#2C2420] outline-none"
                style={{ background: "white", border: "1px solid #EBE7DF" }} />
            </div>
            <div>
              <label className="text-xs text-[#9B8E82] mb-1.5 block">邮箱</label>
              <div className="w-full px-4 py-3 rounded-xl text-sm text-[#9B8E82]"
                style={{ background: "#F5F0E8", border: "1px solid #EBE7DF" }}>{user?.email ?? "—"}</div>
            </div>
            <button onClick={saveProfile}
              className="w-full py-3.5 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: "#9CB48A" }}>
              {saved ? <><Check className="w-4 h-4" />已保存</> : "保存修改"}
            </button>
          </motion.div>
        )}

        {/* 通知设置 */}
        {section === "notifications" && (
          <motion.div key="notif" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="px-5 pt-6">
            <div className="rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              {[
                { key: "booking",  label: "预约状态通知", sub: "咨询师确认/拒绝时提醒" },
                { key: "reminder", label: "咨询前提醒",   sub: "咨询开始前1小时提醒" },
                { key: "message",  label: "新消息通知",   sub: "收到私信时提醒" },
                { key: "news",     label: "平台动态",     sub: "新功能和活动推送" },
              ].map((item, i) => (
                <div key={item.key}
                  className={`flex items-center justify-between px-4 py-4 ${i < 3 ? "border-b border-[#F0EBE3]" : ""}`}>
                  <div>
                    <p className="text-sm font-semibold text-[#2C2420]">{item.label}</p>
                    <p className="text-xs text-[#9B8E82]">{item.sub}</p>
                  </div>
                  <button
                    onClick={() => setNotif(n => ({ ...n, [item.key]: !n[item.key as keyof typeof n] }))}
                    className="w-12 h-6 rounded-full relative transition-all"
                    style={{ background: notif[item.key as keyof typeof notif] ? "#9CB48A" : "#E0D8CE" }}>
                    <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow"
                      style={{ left: notif[item.key as keyof typeof notif] ? "calc(100% - 22px)" : "2px" }} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 隐私与安全 */}
        {section === "privacy" && (
          <motion.div key="privacy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="px-5 pt-6 space-y-3">
            <div className="rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              {[
                { label: "修改密码",     sub: "定期更换密码保护安全" },
                { label: "绑定手机号",   sub: "用于账号验证和找回密码" },
                { label: "隐私设置",     sub: "控制谁能看到你的信息" },
                { label: "注销账号",     sub: "永久删除账号和数据", danger: true },
              ].map((item, i) => (
                <div key={item.label}
                  className={`flex items-center justify-between px-4 py-4 ${i < 3 ? "border-b border-[#F0EBE3]" : ""}`}>
                  <div>
                    <p className={`text-sm font-semibold ${item.danger ? "text-red-500" : "text-[#2C2420]"}`}>{item.label}</p>
                    <p className="text-xs text-[#9B8E82]">{item.sub}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${item.danger ? "text-red-300" : "text-[#C4BDB5]"}`} />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 帮助与反馈 */}
        {section === "help" && (
          <motion.div key="help" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="px-5 pt-6 space-y-4">
            <div className="rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              {[
                { label: "常见问题 FAQ",   sub: "查看使用指引和解答" },
                { label: "预约流程说明",    sub: "了解如何预约咨询师" },
                { label: "退款政策",       sub: "查看退款规则和流程" },
              ].map((item, i) => (
                <div key={item.label}
                  className={`flex items-center justify-between px-4 py-4 ${i < 2 ? "border-b border-[#F0EBE3]" : ""}`}>
                  <div>
                    <p className="text-sm font-semibold text-[#2C2420]">{item.label}</p>
                    <p className="text-xs text-[#9B8E82]">{item.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#C4BDB5]" />
                </div>
              ))}
            </div>
            <p className="text-xs text-[#9B8E82] text-center">联系我们</p>
            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border"
                style={{ borderColor: "#EBE7DF", color: "#5A4E44" }}>
                <MessageCircle className="w-4 h-4" />在线客服
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border"
                style={{ borderColor: "#EBE7DF", color: "#5A4E44" }}>
                <Mail className="w-4 h-4" />发送邮件
              </button>
            </div>
            <p className="text-center text-xs text-[#C4BDB5] mt-4">MindPace v1.0.0</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
