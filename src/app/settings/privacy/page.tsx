"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Lock, Eye, EyeOff, Shield } from "lucide-react";

export default function PrivacyPage() {
  const router = useRouter();
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const ITEMS = [
    { icon: Lock,   label: "修改密码",     action: () => setShowPwdForm(!showPwdForm) },
    { icon: Shield, label: "登录设备管理",  action: () => {} },
    { icon: Eye,    label: "隐私授权管理",  action: () => {} },
  ];

  return (
    <div className="min-h-svh pb-24" style={{ background: "var(--color-surface)" }}>
      <div className="sticky top-0 z-10 px-5 pt-12 pb-4 flex items-center gap-3" style={{ background: "var(--color-surface)" }}>
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "white" }}>
          <ChevronLeft className="w-5 h-5 text-[#2C2420]" />
        </button>
        <h1 className="text-lg font-bold text-[#2C2420]">隐私与安全</h1>
      </div>
      <div className="px-5">
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          {ITEMS.map((item, i) => (
            <button key={item.label} onClick={item.action}
              className={`w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-50 ${i < ITEMS.length - 1 ? "border-b border-[#F0EBE3]" : ""}`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#F0F7EC" }}>
                <item.icon className="w-4 h-4" style={{ color: "#9CB48A" }} />
              </div>
              <span className="flex-1 text-sm font-semibold text-[#2C2420] text-left">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-[#C4BDB5]" />
            </button>
          ))}
        </div>
        {showPwdForm && (
          <div className="rounded-2xl p-4" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <p className="text-sm font-bold text-[#2C2420] mb-3">修改密码</p>
            <div className="relative mb-3">
              <input type={showOld ? "text" : "password"} value={oldPwd} onChange={e => setOldPwd(e.target.value)}
                placeholder="当前密码" className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-10"
                style={{ background: "#F5F0E8", color: "#2C2420" }} />
              <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowOld(!showOld)}>
                {showOld ? <EyeOff className="w-4 h-4 text-[#9B8E82]" /> : <Eye className="w-4 h-4 text-[#9B8E82]" />}
              </button>
            </div>
            <div className="relative mb-4">
              <input type={showNew ? "text" : "password"} value={newPwd} onChange={e => setNewPwd(e.target.value)}
                placeholder="新密码（至少8位）" className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-10"
                style={{ background: "#F5F0E8", color: "#2C2420" }} />
              <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowNew(!showNew)}>
                {showNew ? <EyeOff className="w-4 h-4 text-[#9B8E82]" /> : <Eye className="w-4 h-4 text-[#9B8E82]" />}
              </button>
            </div>
            <button className="w-full py-3 rounded-xl text-white text-sm font-semibold" style={{ background: "#9CB48A" }}>确认修改</button>
          </div>
        )}
      </div>
    </div>
  );
}
