"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Copy, Check, X } from "lucide-react";
import { request } from "@/lib/api/request";

type BookingDetail = {
  id: string; status: string; scheduledAt: string; durationMinutes: number;
  sessionMode: string; priceAmount: number; sessionNumber?: number;
  applicationForm?: Record<string,string> | null;
  agreementSigned?: boolean;
  createdAt?: string; paidAt?: string; paymentMethod?: string;
  counselor: { id: string; displayName: string; counselorTypes?: string[] } | null;
};

const STATUS_CONFIG: Record<string,{label:string;desc:string;color:string}> = {
  pending_confirmation: { label:"等待咨询师确认", desc:"请耐心等候，咨询师确认后将通知您。", color:"#D97706" },
  pending_payment:      { label:"待支付",         desc:"请在24小时内完成支付，逾期将自动取消。", color:"#2563EB" },
  paid:                 { label:"即将咨询",        desc:"咨询即将开始，请提前准备好设备。", color:"#059669" },
  completed:            { label:"咨询完成",        desc:"本次咨询已完成，期待下次相遇。", color:"#059669" },
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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}>
      <div className="w-full rounded-t-3xl max-h-[80vh] overflow-y-auto"
        style={{ background: "white" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 sticky top-0 bg-white border-b border-[#F0EBE3]">
          <h3 className="text-base font-bold text-[#2C2420]">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#F5F0EA" }}>
            <X className="w-4 h-4 text-[#9B8E82]" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

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

  const fmtDt = (s?: string) => {
    if (!s) return "—";
    const d = new Date(s);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
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

        {/* 咨询师 + 咨询信息 + 申请单/协议 */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "white" }}>
          {/* 咨询师信息 */}
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

          {/* 咨询详情 */}
          <div className="border-t border-[#F0EBE3] px-4 py-4 space-y-4">
            <InfoRow label="咨询时间（北京时间）" value={dateStr} />
            <InfoRow label="咨询次数及方式" value={`第${bk.sessionNumber ?? 1}次 ${bk.sessionMode ?? "视频"}咨询`} />
            {bk.sessionMode?.includes("视频") && (
              <InfoRow label="视频账号" value={bk.status === "paid" || bk.status === "completed" ? "将在咨询前发送至消息" : "预约成功后可见"} />
            )}
          </div>

          {/* 我的申请单 */}
          <button className="w-full border-t border-[#F0EBE3] px-4 py-4 flex items-center justify-between"
            onClick={() => setShowForm(true)}>
            <span className="text-sm text-[#2C2420]">我的申请单</span>
            <ChevronRight className="w-5 h-5 text-[#C4BDB5]" />
          </button>

          {/* 我的咨询协议 */}
          <button className="w-full border-t border-[#F0EBE3] px-4 py-4 flex items-center justify-between"
            onClick={() => setShowAgreement(true)}>
            <span className="text-sm text-[#2C2420]">我的咨询协议</span>
            <ChevronRight className="w-5 h-5 text-[#C4BDB5]" />
          </button>
        </div>

        {/* 订单信息 */}
        <div className="rounded-2xl px-4 py-4 space-y-4" style={{ background: "white" }}>
          <InfoRow label="咨询费用" value={`¥${bk.priceAmount}`} />
          <InfoRowCopy label="订单编号" value={bk.id.toUpperCase()} copied={copied} onCopy={() => copy(bk.id.toUpperCase())} />
          <InfoRow label="创建时间" value={fmtDt(bk.createdAt)} />
          <InfoRow label="付款时间" value={fmtDt(bk.paidAt)} />
          <InfoRow label="支付方式" value={bk.paymentMethod ?? (bk.status === "paid" || bk.status === "completed" ? "微信支付" : "—")} />
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

      {/* 申请单弹窗 */}
      {showForm && (
        <Modal title="我的申请单" onClose={() => setShowForm(false)}>
          {bk.applicationForm && Object.keys(bk.applicationForm).length > 0
            ? Object.entries(bk.applicationForm).map(([k, v]) => (
                <div key={k} className="mb-4">
                  <p className="text-xs text-[#9B8E82] mb-1">{k}</p>
                  <p className="text-sm text-[#2C2420] leading-relaxed">{String(v)}</p>
                </div>
              ))
            : <p className="text-sm text-[#9B8E82]">申请单内容暂未填写</p>
          }
        </Modal>
      )}

      {/* 协议弹窗 */}
      {showAgreement && (
        <Modal title="我的咨询协议" onClose={() => setShowAgreement(false)}>
          <pre className="text-xs text-[#5A4E44] whitespace-pre-wrap leading-relaxed font-sans">{AGREEMENT_TEXT}</pre>
          <p className="text-xs mt-4 font-medium" style={{ color: "#9CB48A" }}>
            {bk.agreementSigned ? "✓ 已于预约时确认签署" : "未签署"}
          </p>
        </Modal>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-[#9B8E82] flex-shrink-0">{label}</span>
      <span className="text-sm text-[#2C2420] text-right">{value}</span>
    </div>
  );
}

function InfoRowCopy({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#9B8E82]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#2C2420]">{value}</span>
        <button onClick={onCopy}>
          {copied ? <Check className="w-4 h-4 text-[#9CB48A]" /> : <Copy className="w-4 h-4 text-[#C4BDB5]" />}
        </button>
      </div>
    </div>
  );
}
