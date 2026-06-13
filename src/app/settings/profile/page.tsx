"use client";
import { useState } from "react";
import { useEazo } from "@eazo/sdk/react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Camera, User, Mail, Phone } from "lucide-react";

export default function ProfileSettingsPage() {
  const { user: user } = useEazo();
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-svh pb-24" style={{ background: "var(--color-surface)" }}>
      <div className="sticky top-0 z-10 px-5 pt-12 pb-4 flex items-center gap-3" style={{ background: "var(--color-surface)" }}>
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "white" }}>
          <ChevronLeft className="w-5 h-5 text-[#2C2420]" />
        </button>
        <h1 className="text-lg font-bold text-[#2C2420]">个人资料</h1>
      </div>
      <div className="px-5">
        {/* 头像 */}
        <div className="flex flex-col items-center py-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold"
              style={{ background: "#E8DFCC", color: "#7A6248" }}>
              {user?.name?.[0] ?? user?.email?.[0] ?? "?"}
            </div>
            <button className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "#9CB48A" }}>
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <p className="text-xs text-[#9B8E82] mt-3">点击更换头像</p>
        </div>
        {/* 表单 */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F0EBE3]">
            <User className="w-4 h-4 text-[#9CB48A]" />
            <div className="flex-1">
              <p className="text-xs text-[#9B8E82] mb-1">昵称</p>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full text-sm text-[#2C2420] bg-transparent outline-none"
                placeholder="设置你的昵称" />
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F0EBE3]">
            <Mail className="w-4 h-4 text-[#9CB48A]" />
            <div className="flex-1">
              <p className="text-xs text-[#9B8E82] mb-1">邮箱</p>
              <p className="text-sm text-[#9B8E82]">{user?.email ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Phone className="w-4 h-4 text-[#9CB48A]" />
            <div className="flex-1">
              <p className="text-xs text-[#9B8E82] mb-1">手机号</p>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full text-sm text-[#2C2420] bg-transparent outline-none"
                placeholder="绑定手机号" />
            </div>
          </div>
        </div>
        <button onClick={handleSave}
          className="w-full mt-5 py-3.5 rounded-2xl text-white text-sm font-semibold"
          style={{ background: saved ? "#6B9070" : "#9CB48A" }}>
          {saved ? "已保存 ✓" : "保存修改"}
        </button>
      </div>
    </div>
  );
}
