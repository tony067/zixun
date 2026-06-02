"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Clock, CreditCard, MessageCircle } from "lucide-react";
import { request } from "@/lib/api/request";

type Booking = {
  id: string; status: string; scheduledAt: string | null;
  priceAmount: number | null; sessionMode: string | null;
  sessionNumber: number | null; durationMinutes: number | null;
  createdAt: string | null; paidAt: string | null;
  rescheduleStatus: string | null; paymentMethod: string | null;
  counselor: { id: string; displayName: string | null } | null;
  client: { id: string; name: string | null; email: string | null } | null;
};

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  pending_confirmation: { bg: "#FEF3C7", text: "#D97706", label: "待确认" },
  pending_payment:      { bg: "#EFF6FF", text: "#2563EB", label: "待支付" },
  paid:                 { bg: "#F0FDF4", text: "#16A34A", label: "待咨询" },
  completed:            { bg: "#F0FDF4", text: "#16A34A", label: "已完成" },
  cancelled:            { bg: "#FEE2E2", text: "#DC2626", label: "已取消" },
  rejected:             { bg: "#FEE2E2", text: "#DC2626", label: "已拒绝" },
};

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    request("/api/admin/orders/" + id).then(r => r.json())
      .then(d => setBooking(d.booking ?? d))
      .finally(() => setLoading(false));
  }, [id]);

  const act = async (status: string) => {
    if (!booking) return;
    setProcessing(true);
    await request("/api/bookings/" + id, { method: "PATCH", body: JSON.stringify({ status }) });
    setBooking(prev => prev ? { ...prev, status } : null);
    setProcessing(false);
  };

  const fmt = (s: string | null) => {
    if (!s) return "—";
    const d = new Date(s);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  const st = (status: string) => STATUS_MAP[status] ?? { bg: "#F5F0EA", text: "#9B8E82", label: status };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
      <p className="text-sm" style={{ color: "#9B8E82" }}>加载中…</p>
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--color-bg)" }}>
      <p className="text-sm mb-4" style={{ color: "#9B8E82" }}>订单不存在</p>
      <button onClick={() => router.back()} className="text-sm underline" style={{ color: "var(--color-primary)" }}>返回</button>
    </div>
  );

  const s = st(booking.status);

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--color-bg)" }}>
      {/* 顶栏 */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: "rgba(245,240,232,0.95)", backdropFilter: "blur(8px)", borderColor: "#DDD8D0" }}>
        <button onClick={() => router.back()} className="p-1.5 rounded-full" style={{ background: "#EBE7DF" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "#5A4E44" }} />
        </button>
        <h1 className="text-base font-bold" style={{ color: "#2C2420" }}>订单详情</h1>
        {booking.rescheduleStatus === "pending" && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#FEF3C7", color: "#D97706" }}>
            有改期申请
          </span>
        )}
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* 状态 */}
        <div className="rounded-2xl px-4 py-3" style={{ background: s.bg }}>
          <p className="text-base font-bold" style={{ color: s.text }}>{s.label}</p>
          <p className="text-xs mt-0.5" style={{ color: s.text, opacity: 0.8 }}>订单号：{booking.id}</p>
        </div>

        {/* 来访者 */}
        <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #EBE7DF" }}>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
            <p className="text-xs font-semibold" style={{ color: "#9B8E82" }}>来访者</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-none"
              style={{ background: "var(--color-primary)" }}>
              {(booking.client?.name ?? "?")[0]}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#2C2420" }}>{booking.client?.name ?? "—"}</p>
              <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{booking.client?.email ?? "—"}</p>
            </div>
            <button onClick={() => router.push("/admin/users")} className="ml-auto text-xs px-3 py-1.5 rounded-full"
              style={{ background: "#E4F0DC", color: "var(--color-primary)" }}>查看</button>
          </div>
        </div>

        {/* 咨询师 */}
        <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #EBE7DF" }}>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
            <p className="text-xs font-semibold" style={{ color: "#9B8E82" }}>咨询师</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-none"
              style={{ background: "#B8A99A" }}>
              {(booking.counselor?.displayName ?? "?")[0]}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#2C2420" }}>{booking.counselor?.displayName ?? "—"}</p>
            </div>
            <button onClick={() => router.push("/admin/counselors")} className="ml-auto text-xs px-3 py-1.5 rounded-full"
              style={{ background: "#E4F0DC", color: "var(--color-primary)" }}>查看</button>
          </div>
        </div>

        {/* 咨询信息 */}
        <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #EBE7DF" }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
            <p className="text-xs font-semibold" style={{ color: "#9B8E82" }}>咨询信息</p>
          </div>
          {[
            ["时间", fmt(booking.scheduledAt)],
            ["方式", booking.sessionMode ?? "—"],
            ["时长", (booking.durationMinutes ?? 50) + " 分钟"],
            ["第几次", "第 " + (booking.sessionNumber ?? 1) + " 次"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm py-1.5 border-b last:border-0"
              style={{ borderColor: "#F5F0EA" }}>
              <span style={{ color: "#9B8E82" }}>{k}</span>
              <span style={{ color: "#2C2420", fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* 费用与订单 */}
        <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #EBE7DF" }}>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
            <p className="text-xs font-semibold" style={{ color: "#9B8E82" }}>费用与订单</p>
          </div>
          {[
            ["咨询费用", "¥" + (booking.priceAmount ?? "—")],
            ["创建时间", fmt(booking.createdAt)],
            ["付款时间", fmt(booking.paidAt)],
            ["支付方式", booking.paymentMethod ?? "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm py-1.5 border-b last:border-0"
              style={{ borderColor: "#F5F0EA" }}>
              <span style={{ color: "#9B8E82" }}>{k}</span>
              <span style={{ color: "#2C2420", fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* 联系双方 */}
        <div className="flex gap-2">
          <button onClick={() => router.push("/counselor/messages")}
            className="flex-1 py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-1.5"
            style={{ background: "white", border: "1.5px solid var(--color-primary)", color: "var(--color-primary)" }}>
            <MessageCircle className="w-4 h-4" />联系咨询师
          </button>
          <button onClick={() => router.push("/messages")}
            className="flex-1 py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-1.5"
            style={{ background: "white", border: "1.5px solid #B8A99A", color: "#5A4E44" }}>
            <MessageCircle className="w-4 h-4" />联系来访者
          </button>
        </div>
      </div>

      {/* 底部操作栏 */}
      {!["cancelled", "completed", "rejected"].includes(booking.status) && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-3 space-y-2"
          style={{ background: "rgba(245,240,232,0.97)", borderTop: "1px solid #EBE7DF" }}>
          {booking.status === "pending_confirmation" && (
            <div className="flex gap-2">
              <button onClick={() => act("rejected")} disabled={processing}
                className="flex-1 py-3 rounded-2xl text-sm font-bold"
                style={{ background: "#FEE2E2", color: "#DC2626" }}>拒绝</button>
              <button onClick={() => act("pending_payment")} disabled={processing}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ background: "var(--color-primary)" }}>确认预约</button>
            </div>
          )}
          {booking.status === "paid" && (
            <button onClick={() => act("completed")} disabled={processing}
              className="w-full py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: "var(--color-primary)" }}>标记已完成</button>
          )}
          <button onClick={() => act("cancelled")} disabled={processing}
            className="w-full py-3 rounded-2xl text-sm font-bold"
            style={{ background: "#FEE2E2", color: "#DC2626" }}>取消订单</button>
        </div>
      )}
    </div>
  );
}
