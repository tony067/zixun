"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const NOTIF_SETTINGS = [
  { id: "booking_confirm", label: "预约确认通知", sub: "咨询师确认预约时通知我", defaultOn: true },
  { id: "booking_remind",  label: "咨询提醒",     sub: "咨询开始前1小时提醒", defaultOn: true },
  { id: "message",         label: "新消息提醒",   sub: "收到私信时通知我",     defaultOn: true },
  { id: "reschedule",      label: "改期申请",     sub: "咨询师发起改期时通知我", defaultOn: true },
  { id: "promo",           label: "平台活动",     sub: "新咨询师和活动推送",   defaultOn: false },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_SETTINGS.map(s => [s.id, s.defaultOn]))
  );

  return (
    <div className="min-h-svh pb-24" style={{ background: "var(--color-surface)" }}>
      <div className="sticky top-0 z-10 px-5 pt-12 pb-4 flex items-center gap-3" style={{ background: "var(--color-surface)" }}>
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "white" }}>
          <ChevronLeft className="w-5 h-5 text-[#2C2420]" />
        </button>
        <h1 className="text-lg font-bold text-[#2C2420]">通知设置</h1>
      </div>
      <div className="px-5">
        <div className="rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          {NOTIF_SETTINGS.map((s, i) => (
            <div key={s.id} className={`flex items-center justify-between px-4 py-3.5 ${i < NOTIF_SETTINGS.length - 1 ? "border-b border-[#F0EBE3]" : ""}`}>
              <div>
                <p className="text-sm font-semibold text-[#2C2420]">{s.label}</p>
                <p className="text-xs text-[#9B8E82] mt-0.5">{s.sub}</p>
              </div>
              <button onClick={() => setStates(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                className="w-12 h-6 rounded-full transition-all flex-shrink-0 relative"
                style={{ background: states[s.id] ? "#9CB48A" : "#E0D8D0" }}>
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                  style={{ left: states[s.id] ? "calc(100% - 22px)" : "2px" }} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
