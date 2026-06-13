"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { request } from "@/lib/api/request";
import { User, Clock, CreditCard } from "lucide-react";

type Booking = {
  id: string; status: string; scheduledAt: string | null;
  priceAmount: number | null; sessionMode: string | null;
  sessionNumber: number | null; durationMinutes: number | null;
  createdAt: string | null; rescheduleStatus: string | null;
  counselor: { id: string; displayName: string | null } | null;
  client: { id: string; name: string | null; email: string | null } | null;
};

const STATUS_OPTS = [
  { key: "all", label: "全部" },
  { key: "pending_confirmation", label: "待确认" },
  { key: "pending_payment", label: "待支付" },
  { key: "paid", label: "待咨询" },
  { key: "completed", label: "已完成" },
  { key: "cancelled", label: "已取消" },
];

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  pending_confirmation: { bg: "#FEF3C7", text: "#D97706", label: "待确认" },
  pending_payment:      { bg: "#EFF6FF", text: "#2563EB", label: "待支付" },
  paid:                 { bg: "#F0FDF4", text: "#16A34A", label: "待咨询" },
  completed:            { bg: "#F5F0EA", text: "#6B7280", label: "已完成" },
  cancelled:            { bg: "#FEE2E2", text: "#DC2626", label: "已取消" },
  rejected:             { bg: "#FEE2E2", text: "#DC2626", label: "已拒绝" },
};

export default function AdminOrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [processing, setProcessing] = useState(false);

  const load = () => {
    setLoading(true);
    const qs = tab !== "all" ? "?status="+tab : "";
    request("/api/admin/orders"+qs).then(r => r.json())
      .then(d => setBookings(Array.isArray(d) ? d : Array.isArray(d.bookings) ? d.bookings : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (user) load(); }, [tab, user]);

  const handleAction = async (id: string, status: string) => {
    setProcessing(true);
    await request("/api/bookings/"+id, { method: "PATCH", body: JSON.stringify({ status }) });
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
    setProcessing(false);
  };

  const fmt = (s: string | null) => {
    if (!s) return "—";
    const d = new Date(s);
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
  };

  const st = (status: string) => STATUS_MAP[status] ?? { bg: "#F5F0EA", text: "#9B8E82", label: status };

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--color-bg)" }}>
      <div className="px-5 pt-12 pb-3">
        <h1 className="text-xl font-bold" style={{ color: "#2C2420" }}>订单管理</h1>
        <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>共 {bookings.length} 笔</p>
      </div>
      <div className="flex gap-2 px-4 overflow-x-auto pb-3">
        {STATUS_OPTS.map(opt => (
          <button key={opt.key} onClick={() => setTab(opt.key)}
            className="flex-none px-3.5 py-1.5 rounded-full text-xs font-medium"
            style={{ background: tab===opt.key?"var(--color-primary)":"#EBE7DF", color: tab===opt.key?"white":"#5A4E44" }}>
            {opt.label}
          </button>
        ))}
      </div>
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="text-center py-16 text-sm" style={{ color: "#9B8E82" }}>加载中…</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: "#9B8E82" }}>暂无订单</div>
        ) : bookings.map(b => {
          const s = st(b.status);
          return (
            <button key={b.id} onClick={() => router.push("/admin/orders/"+b.id)} className="w-full text-left rounded-2xl p-4"
              style={{ background: "white", border: "1px solid #EBE7DF" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#2C2420" }}>
                    {b.client?.name ?? "来访者"} → {b.counselor?.displayName ?? "咨询师"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{fmt(b.scheduledAt)}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-none ml-2"
                  style={{ background: s.bg, color: s.text }}>{s.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: "#9B8E82" }}>
                  {b.sessionMode} · {b.durationMinutes ?? 50}分钟
                  {b.rescheduleStatus === "pending" && <span className="ml-2 text-orange-500"> ● 改期申请</span>}
                </p>
                <p className="text-sm font-bold" style={{ color: "#2C2420" }}>¥{b.priceAmount ?? "—"}</p>
              </div>
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setSelected(null)} />
          <div className="relative rounded-t-3xl px-5 pt-5 pb-10 max-h-[88vh] overflow-y-auto" style={{ background: "var(--color-bg)", zIndex: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: "#2C2420" }}>订单详情</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#EBE7DF", color: "#5A4E44", fontSize: 18 }}>×</button>
            </div>
            <div className="rounded-xl px-3 py-2 mb-4" style={{ background: st(selected.status).bg }}>
              <span className="text-sm font-semibold" style={{ color: st(selected.status).text }}>{st(selected.status).label}</span>
              {selected.rescheduleStatus === "pending" && <span className="text-xs ml-2 text-orange-600">● 有改期申请</span>}
            </div>
            <div className="space-y-3 mb-4">
              {[
                { icon: User, label: "来访者", primary: selected.client?.name ?? "—", secondary: selected.client?.email ?? "—" },
                { icon: User, label: "咨询师", primary: selected.counselor?.displayName ?? "—", secondary: null },
              ].map(({ icon: Icon, label, primary, secondary }) => (
                <div key={label} className="rounded-xl p-3" style={{ background: "white", border: "1px solid #EBE7DF" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                    <p className="text-xs font-semibold" style={{ color: "#9B8E82" }}>{label}</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: "#2C2420" }}>{primary}</p>
                  {secondary && <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{secondary}</p>}
                </div>
              ))}
              <div className="rounded-xl p-3" style={{ background: "white", border: "1px solid #EBE7DF" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                  <p className="text-xs font-semibold" style={{ color: "#9B8E82" }}>咨询信息</p>
                </div>
                {[
                  ["时间", fmt(selected.scheduledAt)],
                  ["方式", selected.sessionMode ?? "—"],
                  ["时长", (selected.durationMinutes ?? 50)+"分钟"],
                  ["第几次", "第"+(selected.sessionNumber ?? 1)+"次"],
                ].map(([k,v]) => (
                  <div key={k} className="flex justify-between text-sm py-0.5">
                    <span style={{ color: "#9B8E82" }}>{k}</span>
                    <span style={{ color: "#2C2420" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-3" style={{ background: "white", border: "1px solid #EBE7DF" }}>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                  <p className="text-xs font-semibold" style={{ color: "#9B8E82" }}>费用与订单</p>
                </div>
                {[
                  ["咨询费用", "¥"+(selected.priceAmount ?? "—")],
                  ["订单编号", selected.id.slice(0,20)+"…"],
                  ["创建时间", fmt(selected.createdAt)],
                ].map(([k,v]) => (
                  <div key={k} className="flex justify-between text-sm py-0.5">
                    <span style={{ color: "#9B8E82" }}>{k}</span>
                    <span style={{ color: "#2C2420" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {selected.status === "pending_confirmation" && (
                <div className="flex gap-2">
                  <button onClick={() => handleAction(selected.id, "rejected")} disabled={processing}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold" style={{ background: "#FEE2E2", color: "#DC2626" }}>拒绝</button>
                  <button onClick={() => handleAction(selected.id, "pending_payment")} disabled={processing}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold text-white" style={{ background: "var(--color-primary)" }}>确认预约</button>
                </div>
              )}
              {selected.status === "paid" && (
                <button onClick={() => handleAction(selected.id, "completed")} disabled={processing}
                  className="w-full py-3 rounded-2xl text-sm font-bold text-white" style={{ background: "var(--color-primary)" }}>标记已完成</button>
              )}
              {!["cancelled","completed","rejected"].includes(selected.status) && (
                <button onClick={() => handleAction(selected.id, "cancelled")} disabled={processing}
                  className="w-full py-3 rounded-2xl text-sm font-bold" style={{ background: "#FEE2E2", color: "#DC2626" }}>取消订单</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
