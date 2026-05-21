"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Repeat, Lock, Check, Calendar as CalIcon } from "lucide-react";
import { WeekCalendar, type Rule, type SlotType } from "@/components/schedule/week-calendar";
import { useEazo } from "@eazo/sdk/react";
import { auth } from "@eazo/sdk";
import { request } from "@/lib/api/request";

const TODAY = new Date().toISOString().slice(0, 10);
const WEEKDAYS = ["周一","周二","周三","周四","周五","周六","周日"];
const HOURS = ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00"];
const DURATIONS = [50, 90];
const SPRING = { type: "spring" as const, stiffness: 280, damping: 35 };

const TYPE_OPTIONS: { id: SlotType; label: string; desc: string; color: string; bg: string }[] = [
  { id: "available", label: "可预约",   desc: "来访可在此时段预约", color: "#3d7a30", bg: "#dcf3d4" },
  { id: "blocked",   label: "临时屏蔽", desc: "覆盖特定日期，不接受预约", color: "#dc2626", bg: "#fee2e2" },
  { id: "fixed",     label: "固定档期", desc: "为指定来访预留时间", color: "#d97706", bg: "#fef3c7" },
];

type FormState = {
  type: SlotType;
  mode: "recurring" | "single";
  weekdays: number[];
  startTime: string;
  durationMinutes: number | "custom";
  customDuration: string;
  validFrom: string;
  validUntil: string;
  fixedClientId: string;
  blockNote: string;
  singleDate: string;
  singleTime: string;
};

const EMPTY: FormState = {
  type: "available", mode: "recurring", weekdays: [], startTime: "09:00",
  durationMinutes: 50, customDuration: "", validFrom: TODAY, validUntil: "",
  fixedClientId: "", blockNote: "", singleDate: TODAY, singleTime: "09:00",
};

type ClientOption = { id: string; name: string | null; email: string | null };

function RuleBadge({ rule, onDelete }: { rule: Rule; onDelete: () => void }) {
  const t = TYPE_OPTIONS.find(o => o.id === rule.type)!;
  const days = rule.weekdays ? rule.weekdays.split(",").map(n => WEEKDAYS[+n]).join("、") : null;
  return (
    <div className="rounded-2xl border p-4 relative"
      style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: t.bg, color: t.color }}>{t.label}</span>
      </div>
      {rule.isSingle ? (
        <p className="text-sm font-medium" style={{ color: "var(--color-mp-text)" }}>
          单次：{rule.singleDate} {rule.singleTime}（{rule.durationMinutes} 分钟）
        </p>
      ) : (
        <p className="text-sm font-medium" style={{ color: "var(--color-mp-text)" }}>
          每 {days} · {rule.startTime}（{rule.durationMinutes} 分钟）
        </p>
      )}
      <p className="text-xs mt-0.5" style={{ color: "var(--color-mp-faint)" }}>
        {rule.validFrom} 起{rule.validUntil ? ` · 至 ${rule.validUntil}` : "（长期）"}
      </p>
      {rule.blockNote && <p className="text-xs mt-0.5" style={{ color: "var(--color-mp-muted)" }}>备注：{rule.blockNote}</p>}
      {rule.fixedClientId && <p className="text-xs mt-0.5" style={{ color: "#d97706" }}>固定来访：{rule.fixedClientId}</p>}
      <motion.button whileTap={{ scale: 0.9 }} onClick={onDelete}
        className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: "var(--color-mp-border)" }}>
        <Trash2 className="w-3.5 h-3.5" style={{ color: "var(--color-mp-muted)" }} />
      </motion.button>
    </div>
  );
}

function RuleForm({ onSave, onCancel, saving, clients }: {
  onSave: (f: FormState) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  clients: ClientOption[];
}) {
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(p => ({ ...p, [k]: v }));
  const toggleWd = (i: number) => set("weekdays", form.weekdays.includes(i) ? form.weekdays.filter(d => d !== i) : [...form.weekdays, i].sort());
  const realDuration = form.durationMinutes === "custom" ? (parseInt(form.customDuration) || 50) : form.durationMinutes;
  const canSave = form.mode === "recurring"
    ? (form.type === "blocked" || form.weekdays.length > 0) && !!form.startTime
    : !!form.singleDate && !!form.singleTime;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={SPRING}
      className="rounded-2xl border p-4 space-y-4"
      style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}>
      <p className="text-sm font-bold" style={{ color: "var(--color-mp-text)" }}>新增时间规则</p>

      {/* 类型 */}
      <div className="grid grid-cols-3 gap-2">
        {TYPE_OPTIONS.map(o => (
          <motion.button key={o.id} whileTap={{ scale: 0.95 }} onClick={() => set("type", o.id)}
            className="rounded-xl p-2.5 border text-center text-xs font-semibold transition-colors"
            style={form.type === o.id
              ? { background: o.bg, color: o.color, borderColor: o.color }
              : { background: "var(--color-mp-surface)", color: "var(--color-mp-muted)", borderColor: "var(--color-mp-border)" }}>
            {o.label}
          </motion.button>
        ))}
      </div>

      {/* 循环 / 单次 */}
      <div className="flex gap-2">
        {(["recurring","single"] as const).map(m => (
          <motion.button key={m} whileTap={{ scale: 0.95 }} onClick={() => set("mode", m)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold border"
            style={form.mode === m
              ? { background: "var(--color-mp-primary)", color: "#fff", borderColor: "var(--color-mp-primary)" }
              : { background: "var(--color-mp-surface)", color: "var(--color-mp-muted)", borderColor: "var(--color-mp-border)" }}>
            {m === "recurring" ? "循环重复" : "单次时间"}
          </motion.button>
        ))}
      </div>

      {form.mode === "recurring" && form.type !== "blocked" && (
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--color-mp-muted)" }}>选择重复星期</p>
          <div className="flex gap-1.5 flex-wrap">
            {WEEKDAYS.map((w, i) => (
              <motion.button key={i} whileTap={{ scale: 0.9 }} onClick={() => toggleWd(i)}
                className="w-9 h-9 rounded-xl text-xs font-semibold"
                style={form.weekdays.includes(i)
                  ? { background: "var(--color-mp-primary)", color: "#fff" }
                  : { background: "var(--color-mp-surface)", color: "var(--color-mp-muted)", border: "1px solid var(--color-mp-border)" }}>
                {w.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {form.mode === "single" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--color-mp-muted)" }}>日期</p>
            <input type="date" value={form.singleDate} onChange={e => set("singleDate", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
              style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)", color: "var(--color-mp-text)" }} />
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--color-mp-muted)" }}>时间</p>
            <select value={form.singleTime} onChange={e => set("singleTime", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none appearance-none"
              style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)", color: "var(--color-mp-text)" }}>
              {HOURS.map(h => <option key={h}>{h}</option>)}
            </select>
          </div>
        </div>
      )}

      {form.mode === "recurring" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--color-mp-muted)" }}>开始时间</p>
            <select value={form.startTime} onChange={e => set("startTime", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none appearance-none"
              style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)", color: "var(--color-mp-text)" }}>
              {HOURS.map(h => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--color-mp-muted)" }}>时长（分钟）</p>
            <div className="flex gap-1">
              {DURATIONS.map(d => (
                <motion.button key={d} whileTap={{ scale: 0.9 }} onClick={() => set("durationMinutes", d)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold border"
                  style={form.durationMinutes === d
                    ? { background: "var(--color-mp-primary)", color: "#fff", borderColor: "var(--color-mp-primary)" }
                    : { background: "var(--color-mp-surface)", color: "var(--color-mp-muted)", borderColor: "var(--color-mp-border)" }}>
                  {d}
                </motion.button>
              ))}
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => set("durationMinutes", "custom")}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold border"
                style={form.durationMinutes === "custom"
                  ? { background: "var(--color-mp-primary)", color: "#fff", borderColor: "var(--color-mp-primary)" }
                  : { background: "var(--color-mp-surface)", color: "var(--color-mp-muted)", borderColor: "var(--color-mp-border)" }}>
                自定义
              </motion.button>
            </div>
            {form.durationMinutes === "custom" && (
              <input type="number" min={10} placeholder="分钟数" value={form.customDuration}
                onChange={e => set("customDuration", e.target.value)}
                className="mt-1.5 w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
                style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)", color: "var(--color-mp-text)" }} />
            )}
          </div>
        </div>
      )}

      {form.type === "fixed" && (
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--color-mp-muted)" }}>绑定来访（可选，留空表示预留但不指定）</p>
          <select value={form.fixedClientId} onChange={e => set("fixedClientId", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none appearance-none"
            style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)", color: "var(--color-mp-text)" }}>
            <option value="">— 不指定来访 —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name ?? c.email}</option>)}
          </select>
        </div>
      )}

      {form.type === "blocked" && (
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--color-mp-muted)" }}>屏蔽原因（可选）</p>
          <input type="text" value={form.blockNote} onChange={e => set("blockNote", e.target.value)}
            placeholder="如：出差、培训、个人假期"
            className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
            style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)", color: "var(--color-mp-text)" }} />
        </div>
      )}

      {form.mode === "recurring" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--color-mp-muted)" }}>生效从</p>
            <input type="date" value={form.validFrom} onChange={e => set("validFrom", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
              style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)", color: "var(--color-mp-text)" }} />
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--color-mp-muted)" }}>截止（空=长期）</p>
            <input type="date" value={form.validUntil} onChange={e => set("validUntil", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
              style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)", color: "var(--color-mp-text)" }} />
          </div>
        </div>
      )}

      {/* Preview text */}
      {((form.mode === "recurring" && form.weekdays.length > 0) || form.mode === "single") && (
        <div className="px-3 py-2.5 rounded-xl text-xs" style={{ background: "var(--color-mp-secondary)", color: "var(--color-mp-muted)" }}>
          {form.mode === "single"
            ? `单次：${form.singleDate} ${form.singleTime}，${realDuration} 分钟`
            : `每 ${form.weekdays.map(d => WEEKDAYS[d]).join("、")} 的 ${form.startTime}，${realDuration} 分钟，${form.validFrom} 起${form.validUntil ? `至 ${form.validUntil}` : "长期"}`
          }
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <motion.button whileTap={{ scale: 0.96 }} onClick={onCancel}
          className="flex-1 h-10 rounded-xl border text-sm" style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)", color: "var(--color-mp-muted)" }}>
          取消
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onSave({ ...form, durationMinutes: realDuration as number | "custom" })} disabled={!canSave || saving}
          className="flex-1 h-10 rounded-xl text-sm font-semibold text-white"
          style={{ background: canSave ? "var(--color-mp-primary)" : "var(--color-mp-border)" }}>
          {saving ? "保存中…" : "保存规则"}
        </motion.button>
      </div>
    </motion.div>
  );
}

export function CounselorScheduleScreen() {
  const user = useEazo((s) => s.auth.user);
  const loadingAuth = useEazo((s) => s.auth.loading);
  const [tab, setTab] = useState<"calendar" | "rules">("calendar");
  const [rules, setRules] = useState<Rule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);

  useEffect(() => {
    if (!user) return;
    request("/api/counselor/schedule").then(r => r.json()).then(d => setRules(Array.isArray(d) ? d : []));
    request("/api/counselor/clients").then(r => r.ok ? r.json() : []).then(d => setClients(Array.isArray(d) ? d : []));
  }, [user]);

  const handleAdd = async (f: FormState) => {
    setSaving(true);
    try {
      const body = {
        type: f.type,
        weekdays: f.mode === "recurring" ? f.weekdays.join(",") : undefined,
        startTime: f.mode === "recurring" ? f.startTime : undefined,
        durationMinutes: f.durationMinutes === "custom" ? parseInt(f.customDuration) || 50 : f.durationMinutes,
        validFrom: f.mode === "recurring" ? f.validFrom : undefined,
        validUntil: f.mode === "recurring" && f.validUntil ? f.validUntil : undefined,
        fixedClientId: f.fixedClientId || undefined,
        blockNote: f.blockNote || undefined,
        isSingle: f.mode === "single",
        singleDate: f.mode === "single" ? f.singleDate : undefined,
        singleTime: f.mode === "single" ? f.singleTime : undefined,
      };
      const res = await request("/api/counselor/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const r = await res.json();
      if (r.id) { setRules(prev => [...prev, r]); setShowForm(false); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await request(`/api/counselor/schedule/${id}`, { method: "DELETE" });
    setRules(prev => prev.filter(r => r.id !== id));
  };

  if (!loadingAuth && !user) {
    return (
      <div className="min-h-svh flex items-center justify-center" style={{ background: "var(--color-mp-surface)" }}>
        <div className="text-center px-6">
          <p className="text-base font-semibold mb-4" style={{ color: "var(--color-mp-text)" }}>请先登录</p>
          <button onClick={() => auth.login()} className="px-6 py-3 rounded-2xl text-white font-semibold" style={{ background: "var(--color-mp-primary)" }}>登录</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh" style={{ background: "var(--color-mp-surface)" }}>
      <div className="sticky top-0 z-10 px-5 pt-12 md:pt-6 pb-3 border-b"
        style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)" }}>
        <h1 className="text-xl font-bold mb-3" style={{ color: "var(--color-mp-text)" }}>档期管理</h1>
        <div className="flex gap-2">
          {(["calendar","rules"] as const).map(t => (
            <motion.button key={t} whileTap={{ scale: 0.95 }} onClick={() => setTab(t)}
              className="px-4 py-2 rounded-xl text-sm font-semibold border"
              style={tab === t
                ? { background: "var(--color-mp-primary)", color: "#fff", borderColor: "var(--color-mp-primary)" }
                : { background: "var(--color-mp-card)", color: "var(--color-mp-muted)", borderColor: "var(--color-mp-border)" }}>
              {t === "calendar" ? "📅 日历预览" : "⚙️ 规则管理"}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 pb-28">
        {tab === "calendar" ? (
          <WeekCalendar rules={rules} />
        ) : (
          <div className="space-y-3">
            {rules.length === 0 && !showForm && (
              <div className="text-center py-14">
                <Repeat className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--color-mp-faint)" }} />
                <p className="text-sm font-medium mb-1" style={{ color: "var(--color-mp-text)" }}>还没有设置档期规则</p>
                <p className="text-xs" style={{ color: "var(--color-mp-muted)" }}>点下方新增，设置循环或单次时间段</p>
              </div>
            )}
            {rules.map(r => <RuleBadge key={r.id} rule={r} onDelete={() => handleDelete(r.id)} />)}
            <AnimatePresence>
              {showForm && <RuleForm onSave={handleAdd} onCancel={() => setShowForm(false)} saving={saving} clients={clients} />}
            </AnimatePresence>
            {!showForm && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowForm(true)}
                className="w-full h-12 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                style={{ borderColor: "var(--color-mp-border)", color: "var(--color-mp-muted)" }}>
                <Plus className="w-4 h-4" />新增时间规则
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
