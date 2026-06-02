"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";

const MOCK_BILLS = [
  { id:"bk_001", date:"2026-06-01", client:"张靖", counselor:"陈晓雯", amount:450, status:"completed" },
  { id:"bk_002", date:"2026-06-02", client:"王明浩", counselor:"林诗涵", amount:380, status:"pending_payment" },
  { id:"bk_003", date:"2026-06-03", client:"李晓月", counselor:"余晓彤", amount:500, status:"paid" },
  { id:"bk_004", date:"2026-05-28", client:"张靖", counselor:"陈晓雯", amount:450, status:"completed" },
  { id:"bk_005", date:"2026-05-20", client:"王明浩", counselor:"林诗涵", amount:380, status:"completed" },
  { id:"bk_006", date:"2026-05-15", client:"李晓月", counselor:"余晓彤", amount:500, status:"completed" },
  { id:"bk_007", date:"2026-04-30", client:"张靖", counselor:"陈晓雯", amount:450, status:"completed" },
];

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  completed:   { bg:"#F0FDF4", color:"#16A34A", label:"已完成" },
  paid:        { bg:"#FEF3C7", color:"#D97706", label:"待咨询" },
  pending_payment: { bg:"#EFF6FF", color:"#2563EB", label:"待支付" },
};

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") ?? "monthly";
  const title = type === "monthly" ? "本月应收" : "累计应收";

  const bills = type === "monthly"
    ? MOCK_BILLS.filter(b => b.date.startsWith("2026-06"))
    : MOCK_BILLS;

  const total = bills.filter(b => b.status === "completed").reduce((s, b) => s + b.amount, 0);
  const pending = bills.filter(b => b.status !== "completed").reduce((s, b) => s + b.amount, 0);

  return (
    <div className="min-h-screen pb-10" style={{ background:"var(--color-bg)" }}>
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background:"rgba(245,240,232,0.95)", backdropFilter:"blur(8px)", borderColor:"#DDD8D0" }}>
        <button onClick={() => router.back()} className="p-1.5 rounded-full" style={{ background:"#EBE7DF" }}>
          <ArrowLeft className="w-4 h-4" style={{ color:"#5A4E44" }} />
        </button>
        <h1 className="text-base font-bold" style={{ color:"#2C2420" }}>{title}</h1>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* 汇总卡 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4" style={{ background:"white", border:"1px solid #EBE7DF" }}>
            <p className="text-xs mb-1" style={{ color:"#9B8E82" }}>已到账</p>
            <p className="text-xl font-bold" style={{ color:"#2C2420" }}>¥{total.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background:"white", border:"1px solid #EBE7DF" }}>
            <p className="text-xs mb-1" style={{ color:"#9B8E82" }}>待到账</p>
            <p className="text-xl font-bold" style={{ color:"#D97706" }}>¥{pending.toLocaleString()}</p>
          </div>
        </div>

        {/* 账单列表 */}
        <p className="text-xs font-semibold pt-1" style={{ color:"#9B8E82" }}>账单明细</p>
        {bills.map(b => {
          const st = STATUS_STYLE[b.status] ?? { bg:"#F5F0EA", color:"#9B8E82", label:b.status };
          return (
            <button key={b.id} onClick={() => router.push("/admin/orders/"+b.id)}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left"
              style={{ background:"white", border:"1px solid #EBE7DF" }}>
              <div>
                <p className="text-sm font-semibold" style={{ color:"#2C2420" }}>{b.client} → {b.counselor}</p>
                <p className="text-xs mt-0.5" style={{ color:"#9B8E82" }}>{b.date}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <p className="text-sm font-bold" style={{ color:"#2C2420" }}>¥{b.amount}</p>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:st.bg, color:st.color }}>{st.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BillingPage() {
  return <Suspense><BillingContent /></Suspense>;
}
