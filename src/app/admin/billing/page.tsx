"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { request } from "@/lib/api/request";

interface BillItem {
  id: string;
  scheduledDate: string;
  scheduledTime: string;
  priceAmount: number;
  counselorId: string;
  counselorName: string;
  clientId: string;
  clientName: string;
  clientNote: string;
}

function exportCSV(items: BillItem[], year: number, month: number, total: number) {
  const header = ["订单编号","日期","时间","咨询师","来访者","金额(元)","备注"].join(",");
  const rows = items.map(r =>
    [r.id, r.scheduledDate, r.scheduledTime ?? "", `"${r.counselorName}"`,
     `"${r.clientName}"`, r.priceAmount, `"${r.clientNote}"`].join(",")
  );
  const footer = `,,,,合计,${total},`;
  const csv = ["\uFEFF" + header, ...rows, footer].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `MindPace账单_${year}年${month}月.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function BillingContent() {
  const router = useRouter();
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [items, setItems] = useState<BillItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    request(`/api/admin/billing?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(d => { setItems(d.items ?? []); setTotal(d.total ?? 0); })
      .finally(() => setLoading(false));
  }, [year, month]);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    const nm = month === 12 ? 1 : month + 1;
    const ny = month === 12 ? year + 1 : year;
    if (ny > now.getFullYear() || (ny === now.getFullYear() && nm > now.getMonth() + 1)) return;
    setYear(ny); setMonth(nm);
  }
  const canNext = !(year === now.getFullYear() && month === now.getMonth() + 1);

  return (
    <div className="min-h-screen pb-24" style={{ background: "#FAF7F2" }}>
      <div className="sticky top-0 z-10 px-4 pt-12 pb-3 flex items-center gap-3"
        style={{ background: "rgba(250,247,242,0.95)", backdropFilter: "blur(12px)" }}>
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "#EBE7DF" }}>
          <ArrowLeft size={18} style={{ color: "#6B5E52" }} />
        </button>
        <h1 className="text-lg font-bold flex-1" style={{ color: "#2C2420" }}>账单管理</h1>
        <button onClick={() => exportCSV(items, year, month, total)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "#9CB48A", color: "white" }}>
          <Download size={14} />
          导出 CSV
        </button>
      </div>

      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between rounded-2xl px-4 py-3"
          style={{ background: "#FDFBF7", border: "1px solid #EBE7DF" }}>
          <button onClick={prevMonth} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "#EBE7DF" }}>
            <ChevronLeft size={16} style={{ color: "#6B5E52" }} />
          </button>
          <span className="text-base font-bold" style={{ color: "#2C2420" }}>
            {year} 年 {month} 月
          </span>
          <button onClick={nextMonth} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: canNext ? "#EBE7DF" : "transparent", opacity: canNext ? 1 : 0.3 }}>
            <ChevronRight size={16} style={{ color: "#6B5E52" }} />
          </button>
        </div>

        <div className="rounded-2xl px-5 py-4" style={{ background: "#9CB48A" }}>
          <p className="text-sm font-medium text-white/80 mb-1">{year}年{month}月完成订单总额</p>
          <p className="text-3xl font-bold text-white">¥{total.toLocaleString()}</p>
          <p className="text-xs text-white/70 mt-1">共 {items.length} 笔已完成订单</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm" style={{ color: "#9B8E82" }}>加载中…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "#9B8E82" }}>本月暂无已完成订单</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold px-1" style={{ color: "#C4BDB5" }}>订单明细</p>
            {items.map(item => (
              <div key={item.id} className="rounded-2xl px-4 py-3.5"
                style={{ background: "#FDFBF7", border: "1px solid #EBE7DF" }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold" style={{ color: "#2C2420" }}>
                        {item.counselorName}
                      </span>
                      <span className="text-xs" style={{ color: "#C4BDB5" }}>→</span>
                      <span className="text-sm" style={{ color: "#6B5E52" }}>{item.clientName}</span>
                    </div>
                    <p className="text-xs" style={{ color: "#9B8E82" }}>
                      {item.scheduledDate}{item.scheduledTime ? ` · ${item.scheduledTime}` : ""}
                    </p>
                    {item.clientNote && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "#C4BDB5" }}>
                        {item.clientNote}
                      </p>
                    )}
                  </div>
                  <p className="text-base font-bold ml-3 flex-shrink-0" style={{ color: "#2C2420" }}>
                    ¥{item.priceAmount}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BillingPage() {
  return <Suspense><BillingContent /></Suspense>;
}

const MOCK_BILLS = [
  { id:"bk_001", date:"2026-06-01", client:"张靖", counselor:"陈晓雯", amount:450, status:"completed" },
  { id:"bk_002", date:"2026-06-02", client:"王明浩", counselor:"林诗涵", amount:380, status:"pending_payment" },
  { id:"bk_003", date:"2026-06-03", client:"李晓月", counselor:"余晓彤", amount:500, status:"paid" },
  { id:"bk_004", date:"2026-05-28", client:"张靖", counselor:"陈晓雯", amount:450, status:"completed" },
  { id:"bk_005", date:"2026-05-20", client:"王明浩", counselor:"林诗涵", amount:380, status:"completed" },
  { id:"bk_006", date:"2026-05-15", client:"李晓月", counselor:"余晓彤", amount:500, status:"completed" },
  { id:"bk_007", date:"2026-04-30", client:"张靖", counselor:"陈晓雯", amount:450, status:"completed" },
];

export default function BillingPage() {
  return <Suspense><BillingContent /></Suspense>;
}
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
