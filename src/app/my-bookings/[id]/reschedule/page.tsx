"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";
import { request } from "@/lib/api/request";

const WEEKDAY = ["日","一","二","三","四","五","六"];
const REASONS = ["临时有事，需要调整","工作安排冲突","身体不适","家庭事务","其他原因"];
const SLOTS = ["09:00","10:00","11:00","14:00","15:00","16:00","19:00","20:00"];

function genDays(n = 14) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    return { label: (d.getMonth()+1)+"/"+d.getDate(), weekday: "周"+WEEKDAY[d.getDay()], iso: d.toISOString().slice(0,10) };
  });
}

export default function ReschedulePage() {
  const router = useRouter();
  const { id } = useParams();
  type BookingInfo = { counselorName: string; counselorType: string; scheduledAt: string; sessionMode: string; sessionNumber: number };
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [selDay, setSelDay] = useState("");
  const [selTime, setSelTime] = useState("");
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const days = genDays();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    request("/api/bookings/"+id).then(r => r.json()).then(d => {
      if (d.booking) setBooking({
        counselorName: d.booking.counselor?.displayName ?? "咨询师",
        counselorType: d.booking.counselor?.counselorTypes?.[0] ?? "心理咨询师",
        scheduledAt: d.booking.scheduledAt ?? "",
        sessionMode: d.booking.sessionMode ?? "视频咨询",
        sessionNumber: d.booking.sessionNumber ?? 1,
      });
    }).catch(() => {});
  }, [id]);

  const selectedLabel = selDay && selTime
    ? (() => { const d = days.find(x => x.iso === selDay); return d ? `${d.weekday} ${d.label} ${selTime}` : ""; })()
    : "";
  const canSubmit = selDay && selTime && reason;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    await request("/api/bookings/"+id+"/reschedule", {
      method: "POST",
      body: JSON.stringify({ newTime: selDay+"T"+selTime+":00", reason }),
    });
    setSubmitting(false);
    setDone(true);
  };

  if (done) return (
    <div className="min-h-screen flex flex-col items-center px-5 pt-16 pb-10" style={{ background: "var(--color-bg)" }}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ background: "#E4F0DC" }}>
        <span className="text-2xl text-green-700">✓</span>
      </div>
      <h2 className="text-xl font-bold text-center mb-2" style={{ color: "#2C2420" }}>改期申请已提交</h2>
      <p className="text-sm text-center mb-10" style={{ color: "#9B8E82" }}>咨询师将在 24 小时内确认，请留意消息通知。</p>
      <button onClick={() => router.push("/profile")} className="w-full py-3.5 rounded-2xl text-white font-bold mb-3" style={{ background: "var(--color-primary)" }}>查看我的预约</button>
      <button onClick={() => router.push("/")} className="w-full py-3.5 rounded-2xl font-medium text-sm" style={{ background: "#EBE7DF", color: "#5A4E44" }}>返回首页</button>
    </div>
  );

  return (
    <div className="min-h-screen pb-10" style={{ background: "var(--color-bg)" }}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 sticky top-0 z-10" style={{ background: "rgba(245,240,232,0.96)", backdropFilter: "blur(8px)" }}>
        <button onClick={() => router.back()} className="p-1.5 rounded-full" style={{ background: "#EBE7DF" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "#5A4E44" }} />
        </button>
        <h1 className="text-base font-bold" style={{ color: "#2C2420" }}>申请改期</h1>
      </div>
      <div className="px-5 space-y-4 pt-2">
        {booking && (
          <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #EBE7DF" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold text-white flex-none" style={{ background: "var(--color-primary)" }}>{booking.counselorName[0]}</div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: "#9B8E82" }}>{booking.counselorType}</p>
                <p className="text-base font-bold" style={{ color: "#2C2420" }}>{booking.counselorName}</p>
              </div>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: "#9B8E82" }}>当前咨询时间</p>
              <p className="text-sm font-semibold" style={{ color: "#2C2420" }}>
                {booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleString("zh-CN", { year:"numeric",month:"2-digit",day:"2-digit",weekday:"short",hour:"2-digit",minute:"2-digit" }) : "—"}
              </p>
            </div>
            <div className="mt-2">
              <p className="text-xs mb-0.5" style={{ color: "#9B8E82" }}>咨询次数及方式</p>
              <p className="text-sm font-semibold" style={{ color: "#2C2420" }}>第{booking.sessionNumber}次 {booking.sessionMode}</p>
            </div>
          </div>
        )}
        <div className="rounded-2xl px-4 py-3" style={{ background: "#E4F0DC", border: "1px solid #CCE0C0" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "#3A6228" }}>申请改期前，请先和咨询师沟通好时间</p>
          <p className="text-sm" style={{ color: "#5A7A3A" }}>建议在私信中与咨询师确认好新时间后，再提交申请。改期申请提交后，需等待咨询师确认，原时间暂不释放。</p>
        </div>
        {/* 选择时间 — 抽屉触发 */}
        <div className="rounded-2xl" style={{ background:"white", border:"1px solid #EBE7DF" }}>
          <button onClick={() => setShowPicker(true)} className="w-full flex items-center justify-between px-4 py-4">
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color:"#2C2420" }}>希望改到的时间 <span style={{color:"#EF4444"}}>*</span></p>
              {selectedLabel
                ? <p className="text-sm mt-0.5" style={{ color:"var(--color-primary)" }}>{selectedLabel}</p>
                : <p className="text-sm mt-0.5" style={{ color:"#C4BDB5" }}>点击选择日期和时段</p>}
            </div>
            <ChevronRight className="w-4 h-4 flex-none" style={{ color:"#C4BDB5" }} />
          </button>
        </div>
        <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #EBE7DF" }}>
          <p className="text-sm font-semibold mb-3" style={{ color: "#2C2420" }}>改期原因 *</p>
          <div className="space-y-2">
            {REASONS.map(r => (
              <button key={r} onClick={() => setReason(r)} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-left"
                style={{ background: reason===r?"#E4F0DC":"#F8F5F0", border:"1px solid "+(reason===r?"#9CB48A":"#EBE7DF"), color: reason===r?"#3A6228":"#2C2420" }}>
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-none" style={{ borderColor: reason===r?"var(--color-primary)":"#C4BDB5" }}>
                  {reason===r && <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-primary)" }} />}
                </div>
                {r}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleSubmit} disabled={!canSubmit||submitting} className="w-full py-3.5 rounded-2xl text-white font-bold"
          style={{ background: canSubmit&&!submitting?"var(--color-primary)":"#C4BDB5" }}>
          {submitting ? "发送中…" : "发送改期申请"}
        </button>
        <p className="text-xs text-center pb-4" style={{ color: "#9B8E82" }}>咨询师确认后，订单时间将自动更新。若咨询师拒绝，原时间保持不变。</p>
      </div>

      {/* 时间选择抽屉 */}
      {mounted && showPicker && createPortal(
        <div style={{ position:"fixed",inset:0,zIndex:99999,display:"flex",flexDirection:"column",justifyContent:"flex-end" }}
          onClick={() => setShowPicker(false)}>
          <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.55)" }} />
          <div style={{ position:"relative",zIndex:1,background:"var(--color-bg)",borderRadius:"24px 24px 0 0",maxHeight:"80vh",overflowY:"auto",paddingBottom:32 }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor:"#EBE7DF" }}>
              <h3 className="text-base font-bold" style={{ color:"#2C2420" }}>选择希望改到的时间</h3>
              <button onClick={() => setShowPicker(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background:"#EBE7DF",color:"#5A4E44",fontSize:18 }}>×</button>
            </div>
            <div className="px-4 pt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold mb-2.5" style={{ color:"#9B8E82" }}>选择日期</p>
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:"none" }}>
                  {days.map(d => (
                    <button key={d.iso} onClick={() => { setSelDay(d.iso); setSelTime(""); }}
                      className="flex-none flex flex-col items-center rounded-2xl px-3.5 py-2.5"
                      style={{ background:selDay===d.iso?"var(--color-primary)":"white",border:"1px solid "+(selDay===d.iso?"var(--color-primary)":"#EBE7DF"),color:selDay===d.iso?"white":"#5A4E44",minWidth:60 }}>
                      <span className="text-xs">{d.weekday}</span>
                      <span className="text-sm font-bold mt-0.5">{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {selDay && (
                <div>
                  <p className="text-xs font-semibold mb-2.5" style={{ color:"#9B8E82" }}>选择时段</p>
                  <div className="grid grid-cols-4 gap-2">
                    {SLOTS.map(t => (
                      <button key={t} onClick={() => setSelTime(t)}
                        className="py-2.5 rounded-xl text-sm font-medium"
                        style={{ background:selTime===t?"var(--color-primary)":"#F8F5F0",color:selTime===t?"white":"#5A4E44",border:"1px solid "+(selTime===t?"var(--color-primary)":"#EBE7DF") }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => { if(selDay&&selTime) setShowPicker(false); }}
                disabled={!selDay||!selTime}
                className="w-full py-3.5 rounded-2xl text-white font-bold"
                style={{ background:selDay&&selTime?"var(--color-primary)":"#C4BDB5" }}>
                {selDay&&selTime ? `确认：${selectedLabel}` : "请先选择日期和时段"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
