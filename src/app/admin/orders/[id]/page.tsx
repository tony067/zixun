"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Clock, CreditCard } from "lucide-react";
import { request } from "@/lib/api/request";
import { statusMeta } from "@/lib/booking-status";

type Booking = {
  id: string; status: string; scheduledAt: string | null;
  priceAmount: number | null; sessionMode: string | null;
  sessionNumber: number | null; durationMinutes: number | null;
  createdAt: string | null; rescheduleStatus: string | null;
  counselor: { id: string; displayName: string | null } | null;
  client: { id: string; name: string | null; email: string | null } | null;
};

const fmt = (s: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
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

  const handleAction = async (status: string) => {
    setProcessing(true);
    await request("/api/bookings/" + id, { method: "PATCH", body: JSON.stringify({ status }) });
    setBooking(prev => prev ? { ...prev, status } : null);
    setProcessing(false);
  };

  const st = booking ? (() => { const m = statusMeta(booking.status); return { bg: m.bg, text: m.color, label: m.label }; })() : null;

  return (
    <div className="min-h-screen pb-10" style={{ background: "var(--color-bg)" }}>
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: "rgba(245,240,232,0.95)", backdropFilter: "blur(8px)", borderColor: "#DDD8D0" }}>
        <button onClick={() => router.back()} className="p-1.5 rounded-full" style={{ background: "#EBE7DF" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "#5A4E44" }} />
        </button>
        <h1 className="text-base font-bold" style={{ color: "#2C2420" }}>订单详情</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-sm" style={{ color: "#9B8E82" }}>加载中…</div>
      ) : !booking ? (
        <div className="flex items-center justify-center h-64 text-sm" style={{ color: "#9B8E82" }}>订单不存在</div>
      ) : (
        <div className="px-4 pt-5 space-y-3">
          {/* 状态 */}
          <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
            style={{ background: st!.bg }}>
            <span className="text-sm font-bold" style={{ color: st!.text }}>{st!.label}</span>
            {booking.rescheduleStatus === "pending" && (
              <span className="text-xs text-orange-600 font-medium">● 有改期申请</span>
            )}
          </div>

          {/* 来访者 */}
          <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #EBE7DF" }}>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
              <span className="text-xs font-semibold" style={{ color: "#9B8E82" }}>来访者</span>
            </div>
            <p className="text-base font-bold" style={{ color: "#2C2420" }}>{booking.client?.name ?? "—"}</p>
            <p className="text-sm mt-0.5" style={{ color: "#9B8E82" }}>{booking.client?.email ?? "—"}</p>
          </div>

          {/* 咨询师 */}
          <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #EBE7DF" }}>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
              <span className="text-xs font-semibold" style={{ color: "#9B8E82" }}>咨询师</span>
            </div>
            <p className="text-base font-bold" style={{ color: "#2C2420" }}>{booking.counselor?.displayName ?? "—"}</p>
          </div>

          {/* 咨询信息 */}
          <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #EBE7DF" }}>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
              <span className="text-xs font-semibold" style={{ color: "#9B8E82" }}>咨询信息</span>
            </div>
            {[
              ["时间", fmt(booking.scheduledAt)],
              ["方式", booking.sessionMode ?? "—"],
              ["时长", `${booking.durationMinutes ?? 50} 分钟`],
              ["第几次", `第 ${booking.sessionNumber ?? 1} 次`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b last:border-0" style={{ borderColor: "#F5F0EA" }}>
                <span className="text-sm" style={{ color: "#9B8E82" }}>{k}</span>
                <span className="text-sm font-medium" style={{ color: "#2C2420" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* 费用与订单 */}
          <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #EBE7DF" }}>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
              <span className="text-xs font-semibold" style={{ color: "#9B8E82" }}>费用与订单</span>
            </div>
            {[
              ["咨询费用", `¥${booking.priceAmount ?? "—"}`],
              ["订单编号", booking.id],
              ["创建时间", fmt(booking.createdAt)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b last:border-0" style={{ borderColor: "#F5F0EA" }}>
                <span className="text-sm" style={{ color: "#9B8E82" }}>{k}</span>
                <span className="text-sm font-medium break-all text-right ml-4" style={{ color: "#2C2420", maxWidth: "60%" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* 操作按钮 */}
          <div className="space-y-2 pt-2">
            {(booking.status === "pending_confirmation" || booking.status === "pending_payment") && (
              <div className="flex gap-3">
                <button onClick={() => handleAction("rejected")} disabled={processing}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold"
                  style={{ background: "#FEE2E2", color: "#DC2626" }}>拒绝</button>
                <button onClick={() => handleAction("paid")} disabled={processing}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white"
                  style={{ background: "var(--color-primary)" }}>确认预约</button>
              </div>
            )}
            {(booking.status === "paid" || booking.status === "in_progress") && (
              <button onClick={() => handleAction("completed")} disabled={processing}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
                style={{ background: "var(--color-primary)" }}>标记已完成</button>
            )}
            {["in_progress", "completed"].includes(booking.status) && (
              <button onClick={() => handleAction("refunded")} disabled={processing}
                className="w-full py-3.5 rounded-2xl text-sm font-bold"
                style={{ background: "#FEF9EE", color: "#B07D2A", border: "1px solid #F5E6C0" }}>退款（仅管理员可操作）</button>
            )}
            {!["cancelled", "completed", "rejected"].includes(booking.status) && (
              <button onClick={() => handleAction("cancelled")} disabled={processing}
                className="w-full py-3.5 rounded-2xl text-sm font-bold"
                style={{ background: "#FEE2E2", color: "#DC2626" }}>取消订单</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
