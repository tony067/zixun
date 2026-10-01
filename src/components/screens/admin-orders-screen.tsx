"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { request } from "@/lib/api/request";
import { statusMeta } from "@/lib/booking-status";
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
  { key: "in_progress", label: "进行中" },
  { key: "completed", label: "已完成" },
  { key: "cancelled", label: "已取消" },
  { key: "refunded", label: "已退款" },
];

// 评估订单状态文案/配色 —— 完全对齐 booking-status.ts 纸叠色板：
// 陶土橙=待支付（同总览「待处理订单」图标色系），绿=已付款待进行，青绿=报告进行中，灰=完结
const SVC_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  pending_payment: { label: "待支付",   bg: "#FAE9DD", text: "#C66B2E" },
  paid:            { label: "待作答",   bg: "#E4F0DC", text: "#3A6228" },
  submitted:       { label: "待写报告", bg: "#E4F2F0", text: "#3A9B8E" },
  completed:       { label: "已完成",   bg: "#9CB48A", text: "white" },
  refunded:        { label: "已退款",   bg: "#FEF9EE", text: "#B07D2A" },
  cancelled:       { label: "已取消",   bg: "#EBE7DF", text: "#9B8E82" },
};

type ServiceOrder = {
  id: string; status: string; price: number | null; serviceName: string;
  createdAt: string | null; clientId: string; counselorId: string;
  clientName?: string | null; counselorName?: string | null;
};

export default function AdminOrdersScreen({ variant = "admin" }: { variant?: "admin" | "support" } = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const isSupport = variant === "support";
  const [bizTab, setBizTab] = useState<"booking" | "service">("booking");
  const [tab, setTab] = useState("all");
  const [svcTab, setSvcTab] = useState("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [svcOrders, setSvcOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [processing, setProcessing] = useState(false);

  const SVC_TABS = [
    { key: "all", label: "全部" },
    { key: "pending_payment", label: "待支付" },
    { key: "paid", label: "待作答" },
    { key: "submitted", label: "待写报告" },
    { key: "completed", label: "已完成" },
    { key: "refunded", label: "已退款" },
    { key: "cancelled", label: "已取消" },
  ];

  // 进入页面一次性拉全量（咨询 + 评估），筛选全部在前端做；同时标记「已查看」清掉新增红点
  const load = () => {
    setLoading(true);
    request("/api/admin/orders/seen", { method: "PATCH" }).catch(() => {});
    Promise.all([
      request("/api/admin/orders").then(r => r.json()),
      request("/api/service-orders").then(r => r.json()),
    ]).then(([b, s]) => {
      setBookings(Array.isArray(b) ? b : Array.isArray(b.bookings) ? b.bookings : []);
      setSvcOrders(Array.isArray(s) ? s : []);
    }).catch(() => { setBookings([]); setSvcOrders([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleSvcAction = async (id: string, action: string) => {
    setProcessing(true);
    await request("/api/service-orders/"+id, { method: "PATCH", body: JSON.stringify({ action }) });
    setSvcOrders(prev => prev.map(o => o.id === id ? {
      ...o,
      status: action === "confirm_paid" ? "paid" : action === "refund" ? "refunded" : o.status,
    } : o));
    setProcessing(false);
  };

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

  const st = (status: string) => {
    const m = statusMeta(status);
    return { bg: m.bg, text: m.color, label: m.label };
  };

  const filteredBookings = tab === "all" ? bookings : bookings.filter(b => b.status === tab);
  const filteredSvc = svcTab === "all" ? svcOrders : svcOrders.filter(o => o.status === svcTab);

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--color-bg)" }}>
      <div className="px-5 pt-12 pb-3">
        <h1 className="text-xl font-bold" style={{ color: "#2C2420" }}>{isSupport ? "客服 · 订单" : "订单管理"}</h1>
        <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>
          {bizTab === "booking" ? `咨询订单 ${tab === "all" ? `共 ${bookings.length} 笔` : `${filteredBookings.length} 笔`} ` : `个性服务订单 ${svcTab === "all" ? `共 ${svcOrders.length} 笔` : `${filteredSvc.length} 笔`}`}
        </p>
      </div>
      {/* 业务类型一级 tab */}
      <div className="flex gap-2 px-4 pb-2">
        {[
          { key: "booking", label: "咨询订单" },
          { key: "service", label: "评估订单" },
        ].map(t => (
          <button key={t.key} onClick={() => setBizTab(t.key as "booking" | "service")}
            className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: bizTab===t.key?"var(--color-primary)":"#EBE7DF", color: bizTab===t.key?"white":"#5A4E44" }}>
            {t.label}
          </button>
        ))}
      </div>
      {bizTab === "service" ? (
        <>
          <div className="flex gap-2 px-4 overflow-x-auto pb-3">
            {SVC_TABS.map(opt => (
              <button key={opt.key} onClick={() => setSvcTab(opt.key)}
                className="flex-none px-3.5 py-1.5 rounded-full text-xs font-medium"
                style={{ background: svcTab===opt.key?"var(--color-primary)":"#EBE7DF", color: svcTab===opt.key?"white":"#5A4E44" }}>
                {opt.label}
              </button>
            ))}
          </div>
          <div className="px-4 space-y-3">
            {loading ? (
              <div className="text-center py-16 text-sm" style={{ color: "#9B8E82" }}>加载中…</div>
            ) : filteredSvc.length === 0 ? (
              <div className="text-center py-16 text-sm" style={{ color: "#9B8E82" }}>暂无订单</div>
            ) : filteredSvc.map(o => {
              const s = SVC_STATUS[o.status] ?? { label: o.status, bg: "#F5F5F4", text: "#78716C" };
              const isOffline = o.status === "pending_payment";
              return (
                <div key={o.id} className="rounded-2xl p-4"
                  style={{ background: isOffline ? "#FBEFE3" : "white", border: isOffline ? "1.5px solid #E8A87C" : "1px solid #EBE7DF" }}>
                  <div className="flex items-start justify-between mb-2">
                    <button onClick={() => router.push("/my-services/"+o.id)} className="text-left flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#2C2420" }}>{o.serviceName}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{o.clientName ?? o.clientId.slice(0,10)} → {o.counselorName ?? "老师"} · {fmt(o.createdAt)}</p>
                    </button>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-none ml-2"
                      style={{ background: s.bg, color: s.text }}>{s.label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {o.status === "pending_payment" && (
                        <button onClick={() => handleSvcAction(o.id, "confirm_paid")} disabled={processing}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: "var(--color-primary)" }}>确认收到转账</button>
                      )}
                      {["pending_payment", "paid"].includes(o.status) && (
                        <button onClick={() => handleSvcAction(o.id, "refund")} disabled={processing}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: "#FEF9EE", color: "#B07D2A", border: "1px solid #F5E6C0" }}>退款</button>
                      )}
                    </div>
                    <p className="text-sm font-bold" style={{ color: "#2C2420" }}>¥{o.price ?? "—"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
      <>
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
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: "#9B8E82" }}>暂无订单</div>
        ) : filteredBookings.map(b => {
          const s = st(b.status);
          const isOffline = b.status === "pending_payment";
          return (
            <button key={b.id} onClick={() => router.push("/admin/orders/"+b.id)} className="w-full text-left rounded-2xl p-4"
              style={{ background: isOffline ? "#FBEFE3" : "white", border: isOffline ? "1.5px solid #E8A87C" : "1px solid #EBE7DF" }}>
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
                <p className="text-xs" style={{ color: isOffline ? "#B07D2A" : "#9B8E82", fontWeight: isOffline ? 600 : 400 }}>
                  {isOffline ? "客户线下转账，进入详情确认收款" : `${b.sessionMode} · ${b.durationMinutes ?? 50}分钟`}
                  {!isOffline && b.rescheduleStatus === "pending" && <span className="ml-2 text-orange-500"> ● 改期申请</span>}
                </p>
                <p className="text-sm font-bold" style={{ color: "#2C2420" }}>¥{b.priceAmount ?? "—"}</p>
              </div>
            </button>
          );
        })}
      </div>
      </>
      )}
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
              {isSupport ? (
                <>
                  {/* 客服：仅开放 标记已支付 + 退款 */}
                  {["pending_payment", "confirmed"].includes(selected.status) && (
                    <button onClick={() => handleAction(selected.id, "paid")} disabled={processing}
                      className="w-full py-3 rounded-2xl text-sm font-bold text-white" style={{ background: "var(--color-primary)" }}>标记已支付</button>
                  )}
                  {["pending_confirmation", "pending_payment", "paid", "in_progress", "completed"].includes(selected.status) && (
                    <button onClick={() => handleAction(selected.id, "refunded")} disabled={processing}
                      className="w-full py-3 rounded-2xl text-sm font-bold" style={{ background: "#FEF9EE", color: "#B07D2A", border: "1px solid #F5E6C0" }}>退款</button>
                  )}
                </>
              ) : (
                <>
                  {selected.status === "pending_confirmation" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(selected.id, "rejected")} disabled={processing}
                        className="flex-1 py-3 rounded-2xl text-sm font-bold" style={{ background: "#FEE2E2", color: "#DC2626" }}>拒绝</button>
                      <button onClick={() => handleAction(selected.id, "paid")} disabled={processing}
                        className="flex-1 py-3 rounded-2xl text-sm font-bold text-white" style={{ background: "var(--color-primary)" }}>确认预约</button>
                    </div>
                  )}
                  {/* 待支付 = 线下转账订单：确认已收到来访的转账 */}
                  {selected.status === "pending_payment" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(selected.id, "rejected")} disabled={processing}
                        className="flex-1 py-3 rounded-2xl text-sm font-bold" style={{ background: "#FEE2E2", color: "#DC2626" }}>拒绝</button>
                      <button onClick={() => handleAction(selected.id, "paid")} disabled={processing}
                        className="flex-1 py-3 rounded-2xl text-sm font-bold text-white" style={{ background: "var(--color-primary)" }}>确认收到转账</button>
                    </div>
                  )}
                  {(selected.status === "paid" || selected.status === "in_progress") && (
                    <button onClick={() => handleAction(selected.id, "completed")} disabled={processing}
                      className="w-full py-3 rounded-2xl text-sm font-bold text-white" style={{ background: "var(--color-primary)" }}>标记已完成</button>
                  )}
                  {["in_progress", "completed"].includes(selected.status) && (
                    <button onClick={() => handleAction(selected.id, "refunded")} disabled={processing}
                      className="w-full py-3 rounded-2xl text-sm font-bold" style={{ background: "#FEF9EE", color: "#B07D2A", border: "1px solid #F5E6C0" }}>退款（仅管理员可操作）</button>
                  )}
                  {!["cancelled","completed","rejected"].includes(selected.status) && (
                    <button onClick={() => handleAction(selected.id, "cancelled")} disabled={processing}
                      className="w-full py-3 rounded-2xl text-sm font-bold" style={{ background: "#FEE2E2", color: "#DC2626" }}>取消订单</button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
