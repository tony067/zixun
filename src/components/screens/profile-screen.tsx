"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useEazo } from "@eazo/sdk/react";
import { auth, storage } from "@eazo/sdk";
import { useRouter } from "next/navigation";
import { Heart, HeadphonesIcon, BookOpen, LogOut, Settings, Calendar, ChevronRight, Camera, Pencil, Check, X } from "lucide-react";
import { request } from "@/lib/api/request";

type Booking = {
  id: string; status: string; scheduledAt: string; durationMinutes: number;
  sessionMode: string; priceAmount: number; sessionNumber?: number;
  counselor: { id: string; displayName: string } | null;
};

// 主页只显示进行中的订单
const ACTIVE_STATUSES = ["pending_confirmation","pending_payment","paid","upcoming","confirmed"];

const STATUS_BADGE: Record<string,{label:string;color:string;bg:string}> = {
  pending_confirmation: { label:"待确认",   color:"#D97706", bg:"#FEF3C7" },
  pending_payment:      { label:"待支付",   color:"#2563EB", bg:"#DBEAFE" },
  paid:                 { label:"即将咨询", color:"#059669", bg:"#D1FAE5" },
  upcoming:             { label:"即将咨询", color:"#059669", bg:"#D1FAE5" },
  confirmed:            { label:"即将咨询", color:"#059669", bg:"#D1FAE5" },
  completed:            { label:"已完成",   color:"#6B7280", bg:"#F3F4F6" },
  cancelled:            { label:"已取消",   color:"#9B8E82", bg:"#F5F0EA" },
  rejected:             { label:"已拒绝",   color:"#9B8E82", bg:"#F5F0EA" },
};

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth()+1}月${d.getDate()}日 ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
}

export default function ProfileScreen() {
  const user   = useEazo((s) => s.auth.user);
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!user) return;
    request("/api/bookings/my").then(r => r.json()).then((d: { bookings?: Booking[] }) => {
      setBookings(d.bookings ?? []);
    }).catch(() => {});
  }, [user]);

  // 只显示进行中的订单
  const activeBookings = bookings.filter(b => ACTIVE_STATUSES.includes(b.status));

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 pb-24" style={{ background:"var(--color-bg)" }}>
      <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl" style={{ background:"#EBE7DF" }}>👤</div>
      <p className="text-base font-semibold" style={{ color:"#2C2420" }}>登录后查看你的预约</p>
      <button onClick={() => auth.login()} className="px-8 py-3 rounded-2xl text-white font-bold text-sm" style={{ background:"var(--color-primary)" }}>
        登录 / 注册
      </button>
    </div>
  );

  const initials    = (user as any).displayName?.[0] ?? (user as any).nickname?.[0] ?? user.email?.[0] ?? "我";
  const displayName = (user as any).displayName ?? (user as any).nickname ?? user.email ?? "";
  const [avatarUrl, setAvatarUrl] = useState<string>((user as any).avatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const path = `avatars/${user.id}/${Date.now()}.jpg`;
      const url = await storage.upload(path, file);
      setAvatarUrl(url);
      await request("/api/user/profile", { method: "PATCH", body: JSON.stringify({ avatarUrl: url }) });
    } catch (err) {
      console.error("头像上传失败", err);
    } finally {
      setUploading(false);
    }
  }

  async function handleNameEdit() {
    const newName = window.prompt("修改昵称", displayName);
    if (!newName || newName === displayName) return;
    await request("/api/user/profile", { method: "PATCH", body: JSON.stringify({ displayName: newName }) });
    window.location.reload();
  }

  const QUICK_ACTIONS = [
    { icon: Heart,           label:"收藏的咨询师", sub:"管理收藏",   href:"/favorites" },
    { icon: BookOpen,        label:"新手必读",     sub:"了解咨询",   href:"/guide"     },
    { icon: HeadphonesIcon,  label:"联系客服",     sub:"在线帮助",   href:"/support"   },
    { icon: Settings,        label:"更多设置",     sub:"账号·通知",  href:"/settings"  },
  ];

  return (
    <div className="min-h-screen pb-32" style={{ background:"var(--color-bg)" }}>

      {/* ── 个人信息区 ── */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-4">
          {/* 头像 + 相机图标 */}
          <div className="relative flex-none cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ background:"var(--color-primary)" }}>
                {uploading ? "..." : initials}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background:"#fff", border:"1.5px solid #D4C8B0" }}>
              <Camera className="w-3 h-3" style={{ color:"#5A4E44" }} />
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          {/* 姓名 + 铅笔 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-bold truncate" style={{ color:"#2C2420" }}>{displayName}</p>
              <button className="flex-none p-1 rounded-full" style={{ background:"#F0EBE4" }}
                onClick={handleNameEdit}>
                <Pencil className="w-3 h-3" style={{ color:"#9B8E82" }} />
              </button>
            </div>
            <p className="text-xs mt-0.5 truncate" style={{ color:"#9B8E82" }}>{user.email}</p>
          </div>
        </div>
      </div>

      {/* ── 我的预约（重点区域）── */}
      <div className="mx-5 mb-4 rounded-2xl overflow-hidden" style={{ background:"white", border:"1px solid #EBE7DF" }}>
        {/* 标题行 */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor:"#F0EBE4" }}>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color:"var(--color-primary)" }} />
            <span className="text-sm font-bold" style={{ color:"#2C2420" }}>我的预约</span>
            {activeBookings.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold text-white" style={{ background:"var(--color-primary)" }}>
                {activeBookings.length}
              </span>
            )}
          </div>
          <button onClick={() => router.push("/my-bookings")}
            className="flex items-center gap-0.5 text-xs font-medium"
            style={{ color:"var(--color-primary)" }}>
            全部预约 <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 进行中订单列表 */}
        {activeBookings.length === 0 ? (
          <div className="py-8 flex flex-col items-center gap-2">
            <p className="text-sm" style={{ color:"#9B8E82" }}>暂无进行中的预约</p>
            <button onClick={() => router.push("/")}
              className="text-xs px-4 py-1.5 rounded-full font-medium"
              style={{ background:"#E4F0DC", color:"#3A6228" }}>
              浏览咨询师
            </button>
          </div>
        ) : (
          <div>
            {activeBookings.map((b) => {
              const st = STATUS_BADGE[b.status] ?? { label:b.status, color:"#9B8E82", bg:"#F5F0EA" };
              return (
                <button key={b.id} onClick={() => router.push(`/my-bookings/${b.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b last:border-0 text-left"
                  style={{ borderColor:"#F5F0EA" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-none"
                    style={{ background:"var(--color-primary)" }}>
                    {b.counselor?.displayName?.[0] ?? "师"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color:"#2C2420" }}>
                      {b.counselor?.displayName ?? "咨询师"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color:"#9B8E82" }}>
                      {b.scheduledAt ? fmt(b.scheduledAt) : "待定"} · {b.sessionMode}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-none"
                    style={{ background:st.bg, color:st.color }}>{st.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 快捷功能四宫格 ── */}
      <div className="mx-5 grid grid-cols-2 gap-3 mb-6">
        {QUICK_ACTIONS.map((a) => (
          <button key={a.label} onClick={() => router.push(a.href)}
            className="flex items-center gap-3 px-4 py-4 rounded-2xl text-left"
            style={{ background:"white", border:"1px solid #EBE7DF" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none"
              style={{ background:"#E8F4E8" }}>
              <a.icon className="w-4.5 h-4.5" style={{ color:"var(--color-primary)" }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color:"#2C2420" }}>{a.label}</p>
              <p className="text-xs truncate" style={{ color:"#9B8E82" }}>{a.sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── 退出登录 ── */}
      <div className="mx-5">
        <button onClick={() => auth.logout?.()}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold"
          style={{ background:"white", border:"1px solid #EBE7DF", color:"#EF4444" }}>
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>

    </div>
  );
}
