"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Calendar, ShieldBan, ShieldCheck } from "lucide-react";

const MOCK_USERS: Record<string, {
  id: string; name: string; email: string; role: string;
  bookings: number; joined: string; status: string; phone?: string; bio?: string;
}> = {
  u001: { id:"u001", name:"张靖", email:"zhang@example.com", role:"client", bookings:3, joined:"2026-03-12", status:"active", phone:"138****1234" },
  u002: { id:"u002", name:"王明浩", email:"wang@example.com", role:"client", bookings:1, joined:"2026-04-05", status:"active", phone:"139****5678" },
  u003: { id:"u003", name:"李晓月", email:"li@example.com", role:"client", bookings:7, joined:"2026-01-20", status:"active", phone:"137****9012" },
  u004: { id:"u004", name:"陈晓雯", email:"chen@example.com", role:"counselor", bookings:42, joined:"2026-02-01", status:"active", bio:"擅长ADHD、ASD成人咨询，认知行为疗法取向。" },
  u005: { id:"u005", name:"林诗涵", email:"lin@example.com", role:"counselor", bookings:31, joined:"2026-02-15", status:"active", bio:"擅长ASD谱系、叙事疗法取向。" },
  u006: { id:"u006", name:"刘海涛", email:"liu@example.com", role:"client", bookings:0, joined:"2026-05-28", status:"banned", phone:"136****3456" },
};

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const user = MOCK_USERS[id];
  const [status, setStatus] = useState(user?.status ?? "active");

  if (!user) return (
    <div className="flex flex-col items-center justify-center h-screen" style={{ color: "#9B8E82" }}>
      <p className="text-sm">用户不存在</p>
      <button className="mt-4 text-sm underline" onClick={() => router.back()}>返回</button>
    </div>
  );

  const isBanned = status === "banned";
  const initial = user.name[0];
  const roleLabel = user.role === "counselor" ? "咨询师" : "来访者";
  const roleColor = user.role === "counselor" ? "#8BB5C8" : "#9CB48A";

  return (
    <div className="min-h-screen pb-10" style={{ background: "var(--color-bg)" }}>
      {/* 顶栏 */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: "rgba(245,240,232,0.95)", backdropFilter: "blur(8px)", borderColor: "#DDD8D0" }}>
        <button onClick={() => router.back()} className="p-1.5 rounded-full" style={{ background: "#EBE7DF" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "#5A4E44" }} />
        </button>
        <h1 className="text-base font-bold" style={{ color: "#2C2420" }}>用户详情</h1>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* 头像+基本信息 */}
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #EBE7DF" }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-none"
              style={{ background: roleColor }}>{initial}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold" style={{ color: "#2C2420" }}>{user.name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                  style={{ background: roleColor+"22", color: roleColor }}>{roleLabel}</span>
                {isBanned && <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-red-100 text-red-600">已封禁</span>}
              </div>
              <p className="text-sm mt-1" style={{ color: "#9B8E82" }}>{user.email}</p>
            </div>
          </div>
          {user.bio && (
            <p className="text-sm leading-relaxed p-3 rounded-xl" style={{ background: "#F8F5F0", color: "#5C5552" }}>{user.bio}</p>
          )}
        </div>

        {/* 详细信息 */}
        <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #EBE7DF" }}>
          <p className="text-xs font-semibold mb-3" style={{ color: "#9B8E82" }}>账号信息</p>
          {[
            { icon: Mail, label: "邮箱", value: user.email },
            { icon: User, label: "角色", value: roleLabel },
            { icon: Calendar, label: "注册时间", value: user.joined },
            { icon: User, label: user.role === "counselor" ? "咨询场次" : "预约次数", value: `${user.bookings} 次` },
            { icon: ShieldCheck, label: "账号状态", value: isBanned ? "已封禁" : "正常" },
            ...(user.phone ? [{ icon: User, label: "手机号", value: user.phone }] : []),
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "#F5F0EA" }}>
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 flex-none" style={{ color: "var(--color-primary)" }} />
                <span className="text-sm" style={{ color: "#9B8E82" }}>{label}</span>
              </div>
              <span className="text-sm font-medium" style={{ color: label === "账号状态" && isBanned ? "#DC2626" : "#2C2420" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* 操作 */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={() => setStatus(isBanned ? "active" : "banned")}
            className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: isBanned ? "#F0FDF4" : "#FEE2E2", color: isBanned ? "#16A34A" : "#DC2626" }}>
            {isBanned ? <ShieldCheck className="w-4 h-4" /> : <ShieldBan className="w-4 h-4" />}
            {isBanned ? "解除封禁" : "封禁该用户"}
          </button>
          {user.role === "counselor" && (
            <button onClick={() => router.push("/admin/counselors")}
              className="w-full py-3.5 rounded-2xl text-sm font-bold"
              style={{ background: "#EBE7DF", color: "#5A4E44" }}>查看咨询师档案</button>
          )}
        </div>
      </div>
    </div>
  );
}
