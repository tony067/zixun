"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { request } from "@/lib/api/request";

type ServiceDetail = {
  id: string; name: string; tagline: string | null; description: string | null;
  price: number; counselorName: string; counselorTypes: string[] | null;
  counselor?: { id: string; displayName: string; title: string | null; avatarUrl: string | null; counselorTypes: string[] | null; specialties: string[] | null } | null;
  questions: { id: string; type: string; title: string; options?: string[] }[];
};

const PAY_METHODS = [
  { id: "wechat", label: "微信支付" },
  { id: "alipay", label: "支付宝" },
  { id: "card",   label: "银行卡" },
];

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [s, setS] = useState<ServiceDetail | null>(null);
  const [modal, setModal] = useState<"pay" | "offline" | null>(null);
  const [method, setMethod] = useState("wechat");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<"paid" | "offline" | null>(null);

  useEffect(() => {
    request(`/api/services/${id}`).then(r => r.json())
      .then(d => { if (d?.id) setS(d); })
      .catch(() => {});
  }, [id]);

  const pay = async (offline: boolean) => {
    setSubmitting(true); setError("");
    try {
      const res = await request("/api/service-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: id, paymentMethod: offline ? "offline" : method, offline }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error === "service_not_found" ? "服务不存在或已下架" : "提交失败，请稍后重试");
      }
      setDone(offline ? "offline" : "paid");
      setModal(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失败");
    } finally { setSubmitting(false); }
  };

  if (!s) {
    return (
      <div className="min-h-svh flex items-center justify-center" style={{ background: "var(--color-surface)" }}>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>加载中…</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-svh flex flex-col items-center px-8 text-center pt-24" style={{ background: "var(--color-surface)" }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: done === "offline" ? "#FAE9DD" : "#E8F4E4" }}>
          <svg viewBox="0 0 48 48" className="w-12 h-12 fill-none" stroke={done === "offline" ? "#C66B2E" : "#9CB48A"} strokeWidth="3">
            <circle cx="24" cy="24" r="20" />
            {done === "offline" ? <path d="M24 14v20M14 24h20" /> : <polyline points="14,24 21,31 34,17" />}
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#2C2420] mb-2">{done === "offline" ? "订单已提交" : "购买成功！"}</h2>
        <p className="text-sm text-[#9B8E82] mb-2">
          {done === "offline"
            ? "请联系客服完成转账，客服确认收款后即可开始填写评估问卷"
            : "评估资格已开通，现在就可以开始填写评估问卷"}
        </p>
        <p className="text-sm font-semibold text-[#5A4E44]">{s.counselorName} · {s.name}</p>
        <div className="flex gap-3 mt-10 w-full">
          <button onClick={() => router.push("/services")}
            className="flex-1 py-3 rounded-2xl border text-sm font-semibold"
            style={{ borderColor: "#E8E2D8", color: "#9B8E82" }}>返回列表</button>
          <button onClick={() => router.push(done === "offline" ? "/messages?toAdmin=1" : "/my-services")}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-sm"
            style={{ background: "var(--color-primary)" }}>
            {done === "offline" ? "联系客服转账" : "去填写问卷"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh pb-40" style={{ background: "var(--color-surface)" }}>
      {/* 顶部返回 */}
      <div className="px-4 pt-12 pb-2 flex items-center gap-3">
        <button onClick={() => router.push("/services")}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-[#DDD8D0]">
          <ArrowLeft className="w-4 h-4 text-[#6B5E52]" />
        </button>
      </div>

      {/* 标题区 */}
      <div className="px-5 pt-2 pb-5">
        <h1 className="text-2xl font-black" style={{ color: "var(--color-text-primary)" }}>{s.name}</h1>
        {s.tagline && <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{s.tagline}</p>}
        <p className="text-2xl font-black mt-4" style={{ color: "var(--color-primary)" }}>¥{s.price}</p>
      </div>

      {/* 服务老师卡：点击进完整档案 */}
      {s.counselor && (
        <button onClick={() => router.push(`/counselors/${s.counselor!.id}`)}
          className="mx-5 mb-5 w-[calc(100%-2.5rem)] rounded-2xl p-4 flex items-center gap-3 text-left"
          style={{ background: "var(--color-card)", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          {s.counselor.avatarUrl
            ? <img src={s.counselor.avatarUrl} alt={s.counselor.displayName} className="w-12 h-12 rounded-full object-cover flex-none" />
            : <div className="w-12 h-12 rounded-full flex-none flex items-center justify-center text-base font-bold text-white"
                style={{ background: "var(--color-primary)" }}>{s.counselor.displayName.charAt(0)}</div>}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              {s.counselor.displayName}
              {s.counselor.title ? <span className="text-xs font-medium ml-2" style={{ color: "var(--color-text-muted)" }}>{s.counselor.title}</span> : null}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>
              {[
                ...(s.counselor.counselorTypes ?? []),
                ...(s.counselor.specialties ?? []).slice(0, 2),
              ].join(" · ") || "本服务由该老师完成"}
            </p>
          </div>
          <span className="text-xs font-semibold shrink-0" style={{ color: "var(--color-primary)" }}>查看档案</span>
        </button>
      )}

      {/* 详细介绍（老师撰写，可包含评估维度、适用人群、报告说明等） */}
      {s.description && (
        <div className="mx-5 mb-5 rounded-2xl p-4" style={{ background: "var(--color-card)" }}>
          <p className="text-sm font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>服务介绍</p>
          {s.description.split("\n").filter(Boolean).map((p, i) => (
            <p key={i} className="text-sm leading-relaxed mb-2.5" style={{ color: "var(--color-text-secondary)" }}>{p}</p>
          ))}
        </div>
      )}

      {/* 服务流程（平台统一固定流程） */}
      <div className="mx-5 mb-5 rounded-2xl p-4" style={{ background: "var(--color-card)" }}>
        <p className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>服务流程</p>
        {["购买服务，获得评估资格", "填写评估问卷（约10-20分钟）", "老师审阅并撰写评估报告", "查看报告，了解评估结论"].map((t, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ background: "var(--color-primary)" }}>{i + 1}</span>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{t}</p>
          </div>
        ))}
      </div>

      {/* 底部购买栏 */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-3 border-t" style={{ borderColor: "#EBE7DF", background: "var(--color-bg)" }}>
        {error && <p className="text-xs text-red-600 text-center mb-2">{error}</p>}
        <div className="flex gap-3">
          <button onClick={() => setModal("offline")} disabled={submitting}
            className="px-4 py-3 rounded-2xl border text-sm font-semibold"
            style={{ borderColor: "#E8E2D8", color: "#9B8E82" }}>付款遇到问题？</button>
          <button onClick={() => setModal("pay")} disabled={submitting}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-base"
            style={{ background: submitting ? "#C4BDB5" : "var(--color-primary)" }}>
            {submitting ? "处理中…" : `立即购买 ¥${s.price}`}
          </button>
        </div>
      </div>

      {/* 支付方式弹窗 */}
      {modal === "pay" && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setModal(null)}>
          <div className="w-full rounded-t-3xl p-5 pb-10" style={{ background: "var(--color-bg)" }} onClick={e => e.stopPropagation()}>
            <p className="text-base font-bold text-center mb-1" style={{ color: "var(--color-text-primary)" }}>确认购买</p>
            <p className="text-xs text-center mb-4" style={{ color: "var(--color-text-muted)" }}>{s.name} · ¥{s.price}</p>
            <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "var(--color-card)" }}>
              {PAY_METHODS.map((m, i) => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className="w-full flex items-center justify-between px-4 py-3.5"
                  style={{ borderTop: i > 0 ? "1px solid #F5F0EA" : "none" }}>
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{m.label}</span>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: method === m.id ? "var(--color-primary)" : "#C4BDB5" }}>
                    {method === m.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-primary)" }} />}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => pay(false)} disabled={submitting}
              className="w-full py-3 rounded-2xl text-white font-bold text-base"
              style={{ background: submitting ? "#C4BDB5" : "var(--color-primary)" }}>
              {submitting ? "处理中…" : `确认支付 ¥${s.price}`}
            </button>
          </div>
        </div>
      )}

      {/* 付款遇到问题 → 客服协助弹窗 */}
      {modal === "offline" && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setModal(null)}>
          <div className="w-full rounded-t-3xl p-5 pb-10" style={{ background: "var(--color-bg)" }} onClick={e => e.stopPropagation()}>
            <p className="text-base font-bold text-center mb-1" style={{ color: "var(--color-text-primary)" }}>付款遇到问题？</p>
            <p className="text-xs text-center leading-relaxed mb-3" style={{ color: "var(--color-text-muted)" }}>
              若无法在线支付（如银行卡受限等特殊情况），可联系客服协助完成付款。
            </p>
            <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--color-card)" }}>
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                点击下方按钮将为你生成一笔待支付订单，并自动进入与官方客服的会话；客服会提供转账方式，确认收款后你的评估资格即开通。
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-2xl border text-sm font-semibold"
                style={{ borderColor: "#E8E2D8", color: "#9B8E82" }}>再想想</button>
              <button onClick={() => pay(true)} disabled={submitting}
                className="flex-1 py-3 rounded-2xl text-white font-bold text-sm"
                style={{ background: submitting ? "#C4BDB5" : "var(--color-primary)" }}>
                {submitting ? "提交中…" : "联系客服协助付款"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
