"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { request } from "@/lib/api/request";

type Booking = {
  id: string; status: string; scheduledAt: string | null;
  priceAmount: number | null; sessionMode: string | null;
  counselorName: string; clientName: string;
};

const STATUS_OPTS = [
  { key: "all", label: "全部" },
  { key: "pending_confirmation", label: "待确认" },
  { key: "pending_payment", label: "待支付" },
  { key: "paid", label: "待咨询" },
  { key: "completed", label: "已完成" },
  { key: "cancelled", label: "已取消" },
];
const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  pending_confirmation: { bg: "#FEF3C7", text: "#D97706", label: "待确认" },
  pending_payment:      { bg: "#EFF6FF", text: "#2563EB", label: "待支付" },
  paid:                 { bg: "#F0FDF4", text: "#16A34A", label: "待咨询" },
  completed:            { bg: "#F5F0EA", text: "#9B8E82", label: "已完成" },
  cancelled:            { bg: "#FEE2E2", text: "#DC2626", label: "已取消" },
};

export default function AdminOrdersScreen() {
  const router = useRouter();
  const [tab, setTab] = useState("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = tab === "all" ? "" : `?status=${tab}`;
    request(`/api/admin/bookings${q}`).then(r => r.json())
      .then(d => { setBookings(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tab]);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => router.push("/admin")} className="p-1.5 rounded-full" style={{ background: "#EBE7DF" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "#5A4E44" }} />
        </button>
        <h1 className="text-base font-bold" style={{ color: "#2C2420" }}>订单管理</h1>
      </div>

      {/* 状态Tab横滑 */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_OPTS.map(o => (
          <button key={o.key} onClick={() => setTab(o.key)}
            className="px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-none"
            style={{ background: tab === o.key ? "var(--color-primary)" : "#EBE7DF",
              color: tab === o.key ? "white" : "#5A4E44" }}>
            {o.label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3 pb-10">
        {loading && <p className="text-center text-sm py-10" style={{ color: "#9B8E82" }}>加载中…</p>}
        {!loading && bookings.length === 0 && (
          <p className="text-center text-sm py-10" style={{ color: "#9B8E82" }}>暂无订单</p>
        )}
        {bookings.map(b => {
          const st = STATUS_STYLE[b.status] ?? { bg: "#EBE7DF", text: "#9B8E82", label: b.status };
          const dt = b.scheduledAt ? new Date(b.scheduledAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "待定";
          return (
            <div key={b.id} className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #EBE7DF" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-bold" style={{ color: "#2C2420" }}>
                    {b.clientName} → {b.counselorName}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{dt} · {b.sessionMode ?? "视频"}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-none"
                  style={{ background: st.bg, color: st.text }}>{st.label}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "#F5F0EA" }}>
                <p className="text-xs" style={{ color: "#9B8E82" }}>订单号：{b.id}</p>
                <p className="text-sm font-bold" style={{ color: "#2C2420" }}>
                  {b.priceAmount ? `¥${b.priceAmount}` : "—"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
