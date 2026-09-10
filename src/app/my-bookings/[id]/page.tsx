"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { request } from "@/lib/api/request";
import { statusMeta } from "@/lib/booking-status";
import { localDateStr } from "@/lib/date";

type BookingDetail = {
  id: string; status: string; scheduledAt: string; durationMinutes: number;
  sessionMode: string; priceAmount: number; sessionNumber?: number;
  applicationForm?: Record<string,string> | null;
  agreementSigned?: boolean; paidAt?: string; createdAt?: string; paymentMethod?: string;
  counselorNote?: string; meetingLink?: string;
  adjustRequest?: { message: string; acceptOther?: string } | null;
  counselor: { id: string; displayName: string; counselorTypes?: string[] } | null;
};

// 状态 label/color 统一来自 @/lib/booking-status；此处仅补充详情页的长描述文案
const STATUS_DESC: Record<string,string> = {
  pending_confirmation: "已支付成功。咨询师确认后会通知您，并在此页发送咨询设置与链接。",
  pending_payment:      "请在24小时内完成支付，逾期将自动取消。",
  paid:                 "咨询师已确认。请在咨询时间前查看咨询设置与链接，准时参加。",
  in_progress:          "咨询正在进行，请通过咨询链接进入。",
  completed:            "本次咨询已完成。如已约定下次咨询时间，请记得续约。",
  cancelled:            "本次预约已取消，已支付费用将原路退回（模拟支付未实际扣款）。",
  rejected:             "咨询师未能承接本次预约，费用已原路退回（模拟支付未实际扣款）。",
  refunded:             "本次订单已退款，费用将原路退回（模拟支付未实际扣款）。如有疑问请联系客服。",
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
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full rounded-t-3xl max-h-[85vh] flex flex-col" style={{ background: "white" }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="text-base font-bold text-[#2C2420]">{title}</h2>
          <button onClick={onClose} className="p-1"><X className="w-5 h-5 text-[#9B8E82]" /></button>
        </div>
        <div className="overflow-y-auto px-5 pb-8 flex-1">{children}</div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#9B8E82] mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-[#2C2420]">{value}</p>
    </div>
  );
}

const FIELD_LABELS: Record<string, string> = {
  name: "真实姓名", phone: "手机号", wechat: "微信号",
  purposes: "咨询目的", purposeOther: "其他目的",
  additionalNote: "补充说明", emergencyName: "紧急联系人姓名",
  emergencyPhone: "紧急联系人电话", background: "背景说明",
  hasMentalDisease: "有精神科诊断", onMedication: "正在服药",
  hasSelfHarm: "三个月内有自伤行为", hasSuicidalThought: "三个月内有自杀想法",
  hasSuicidalBehavior: "三个月内有自杀行为",
  consentSigned: "已签署咨询协议",
};
const SAFETY_FIELDS = new Set(["hasMentalDisease","onMedication","hasSelfHarm","hasSuicidalThought","hasSuicidalBehavior"]);

function IntakeFormDisplay({ form }: { form: Record<string, unknown> }) {
  const entries = Object.entries(form).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (entries.length === 0) return <p className="text-sm text-[#9B8E82] py-8 text-center">暂无申请单信息</p>;
  return (
    <div className="space-y-4">
      {entries.map(([k, v]) => {
        const label = FIELD_LABELS[k] ?? k;
        const isTrue = v === true || v === "true";
        const isFalse = v === false || v === "false";
        const isBool = isTrue || isFalse;
        const text = isBool ? (isTrue ? "是" : "否") : Array.isArray(v) ? (v as string[]).join("、") : String(v ?? "");
        return (
          <div key={k} className="flex gap-3 items-start">
            <span className="text-xs text-[#9B8E82] w-28 flex-none pt-0.5">{label}</span>
            <span className="text-sm font-medium leading-relaxed text-[#2C2420]">
              {text}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function formatFull(d?: string) {
  if (!d) return "—";
  const dt = new Date(d);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [bk, setBk] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [modal, setModal] = useState<"form"|"agreement"|"reschedule"|"pay"|null>(null);
  const [payMethod, setPayMethod] = useState("wechat");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [selDay, setSelDay] = useState("");
  const [selTime, setSelTime] = useState("");
  const [submittingReschedule, setSubmittingReschedule] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    request(`/api/bookings/${id}`).then(r => r.json()).then(d => {
      const data = d?.booking ?? d ?? null;
      setBk(data);
      // 从主页"待支付"提醒点进来：自动弹出支付窗
      if (data?.status === "pending_payment" &&
          new URLSearchParams(window.location.search).get("pay") === "1") {
        setPayError("");
        setModal("pay");
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const [toast, setToast] = useState("");
  const copy = async (text: string) => {
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        ok = true;
      } else {
        // http 非安全环境降级方案
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      }
    } catch {}
    setCopied(ok);
    setToast(ok ? "已复制到剪贴板" : "复制失败，请长按订单号手动复制");
    setTimeout(() => { setCopied(false); setToast(""); }, 2000);
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
    ? `${dt.getFullYear()}.${pad(dt.getMonth()+1)}.${pad(dt.getDate())} ${WD[dt.getDay()]} ${pad(dt.getHours())}:${pad(dt.getMinutes())}–${pad(endDt.getHours())}:${pad(endDt.getMinutes())}`
    : "—";
  const status = (() => { const m = statusMeta(bk.status); return { label: m.label, desc: STATUS_DESC[bk.status] ?? "", color: m.color }; })();
  const showMeetingLink = !!bk.meetingLink && ["paid", "in_progress"].includes(bk.status);
  const showAdjust = !!bk.adjustRequest;

  const handleCancel = async () => {
    if (!confirm("确定取消这条预约吗？已支付费用将原路退回（模拟支付未实际扣款）。")) return;
    const res = await request(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (res.ok) setBk(prev => prev ? { ...prev, status: "cancelled" } : prev);
  };

  return (
    <div className="min-h-svh pb-[100px]" style={{ background: "#F5F0EA" }}>
      {/* 顶部导航 */}
      <div className="flex items-center px-4 pt-14 pb-4">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-[#2C2420]" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-[#2C2420]">我的咨询</h1>
        <div className="w-10" />
      </div>

      <div className="px-4 space-y-3">
        {/* 状态卡 */}
        <div className="rounded-2xl p-4" style={{ background: "white" }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: status.color }} />
            <p className="text-sm font-bold" style={{ color: status.color }}>{status.label}</p>
          </div>
          <p className="text-xs text-[#9B8E82] leading-relaxed">{status.desc}</p>
        </div>

        {/* 咨询师 + 咨询信息 + 申请单/协议 */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "white" }}>
          {/* 咨询师信息 — 点击跳转详情页 */}
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

          {/* 咨询详情 — 无分割线 */}
          <div className="px-4 pb-4 space-y-4">
            {showAdjust ? (
              <div>
                <p className="text-xs text-[#9B8E82] mb-0.5">时间调剂申请</p>
                <p className="text-sm font-semibold text-[#2C2420] whitespace-pre-wrap">{bk.adjustRequest?.message}</p>
                <p className="text-xs text-[#9B8E82] mt-1">最终时间以咨询师确认为准，确认后将在此页通知您</p>
              </div>
            ) : (
              <InfoRow label="咨询时间（北京时间）" value={dateStr} />
            )}
            <InfoRow label="咨询次数及方式" value={`第${bk.sessionNumber ?? 1}次 ${bk.sessionMode ?? "视频"}咨询`} />
            {bk.counselorNote && (
              <div>
                <p className="text-xs text-[#9B8E82] mb-0.5">咨询设置说明</p>
                <p className="text-sm font-medium text-[#2C2420] whitespace-pre-wrap">{bk.counselorNote}</p>
              </div>
            )}
            {bk.sessionMode?.includes("视频") && !showMeetingLink && (
              <InfoRow label="视频账号" value={
                bk.status === "paid" || bk.status === "in_progress"
                  ? "咨询师将通过私信发送咨询设置与链接，请注意查收消息"
                  : "咨询师确认后可见"
              } />
            )}
            {(bk.status === "paid" || bk.status === "in_progress") && !bk.counselorNote && !showMeetingLink && (
              <InfoRow label="咨询设置" value="咨询师确认后将在本页展示咨询设置，如有疑问可私信咨询师" />
            )}
          </div>

          {/* 我的申请单 — 弹窗 */}
          <button className="w-full border-t border-[#F0EBE3] px-4 py-4 flex items-center justify-between"
            onClick={() => setModal("form")}>
            <span className="text-sm text-[#2C2420]">我的申请单</span>
            <ChevronRight className="w-5 h-5 text-[#C4BDB5]" />
          </button>

          {/* 我的咨询协议 — 弹窗 */}
          <button className="w-full border-t border-[#F0EBE3] px-4 py-4 flex items-center justify-between"
            onClick={() => setModal("agreement")}>
            <span className="text-sm text-[#2C2420]">我的咨询协议</span>
            <ChevronRight className="w-5 h-5 text-[#C4BDB5]" />
          </button>
        </div>

        {/* 咨询链接 — 咨询师确认后可见 */}
        {showMeetingLink && (
          <div className="rounded-2xl p-4" style={{ background: "#E8F4E4" }}>
            <p className="text-xs text-[#4A7A36] mb-1.5 font-semibold">咨询链接</p>
            <p className="text-sm text-[#2C2420] break-all mb-3">{bk.meetingLink}</p>
            <div className="flex gap-2">
              <a href={bk.meetingLink} target="_blank" rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white text-center"
                style={{ background: "var(--color-primary)" }}>
                进入咨询
              </a>
              <button onClick={() => copy(bk.meetingLink!)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: "#9CB48A", color: "#4A7A36" }}>
                {copied ? "已复制" : "复制链接"}
              </button>
            </div>
          </div>
        )}

        {/* 订单信息 */}
        <div className="rounded-2xl px-4 py-4 space-y-3.5" style={{ background: "white" }}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#9B8E82]">咨询费用</span>
            <span className="text-sm font-bold text-[#2C2420]">¥{bk.priceAmount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#9B8E82]">订单编号</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#2C2420]">{bk.id.toUpperCase()}</span>
              <button onClick={() => copy(bk.id.toUpperCase())}
                className="text-xs px-2 py-0.5 rounded-md border"
                style={{ borderColor: copied ? "#9CB48A" : "#D4CEC8", color: copied ? "#9CB48A" : "#9B8E82" }}>
                {copied ? "已复制" : "复制"}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#9B8E82]">创建时间</span>
            <span className="text-xs text-[#2C2420]">{formatFull(bk.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#9B8E82]">付款时间</span>
            <span className="text-xs text-[#2C2420]">{bk.paidAt ? formatFull(bk.paidAt) : "未支付"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#9B8E82]">支付方式</span>
            <span className="text-xs text-[#2C2420]">{bk.paymentMethod ?? "—"}</span>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3"
        style={{ background: "rgba(245,240,234,0.95)", backdropFilter: "blur(8px)" }}>
        <div className="flex gap-3">
          {["pending_confirmation", "pending_payment", "paid"].includes(bk.status) && (
            <button className="flex-1 py-3 rounded-2xl text-sm font-semibold border"
              style={{ borderColor: "#9CB48A", color: "#9CB48A" }}
              onClick={() => router.push(`/messages?counselorUserId=${bk.counselor?.id}`)}>私信咨询师</button>
          )}
          <button
            onClick={() => {
              if (bk.status === "pending_payment") {
                setPayError(""); setModal("pay");
              } else if (bk.status === "pending_confirmation") {
                handleCancel();
              } else if (bk.status === "paid") {
                setModal("reschedule");
              } else {
                router.push(`/booking/${bk.counselor?.id}`);
              }
            }}
            className="flex-[2] py-3 rounded-2xl text-white text-sm font-semibold"
            style={{ background: bk.status === "pending_confirmation" ? "#DC2626" : "var(--color-primary)" }}>
            {bk.status === "pending_payment" ? `立即支付 ¥${bk.priceAmount}` :
             bk.status === "pending_confirmation" ? "取消预约" :
             bk.status === "paid" ? "修改时间" : "续约"}
          </button>
        </div>
      </div>

      {/* 申请单弹窗 */}
      {modal === "form" && (
        <Modal title="我的申请单" onClose={() => setModal(null)}>
          {bk.applicationForm && Object.keys(bk.applicationForm).length > 0 ? (
            <IntakeFormDisplay form={bk.applicationForm as Record<string, unknown>} />
          ) : (
            <p className="text-sm text-[#9B8E82] py-8 text-center">暂无申请单信息</p>
          )}
        </Modal>
      )}

      {/* 协议弹窗 */}
      {modal === "agreement" && (
        <Modal title="咨询服务协议" onClose={() => setModal(null)}>
          <pre className="text-sm text-[#2C2420] whitespace-pre-wrap leading-relaxed font-sans">{AGREEMENT_TEXT}</pre>
          <div className="mt-4 pt-4 border-t border-[#F0EBE3]">
            <p className="text-xs" style={{ color: bk.agreementSigned ? "#9CB48A" : "#9B8E82" }}>
              {bk.agreementSigned ? "✓ 已于预约时签署同意" : "未签署"}
            </p>
          </div>
        </Modal>
      )}

      {/* 模拟支付弹窗（网页端过渡方案，真实支付将在小程序中接入） */}
      {modal === "pay" && (
        <Modal title="确认支付" onClose={() => { if (!paying) setModal(null); }}>
          <div className="rounded-2xl px-4 py-5 mb-4 text-center" style={{ background: "#F8F5F0" }}>
            <p className="text-xs text-[#9B8E82] mb-1">咨询费用</p>
            <p className="text-3xl font-bold text-[#2C2420]">¥{bk.priceAmount}</p>
            <p className="text-xs text-[#9B8E82] mt-2">{bk.counselor?.displayName ?? "咨询师"} · {formatFull(bk.scheduledAt)}</p>
          </div>
          <div className="space-y-2 mb-4">
            {[
              { id: "wechat", label: "微信支付", color: "#07C160" },
              { id: "alipay", label: "支付宝",   color: "#1677FF" },
            ].map(m => (
              <button key={m.id} onClick={() => setPayMethod(m.id)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-sm font-medium"
                style={{ borderColor: payMethod === m.id ? m.color : "#EBE7DF", color: "#2C2420" }}>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: m.color }} />
                  {m.label}
                </span>
                {payMethod === m.id && <Check className="w-4 h-4" style={{ color: m.color }} />}
              </button>
            ))}
          </div>
          {payError && <p className="text-xs text-red-500 mb-3">{payError}</p>}
          <button
            disabled={paying}
            onClick={async () => {
              setPaying(true); setPayError("");
              try {
                const res = await request(`/api/bookings/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "paid", paymentMethod: payMethod }),
                });
                if (res.ok) {
                  const updated = await res.json().catch(() => null);
                  setBk(prev => prev ? { ...prev, status: "paid", paidAt: updated?.paidAt, paymentMethod: payMethod } : prev);
                  setModal(null);
                } else {
                  const d = await res.json().catch(() => ({}));
                  setPayError(d.message ?? "支付失败，请稍后重试");
                }
              } catch {
                setPayError("网络异常，请稍后重试");
              } finally {
                setPaying(false);
              }
            }}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm"
            style={{ background: paying ? "#C0B8B0" : "var(--color-primary)" }}>
            {paying ? "支付中…" : `确认支付 ¥${bk.priceAmount}`}
          </button>
          <p className="text-[11px] text-center text-[#9B8E82] mt-3">网页端为模拟支付，正式支付能力将在小程序版本中提供</p>
        </Modal>
      )}

      {/* 修改时间抽屉 - createPortal 挂到 body，避免父层 stacking context 影响 */}
      {mounted && modal === "reschedule" && (() => {
        const WEEKDAY = ["日","一","二","三","四","五","六"];
        const days = Array.from({ length: 14 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() + i + 1);
          return {
            iso: localDateStr(d),
            label: `${d.getMonth()+1}/${d.getDate()}`,
            weekday: `周${WEEKDAY[d.getDay()]}`,
          };
        });
        const TIME_SLOTS = ["09:00","10:00","11:00","14:00","15:00","16:00","19:00","20:00"];

        const handleSubmit = async () => {
          if (!selDay || !selTime || submittingReschedule) return;
          setSubmittingReschedule(true);
          try {
            await fetch(`/api/bookings/${id}/reschedule`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ newTime: `${selDay}T${selTime}:00`, reason: "来访申请修改时间" }),
            });
            setRescheduleSuccess(true);
            setModal(null);
          } finally {
            setSubmittingReschedule(false);
          }
        };

        return createPortal(
          <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setModal(null)} />
            <div style={{ position: "relative", zIndex: 1, background: "var(--color-bg)", borderRadius: "24px 24px 0 0", padding: "20px 20px 0", maxHeight: "80vh", overflowY: "auto", paddingBottom: "calc(env(safe-area-inset-bottom) + 80px)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[#2C2420]">选择新的咨询时间</h3>
                <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-[#EBE7DF] flex items-center justify-center text-[#5A4E44]">×</button>
              </div>
              <div className="mb-4 px-3 py-2.5 rounded-xl" style={{ background: "#FEF9EE", border: "1px solid #F5E6C0" }}>
                <p className="text-xs font-semibold mb-0.5" style={{ color: "#92600A" }}>建议先与咨询师沟通好时间</p>
                <p className="text-xs" style={{ color: "#B07D2A" }}>提交申请后需等待咨询师确认，建议在私信中提前确认好新时间再操作。</p>
              </div>

              {/* 日期横滑 */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                {days.map(d => (
                  <button key={d.iso} onClick={() => { setSelDay(d.iso); setSelTime(""); }}
                    className="flex-none flex flex-col items-center px-3 py-2 rounded-2xl text-xs font-medium"
                    style={{
                      background: selDay === d.iso ? "var(--color-primary)" : "white",
                      color: selDay === d.iso ? "white" : "#5A4E44",
                      border: `1px solid ${selDay === d.iso ? "var(--color-primary)" : "#EBE7DF"}`,
                      minWidth: 52,
                    }}>
                    <span>{d.weekday}</span>
                    <span className="mt-0.5">{d.label}</span>
                  </button>
                ))}
              </div>

              {/* 时段格子 */}
              {selDay && (
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {TIME_SLOTS.map(t => (
                    <button key={t} onClick={() => setSelTime(t)}
                      className="py-2 rounded-xl text-sm font-medium"
                      style={{
                        background: selTime === t ? "var(--color-primary)" : "#F5F0EA",
                        color: selTime === t ? "white" : "#2C2420",
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {selDay && selTime && (
                <div className="mb-4 px-3 py-2.5 rounded-xl bg-[#E4F0DC]">
                  <p className="text-sm text-[#3A6228] font-medium">已选：{days.find(d=>d.iso===selDay)?.weekday} {days.find(d=>d.iso===selDay)?.label} {selTime}</p>
                </div>
              )}

              <button onClick={handleSubmit} disabled={!selDay || !selTime || submittingReschedule}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}>
                {submittingReschedule ? "提交中…" : "提交修改申请"}
              </button>
            </div>
          </div>
        , document.body);
      })()}

      {rescheduleSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRescheduleSuccess(false)} />
          <div className="relative bg-white rounded-2xl px-8 py-8 mx-6 text-center shadow-xl">
            <div className="w-12 h-12 rounded-full bg-[#E4F0DC] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#3A6228" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <p className="text-base font-bold text-[#2C2420] mb-1">改期申请已提交</p>
            <p className="text-sm text-[#9B8E82] mb-5">等待咨询师确认，确认后时间自动更新。</p>
            <button onClick={() => setRescheduleSuccess(false)} className="w-full py-3 rounded-2xl text-white font-bold text-sm" style={{background:"var(--color-primary)"}}>好的</button>
          </div>
        </div>
      )}

      {/* 复制成功/失败轻提示 */}
      {toast && (
        <div className="fixed left-1/2 bottom-28 -translate-x-1/2 px-4 py-2 rounded-full text-xs text-white whitespace-nowrap z-[100000]"
          style={{ background: "rgba(44,36,32,0.88)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
