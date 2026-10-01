"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { request } from "@/lib/api/request";

type Question = { id: string; type: string; title: string; options?: string[]; required?: boolean };
type Order = {
  id: string; serviceId: string; serviceName: string | null; price: number; status: string;
  paymentMethod?: string | null; createdAt: string; paidAt?: string | null; submittedAt?: string | null;
  reportAt?: string | null; report: string | null; answers: { questionId: string; value: string | string[] | number }[] | null;
  questions: Question[];
  questionnaireLink?: string | null; reportLink?: string | null; reportFileUrl?: string | null;
  counselor?: { id: string; userId: string; displayName: string; title: string | null; avatarUrl: string | null; counselorTypes: string[] | null } | null;
};

const STATUS: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  pending_payment: { label: "待支付", color: "#C66B2E", bg: "#FAE9DD", desc: "请完成支付（或联系客服线下转账），支付后即可填写问卷。" },
  paid:            { label: "待填写问卷", color: "#3A6228", bg: "#E4F0DC", desc: "评估资格已开通，请在下方填写评估问卷，提交后老师将为你撰写报告。" },
  submitted:       { label: "已提交", color: "#3A9B8E", bg: "#E4F2F0", desc: "问卷已提交，老师正在审阅并撰写评估报告，完成后将通知你。" },
  completed:       { label: "已完成", color: "white", bg: "#9CB48A", desc: "评估报告已生成，请在下方查看。" },
  refunded:        { label: "已退款", color: "#B07D2A", bg: "#FEF9EE", desc: "本订单已退款。" },
  cancelled:       { label: "已取消", color: "#9B8E82", bg: "#EBE7DF", desc: "本订单已取消。" },
};

export default function ServiceOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [o, setO] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState("wechat");
  const [submitDone, setSubmitDone] = useState(false);

  const load = () => {
    request(`/api/service-orders/${id}`).then(r => r.json())
      .then(d => {
        if (d?.id) {
          setO(d);
          // 已提交过的答案回填（老师端可见，来访重进不丢）
          if (Array.isArray(d.answers)) {
            const m: Record<string, string | string[]> = {};
            d.answers.forEach((a: any) => { m[a.questionId] = a.value; });
            setAnswers(m);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const submitAnswers = async () => {
    if (!o) return;
    const missing = (o.questions ?? []).find(q => q.required !== false && !answers[q.id]);
    if (missing) { setError(`请完成第 ${o.questions.indexOf(missing) + 1} 题：${missing.title}`); return; }
    setSubmitting(true); setError("");
    try {
      const res = await request(`/api/service-orders/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })) }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error === "invalid_status" ? "当前状态不可提交" : "提交失败，请稍后重试"); }
      setSubmitDone(true);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失败");
    } finally { setSubmitting(false); }
  };

  const pay = async (offline: boolean) => {
    setSubmitting(true); setError("");
    try {
      const res = await request(`/api/service-orders/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(offline ? { action: "confirm_paid" } : { action: "pay", paymentMethod: method }),
      });
      if (!res.ok) throw new Error("操作失败，请稍后重试");
      setPayOpen(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally { setSubmitting(false); }
  };

  const cancel = async () => {
    if (!window.confirm("确定取消该订单吗？")) return;
    await request(`/api/service-orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    load();
  };

  if (loading) {
    return <div className="min-h-svh flex items-center justify-center" style={{ background: "var(--color-surface)" }}>
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>加载中…</p>
    </div>;
  }
  if (!o) {
    return <div className="min-h-svh flex items-center justify-center" style={{ background: "var(--color-surface)" }}>
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>订单不存在</p>
    </div>;
  }

  const st = STATUS[o.status] ?? STATUS.cancelled;
  const questions = o.questions ?? [];

  return (
    <div className="min-h-svh pb-36" style={{ background: "var(--color-surface)" }}>
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => router.push("/my-services")}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-[#DDD8D0]">
          <ArrowLeft className="w-4 h-4 text-[#6B5E52]" />
        </button>
        <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{o.serviceName ?? "评估订单"}</h1>
      </div>

      {/* 状态卡 */}
      <div className="mx-5 mb-4 rounded-2xl p-4" style={{ background: "var(--color-card)" }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: st.color, background: st.bg }}>{st.label}</span>
          <p className="text-sm font-black" style={{ color: "var(--color-primary)" }}>¥{o.price}</p>
        </div>
        <p className="text-xs mt-2.5 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{st.desc}</p>
      </div>

      {/* 服务老师卡 + 联系老师 */}
      {o.counselor && (
        <div className="mx-5 mb-4 rounded-2xl p-4 flex items-center gap-3" style={{ background: "var(--color-card)" }}>
          {o.counselor.avatarUrl
            ? <img src={o.counselor.avatarUrl} alt={o.counselor.displayName} className="w-11 h-11 rounded-full object-cover flex-none" />
            : <div className="w-11 h-11 rounded-full flex-none flex items-center justify-center text-sm font-bold text-white"
                style={{ background: "var(--color-primary)" }}>{o.counselor.displayName.charAt(0)}</div>}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: "var(--color-text-primary)" }}>
              {o.counselor.displayName}
              {o.counselor.title ? <span className="text-xs font-medium ml-2" style={{ color: "var(--color-text-muted)" }}>{o.counselor.title}</span> : null}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>本评估由该老师完成{["pending_payment"].includes(o.status) ? "" : " · 遇到问题可联系"}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => router.push(`/counselors/${o.counselor!.id}`)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border"
              style={{ borderColor: "#E8E2D8", color: "#9B8E82" }}>档案</button>
            {o.status !== "pending_payment" && o.status !== "cancelled" && (
              <button onClick={async () => {
                try {
                  const res = await request("/api/conversations", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ otherUserId: o.counselor!.userId }),
                  });
                  const conv = await res.json().catch(() => null);
                  if (res.ok && conv?.id) router.push(`/chat/${conv.id}`);
                } catch {}
              }} className="text-xs font-bold px-3 py-2 rounded-xl text-white"
                style={{ background: "var(--color-primary)" }}>联系老师</button>
            )}
          </div>
        </div>
      )}

      {/* 外链问卷：老师发送的链接优先于内置问卷 */}
      {o.status === "paid" && o.questionnaireLink && (
        <div className="mx-5 mb-4 rounded-2xl p-4" style={{ background: "#FAE9DD", border: "1px solid #F0D5BC" }}>
          <p className="text-sm font-bold mb-1" style={{ color: "#C66B2E" }}>老师已发送问卷链接</p>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: "#C66B2E" }}>点击下方按钮打开问卷（新窗口），填写完成后回到这里标记完成。</p>
          <div className="flex gap-2">
            <a href={o.questionnaireLink} target="_blank" rel="noreferrer"
              className="flex-1 py-3 rounded-2xl text-center text-sm font-bold"
              style={{ background: "#C66B2E", color: "white" }}>打开问卷链接</a>
            <button onClick={() => submitAnswers()} disabled={submitting}
              className="flex-1 py-3 rounded-2xl text-sm font-bold"
              style={{ background: submitting ? "#C4BDB5" : "white", color: "#C66B2E", border: "1px solid #E8A87C" }}>
              {submitting ? "提交中…" : "我已填写完毕"}
            </button>
          </div>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>
      )}

      {/* 问卷（内置）：无外链时展示 */}
      {(o.status === "paid" || o.status === "submitted") && !o.questionnaireLink && questions.length > 0 && (
        <div className="mx-5 mb-4 rounded-2xl p-4" style={{ background: "var(--color-card)" }}>
          <p className="text-sm font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>评估问卷</p>
          {o.status === "submitted" && <p className="text-xs mb-3" style={{ color: "#3A9B8E" }}>已提交，以下为你的作答记录</p>}
          {questions.map((q, qi) => (
            <div key={q.id} className="py-3" style={{ borderTop: qi > 0 ? "1px solid #F5F0EA" : "none" }}>
              <p className="text-sm font-medium mb-2.5" style={{ color: "var(--color-text-primary)" }}>
                {qi + 1}. {q.title}{q.required !== false && <span className="text-red-500"> *</span>}
              </p>
              {q.type === "text" ? (
                <textarea value={String(answers[q.id] ?? "")} disabled={o.status === "submitted"}
                  onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  rows={3} placeholder="请输入…"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                  style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
              ) : (
                <div className="space-y-2">
                  {(q.options ?? []).map(opt => {
                    const checked = q.type === "multi"
                      ? Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(opt)
                      : answers[q.id] === opt;
                    return (
                      <button key={opt} disabled={o.status === "submitted"}
                        onClick={() => setAnswers(prev => {
                          if (q.type === "multi") {
                            const arr = Array.isArray(prev[q.id]) ? [...(prev[q.id] as string[])] : [];
                            const idx = arr.indexOf(opt);
                            idx >= 0 ? arr.splice(idx, 1) : arr.push(opt);
                            return { ...prev, [q.id]: arr };
                          }
                          return { ...prev, [q.id]: opt };
                        })}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm"
                        style={{
                          background: checked ? "#F0F7EC" : "var(--color-surface)",
                          border: `1px solid ${checked ? "var(--color-primary)" : "var(--color-border)"}`,
                          color: "var(--color-text-primary)",
                        }}>
                        <span>{opt}</span>
                        {checked && <Check className="w-3.5 h-3.5" style={{ color: "var(--color-primary)" }} strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {o.status === "paid" && (
            <>
              {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
              <button onClick={submitAnswers} disabled={submitting}
                className="w-full mt-2 py-3 rounded-2xl text-white font-bold text-sm"
                style={{ background: submitting ? "#C4BDB5" : "var(--color-primary)" }}>
                {submitting ? "提交中…" : "提交问卷"}
              </button>
            </>
          )}
        </div>
      )}

      {/* 报告：文本 / 链接 / 文件任一 */}
      {o.status === "completed" && (o.report || o.reportLink || o.reportFileUrl) && (
        <div className="mx-5 mb-4 rounded-2xl p-4" style={{ background: "var(--color-card)" }}>
          <p className="text-sm font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>评估报告</p>
          <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
            完成于 {o.reportAt ? new Date(o.reportAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
          </p>
          {o.report && o.report.split("\n").filter(Boolean).map((p, i) => (
            <p key={i} className="text-sm leading-relaxed mb-2.5" style={{ color: "var(--color-text-secondary)" }}>{p}</p>
          ))}
          {(o.reportLink || o.reportFileUrl) && (
            <div className="flex gap-2 mt-3">
              {o.reportFileUrl && (
                <a href={o.reportFileUrl} target="_blank" rel="noreferrer"
                  className="flex-1 py-2.5 rounded-xl text-center text-xs font-bold"
                  style={{ background: "#E4F0DC", color: "#3A6228" }}>查看报告文件</a>
              )}
              {o.reportLink && (
                <a href={o.reportLink} target="_blank" rel="noreferrer"
                  className="flex-1 py-2.5 rounded-xl text-center text-xs font-bold"
                  style={{ background: "#E4F2F0", color: "#3A9B8E" }}>打开报告链接</a>
              )}
            </div>
          )}
        </div>
      )}

      {/* 底部操作 */}
      {o.status === "pending_payment" && (
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-3 border-t" style={{ borderColor: "#EBE7DF", background: "var(--color-bg)" }}>
          {error && <p className="text-xs text-red-600 text-center mb-2">{error}</p>}
          <div className="flex gap-3">
            <button onClick={cancel} className="px-4 py-3 rounded-2xl border text-sm font-semibold"
              style={{ borderColor: "#E8E2D8", color: "#9B8E82" }}>取消订单</button>
            <button onClick={() => setPayOpen(true)} className="flex-1 py-3 rounded-2xl text-white font-bold text-base"
              style={{ background: "var(--color-primary)" }}>立即支付 ¥{o.price}</button>
          </div>
        </div>
      )}

      {payOpen && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setPayOpen(false)}>
          <div className="w-full rounded-t-3xl p-5 pb-10" style={{ background: "var(--color-bg)" }} onClick={e => e.stopPropagation()}>
            <p className="text-base font-bold text-center mb-4" style={{ color: "var(--color-text-primary)" }}>确认支付 ¥{o.price}</p>
            <div className="flex gap-3">
              <button onClick={() => pay(true)} disabled={submitting}
                className="flex-1 py-3 rounded-2xl border text-sm font-semibold"
                style={{ borderColor: "#E8E2D8", color: "#9B8E82" }}>线下转账给客服</button>
              <button onClick={() => pay(false)} disabled={submitting}
                className="flex-1 py-3 rounded-2xl text-white font-bold text-sm"
                style={{ background: submitting ? "#C4BDB5" : "var(--color-primary)" }}>
                {submitting ? "处理中…" : "模拟支付"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 问卷提交成功弹窗 */}
      {submitDone && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-8" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="w-full rounded-3xl p-6 text-center" style={{ background: "var(--color-bg)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#E8F4E4" }}>
              <svg viewBox="0 0 48 48" className="w-8 h-8 fill-none" stroke="#9CB48A" strokeWidth="3.5">
                <polyline points="14,24 21,31 34,17" />
              </svg>
            </div>
            <p className="text-lg font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>问卷已提交</p>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--color-text-secondary)" }}>
              老师将审阅你的答卷并撰写评估报告，完成后会第一时间通知你。
            </p>
            <button onClick={() => router.push("/my-services")}
              className="w-full py-3 rounded-2xl text-white font-bold text-sm"
              style={{ background: "var(--color-primary)" }}>好的</button>
          </div>
        </div>
      )}
    </div>
  );
}
