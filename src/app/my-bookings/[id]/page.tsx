"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import { request } from "@/lib/api/request";

type BookingDetail = {
  id: string; status: string; scheduledAt: string; durationMinutes: number;
  sessionMode: string; priceAmount: number; sessionNumber?: number;
  applicationForm?: Record<string,string> | null;
  agreementSigned?: boolean;
  counselor: { id: string; displayName: string; counselorTypes?: string[] } | null;
};

const STATUS_CONFIG: Record<string,{label:string;desc:string;color:string}> = {
  pending_confirmation: { label:"等待咨询师确认", desc:"请耐心等候，咨询师确认后将通知您。", color:"#D97706" },
  pending_payment:      { label:"待支付",         desc:"请在24小时内完成支付，逾期将自动取消。", color:"#2563EB" },
  paid:                 { label:"即将咨询",        desc:"咨询即将开始，请提前准备好设备。", color:"#059669" },
  completed:            { label:"咨询完成",        desc:"本次咨询已完成，如与咨询师已约定下次咨询时间，请及时续约。", color:"#059669" },
  cancelled:            { label:"已取消",          desc:"本次预约已取消。", color:"#9CA3AF" },
  rejected:             { label:"已拒绝",          desc:"咨询师无法接受本次预约，建议重新选择时间。", color:"#DC2626" },
};

const AGREEMENT_TEXT = `MindPace 咨询服务协议

一、服务说明
本平台提供神经多样性友好的心理咨询服务，咨询师均经联盟认证。

二、保密原则
咨询内容严格保密，以下情况除外：
1. 来访者有伤害自己或他人的危险；
2. 法律要求披露。

三、取消与改期政策
• 咨询开始前24小时可免费取消或改期；
• 24小时内取消将扣除50%费用；
• 未出席将扣除全部费用。

四、来访者权利与责任
来访者有权了解咨询方法，有责任如实告知个人情况，并遵守预约时间。

五、紧急情况
如遇紧急心理危机，请拨打心理援助热线 400-161-9995。

本协议由来访者在首次预约时确认签署，签署后视为同意以上条款。`;

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [bk, setBk] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    request(`/api/bookings/${id}`).then(r => r.json()).then(d => {
      setBk(d.booking ?? d ?? null);
    }).finally(() => setLoading(false));
  }, [id]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-svh flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#9CB48A] border-t-transparent animate-spin" />
    </div>
  );
  if (!bk) return (
    <div className="min-h-svh flex items-center justify-center">
      <p className="text-sm text-[#9B8E82]">订单不存在</p>
    </div>
  );

  const dt = bk.scheduledAt ? new Date(bk.scheduledAt) : null;
  const endDt = dt ? new Date(dt.getTime() + bk.durationMinutes * 60000) : null;
  const pad = (n: number) => n.toString().padStart(2, "0");
  const WD = ["周日","周一","周二","周三","周四","周五","周六"];
  const dateStr = dt && endDt
    ? `${dt.getFullYear()}.${pad(dt.getMonth()+1)}.${pad(dt.getDate())} ${WD[dt.getDay()]} ${pad(dt.getHours())}:${pad(dt.getMinutes())}-${pad(endDt.getHours())}:${pad(endDt.getMinutes())}`
    : "—";
  const status = STATUS_CONFIG[bk.status] ?? { label: bk.status, desc: "", color: "#9B8E82" };

  return (
    <div className="min-h-svh pb-32" style={{ background: "#F5F0EA" }}>
      {/* 顶部导航 */}
      <div className="flex items-center px-4 pt-14 pb-4">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-[#2C2420]" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-[#2C2420]">我的咨询</h1>
      </div>

      <div className="px-4 space-y-3">
        {/* 状态卡 */}
        <div className="rounded-2xl p-4" style={{ background: "white" }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ background: status.color }} />
            <p className="text-sm font-bold" style={{ color: status.color }}>{status.label}</p>
          </div>
          <p className="text-xs text-[#9B8E82] leading-relaxed">{status.desc}</p>
        </div>

        {/* 咨询师信息 */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "white" }}>
          <button className="w-full flex items-center gap-4 px-4 py-4"
            onClick={() => bk.counselor && router.push(`/counselors/${bk.counselor.id}`)}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0"
              style={{ background: "#E8DFCC", color: "#7A6248" }}>
              {bk.counselor?.displayName[0] ?? "?"}
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs text-[#9B8E82]">{bk.counselor?.counselorTypes?.[0] ?? "心理咨询师"}</p>
              <p className="text-lg font-bold text-[#2C2420]">{bk.counselor?.displayName ?? "咨询师"}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#C4BDB5]" />
          </button>

          <div className="border-t border-[#F0EBE3] px-4 py-4 space-y-4">
            <div>
              <p className="text-xs text-[#9B8E82] mb-1">咨询时间（北京时间）</p>
              <p className="text-base font-bold text-[#2C2420]">{dateStr}</p>
            </div>
            <div>
              <p className="text-xs text-[#9B8E82] mb-1">咨询次数及方式</p>
              <p className="text-base font-bold text-[#2C2420]">第{bk.sessionNumber ?? 1}次 {bk.sessionMode ?? "视频"}咨询</p>
            </div>
            {bk.sessionMode?.includes("视频") && (
              <div>
                <p className="text-xs text-[#9B8E82] mb-1">视频账号</p>
                <p className="text-base font-bold text-[#2C2420]">
                  {bk.status === "paid" || bk.status === "completed" ? "将在咨询前发送至消息" : "预约成功后可见"}
                </p>
              </div>
            )}
          </div>

          {/* 我的申请单 */}
          <button className="w-full border-t border-[#F0EBE3] px-4 py-4 flex items-center justify-between"
            onClick={() => setShowForm(!showForm)}>
            <span className="text-sm text-[#2C2420]">我的申请单</span>
            <ChevronRight className={`w-5 h-5 text-[#C4BDB5] transition-transform ${showForm ? "rotate-90" : ""}`} />
          </button>
          {showForm && bk.applicationForm && (
            <div className="px-4 pb-4 space-y-3 bg-[#FAFAF8]">
              {Object.entries(bk.applicationForm).map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-[#9B8E82]">{k}</p>
                  <p className="text-sm text-[#2C2420] mt-0.5">{String(v)}</p>
                </div>
              ))}
            </div>
          )}

          {/* 我的咨询协议 */}
          <button className="w-full border-t border-[#F0EBE3] px-4 py-4 flex items-center justify-between"
            onClick={() => setShowAgreement(!showAgreement)}>
            <span className="text-sm text-[#2C2420]">我的咨询协议</span>
            <ChevronRight className={`w-5 h-5 text-[#C4BDB5] transition-transform ${showAgreement ? "rotate-90" : ""}`} />
          </button>
          {showAgreement && (
            <div className="px-4 pb-4 bg-[#FAFAF8]">
              <pre className="text-xs text-[#9B8E82] whitespace-pre-wrap leading-relaxed font-sans">{AGREEMENT_TEXT}</pre>
              <p className="text-xs text-[#9CB48A] mt-3">
                {bk.agreementSigned ? "✓ 已于预约时签署同意" : "未签署"}
              </p>
            </div>
          )}
        </div>

        {/* 费用与编号 */}
        <div className="rounded-2xl px-4 py-4 space-y-3" style={{ background: "white" }}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#9B8E82]">咨询费用</span>
            <span className="text-sm font-bold text-[#2C2420]">¥{bk.priceAmount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#9B8E82]">订单编号</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#2C2420]">{bk.id.toUpperCase()}</span>
              <button onClick={() => copy(bk.id.toUpperCase())}>
                {copied ? <Check className="w-4 h-4 text-[#9CB48A]" /> : <Copy className="w-4 h-4 text-[#C4BDB5]" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-3"
        style={{ background: "rgba(245,240,234,0.95)", backdropFilter: "blur(8px)" }}>
        <div className="flex gap-3">
          <button className="flex-1 py-3 rounded-2xl text-sm font-semibold border"
            style={{ borderColor: "#9CB48A", color: "#9CB48A" }}>联系咨询师</button>
          <button className="flex-[2] py-3 rounded-2xl text-white text-sm font-semibold"
            style={{ background: "#9CB48A" }}>
            {bk.status === "pending_payment" ? `立即支付 ¥${bk.priceAmount}` : "续约"}
          </button>
        </div>
      </div>
    </div>
  );
}
