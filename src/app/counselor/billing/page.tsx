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
  clientName: string;
  clientNote: string;
}

function exportCSV(items: BillItem[], year: number, month: number, total: number) {
  const header = ["订单编号","日期","时间","来访者","金额(元)","备注"].join(",");
  const rows = items.map(r =>
    [r.id, r.scheduledDate, r.scheduledTime ?? "",
     `"${r.clientName}"`, r.priceAmount, `"${r.clientNote}"`].join(",")
  );
  const footer = `,,,,合计,${total}`;
  const csv = ["\uFEFF" + header, ...rows, footer].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `我的账单_${year}年${month}月.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function BillingContent() {
  const router = useRouter();
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showPicker, setShowPicker] = useState(false);
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const [items, setItems] = useState<BillItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    request(`/api/counselor/billing?year=${year}&month=${month}`)
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
        <button onClick={() => { const from = new URLSearchParams(window.location.search).get('from'); router.push(from === 'stats' ? '/counselor/schedule?tab=stats' : '/counselor/billing'); }}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "#EBE7DF" }}>
          <ArrowLeft size={18} style={{ color: "#6B5E52" }} />
        </button>
        <h1 className="text-lg font-bold flex-1" style={{ color: "#2C2420" }}>我的账单</h1>
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
            <button onClick={() => setShowPicker(v => !v)} className="font-bold text-base px-3 py-1 rounded-xl" style={{ color: "#2C2420", background: showPicker ? "#EBE7DF" : "transparent" }}>{year} 年 {month} 月 ▾</button>
          </span>
          <button onClick={nextMonth} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: canNext ? "#EBE7DF" : "transparent", opacity: canNext ? 1 : 0.3 }}>
            <ChevronRight size={16} style={{ color: "#6B5E52" }} />
          </button>
        </div>

        {showPicker && (
          <div className="rounded-2xl p-4 mb-3" style={{ background: "white", border: "1px solid #EBE7DF" }}>
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-xs text-center mb-2" style={{ color: "#9B8E82" }}>年份</p>
                {years.map(y => (
                  <button key={y} onClick={() => { setYear(y); }}
                    className="w-full py-2 rounded-xl text-sm font-medium mb-1"
                    style={{ background: y === year ? "#9CB48A" : "#F5F0EA", color: y === year ? "white" : "#2C2420" }}>
                    {y} 年
                  </button>
                ))}
              </div>
              <div className="flex-1">
                <p className="text-xs text-center mb-2" style={{ color: "#9B8E82" }}>月份</p>
                <div className="grid grid-cols-3 gap-1">
                  {months.map(m => {
                    const disabled = year === now.getFullYear() && m > now.getMonth() + 1;
                    return (
                      <button key={m} onClick={() => { if (!disabled) { setMonth(m); setShowPicker(false); } }}
                        className="py-1.5 rounded-lg text-sm font-medium"
                        style={{ background: m === month && year === year ? "#9CB48A" : disabled ? "#F5F0EA" : "#F5F0EA",
                          color: m === month ? "white" : disabled ? "#C4BDB5" : "#2C2420",
                          opacity: disabled ? 0.4 : 1 }}>
                        {m}月
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="rounded-2xl px-5 py-4" style={{ background: "#9CB48A" }}>
          <p className="text-sm font-medium text-white/80 mb-1">{year}年{month}月咨询收入</p>
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
                    <p className="text-sm font-semibold mb-0.5" style={{ color: "#2C2420" }}>
                      {item.clientName}
                    </p>
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

export default function CounselorBillingPage() {
  return <Suspense><BillingContent /></Suspense>;
}
