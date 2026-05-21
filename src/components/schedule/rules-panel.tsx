"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Repeat, Lock, Check } from "lucide-react";

type RuleType = "available" | "blocked" | "fixed";
type RuleMode = "recurring" | "single";

type Rule = {
  id: string;
  type: RuleType;
  weekdays?: string;
  startTime?: string;
  durationMinutes: number;
  validFrom?: string;
  validUntil?: string;
  fixedClientId?: string;
  blockNote?: string;
  isSingle?: boolean;
  singleDate?: string;
  singleTime?: string;
  isActive: boolean;
};

const WEEKDAY_LABELS = ["周一","周二","周三","周四","周五","周六","周日"];
const HOUR_OPTIONS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];
const TODAY = new Date().toISOString().slice(0, 10);

const TYPE_CFG: Record<RuleType, { label: string; icon: React.ReactNode; bgClass: string; textClass: string }> = {
  available: { label: "可预约", icon: <Check className="w-3.5 h-3.5" />, bgClass: "bg-[rgba(156,180,138,0.15)]", textClass: "text-[#5a7a4a]" },
  blocked:   { label: "临时屏蔽", icon: <Lock className="w-3.5 h-3.5" />,  bgClass: "bg-[rgba(220,38,38,0.10)]", textClass: "text-[#b91c1c]" },
  fixed:     { label: "固定档期", icon: <Repeat className="w-3.5 h-3.5" />,bgClass: "bg-[rgba(217,119,6,0.12)]", textClass: "text-[#b45309]" },
};

function RuleBadge({ rule, onDelete }: { rule: Rule; onDelete: (id: string) => void }) {
  const cfg = TYPE_CFG[rule.type];
  const wds = rule.weekdays ? rule.weekdays.split(",").map(i => WEEKDAY_LABELS[Number(i)]).join("、") : "";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border p-4 relative"
      style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bgClass} ${cfg.textClass}`}>
          {cfg.icon}{cfg.label}
        </span>
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--color-mp-text)" }}>
        {rule.isSingle
          ? `单次：${rule.singleDate} ${rule.singleTime}`
          : `每${wds} · ${rule.startTime}`}
        {" "}<span className="font-normal" style={{ color: "var(--color-mp-muted)" }}>（{rule.durationMinutes} 分钟）</span>
      </p>
      {rule.validFrom && (
        <p className="text-xs mt-0.5" style={{ color: "var(--color-mp-faint)" }}>
          {rule.validFrom} 起{rule.validUntil ? ` · 至 ${rule.validUntil}` : "（长期）"}
        </p>
      )}
      {rule.blockNote && <p className="text-xs mt-0.5" style={{ color: "var(--color-mp-muted)" }}>备注：{rule.blockNote}</p>}
      {rule.fixedClientId && <p className="text-xs mt-0.5" style={{ color: "#b45309" }}>固定来访：{rule.fixedClientId}</p>}
      <button onClick={() => onDelete(rule.id)}
        className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: "var(--color-mp-border)" }}>
        <Trash2 className="w-3.5 h-3.5" style={{ color: "var(--color-mp-muted)" }} />
      </button>
    </motion.div>
  );
}

type FormState = {
  mode: RuleMode;
  type: RuleType;
  weekdays: number[];
  startTime: string;
  durationMinutes: number;
  validFrom: string;
  validUntil: string;
  fixedClientId: string;
  blockNote: string;
  singleDate: string;
  singleTime: string;
};

const EMPTY: FormState = {
  mode: "recurring", type: "available",
  weekdays: [], startTime: "09:00", durationMinutes: 50,
  validFrom: TODAY, validUntil: "",
  fixedClientId: "", blockNote: "", singleDate: TODAY, singleTime: "09:00",
};

export function RulesPanel({
  rules,
  onAdd,
  onDelete,
  saving,
}: {
  rules: Rule[];
  onAdd: (f: FormState) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  saving: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>({ ...EMPTY });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(p => ({ ...p, [k]: v }));
  const toggleWD = (i: number) => set("weekdays", form.weekdays.includes(i) ? form.weekdays.filter(d => d !== i) : [...form.weekdays, i].sort());

  const canSubmit = form.mode === "recurring"
    ? (form.type === "blocked" || form.weekdays.length > 0) && !!form.startTime
    : !!form.singleDate && !!form.singleTime;

  const submit = async () => { await onAdd(form); setForm({ ...EMPTY }); setShowForm(false); };

  return (
    <div className="px-4 pt-4 pb-24 space-y-3">
      {rules.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Repeat className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-mp-faint)" }} />
          <p className="text-sm" style={{ color: "var(--color-mp-muted)" }}>还没有档期规则</p>
        </div>
      )}

      {rules.map(r => <RuleBadge key={r.id} rule={r} onDelete={onDelete} />)}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="rounded-2xl border p-4 space-y-4"
            style={{ background: "var(--color-mp-card)", borderColor: "rgba(156,180,138,0.4)" }}>

            {/* mode */}
            <div className="flex gap-2">
              {(["recurring","single"] as RuleMode[]).map(m => (
                <button key={m} onClick={() => set("mode", m)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors"
                  style={{
                    background: form.mode === m ? "var(--color-mp-primary)" : "var(--color-mp-surface)",
                    color: form.mode === m ? "#fff" : "var(--color-mp-muted)",
                    borderColor: form.mode === m ? "var(--color-mp-primary)" : "var(--color-mp-border)",
                  }}>
                  {m === "recurring" ? "循环重复" : "单次时间"}
                </button>
              ))}
            </div>

            {/* type */}
            <div>
              <p className="text-xs mb-2" style={{ color: "var(--color-mp-muted)" }}>类型</p>
              <div className="flex gap-2">
                {(["available","blocked","fixed"] as RuleType[]).map(t => (
                  <button key={t} onClick={() => set("type", t)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors"
                    style={{
                      background: form.type === t ? (t === "blocked" ? "#DC2626" : t === "fixed" ? "#D97706" : "var(--color-mp-primary)") : "var(--color-mp-surface)",
                      color: form.type === t ? "#fff" : "var(--color-mp-muted)",
                      borderColor: form.type === t ? "transparent" : "var(--color-mp-border)",
                    }}>
                    {TYPE_CFG[t].label}
                  </button>
                ))}
              </div>
            </div>

            {/* recurring fields */}
            {form.mode === "recurring" && (
              <>
                {form.type !== "blocked" && (
                  <div>
                    <p className="text-xs mb-2" style={{ color: "var(--color-mp-muted)" }}>重复星期</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {WEEKDAY_LABELS.map((l, i) => (
                        <button key={i} onClick={() => toggleWD(i)}
                          className="w-9 h-9 rounded-xl text-xs font-semibold border transition-colors"
                          style={{
                            background: form.weekdays.includes(i) ? "var(--color-mp-primary)" : "var(--color-mp-surface)",
                            color: form.weekdays.includes(i) ? "#fff" : "var(--color-mp-muted)",
                            borderColor: form.weekdays.includes(i) ? "var(--color-mp-primary)" : "var(--color-mp-border)",
                          }}>{l.slice(1)}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs mb-1.5" style={{ color: "var(--color-mp-muted)" }}>开始时间</p>
                    <select value={form.startTime} onChange={e => set("startTime", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border text-sm"
                      style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)", color: "var(--color-mp-text)" }}>
                      {HOUR_OPTIONS.map(h => <option key={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs mb-1.5" style={{ color: "var(--color-mp-muted)" }}>时长（分钟）</p>
                    <div className="flex gap-1.5">
                      {[50, 90].map(d => (
                        <button key={d} onClick={() => set("durationMinutes", d)}
                          className="flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors"
                          style={{
                            background: form.durationMinutes === d ? "var(--color-mp-primary)" : "var(--color-mp-surface)",
                            color: form.durationMinutes === d ? "#fff" : "var(--color-mp-muted)",
                            borderColor: form.durationMinutes === d ? "var(--color-mp-primary)" : "var(--color-mp-border)",
                          }}>{d}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs mb-1.5" style={{ color: "var(--color-mp-muted)" }}>生效日期</p>
                    <input type="date" value={form.validFrom} onChange={e => set("validFrom", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-sm"
                      style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)", color: "var(--color-mp-text)" }} />
                  </div>
                  <div>
                    <p className="text-xs mb-1.5" style={{ color: "var(--color-mp-muted)" }}>截止日期（空=长期）</p>
                    <input type="date" value={form.validUntil} onChange={e => set("validUntil", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-sm"
                      style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)", color: "var(--color-mp-text)" }} />
                  </div>
                </div>
              </>
            )}

            {/* single fields */}
            {form.mode === "single" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs mb-1.5" style={{ color: "var(--color-mp-muted)" }}>日期</p>
                  <input type="date" value={form.singleDate} onChange={e => set("singleDate", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)", color: "var(--color-mp-text)" }} />
                </div>
                <div>
                  <p className="text-xs mb-1.5" style={{ color: "var(--color-mp-muted)" }}>时间</p>
                  <select value={form.singleTime} onChange={e => set("singleTime", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm"
                    style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)", color: "var(--color-mp-text)" }}>
                    {HOUR_OPTIONS.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs mb-1.5" style={{ color: "var(--color-mp-muted)" }}>时长（分钟）</p>
                  <div className="flex gap-1.5">
                    {[50, 90].map(d => (
                      <button key={d} onClick={() => set("durationMinutes", d)}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors"
                        style={{
                          background: form.durationMinutes === d ? "var(--color-mp-primary)" : "var(--color-mp-surface)",
                          color: form.durationMinutes === d ? "#fff" : "var(--color-mp-muted)",
                          borderColor: form.durationMinutes === d ? "var(--color-mp-primary)" : "var(--color-mp-border)",
                        }}>{d}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* optional fields */}
            {form.type === "fixed" && (
              <div>
                <p className="text-xs mb-1.5" style={{ color: "var(--color-mp-muted)" }}>绑定来访（可选，留空=预留但不指定）</p>
                <input value={form.fixedClientId} onChange={e => set("fixedClientId", e.target.value)}
                  placeholder="来访姓名或 ID"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm"
                  style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)", color: "var(--color-mp-text)" }} />
              </div>
            )}
            {form.type === "blocked" && (
              <div>
                <p className="text-xs mb-1.5" style={{ color: "var(--color-mp-muted)" }}>屏蔽原因（可选）</p>
                <input value={form.blockNote} onChange={e => set("blockNote", e.target.value)}
                  placeholder="如：出差、培训、假期"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm"
                  style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)", color: "var(--color-mp-text)" }} />
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowForm(false)}
                className="flex-1 h-10 rounded-xl border text-sm"
                style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)", color: "var(--color-mp-muted)" }}>
                取消
              </button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={submit}
                disabled={!canSubmit || saving}
                className="flex-1 h-10 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: canSubmit ? "var(--color-mp-primary)" : "var(--color-mp-border)" }}>
                {saving ? "保存中…" : "保存规则"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowForm(true)}
          className="w-full h-12 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-sm font-medium transition-colors"
          style={{ borderColor: "var(--color-mp-border)", color: "var(--color-mp-muted)" }}>
          <Plus className="w-4 h-4" />新增时间规则
        </motion.button>
      )}
    </div>
  );
}
