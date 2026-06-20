"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, AlignLeft, Plus, Trash2, Check, Lock, Repeat, BarChart2, Users, TrendingUp, Clock } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { request } from "@/lib/api/request";

type Rule = {
  id: string; type: "available" | "blocked" | "fixed";
  mode: "recurring" | "single";
  weekdays?: number[] | string; date?: string; isSingle?: boolean;
  startTime: string; durationMinutes: number;
  validFrom?: string; validUntil?: string;
  fixedClientId?: string; blockNote?: string;
  isActive: boolean;
};

const WEEKDAY_LABELS = ["一","二","三","四","五","六","日"];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2,"0")}:00`);

// ── 月视图日历 ────────────────────────────────────────────────────────────────
function MonthCalendar({ rules, onDayClick }: { rules: Rule[], onDayClick: (dateStr: string) => void }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const touchStartX = useRef(0);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayMon = firstDay === 0 ? 6 : firstDay - 1;
  const monthName = new Date(year, month, 1).toLocaleDateString("zh-CN", { year: "numeric", month: "long" });

  function getDayStatus(day: number): "available" | "blocked" | "fixed" | "mixed" | null {
    const date = new Date(year, month, day);
    const jsDay = date.getDay();
    const weekday = jsDay === 0 ? 6 : jsDay - 1;
    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const matched = rules.filter(r => {
      if (!r.isActive) return false;
      // weekdays 可能是 "0,2,4" 字符串或数字数组，统一解析
      const wdArr: number[] = Array.isArray(r.weekdays)
        ? r.weekdays
        : typeof r.weekdays === "string" && r.weekdays
          ? r.weekdays.split(",").map(Number)
          : [];
      if (r.isSingle) return r.date === dateStr;
      // recurring
      const from = r.validFrom ? new Date(r.validFrom) : null;
      const until = r.validUntil ? new Date(r.validUntil) : null;
      if (from && date < from) return false;
      if (until && date > until) return false;
      return wdArr.includes(weekday);
    });
    if (matched.length === 0) return null;
    const types = [...new Set(matched.map(r => r.type))];
    if (types.length > 1) return "mixed";
    return types[0];
  }

  const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
    available: { bg: "#9CB48A", text: "white", label: "可预约" },
    blocked:   { bg: "#E8A0A0", text: "white", label: "已屏蔽" },
    fixed:     { bg: "#F4C97A", text: "#2C2420", label: "固定档期" },
    mixed:     { bg: "#B0C4DE", text: "white", label: "混合" },
  };

  return (
    <div className="px-4 pt-4 pb-6"
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        const diff = e.changedTouches[0].clientX - touchStartX.current;
        if (diff > 50) prevMonth();
        else if (diff < -50) nextMonth();
      }}>
      <div className="flex items-center justify-between mb-5">
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={prevMonth}
          className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#EBE7DF" }}>
          <ChevronLeft className="w-4 h-4 text-[#6B5E52]" />
        </motion.button>
        <span className="text-base font-bold text-[#2C2420]">{monthName}</span>
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={nextMonth}
          className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#EBE7DF" }}>
          <ChevronRight className="w-4 h-4 text-[#6B5E52]" />
        </motion.button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAY_LABELS.map(d => (
          <div key={d} className="text-center text-[11px] font-semibold text-[#9B8E82]">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1.5">
        {Array.from({ length: firstDayMon }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const status = getDayStatus(day);
          const style = status ? STATUS_STYLE[status] : null;
          return (
            <div key={day} className="flex flex-col items-center">
              <button
                onClick={() => {
                  const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  onDayClick(dateStr);
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium active:opacity-70"
                style={{
                  background: style?.bg ?? (isToday ? "#EBE7DF" : "transparent"),
                  color: style?.text ?? "#2C2420",
                  fontWeight: isToday ? 700 : 500,
                  border: isToday && !style ? "2px solid #9CB48A" : "none",
                }}>
                {day}
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-6">
        {Object.entries(STATUS_STYLE).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full" style={{ background: v.bg }} />
            <span className="text-xs text-[#7D736A]">{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 规则卡片 ──────────────────────────────────────────────────────────────────
function RuleBadge({ rule, onDelete }: { rule: Rule; onDelete: (id: string) => void }) {
  const typeColors = {
    available: { bg: "#E4F0DC", text: "#3A6228", icon: <Check className="w-3 h-3" /> },
    blocked:   { bg: "#FEE2E2", text: "#991B1B", icon: <Lock className="w-3 h-3" /> },
    fixed:     { bg: "#FEF3C7", text: "#92400E", icon: <Repeat className="w-3 h-3" /> },
  };
  const c = typeColors[rule.type];
  const wdArr: number[] = Array.isArray(rule.weekdays)
    ? rule.weekdays
    : typeof rule.weekdays === "string" && rule.weekdays
      ? rule.weekdays.split(",").map(Number)
      : [];
  const dayStr = (!rule.isSingle || !rule.isSingle)
    ? (wdArr.map(d => `周${WEEKDAY_LABELS[d]}`).join("、") || "")
    : (rule.date ?? "");
  return (
    <div className="rounded-2xl p-4 flex items-start justify-between gap-3"
      style={{ background: "#FDFAF5", border: "1px solid #EBE7DF" }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: c.bg, color: c.text }}>
            {c.icon}
            {rule.type === "available" ? "可预约" : rule.type === "blocked" ? "已屏蔽" : "固定档期"}
          </span>
          {rule.isSingle && (
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#EBE7DF", color: "#7D736A" }}>单次</span>
          )}
        </div>
        <p className="text-sm font-medium text-[#2C2420]">{dayStr} · {rule.startTime}（{rule.durationMinutes} 分钟）</p>
        {!rule.isSingle && rule.validFrom && (
          <p className="text-xs text-[#9B8E82] mt-0.5">{rule.validFrom} 起{rule.validUntil ? ` 至 ${rule.validUntil}` : "（长期）"}</p>
        )}
        {rule.fixedClientId && <p className="text-xs text-amber-600 mt-0.5">绑定来访：{rule.fixedClientId}</p>}
        {rule.blockNote && <p className="text-xs text-[#9B8E82] mt-0.5">备注：{rule.blockNote}</p>}
      </div>
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => onDelete(rule.id)}
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "#EBE7DF" }}>
        <Trash2 className="w-3.5 h-3.5 text-[#9B8E82]" />
      </motion.button>
    </div>
  );
}

// ── 规则设置面板 ──────────────────────────────────────────────────────────────
type NewRule = {
  mode: "recurring" | "single"; type: "available" | "blocked" | "fixed";
  weekdays: number[]; date: string; startTime: string;
  durationMinutes: number | "custom"; customDuration: string;
  validFrom: string; validUntil: string; fixedClientId: string; blockNote: string;
};
const TODAY_STR = new Date().toISOString().slice(0, 10);
const EMPTY: NewRule = {
  mode: "recurring", type: "available", weekdays: [], date: TODAY_STR,
  startTime: "09:00", durationMinutes: 50, customDuration: "",
  validFrom: TODAY_STR, validUntil: "", fixedClientId: "", blockNote: "",
};

function RulesPanel({ rules, onAdd, onDelete, saving }: {
  rules: Rule[]; saving: boolean;
  onAdd: (r: NewRule) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewRule>({ ...EMPTY });
  const set = <K extends keyof NewRule>(k: K, v: NewRule[K]) => setForm(p => ({ ...p, [k]: v }));
  const toggleDay = (i: number) => set("weekdays",
    form.weekdays.includes(i) ? form.weekdays.filter(d => d !== i) : [...form.weekdays, i].sort());

  const canSubmit = form.mode === "single" ? !!form.date && !!form.startTime : form.weekdays.length > 0;
  const actualDur = form.durationMinutes === "custom" ? (parseInt(form.customDuration) || 50) : form.durationMinutes;

  const submit = async () => {
    await onAdd({ ...form, durationMinutes: actualDur as number });
    setForm({ ...EMPTY }); setShowForm(false);
  };

  return (
    <div className="px-4 pb-28 pt-4 space-y-3">
      {rules.length === 0 && !showForm && (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "#E4F0DC" }}>
            <CalendarDays className="w-6 h-6 text-[#9CB48A]" />
          </div>
          <p className="text-sm font-medium text-[#2C2420] mb-1">还没有设置任何档期规则</p>
          <p className="text-xs text-[#9B8E82]">点击下方「新增规则」开始设置</p>
        </div>
      )}

      {rules.map(r => <RuleBadge key={r.id} rule={r} onDelete={onDelete} />)}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="rounded-2xl p-4 space-y-4"
            style={{ border: "1.5px solid #9CB48A", background: "#FDFAF5" }}>
            <p className="text-sm font-bold text-[#2C2420]">新增档期规则</p>

            {/* 循环 vs 单次 */}
            <div>
              <p className="text-xs text-[#9B8E82] mb-2">规则类型</p>
              <div className="flex gap-2">
                {(["recurring","single"] as const).map(m => (
                  <button key={m} onClick={() => set("mode", m)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all"
                    style={{ background: form.mode === m ? "#9CB48A" : "#F5F0E8", color: form.mode === m ? "white" : "#6B5E52", border: form.mode === m ? "1px solid #9CB48A" : "1px solid #EBE7DF" }}>
                    {m === "recurring" ? "🔁 循环（每周）" : "📅 单次（指定日期）"}
                  </button>
                ))}
              </div>
            </div>

            {/* 周几 / 日期 */}
            {form.mode === "recurring" ? (
              <div>
                <p className="text-xs text-[#9B8E82] mb-2">每周哪几天（可多选）</p>
                <div className="flex gap-1.5">
                  {WEEKDAY_LABELS.map((d, i) => (
                    <button key={i} onClick={() => toggleDay(i)}
                      className="flex-1 h-9 rounded-xl text-xs font-semibold"
                      style={{ background: form.weekdays.includes(i) ? "#9CB48A" : "#F5F0E8", color: form.weekdays.includes(i) ? "white" : "#6B5E52", border: form.weekdays.includes(i) ? "1px solid #9CB48A" : "1px solid #EBE7DF" }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-[#9B8E82] mb-2">指定日期</p>
                <input type="date" value={form.date} min={TODAY_STR} onChange={e => set("date", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: "#F5F0E8", border: "1px solid #EBE7DF", color: "#2C2420" }} />
              </div>
            )}

            {/* 时间 + 时长 */}
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="text-xs text-[#9B8E82] mb-2">开始时间</p>
                <select value={form.startTime} onChange={e => set("startTime", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: "#F5F0E8", border: "1px solid #EBE7DF", color: "#2C2420" }}>
                  {HOUR_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <p className="text-xs text-[#9B8E82] mb-2">时长</p>
                <div className="flex gap-1">
                  {([50, 90, "custom"] as const).map(d => (
                    <button key={String(d)} onClick={() => set("durationMinutes", d)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                      style={{ background: form.durationMinutes === d ? "#9CB48A" : "#F5F0E8", color: form.durationMinutes === d ? "white" : "#6B5E52", border: form.durationMinutes === d ? "1px solid #9CB48A" : "1px solid #EBE7DF" }}>
                      {d === "custom" ? "自定义" : `${d}分`}
                    </button>
                  ))}
                </div>
                {form.durationMinutes === "custom" && (
                  <input type="number" placeholder="分钟数" value={form.customDuration}
                    onChange={e => set("customDuration", e.target.value)}
                    className="w-full mt-2 px-3 py-2 rounded-xl text-sm"
                    style={{ background: "#F5F0E8", border: "1px solid #EBE7DF", color: "#2C2420" }} />
                )}
              </div>
            </div>

            {/* 档期类型 */}
            <div>
              <p className="text-xs text-[#9B8E82] mb-2">档期类型</p>
              <div className="flex gap-2">
                {([["available","可预约"],["blocked","屏蔽时段"],["fixed","固定档期"]] as const).map(([id, label]) => (
                  <button key={id} onClick={() => set("type", id)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: form.type === id ? "#9CB48A" : "#F5F0E8", color: form.type === id ? "white" : "#6B5E52", border: form.type === id ? "1px solid #9CB48A" : "1px solid #EBE7DF" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 循环：生效时间 */}
            {form.mode === "recurring" && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-xs text-[#9B8E82] mb-2">开始生效</p>
                  <input type="date" value={form.validFrom} onChange={e => set("validFrom", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: "#F5F0E8", border: "1px solid #EBE7DF", color: "#2C2420" }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[#9B8E82] mb-2">截止（留空=长期）</p>
                  <input type="date" value={form.validUntil} onChange={e => set("validUntil", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: "#F5F0E8", border: "1px solid #EBE7DF", color: "#2C2420" }} />
                </div>
              </div>
            )}

            {/* 固定：绑定来访 */}
            {form.type === "fixed" && (
              <div>
                <p className="text-xs text-[#9B8E82] mb-1">绑定来访（可选）</p>
                <p className="text-[10px] text-[#9B8E82] mb-2 opacity-75">留空表示预留但不指定来访</p>
                <input type="text" value={form.fixedClientId} placeholder="来访姓名或 ID"
                  onChange={e => set("fixedClientId", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: "#F5F0E8", border: "1px solid #EBE7DF", color: "#2C2420" }} />
              </div>
            )}

            {/* 屏蔽：备注 */}
            {form.type === "blocked" && (
              <div>
                <p className="text-xs text-[#9B8E82] mb-2">备注（如假期、培训等）</p>
                <input type="text" value={form.blockNote} placeholder="可选"
                  onChange={e => set("blockNote", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: "#F5F0E8", border: "1px solid #EBE7DF", color: "#2C2420" }} />
              </div>
            )}

            {/* 预览 */}
            {canSubmit && (
              <div className="px-3 py-2.5 rounded-xl text-xs text-[#6B5E52]" style={{ background: "#E4F0DC" }}>
                {form.mode === "recurring"
                  ? `每 ${form.weekdays.map(d => `周${WEEKDAY_LABELS[d]}`).join("、")} 的 ${form.startTime}，每次 ${actualDur} 分钟，${form.validFrom} 起${form.validUntil ? ` 至 ${form.validUntil}` : "长期循环"}`
                  : `${form.date} ${form.startTime}，时长 ${actualDur} 分钟`}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowForm(false)}
                className="flex-1 h-11 rounded-2xl text-sm text-[#7D736A]"
                style={{ border: "1px solid #EBE7DF", background: "#F5F0E8" }}>取消</button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={submit}
                disabled={!canSubmit || saving}
                className="flex-1 h-11 rounded-2xl text-sm font-semibold text-white"
                style={{ background: canSubmit && !saving ? "#9CB48A" : "#C0B8B0" }}>
                {saving ? "保存中…" : "保存规则"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowForm(true)}
          className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium"
          style={{ border: "2px dashed #C0B8B0", color: "#7D736A" }}>
          <Plus className="w-4 h-4" /> 新增规则
        </motion.button>
      )}
    </div>
  );
}

// ── 主屏幕 ────────────────────────────────────────────────────────────────────
export function CounselorScheduleScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"rules" | "calendar" | "stats" | "clients">("rules");
  const [rules, setRules] = useState<Rule[]>([]);
  const [saving, setSaving] = useState(false);

  // 日历点击日期相关状态
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayStartTime, setDayStartTime] = useState("09:00");
  const [dayDuration, setDayDuration] = useState(50);
  const [addingDay, setAddingDay] = useState(false);

  const loadRules = useCallback(async () => {
    if (!user) return;
    try {
      const res = await request("/api/counselor/schedule");
      if (res.ok) {
        const data = await res.json();
        setRules(Array.isArray(data) ? data : []);
      }
    } catch { setRules([]); }
  }, [user]);

  useEffect(() => { loadRules(); }, [loadRules]);

  const handleAdd = async (r: NewRule) => {
    setSaving(true);
    try {
      const actual = r.durationMinutes === "custom" ? parseInt((r as any).customDuration) || 50 : r.durationMinutes;
      await request("/api/counselor/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...r, durationMinutes: actual }),
      });
      await loadRules();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await request("/api/counselor/schedule", { method: "DELETE" });
    await loadRules();
  };

  if (!user) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center px-6" style={{ background: "#F5F0E8" }}>
        <p className="text-base font-semibold text-[#2C2420] mb-4">请先登录</p>
        <button onClick={() => router.push("/login")} className="px-6 py-3 rounded-2xl text-white font-semibold" style={{ background: "#9CB48A" }}>登录</button>
      </div>
    );
  }

  const TABS = [
    { id: "rules",    label: "档期规则", icon: <AlignLeft className="w-4 h-4" /> },
    { id: "calendar", label: "日历预览", icon: <CalendarDays className="w-4 h-4" /> },
    { id: "stats",    label: "统计",     icon: <BarChart2 className="w-4 h-4" /> },
    { id: "clients",  label: "来访档案", icon: <Users className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="min-h-svh" style={{ background: "#F5F0E8" }}>
      <div className="sticky top-0 z-10 px-5 pt-12 pb-3" style={{ background: "#F5F0E8" }}>
        <h1 className="text-xl font-bold text-[#2C2420] mb-4">档期管理</h1>
        <div className="flex gap-0 rounded-2xl overflow-hidden p-1" style={{ background: "#EBE7DF" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold transition-all"
              style={{ background: tab === t.id ? "#9CB48A" : "transparent", color: tab === t.id ? "white" : "#7D736A", borderRadius: 12 }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}>
          {tab === "rules"
            ? <RulesPanel rules={rules} onAdd={handleAdd} onDelete={handleDelete} saving={saving} />
            : tab === "calendar"
            ? <MonthCalendar rules={rules} onDayClick={(d) => { setSelectedDate(d); setDayStartTime("09:00"); setDayDuration(50); }} />
            : tab === "stats"
            ? <StatsPanel />
            : <ClientsPanel />}
        </motion.div>
      </AnimatePresence>

      {/* 点击日期弹出的底部面板 */}
      <AnimatePresence>
        {selectedDate && (
          <>
            <motion.div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.3)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedDate(null)} />
            <motion.div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
              style={{ background: "#FDFBF7" }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              <div className="px-5 pt-5 pb-2 flex items-center justify-between">
                <span className="text-base font-bold" style={{ color: "#2C2420" }}>
                  {selectedDate} 档期
                </span>
                <button onClick={() => setSelectedDate(null)}>
                  <ChevronRight size={20} className="rotate-90" style={{ color: "#9B8E82" }} />
                </button>
              </div>

              {/* 该天已有的档期 */}
              <div className="px-5 pb-2">
                {rules.filter(r => {
                  if (!r.isActive) return false;
                  if (r.isSingle) return r.date === selectedDate;
                  const d = new Date(selectedDate);
                  const wd = d.getDay() === 0 ? 6 : d.getDay() - 1;
                  const wds: number[] = Array.isArray(r.weekdays) ? r.weekdays
                    : typeof r.weekdays === "string" && r.weekdays ? r.weekdays.split(",").map(Number) : [];
                  return wds.includes(wd);
                }).length === 0 ? (
                  <p className="text-sm py-2" style={{ color: "#9B8E82" }}>该天暂无档期规则，可在下方添加单次档期</p>
                ) : (
                  rules.filter(r => {
                    if (!r.isActive) return false;
                    if (r.isSingle) return r.date === selectedDate;
                    const d = new Date(selectedDate);
                    const wd = d.getDay() === 0 ? 6 : d.getDay() - 1;
                    const wds: number[] = Array.isArray(r.weekdays) ? r.weekdays
                      : typeof r.weekdays === "string" && r.weekdays ? r.weekdays.split(",").map(Number) : [];
                    return wds.includes(wd);
                  }).map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "#EBE7DF" }}>
                      <span className="text-sm" style={{ color: "#2C2420" }}>
                        {r.isSingle ? `${r.startTime} · ${r.durationMinutes}分钟` : `${r.startTime} · ${r.durationMinutes}分钟 · 循环`}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{
                        background: r.type === "available" ? "#D1FAE5" : r.type === "blocked" ? "#FEE2E2" : "#FEF3C7",
                        color: r.type === "available" ? "#065F46" : r.type === "blocked" ? "#991B1B" : "#92400E"
                      }}>
                        {r.type === "available" ? "可预约" : r.type === "blocked" ? "已屏蔽" : "固定"}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* 新增单次档期 */}
              <div className="px-5 pb-4 pt-2">
                <p className="text-xs font-semibold mb-3" style={{ color: "#7D736A" }}>新增该天单次可预约档期</p>
                <div className="flex gap-3 mb-3">
                  <div className="flex-1">
                    <label className="text-xs" style={{ color: "#9B8E82" }}>开始时间</label>
                    <select value={dayStartTime} onChange={e => setDayStartTime(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: "#F5F1E8", border: "1px solid #EBE7DF", color: "#2C2420" }}>
                      {HOUR_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs" style={{ color: "#9B8E82" }}>时长（分钟）</label>
                    <select value={dayDuration} onChange={e => setDayDuration(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: "#F5F1E8", border: "1px solid #EBE7DF", color: "#2C2420" }}>
                      {[25, 50, 60, 90, 120].map(d => <option key={d} value={d}>{d}分钟</option>)}
                    </select>
                  </div>
                </div>
                <button
                  disabled={addingDay}
                  onClick={async () => {
                    setAddingDay(true);
                    try {
                      await request("/api/counselor/schedule", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          type: "available",
                          isSingle: true,
                          date: selectedDate,
                          startTime: dayStartTime,
                          durationMinutes: dayDuration,
                        }),
                      });
                      await loadRules();
                      setSelectedDate(null);
                    } finally { setAddingDay(false); }
                  }}
                  className="w-full py-3 rounded-2xl text-sm font-semibold text-white"
                  style={{ background: addingDay ? "#C0B8B0" : "#9CB48A" }}>
                  {addingDay ? "保存中…" : "添加这个时间段"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatsPanel() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<{ monthBookings: number; monthHours: number; totalClients: number; totalHours: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    request("/api/counselor/stats").then(r => r.json()).then(d => { if (!d.error) setStats(d); }).catch(() => {});
  }, [user]);

  const STATS = [
    { label: "本月接单", value: stats?.monthBookings ?? "—", unit: "个", desc: "本月新增预约订单", href: "/counselor/bookings" },
    { label: "本月完成咨询", value: stats?.monthHours ?? "—", unit: "小时", desc: "本月已完成咨询时长", href: "/counselor/bookings" },
    { label: "接待来访", value: stats?.totalClients ?? "—", unit: "个", desc: "累计接待来访人数", href: "/counselor/schedule?tab=clients" },
    { label: "累计完成时长", value: stats?.totalHours ?? "—", unit: "小时", desc: "累计完成咨询时长", href: "/counselor/bookings" },
  ];
  return (
    <div className="px-5 py-4">
      <div className="grid grid-cols-2 gap-3">
        {STATS.map(s => (
          <button key={s.label} onClick={() => router.push(s.href)}
            className="rounded-2xl p-4 text-left"
            style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", border: "1px solid #EBE7DF" }}>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold" style={{ color: "#2C2420" }}>{s.value}</p>
              <p className="text-sm" style={{ color: "#9B8E82" }}>{s.unit}</p>
            </div>
            <p className="text-xs mt-1.5" style={{ color: "#C4BDB5" }}>{s.desc} →</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ClientsPanel() {
  const router = useRouter();
  const { user } = useAuth();
  const [clients, setClients] = useState<{ id: string; name: string; sessions: number; completed: number; status: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    request("/api/counselor/bookings").then(r => r.json()).then(data => {
      if (!Array.isArray(data)) return;
      // 按来访者聚合
      const map: Record<string, { id: string; name: string; sessions: number; completed: number; status: string }> = {};
      for (const b of data) {
        const cid = b.clientId ?? b.client_id ?? "";
        const name = b.clientName ?? b.client_name ?? "来访者";
        if (!map[cid]) map[cid] = { id: cid, name, sessions: 0, completed: 0, status: "active" };
        map[cid].sessions++;
        if (b.status === "completed") map[cid].completed++;
      }
      setClients(Object.values(map));
    }).catch(() => {});
  }, [user]);

  const COLORS = ["#9CB48A","#C4A882","#89B4C8"];
  return (
    <div className="px-5 py-4 space-y-3">
      {clients.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: "#C4BDB5" }}>暂无来访档案</p>
      )}
      {clients.map((c, i) => (
        <motion.button key={c.id} whileTap={{ scale: 0.98 }}
          onClick={() => router.push(`/counselor/clients/${c.id}`)}
          className="w-full rounded-2xl p-4 text-left"
          style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-none"
                style={{ background: COLORS[i % COLORS.length] }}>
                {c.name.slice(0,1)}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#2C2420" }}>{c.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>
                  共 {c.sessions} 次 · 已完成 {c.completed} 次
                </p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: c.status === "active" ? "#E8F5E0" : "#F5F1E8", color: c.status === "active" ? "#3A6228" : "#9B8E82" }}>
              {c.status === "active" ? "进行中" : "暂停"}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
