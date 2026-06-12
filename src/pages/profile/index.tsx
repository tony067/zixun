import { useState, useEffect, useRef } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Input, ScrollView, Image, Swiper, SwiperItem, Textarea } from '@tarojs/components'
import { request } from '../../api/request'
import { useAuthStore } from '../../store/authStore'

import { useState, useEffect, useRef, useCallback } from "react";

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
  const { user } = useAuthStore() => s.auth.user);
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!user) return;
    request("/api/bookings/my").then((d: { bookings?: Booking[] }) => {
      setBookings(d.bookings ?? []);
    }).catch(() => {});
  }, [user]);

  // 只显示进行中的订单
  const activeBookings = bookings.filter(b => ACTIVE_STATUSES.includes(b.status));

  if (!user) return (
    <View className="min-h-screen flex flex-col items-center justify-center gap-4 pb-24" style={{ background:"var(--color-bg)" }}>
      <View className="w-24 h-24 rounded-full flex items-center justify-center text-4xl" style={{ background:"#EBE7DF" }}>👤</View>
      <Text className="text-base font-semibold" style={{ color:"#2C2420" }}>登录后查看你的预约</Text>
      <View onClick={() => Taro.showToast({title: '请先登录', icon: 'none'})} className="px-8 py-3 rounded-2xl text-white font-bold text-sm" style={{ background:"var(--color-primary)" }}>
        登录 / 注册
      </View>
    </View>
  );

  const initials    = (user as any).name?.[0] ?? (user as any).displayName?.[0] ?? user.email?.[0] ?? "我";
  const displayName = (user as any).name ?? (user as any).displayName ?? user.email ?? "";
  const [avatarUrl, setAvatarUrl] = useState<string>((user as any).avatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const key = `avatars/${Date.now()}.${ext}`;
      const result = await storage.upload(key, file);
      const url = result.url;
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
    { icon: Heart,           label:"我的收藏", sub:"收藏的咨询师",   href:"/favorites" },
    { icon: BookOpen,        label:"新手必读",     sub:"了解咨询",   href:"/guide"     },
    { icon: HeadphonesIcon,  label:"联系客服",     sub:"在线帮助",   href:"/support"   },
    { icon: Settings,        label:"更多设置",     sub:"账号·通知",  href:"/settings"  },
  ];

  return (
    <View className="min-h-screen pb-32" style={{ background:"var(--color-bg)" }}>

      {/* ── 个人信息区 ── */}
      <View className="px-5 pt-6 pb-4">
        <View className="flex items-center gap-4">
          {/* 头像 + 相机图标 */}
          <View className="relative flex-none cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {avatarUrl ? (
              <Image src={avatarUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <View className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ background:"var(--color-primary)" }}>
                {uploading ? "..." : initials}
              </View>
            )}
            <View className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background:"#fff", border:"1.5px solid #D4C8B0" }}>
              <Camera className="w-3 h-3" style={{ color:"#5A4E44" }} />
            </View>
            <Input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </View>
          {/* 姓名 + 铅笔 */}
          <View className="flex-1 min-w-0">
            <View className="flex items-center gap-1.5">
              <Text className="text-lg font-bold truncate" style={{ color:"#2C2420" }}>{displayName}</Text>
              <View className="flex-none p-1 rounded-full" style={{ background:"#F0EBE4" }}
                onClick={handleNameEdit}>
                <Pencil className="w-3 h-3" style={{ color:"#9B8E82" }} />
              </View>
            </View>
            <Text className="text-xs mt-0.5 truncate" style={{ color:"#9B8E82" }}>{user.email}</Text>
          </View>
        </View>
      </View>

      {/* ── 我的预约（重点区域）── */}
      <View className="mx-5 mb-4 rounded-2xl overflow-hidden" style={{ background:"white", border:"1px solid #EBE7DF" }}>
        {/* 标题行 */}
        <View className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor:"#F0EBE4" }}>
          <View className="flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color:"var(--color-primary)" }} />
            <Text className="text-sm font-bold" style={{ color:"#2C2420" }}>我的预约</Text>
            {activeBookings.length > 0 && (
              <Text className="text-xs px-1.5 py-0.5 rounded-full font-bold text-white" style={{ background:"var(--color-primary)" }}>
                {activeBookings.length}
              </Text>
            )}
          </View>
          <View onClick={() => Taro.navigateTo({url: '/pages/my-bookings/index'})}
            className="flex items-center gap-0.5 text-xs font-medium"
            style={{ color:"var(--color-primary)" }}>
            全部预约 <Text>›</Text>
          </View>
        </View>

        {/* 进行中订单列表 */}
        {activeBookings.length === 0 ? (
          <View className="py-8 flex flex-col items-center gap-2">
            <Text className="text-sm" style={{ color:"#9B8E82" }}>暂无进行中的预约</Text>
            <View onClick={() => Taro.navigateTo({url: '/pages//index'})}
              className="text-xs px-4 py-1.5 rounded-full font-medium"
              style={{ background:"#E4F0DC", color:"#3A6228" }}>
              浏览咨询师
            </View>
          </View>
        ) : (
          <View>
            {activeBookings.map((b) => {
              const st = STATUS_BADGE[b.status] ?? { label:b.status, color:"#9B8E82", bg:"#F5F0EA" };
              return (
                <View key={b.id} onClick={() => Taro.navigateTo({url: '/pages/my-bookings/index?id=${b.id}'})}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b last:border-0 text-left"
                  style={{ borderColor:"#F5F0EA" }}>
                  <View className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-none"
                    style={{ background:"var(--color-primary)" }}>
                    {b.counselor?.displayName?.[0] ?? "师"}
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-sm font-semibold truncate" style={{ color:"#2C2420" }}>
                      {b.counselor?.displayName ?? "咨询师"}
                    </Text>
                    <Text className="text-xs mt-0.5" style={{ color:"#9B8E82" }}>
                      {b.scheduledAt ? fmt(b.scheduledAt) : "待定"} · {b.sessionMode}
                    </Text>
                  </View>
                  <Text className="text-xs px-2 py-0.5 rounded-full font-medium flex-none"
                    style={{ background:st.bg, color:st.color }}>{st.label}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* ── 快捷功能四宫格 ── */}
      <View className="mx-5 grid grid-cols-2 gap-3 mb-6">
        {QUICK_ACTIONS.map((a) => (
          <View key={a.label} onClick={() => router.push(a.href)}
            className="flex items-center gap-3 px-4 py-4 rounded-2xl text-left"
            style={{ background:"white", border:"1px solid #EBE7DF" }}>
            <View className="w-9 h-9 rounded-xl flex items-center justify-center flex-none"
              style={{ background:"#E8F4E8" }}>
              <a.icon className="w-4.5 h-4.5" style={{ color:"var(--color-primary)" }} />
            </View>
            <View className="min-w-0">
              <Text className="text-sm font-semibold truncate" style={{ color:"#2C2420" }}>{a.label}</Text>
              <Text className="text-xs truncate" style={{ color:"#9B8E82" }}>{a.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── 退出登录 ── */}
      <View className="mx-5">
        <View onClick={() => auth.logout?.()}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold"
          style={{ background:"white", border:"1px solid #EBE7DF", color:"#EF4444" }}>
          <LogOut className="w-4 h-4" />
          退出登录
        </View>
      </View>

    </View>
  );
}
