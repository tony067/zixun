"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Pencil, MessageCircle, Upload } from "lucide-react";
import { request } from "@/lib/api/request";

type Question = { id: string; type: "single" | "multi" | "text" | "scale"; title: string; options?: string[]; required?: boolean };
type Service = { id: string; name: string; tagline: string | null; description: string | null; price: number; questions: Question[]; status: string; createdAt: string; questionnaireLink?: string | null };
type Order = {
  id: string; serviceId: string; clientId: string; serviceName: string | null; price: number; status: string;
  clientName?: string; createdAt: string; submittedAt?: string | null;
  answers: { questionId: string; value: string | string[] | number }[] | null; report: string | null; questions?: Question[];
  questionnaireLink?: string | null; reportLink?: string | null; reportFileUrl?: string | null;
};

const ORDER_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending_payment: { label: "待支付", color: "#C66B2E", bg: "#FAE9DD" },
  paid:            { label: "待作答", color: "#3A6228", bg: "#E4F0DC" },
  submitted:       { label: "待写报告", color: "#3A9B8E", bg: "#E4F2F0" },
  completed:       { label: "已完成", color: "white", bg: "#9CB48A" },
  refunded:        { label: "已退款", color: "#B07D2A", bg: "#FEF9EE" },
  cancelled:       { label: "已取消", color: "#9B8E82", bg: "#EBE7DF" },
};

const emptyForm = { name: "", tagline: "", description: "", price: "", questions: [] as Question[], questionnaireLink: "" };

/**
 * 解析文本导入的问卷（宽容模式，兼容现成问卷的常见排版）：
 * - 题型关键词：单选/多选/问答/简答/填空/判断/打分/评分/量表，支持"单选题"写法；
 *   可写在题目前（"1. 单选：xxx"）、题干括号内（"xxx（多选）""【单选题】"），
 *   也可写在模块标题行（"一、单选题""二、多选题"），对后续题目生效
 * - 选项行：字母开头（A. / A、 / A)）几乎必为选项；数字开头按序号连续性和内容长度智能判断是选项还是下一题
 * - 题干与选项无需任何前缀也能导入（逐行文本，空行分隔题目）
 * - 判断题自动补"对/错"选项
 */
function parseQuestions(text: string): Question[] {
  const lines = text.split("\n").map(l => l.replace(/\s+$/, ""));
  const questions: Question[] = [];
  let cur: Question | null = null;
  let moduleType: Question["type"] | null = null;   // 模块标题行设置的默认题型
  let lastOptNum = 0;                                // 当前题最后一个数字选项的序号

  const TYPE_WORDS: Record<string, Question["type"]> = {
    "单选": "single", "多选": "multi", "问答": "text", "简答": "text", "填空": "text",
    "判断": "single", "打分": "scale", "评分": "scale", "量表": "scale", "选择": "single",
  };
  const titleLen = (s: string) => s.length;

  // 提取行内/行首题型关键词，返回 [题型, 剩余文本]
  const extractType = (s: string): [Question["type"] | null, string] => {
    let t: Question["type"] | null = null;
    let rest = s;
    // 题干括号内：（多选）（多选题）【单选】[判断] 等
    const bracket = rest.match(/[（(【\[]\s*(单选|多选|问答|简答|填空|判断|打分|评分|量表|选择)(题)?\s*[）)】\]]/);
    if (bracket) {
      t = TYPE_WORDS[bracket[1]];
      rest = rest.replace(bracket[0], "").trim();
    }
    // 行首："单选：""单选题、" "2. 多选题：xxx"
    const head = rest.match(/^(?:\d+[.、)）]\s*)?(单选|多选|问答|简答|填空|判断|打分|评分|量表|选择)(题)?\s*[:：.、)）]\s*(.+)$/);
    if (head && !t) {
      t = TYPE_WORDS[head[1]];
      rest = head[3].trim();
    }
    return [t, rest];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // ① 模块标题行："一、单选题" "二、多选题（共3题）" "Ⅱ 简答题" —— 整行很短且只有编号+题型
    const moduleMatch = line.match(/^[一二三四五六七八九十\d]{1,3}\s*[、..．]\s*(单选|多选|问答|简答|填空|判断|打分|评分|量表|选择)(题)?(类)?\s*(（[^）]*）)?\s*$/);
    if (moduleMatch) {
      moduleType = TYPE_WORDS[moduleMatch[1]];
      cur = null;
      continue;
    }

    // ② 字母选项行：A. / A、 / A) —— 几乎必为选项（含待定题型题）
    const letterOpt = line.match(/^([A-Za-z])[..)）]\s*(.+)$/);
    if (letterOpt && cur) {
      const opt = letterOpt[2].trim();
      const t2 = cur.type as string;
      if (t2 === "single" || t2 === "multi" || t2 === "pending") {
        cur.options = [...(cur.options ?? []), opt];
      }
      continue;
    }

    // ③ 数字开头行：可能是选项（1. 2. 3.）也可能是下一题（1. 2. 题号重排）
    const numLine = line.match(/^(\d{1,2})[.、)）]\s*(.+)$/);
    if (numLine) {
      const num = parseInt(numLine[1]);
      const content = numLine[2].trim();
      const [t, rest] = extractType(content);
      const isLong = titleLen(rest) > 20;           // 长文本更像题干
      const optContinues = lastOptNum > 0 && num === lastOptNum + 1;
      const startsFresh = num === 1;

      if (t) {
        // 明确带题型关键词 → 新题
        cur = { id: "", type: t, title: rest, options: t === "single" || t === "multi" ? [] : t === "scale" ? [] : [], required: true };
        if (t === "single" || t === "multi") cur.options = [];
        questions.push(cur); lastOptNum = 0;
        continue;
      }
      if (optContinues || (startsFresh && cur && (cur.options?.length ?? 0) === 0 && !isLong && (cur.type === "single" || cur.type === "multi"))) {
        // 选项：序号连续，或题刚出、从1开始的短选项
        if (cur && (cur.type === "single" || cur.type === "multi")) {
          cur.options = [...(cur.options ?? []), content];
          lastOptNum = num;
          continue;
        }
      }
      if (startsFresh && cur && (cur.options?.length ?? 0) > 0) {
        // 序号回到1且当前题已有选项 → 新题
        cur = { id: "", type: moduleType ?? "single", title: rest, options: [], required: true };
        questions.push(cur); lastOptNum = 0;
        continue;
      }
      if (!isLong && cur && (cur.type === "single" || cur.type === "multi")) {
        // 短内容接在选择题后 → 选项
        cur.options = [...(cur.options ?? []), content];
        lastOptNum = num;
        continue;
      }
      // 其余 → 新题（无题型关键词且无模块题型时记为 pending，收尾再定型）
      cur = { id: "", type: (t ?? moduleType ?? "pending") as Question["type"], title: rest, options: [], required: true };
      questions.push(cur); lastOptNum = 0;
      continue;
    }

    // ④ 判断题选项行："对 / 错 / 正确 / 错误 / 是 / 否" 裸词 → 当前题的选项
    const t4 = cur?.type as string | undefined;
    if (/^(对|错|正确|错误|是|否)$/.test(line) && cur && (t4 === "single" || t4 === "multi" || t4 === "pending")) {
      cur.options = [...(cur.options ?? []), line];
      continue;
    }

    // ⑤ 普通文本行 → 新题（提取题型关键词）
    const [t, rest] = extractType(line);
    cur = { id: "", type: t ?? moduleType ?? "single", title: rest || line, options: [], required: true };
    if (cur.type === "scale") cur.required = true;
    questions.push(cur); lastOptNum = 0;
  }

  // 收尾：题号、待定题型定型、无选项的"单选"转问答、判断题补对错选项
  questions.forEach((q, i) => {
    q.id = `q_${Date.now()}_${i}`;
    if ((q.type as string) === "pending") {
      q.type = (q.options && q.options.length > 0) ? "single" : "text";
    }
    if ((q.type === "single" || q.type === "multi") && (!q.options || q.options.length === 0)) q.type = "text";
  });
  // 判断题：题干含"判断"且无选项 → 补对/错
  for (const q of questions) {
    if (q.type === "single" && /判断/.test(q.title) && (q.options?.length ?? 0) === 0) {
      q.options = ["对", "错"];
    }
  }
  return questions.filter(q => q.title.trim());
}

export default function CounselorServicesScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"services" | "orders">("services");
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  // 编辑器
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // 报告 / 答卷
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [reportText, setReportText] = useState("");
  const [reportLink, setReportLink] = useState("");
  const [reportFileUrl, setReportFileUrl] = useState("");
  const [reportSaving, setReportSaving] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [linkSending, setLinkSending] = useState(false);
  // 问卷文本导入
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<Question[] | null>(null);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  const load = useCallback(() => {
    Promise.all([
      request("/api/counselor/services").then(r => r.json()),
      request("/api/service-orders").then(r => r.json()),
    ]).then(([s, o]) => {
      const svcs = Array.isArray(s) ? s : [];
      setServices(svcs);
      // 列表接口对老师合并返回"挂自己服务的单 + 自己购买的单"，工作台只展示前者
      const myIds = new Set(svcs.map((x: Service) => x.id));
      const all = Array.isArray(o) ? o : [];
      setOrders(all.filter((x: any) => myIds.has(x.serviceId)));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setEditorOpen(true); };
  const openEdit = (s: Service) => {
    setEditingId(s.id);
    setForm({ name: s.name, tagline: s.tagline ?? "", description: s.description ?? "", price: String(s.price), questions: s.questions ?? [], questionnaireLink: s.questionnaireLink ?? "" });
    setEditorOpen(true);
  };

  const saveService = async () => {
    if (!form.name.trim()) { showToast("请填写服务名称"); return; }
    if (!(Number(form.price) > 0)) { showToast("价格必须大于 0"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name, tagline: form.tagline, description: form.description,
        price: Number(form.price),
        questions: form.questions.map(q => ({ ...q, title: q.title.trim() })).filter(q => q.title),
        questionnaireLink: form.questionnaireLink.trim(),
      };
      const res = editingId
        ? await request(`/api/counselor/services/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await request("/api/counselor/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? "保存失败"); }
      showToast(editingId ? "已保存" : "已上架");
      setEditorOpen(false);
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "保存失败");
    } finally { setSaving(false); }
  };

  const toggleStatus = async (s: Service) => {
    await request(`/api/counselor/services/${s.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s.status === "active" ? "inactive" : "active" }),
    });
    showToast(s.status === "active" ? "已下架" : "已上架");
    load();
  };

  const orderAction = async (id: string, action: string, extra: Record<string, unknown> = {}) => {
    const res = await request(`/api/service-orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error === "invalid_status" ? "当前状态不可执行此操作" : "操作失败"); return false; }
    load();
    return true;
  };

  const submitReport = async () => {
    if (!viewOrder) return;
    if (!reportText.trim() && !reportLink.trim() && !reportFileUrl) { showToast("请填写报告内容、链接或上传文件"); return; }
    if (reportLink.trim() && !/^https?:\/\//.test(reportLink.trim())) { showToast("报告链接需以 http(s):// 开头"); return; }
    setReportSaving(true);
    const ok = await orderAction(viewOrder.id, "report", { report: reportText, reportLink: reportLink.trim(), reportFileUrl });
    setReportSaving(false);
    if (ok) { showToast("报告已发布"); setViewOrder(null); }
  };

  /** 老师发送外链问卷给该订单的来访 */
  const sendQuestionnaireLink = async () => {
    if (!viewOrder) return;
    const link = linkInput.trim();
    if (!/^https?:\/\//.test(link)) { showToast("链接需以 http(s):// 开头"); return; }
    setLinkSending(true);
    const ok = await orderAction(viewOrder.id, "set_link", { link });
    setLinkSending(false);
    if (ok) { showToast("问卷链接已发送"); setViewOrder(null); }
  };

  /** 老师上传报告文件（PDF/图片/Word，≤20MB） */
  const uploadReportFile = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    setReportSaving(true);
    try {
      const res = await request("/api/upload/report", { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? "上传失败");
      setReportFileUrl(d.url);
      showToast("文件已上传");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "上传失败");
    } finally { setReportSaving(false); }
  };

  // ── 问卷编辑器辅助 ──
  const addQuestion = (type: Question["type"]) => {
    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, { id: `q_${Date.now()}_${prev.questions.length}`, type, title: "", options: type === "single" || type === "multi" ? ["选项1", "选项2"] : undefined, required: true }],
    }));
  };
  const updateQuestion = (idx: number, patch: Partial<Question>) => {
    setForm(prev => ({ ...prev, questions: prev.questions.map((q, i) => i === idx ? { ...q, ...patch } : q) }));
  };
  const removeQuestion = (idx: number) => {
    setForm(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="min-h-svh pb-28" style={{ background: "var(--color-surface)" }}>
      {toast && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-sm font-medium text-white shadow-lg"
          style={{ background: "#9CB48A", zIndex: 60 }}>{toast}</motion.div>
      )}

      {/* 顶部 */}
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => router.push("/counselor/bookings")}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-[#DDD8D0]">
          <ArrowLeft className="w-4 h-4 text-[#6B5E52]" />
        </button>
        <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>评估服务</h1>
      </div>

      {/* 两个 tab */}
      <div className="flex gap-1.5 px-5 mb-4">
        {([["services", `我的服务 (${services.length})`], ["orders", `评估订单 (${orders.length})`]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className="flex-1 py-2.5 rounded-2xl text-xs font-semibold"
            style={{
              background: tab === k ? "var(--color-primary)" : "var(--color-card)",
              color: tab === k ? "white" : "var(--color-text-secondary)",
              border: tab === k ? "none" : "1px solid var(--color-border)",
            }}>{label}</button>
        ))}
      </div>

      {loading && <p className="text-sm text-center pt-10" style={{ color: "var(--color-text-muted)" }}>加载中…</p>}

      {/* ── 我的服务 ── */}
      {tab === "services" && !loading && (
        <div className="px-5 space-y-3">
          {services.length === 0 && (
            <div className="text-center pt-12">
              <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>还没有上架评估服务</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>创建一个评估服务（如"学习困难评估"），来访购买后即可填写问卷</p>
            </div>
          )}
          {services.map(s => (
            <div key={s.id} className="rounded-2xl p-4" style={{ background: "var(--color-card)", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>{s.name}</p>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: s.status === "active" ? "#E4F0DC" : "#EBE7DF", color: s.status === "active" ? "#3A6228" : "#9B8E82" }}>
                      {s.status === "active" ? "上架中" : "已下架"}
                    </span>
                  </div>
                  {s.tagline && <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{s.tagline}</p>}
                  <p className="text-xs mt-1.5" style={{ color: "var(--color-text-muted)" }}>
                    ¥{s.price} · {(s.questions ?? []).length} 道题
                  </p>
                </div>
                <button onClick={() => openEdit(s)} className="p-2 rounded-full" style={{ background: "var(--color-surface)" }}>
                  <Pencil className="w-4 h-4" style={{ color: "#6B5E52" }} />
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => toggleStatus(s)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                  {s.status === "active" ? "下架" : "重新上架"}
                </button>
              </div>
            </div>
          ))}
          <button onClick={openCreate}
            className="w-full py-3.5 rounded-2xl border-2 border-dashed text-sm font-bold flex items-center justify-center gap-1.5"
            style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
            <Plus className="w-4 h-4" />新建评估服务
          </button>
        </div>
      )}

      {/* ── 评估订单 ── */}
      {tab === "orders" && !loading && (
        <div className="px-5 space-y-3">
          {/* 统计条 */}
          {orders.length > 0 && (() => {
            const income = orders.filter(o => o.status === "completed").reduce((sum, o) => sum + (o.price ?? 0), 0);
            const pending = orders.filter(o => ["pending_payment", "paid", "submitted"].includes(o.status)).length;
            const completed = orders.filter(o => o.status === "completed").length;
            return (
              <div className="grid grid-cols-3 gap-2 mb-1">
                {[
                  { label: "累计收入", value: `¥${income}` },
                  { label: "待处理", value: String(pending) },
                  { label: "已完成", value: String(completed) },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl py-3 text-center" style={{ background: "var(--color-card)" }}>
                    <p className="text-base font-black" style={{ color: i === 0 ? "var(--color-primary)" : "var(--color-text-primary)" }}>{s.value}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            );
          })()}
          {orders.length === 0 && (
            <p className="text-sm text-center pt-12" style={{ color: "var(--color-text-muted)" }}>暂无评估订单</p>
          )}
          {orders.map(o => {
            const st = ORDER_STATUS[o.status] ?? ORDER_STATUS.cancelled;
            return (
              <div key={o.id} className="rounded-2xl p-4" style={{ background: "var(--color-card)", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>{o.serviceName ?? "评估服务"}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                      下单于 {new Date(o.createdAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                      {o.submittedAt ? ` · 提交于 ${new Date(o.submittedAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-sm font-black" style={{ color: "var(--color-primary)" }}>¥{o.price}</p>
                  <div className="flex gap-2">
                    {o.status === "pending_payment" && (
                      <button onClick={() => orderAction(o.id, "confirm_paid")}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{ background: "var(--color-primary)" }}>确认收到转账</button>
                    )}
                    {(o.status === "paid" || o.status === "submitted" || o.status === "completed") && (
                      <button onClick={() => {
                        setViewOrder(o);
                        setReportText(o.report ?? "");
                        setReportLink(o.reportLink ?? "");
                        setReportFileUrl(o.reportFileUrl ?? "");
                        setLinkInput(o.questionnaireLink ?? "");
                        // 答卷查看时带上问卷题目定义
                        if (!o.questions) {
                          request(`/api/counselor/services`).then(r => r.json()).then((list: Service[]) => {
                            const s = (Array.isArray(list) ? list : []).find(x => x.id === o.serviceId);
                            if (s) setViewOrder(prev => prev && prev.id === o.id ? { ...prev, questions: s.questions ?? [] } : prev);
                          }).catch(() => {});
                        }
                      }}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border"
                        style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
                        {o.status === "submitted" ? "查看答卷 · 写报告" : o.status === "completed" ? "查看报告" : "查看详情"}
                      </button>
                    )}
                    {["pending_payment", "paid"].includes(o.status) && (
                      <button onClick={() => { if (window.confirm("确认退款吗？")) orderAction(o.id, "refund"); }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border" style={{ borderColor: "#E0D8CE", color: "#9B8E82" }}>退款</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 服务编辑弹窗 ── */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setEditorOpen(false)}>
          <div className="w-full rounded-t-3xl max-h-[88vh] overflow-y-auto p-5 pb-12" style={{ background: "var(--color-bg)" }} onClick={e => e.stopPropagation()}>
            <p className="text-base font-bold text-center mb-4" style={{ color: "var(--color-text-primary)" }}>
              {editingId ? "编辑评估服务" : "新建评估服务"}
            </p>

            <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>服务名称 *</p>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="如：学习困难评估"
              className="w-full rounded-xl px-3.5 py-3 text-sm mb-3 outline-none"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />

            <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>一句话简介</p>
            <input value={form.tagline} onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))}
              placeholder="展示在列表页的一句话介绍"
              className="w-full rounded-xl px-3.5 py-3 text-sm mb-3 outline-none"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />

            <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>详细介绍（换行分段）</p>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={10}
              placeholder={"可详细描述这项服务，如：\n· 评估对象与适用人群\n· 评估维度与内容\n· 使用的测评工具\n· 报告包含哪些内容"}
              className="w-full rounded-xl px-3.5 py-3 text-sm mb-3 outline-none resize-none"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />

            <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>价格（元）*</p>
            <input value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value.replace(/[^\d]/g, "") }))}
              inputMode="numeric" placeholder="如 299"
              className="w-full rounded-xl px-3.5 py-3 text-sm mb-4 outline-none"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />

            <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>问卷链接（可选，外部问卷工具如问卷星/腾讯文档）</p>
            <input value={form.questionnaireLink} onChange={e => setForm(p => ({ ...p, questionnaireLink: e.target.value }))}
              placeholder="https://… 填写后来访订单页直接打开该链接填写"
              className="w-full rounded-xl px-3.5 py-3 text-sm mb-4 outline-none"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />

            {/* 问卷编辑 */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>内置问卷（{form.questions.length} 题，与问卷链接二选一或并用）</p>
              <div className="flex gap-1.5">
                <button onClick={() => { setImportText(""); setImportPreview(null); setImportOpen(true); }}
                  className="text-[10px] font-semibold px-2 py-1 rounded-md font-bold"
                  style={{ background: "#E4F0DC", color: "#3A6228" }}><Upload className="w-3 h-3 inline-block mr-0.5 -mt-0.5" />批量导入</button>
                {([["single", "单选"], ["multi", "多选"], ["text", "问答"], ["scale", "打分"]] as const).map(([t, label]) => (
                  <button key={t} onClick={() => addQuestion(t)}
                    className="text-[10px] font-semibold px-2 py-1 rounded-md border"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>+{label}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2.5 mb-5">
              {form.questions.length === 0 && (
                <p className="text-xs py-2" style={{ color: "var(--color-text-muted)" }}>点击上方按钮添加题目；也可以先上架，之后再编辑问卷</p>
              )}
              {form.questions.map((q, i) => (
                <div key={q.id} className="rounded-xl p-3" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#F0F7EC", color: "#3A6228" }}>
                      {{ single: "单选", multi: "多选", text: "问答", scale: "打分" }[q.type]}
                    </span>
                    <button onClick={() => updateQuestion(i, { required: q.required === false })} className="text-[10px]"
                      style={{ color: q.required === false ? "#9B8E82" : "#3A6228" }}>
                      {q.required === false ? "选填" : "必填"}
                    </button>
                    <button onClick={() => removeQuestion(i)} className="ml-auto text-[10px] text-red-500">删除</button>
                  </div>
                  <input value={q.title} onChange={e => updateQuestion(i, { title: e.target.value })}
                    placeholder={`第 ${i + 1} 题题目`}
                    className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none"
                    style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
                  {(q.type === "single" || q.type === "multi") && (
                    <div className="space-y-1.5">
                      {(q.options ?? []).map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input value={opt}
                            onChange={e => updateQuestion(i, { options: (q.options ?? []).map((o2, j) => j === oi ? e.target.value : o2) })}
                            className="flex-1 rounded-lg px-3 py-1.5 text-xs outline-none"
                            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
                          {(q.options ?? []).length > 2 && (
                            <button onClick={() => updateQuestion(i, { options: (q.options ?? []).filter((_, j) => j !== oi) })}
                              className="text-xs text-red-400 px-1">×</button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => updateQuestion(i, { options: [...(q.options ?? []), `选项${(q.options ?? []).length + 1}`] })}
                        className="text-xs font-semibold" style={{ color: "var(--color-primary)" }}>+ 添加选项</button>
                    </div>
                  )}
                  {q.type === "scale" && <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>来访将打 1-5 分</p>}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEditorOpen(false)} className="flex-1 py-3 rounded-2xl border text-sm font-semibold"
                style={{ borderColor: "#E8E2D8", color: "#9B8E82" }}>取消</button>
              <button onClick={saveService} disabled={saving}
                className="flex-1 py-3 rounded-2xl text-white font-bold text-sm"
                style={{ background: saving ? "#C4BDB5" : "var(--color-primary)" }}>
                {saving ? "保存中…" : editingId ? "保存修改" : "上架服务"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 问卷批量导入弹窗 ── */}
      {importOpen && (
        <div className="fixed inset-0 z-[55] flex items-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setImportOpen(false)}>
          <div className="w-full rounded-t-3xl max-h-[88vh] overflow-y-auto p-5 pb-12" style={{ background: "var(--color-bg)" }} onClick={e => e.stopPropagation()}>
            <p className="text-base font-bold text-center mb-1" style={{ color: "var(--color-text-primary)" }}>批量导入问卷</p>
            <p className="text-xs text-center mb-3" style={{ color: "var(--color-text-muted)" }}>从文档/微信复制题目粘贴到这里，自动识别题型和选项</p>

            {/* 格式说明 */}
            <div className="rounded-xl p-3 mb-3 text-[11px] leading-relaxed" style={{ background: "#F7F5F0", color: "#8A7F6E" }}>
              <p className="text-xs font-bold mb-1" style={{ color: "#6B5E52" }}>直接粘贴现成问卷即可，支持：</p>
              <p>· 选项以字母开头（A. B. C.）或数字开头（1. 2. 3.）</p>
              <p>· 题型写在题目前「单选：」、题干中「（多选）」或模块标题「一、单选题」</p>
              <p>· 支持单选 / 多选 / 问答 / 简答 / 填空 / 判断 / 打分；判断题自动配「对/错」</p>
              <p>· 序号、括号标注会自动清理；解析后有预览，确认后才导入</p>
            </div>

            <textarea value={importText} onChange={e => { setImportText(e.target.value); setImportPreview(null); }}
              rows={9} placeholder={"在此粘贴题目…"}
              disabled={!!importPreview}
              className="w-full rounded-xl px-3.5 py-3 text-sm mb-3 outline-none resize-none font-mono"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />

            {/* 解析预览 */}
            {importPreview && (
              <div className="rounded-xl p-3 mb-3" style={{ background: "#F0F7EC", border: "1px solid #DDE8D4" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "#3A6228" }}>识别出 {importPreview.length} 道题，请确认：</p>
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {importPreview.map((q, i) => (
                    <p key={q.id} className="text-xs leading-relaxed" style={{ color: "#4A5A40" }}>
                      {i + 1}. <span className="font-bold">[{({ single: "单选", multi: "多选", text: "问答", scale: "打分" } as Record<string, string>)[q.type] ?? "单选"}]</span> {q.title}
                      {q.options && q.options.length > 0 && <span style={{ color: "#7A8A6E" }}>（{q.options.length} 个选项）</span>}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setImportOpen(false)} className="flex-1 py-3 rounded-2xl border text-sm font-semibold"
                style={{ borderColor: "#E8E2D8", color: "#9B8E82" }}>取消</button>
              {!importPreview ? (
                <button onClick={() => {
                  const qs = parseQuestions(importText);
                  if (qs.length === 0) { showToast("未能识别出题目，请检查格式"); return; }
                  setImportPreview(qs);
                }} className="flex-1 py-3 rounded-2xl text-white font-bold text-sm"
                  style={{ background: "var(--color-primary)" }}>解析预览</button>
              ) : (
                <button onClick={() => {
                  setForm(prev => ({ ...prev, questions: [...prev.questions, ...importPreview.map((q, i) => ({ ...q, id: `q_${Date.now()}_${prev.questions.length + i}` }))] }));
                  setImportOpen(false);
                  showToast(`已导入 ${importPreview.length} 道题`);
                }} className="flex-1 py-3 rounded-2xl text-white font-bold text-sm"
                  style={{ background: "var(--color-primary)" }}>确认导入</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 答卷查看 / 报告编辑弹窗 ── */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setViewOrder(null)}>
          <div className="w-full rounded-t-3xl max-h-[88vh] overflow-y-auto p-5 pb-12" style={{ background: "var(--color-bg)" }} onClick={e => e.stopPropagation()}>
            <p className="text-base font-bold text-center mb-1" style={{ color: "var(--color-text-primary)" }}>{viewOrder.serviceName ?? "评估订单"}</p>
            <p className="text-xs text-center mb-4" style={{ color: "var(--color-text-muted)" }}>¥{viewOrder.price} · {ORDER_STATUS[viewOrder.status]?.label ?? viewOrder.status}</p>

            {/* 答卷 */}
            {viewOrder.answers && viewOrder.answers.length > 0 ? (
              <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--color-card)" }}>
                <p className="text-sm font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>来访答卷</p>
                {(viewOrder.questions ?? []).length > 0 ? (viewOrder.questions ?? []).map((q, i) => {
                  const a = viewOrder.answers?.find(x => x.questionId === q.id);
                  const val = a ? (Array.isArray(a.value) ? a.value.join("、") : String(a.value ?? "")) : "未作答";
                  return (
                    <div key={q.id} className="py-2.5" style={{ borderTop: i > 0 ? "1px solid #F5F0EA" : "none" }}>
                      <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>{i + 1}. {q.title}</p>
                      <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>{val}</p>
                    </div>
                  );
                }) : (
                  viewOrder.answers.map((a, i) => (
                    <p key={i} className="text-sm py-1" style={{ color: "var(--color-text-primary)" }}>
                      {a.questionId}: {Array.isArray(a.value) ? a.value.join("、") : String(a.value)}
                    </p>
                  ))
                )}
              </div>
            ) : (
              <p className="text-xs text-center mb-4" style={{ color: "var(--color-text-muted)" }}>该来访还未提交问卷{viewOrder.status === "pending_payment" ? "（待支付）" : ""}</p>
            )}

            {/* 联系来访 */}
            {viewOrder.status !== "pending_payment" && viewOrder.status !== "cancelled" && (
              <button onClick={async () => {
                const res = await request("/api/conversations", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ otherUserId: viewOrder.clientId }),
                });
                const conv = await res.json().catch(() => null);
                if (res.ok && conv?.id) router.push(`/chat/${conv.id}`);
                else showToast("会话创建失败");
              }} className="w-full py-2.5 rounded-2xl border text-sm font-semibold mb-4 flex items-center justify-center gap-1.5"
                style={{ borderColor: "#DDE8D4", color: "#3A6228" }}>
                <MessageCircle className="w-4 h-4" />联系来访
              </button>
            )}

            {/* 待作答：发送外链问卷 */}
            {viewOrder.status === "paid" && (
              <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--color-card)" }}>
                <p className="text-sm font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>发送问卷链接（可选）</p>
                <p className="text-xs mb-2.5 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                  如果你在问卷星/腾讯文档等工具做好了问卷，把链接发给来访；TA 在订单页打开链接填写后标记完成。已填写的内置问卷无需发送链接。
                </p>
                <div className="flex gap-2">
                  <input value={linkInput} onChange={e => setLinkInput(e.target.value)}
                    placeholder="https://…"
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none min-w-0"
                    style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
                  <button onClick={sendQuestionnaireLink} disabled={linkSending}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shrink-0"
                    style={{ background: linkSending ? "#C4BDB5" : "var(--color-primary)" }}>
                    {linkSending ? "发送中…" : "发送"}
                  </button>
                </div>
              </div>
            )}

            {/* 已发送的问卷链接 */}
            {viewOrder.questionnaireLink && viewOrder.status !== "pending_payment" && (
              <div className="rounded-2xl p-3.5 mb-4 flex items-center gap-2" style={{ background: "#FAE9DD", border: "1px solid #F0D5BC" }}>
                <p className="text-xs flex-1 min-w-0 truncate" style={{ color: "#C66B2E" }}>已发送问卷链接：{viewOrder.questionnaireLink}</p>
                <a href={viewOrder.questionnaireLink} target="_blank" rel="noreferrer" className="text-xs font-bold shrink-0" style={{ color: "#C66B2E" }}>打开</a>
              </div>
            )}

            {/* 写报告（仅待写报告状态） */}
            {viewOrder.status === "submitted" && (
              <>
                <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>报告文字内容（可选，换行分段）</p>
                <textarea value={reportText} onChange={e => setReportText(e.target.value)} rows={7}
                  placeholder="综合分析、评估结论、建议…"
                  className="w-full rounded-xl px-3.5 py-3 text-sm mb-3 outline-none resize-none"
                  style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />

                <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>报告链接（可选，如腾讯文档/网盘）</p>
                <input value={reportLink} onChange={e => setReportLink(e.target.value)}
                  placeholder="https://…"
                  className="w-full rounded-xl px-3.5 py-3 text-sm mb-3 outline-none"
                  style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />

                <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>或上传报告文件（可选，PDF/Word/图片，≤20MB）</p>
                {reportFileUrl ? (
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3" style={{ background: "#F0F7EC", border: "1px solid #DDE8D4" }}>
                    <p className="text-xs flex-1 truncate" style={{ color: "#3A6228" }}>已上传文件</p>
                    <a href={reportFileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold" style={{ color: "#3A6228" }}>预览</a>
                    <button onClick={() => setReportFileUrl("")} className="text-xs" style={{ color: "#B07D2A" }}>移除</button>
                  </div>
                ) : (
                  <label className="block w-full py-3 rounded-2xl border-2 border-dashed text-center text-xs font-bold mb-3 cursor-pointer"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                    {reportSaving ? "上传中…" : "点击选择文件上传"}
                    <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadReportFile(f); e.target.value = ""; }} />
                  </label>
                )}

                <button onClick={submitReport} disabled={reportSaving}
                  className="w-full py-3 rounded-2xl text-white font-bold text-sm"
                  style={{ background: reportSaving ? "#C4BDB5" : "var(--color-primary)" }}>
                  {reportSaving ? "发布中…" : "发布报告"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
