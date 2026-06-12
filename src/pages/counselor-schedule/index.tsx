import { useState, useEffect, useRef } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Input, ScrollView, Image, Swiper, SwiperItem, Textarea } from '@tarojs/components'
import { request } from '../../api/request'
import { useAuthStore } from '../../store/authStore'

import { useState, useEffect, useCallback, useRef } from "react";

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
function MonthCalendar({ rules }: { rules: Rule[] }) {
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
      if (r.isSingle) return (r as any).singleDate === dateStr;
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
    <View className="px-4 pt-4 pb-6"
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        const diff = e.changedTouches[0].clientX - touchStartX.current;
        if (diff > 50) prevMonth();
        else if (diff < -50) nextMonth();
      }}>
      <View className="flex items-center justify-between mb-5">
        <View}
          onClick={prevMonth}
          className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#EBE7DF" }}>
          <Text>‹</Text>
        </View>
        <Text className="text-base font-bold text-[#2C2420]">{monthName}</Text>
        <View}
          onClick={nextMonth}
          className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#EBE7DF" }}>
          <Text>›</Text>
        </View>
      </View>
      <View className="grid grid-cols-7 mb-2">
        {WEEKDAY_LABELS.map(d => (
          <View key={d} className="text-center text-[11px] font-semibold text-[#9B8E82]">{d}</View>
        ))}
      </View>
      <View className="grid grid-cols-7 gap-y-1.5">
        {Array.from({ length: firstDayMon }).map((_, i) => <View key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const status = getDayStatus(day);
          const style = status ? STATUS_STYLE[status] : null;
          return (
            <View key={day} className="flex flex-col items-center">
              <View className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium"
                style={{
                  background: style?.bg ?? (isToday ? "#EBE7DF" : "transparent"),
                  color: style?.text ?? "#2C2420",
                  fontWeight: isToday ? 700 : 500,
                  border: isToday && !style ? "2px solid #9CB48A" : "none",
                }}>
                {day}
              </View>
            </View>
          );
        })}
      </View>
      <View className="flex flex-wrap gap-x-4 gap-y-2 mt-6">
        {Object.entries(STATUS_STYLE).map(([k, v]) => (
          <View key={k} className="flex items-center gap-1.5">
            <View className="w-3.5 h-3.5 rounded-full" style={{ background: v.bg }} />
            <Text className="text-xs text-[#7D736A]">{v.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── 规则卡片 ──────────────────────────────────────────────────────────────────
function RuleBadge({ rule, onDelete }: { rule: Rule; onDelete: (id: string) => void }) {
  const typeColors = {
    available: { bg: "#E4F0DC", text: "#3A6228", icon: <Text>✓</Text> },
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
    <View className="rounded-2xl p-4 flex items-start justify-between gap-3"
      style={{ background: "#FDFAF5", border: "1px solid #EBE7DF" }}>
      <View className="flex-1 min-w-0">
        <View className="flex items-center gap-2 mb-1.5">
          <Text className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: c.bg, color: c.text }}>
            {c.icon}
            {rule.type === "available" ? "可预约" : rule.type === "blocked" ? "已屏蔽" : "固定档期"}
          </Text>
          {rule.isSingle && (
            <Text className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#EBE7DF", color: "#7D736A" }}>单次</Text>
          )}
        </View>
        <Text className="text-sm font-medium text-[#2C2420]">{dayStr} · {rule.startTime}（{rule.durationMinutes} 分钟）</Text>
        {!rule.isSingle && rule.validFrom && (
          <Text className="text-xs text-[#9B8E82] mt-0.5">{rule.validFrom} 起{rule.validUntil ? ` 至 ${rule.validUntil}` : "（长期）"}</Text>
        )}
        {rule.fixedClientId && <Text className="text-xs text-amber-600 mt-0.5">绑定来访：{rule.fixedClientId}</Text>}
        {rule.blockNote && <Text className="text-xs text-[#9B8E82] mt-0.5">备注：{rule.blockNote}</Text>}
      </View>
      <View} onClick={() => onDelete(rule.id)}
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "#EBE7DF" }}>
        <Trash2 className="w-3.5 h-3.5 text-[#9B8E82]" />
      </View>
    </View>
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
    <View className="px-4 pb-28 pt-4 space-y-3">
      {rules.length === 0 && !showForm && (
        <View className="text-center py-12">
          <View className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "#E4F0DC" }}>
            <Text>📅</Text>
          </View>
          <Text className="text-sm font-medium text-[#2C2420] mb-1">还没有设置任何档期规则</Text>
          <Text className="text-xs text-[#9B8E82]">点击下方「新增规则」开始设置</Text>
        </View>
      )}

      {rules.map(r => <RuleBadge key={r.id} rule={r} onDelete={onDelete} />)}

      <View>
        {showForm && (
          <View}}}
            className="rounded-2xl p-4 space-y-4"
            style={{ border: "1.5px solid #9CB48A", background: "#FDFAF5" }}>
            <Text className="text-sm font-bold text-[#2C2420]">新增档期规则</Text>

            {/* 循环 vs 单次 */}
            <View>
              <Text className="text-xs text-[#9B8E82] mb-2">规则类型</Text>
              <View className="flex gap-2">
                {(["recurring","single"] as const).map(m => (
                  <View key={m} onClick={() => set("mode", m)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all"
                    style={{ background: form.mode === m ? "#9CB48A" : "#F5F0E8", color: form.mode === m ? "white" : "#6B5E52", border: form.mode === m ? "1px solid #9CB48A" : "1px solid #EBE7DF" }}>
                    {m === "recurring" ? "🔁 循环（每周）" : "📅 单次（指定日期）"}
                  </View>
                ))}
              </View>
            </View>

            {/* 周几 / 日期 */}
            {form.mode === "recurring" ? (
              <View>
                <Text className="text-xs text-[#9B8E82] mb-2">每周哪几天（可多选）</Text>
                <View className="flex gap-1.5">
                  {WEEKDAY_LABELS.map((d, i) => (
                    <View key={i} onClick={() => toggleDay(i)}
                      className="flex-1 h-9 rounded-xl text-xs font-semibold"
                      style={{ background: form.weekdays.includes(i) ? "#9CB48A" : "#F5F0E8", color: form.weekdays.includes(i) ? "white" : "#6B5E52", border: form.weekdays.includes(i) ? "1px solid #9CB48A" : "1px solid #EBE7DF" }}>
                      {d}
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View>
                <Text className="text-xs text-[#9B8E82] mb-2">指定日期</Text>
                <Input type="date" value={form.date} min={TODAY_STR} onChange={e => set("date", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: "#F5F0E8", border: "1px solid #EBE7DF", color: "#2C2420" }} />
              </View>
            )}

            {/* 时间 + 时长 */}
            <View className="flex gap-3">
              <View className="flex-1">
                <Text className="text-xs text-[#9B8E82] mb-2">开始时间</Text>
                <select value={form.startTime} onChange={e => set("startTime", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: "#F5F0E8", border: "1px solid #EBE7DF", color: "#2C2420" }}>
                  {HOUR_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-[#9B8E82] mb-2">时长</Text>
                <View className="flex gap-1">
                  {([50, 90, "custom"] as const).map(d => (
                    <View key={String(d)} onClick={() => set("durationMinutes", d)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                      style={{ background: form.durationMinutes === d ? "#9CB48A" : "#F5F0E8", color: form.durationMinutes === d ? "white" : "#6B5E52", border: form.durationMinutes === d ? "1px solid #9CB48A" : "1px solid #EBE7DF" }}>
                      {d === "custom" ? "自定义" : `${d}分`}
                    </View>
                  ))}
                </View>
                {form.durationMinutes === "custom" && (
                  <Input type="number" placeholder="分钟数" value={form.customDuration}
                    onChange={e => set("customDuration", e.target.value)}
                    className="w-full mt-2 px-3 py-2 rounded-xl text-sm"
                    style={{ background: "#F5F0E8", border: "1px solid #EBE7DF", color: "#2C2420" }} />
                )}
              </View>
            </View>

            {/* 档期类型 */}
            <View>
              <Text className="text-xs text-[#9B8E82] mb-2">档期类型</Text>
              <View className="flex gap-2">
                {([["available","可预约"],["blocked","屏蔽时段"],["fixed","固定档期"]] as const).map(([id, label]) => (
                  <View key={id} onClick={() => set("type", id)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: form.type === id ? "#9CB48A" : "#F5F0E8", color: form.type === id ? "white" : "#6B5E52", border: form.type === id ? "1px solid #9CB48A" : "1px solid #EBE7DF" }}>
                    {label}
                  </View>
                ))}
              </View>
            </View>

            {/* 循环：生效时间 */}
            {form.mode === "recurring" && (
              <View className="flex gap-3">
                <View className="flex-1">
                  <Text className="text-xs text-[#9B8E82] mb-2">开始生效</Text>
                  <Input type="date" value={form.validFrom} onChange={e => set("validFrom", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: "#F5F0E8", border: "1px solid #EBE7DF", color: "#2C2420" }} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-[#9B8E82] mb-2">截止（留空=长期）</Text>
                  <Input type="date" value={form.validUntil} onChange={e => set("validUntil", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: "#F5F0E8", border: "1px solid #EBE7DF", color: "#2C2420" }} />
                </View>
              </View>
            )}

            {/* 固定：绑定来访 */}
            {form.type === "fixed" && (
              <View>
                <Text className="text-xs text-[#9B8E82] mb-1">绑定来访（可选）</Text>
                <Text className="text-[10px] text-[#9B8E82] mb-2 opacity-75">留空表示预留但不指定来访</Text>
                <Input type="text" value={form.fixedClientId} placeholder="来访姓名或 ID"
                  onChange={e => set("fixedClientId", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: "#F5F0E8", border: "1px solid #EBE7DF", color: "#2C2420" }} />
              </View>
            )}

            {/* 屏蔽：备注 */}
            {form.type === "blocked" && (
              <View>
                <Text className="text-xs text-[#9B8E82] mb-2">备注（如假期、培训等）</Text>
                <Input type="text" value={form.blockNote} placeholder="可选"
                  onChange={e => set("blockNote", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: "#F5F0E8", border: "1px solid #EBE7DF", color: "#2C2420" }} />
              </View>
            )}

            {/* 预览 */}
            {canSubmit && (
              <View className="px-3 py-2.5 rounded-xl text-xs text-[#6B5E52]" style={{ background: "#E4F0DC" }}>
                {form.mode === "recurring"
                  ? `每 ${form.weekdays.map(d => `周${WEEKDAY_LABELS[d]}`).join("、")} 的 ${form.startTime}，每次 ${actualDur} 分钟，${form.validFrom} 起${form.validUntil ? ` 至 ${form.validUntil}` : "长期循环"}`
                  : `${form.date} ${form.startTime}，时长 ${actualDur} 分钟`}
              </View>
            )}

            <View className="flex gap-2 pt-1">
              <View onClick={() => setShowForm(false)}
                className="flex-1 h-11 rounded-2xl text-sm text-[#7D736A]"
                style={{ border: "1px solid #EBE7DF", background: "#F5F0E8" }}>取消</View>
              <View} onClick={submit}
                disabled={!canSubmit || saving}
                className="flex-1 h-11 rounded-2xl text-sm font-semibold text-white"
                style={{ background: canSubmit && !saving ? "#9CB48A" : "#C0B8B0" }}>
                {saving ? "保存中…" : "保存规则"}
              </View>
            </View>
          </View>
        )}
      </View>

      {!showForm && (
        <View} onClick={() => setShowForm(true)}
          className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium"
          style={{ border: "2px dashed #C0B8B0", color: "#7D736A" }}>
          <Text>+</Text> 新增规则
        </View>
      )}
    </View>
  );
}

// ── 主屏幕 ────────────────────────────────────────────────────────────────────
export default function CounselorScheduleScreen() {
  const { user } = useAuthStore() => s.auth.user);
  const [tab, setTab] = useState<"rules" | "calendar" | "stats" | "clients">("rules");
  const [rules, setRules] = useState<Rule[]>([]);
  const [saving, setSaving] = useState(false);

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
      <View className="min-h-svh flex flex-col items-center justify-center px-6" style={{ background: "#F5F0E8" }}>
        <Text className="text-base font-semibold text-[#2C2420] mb-4">请先登录</Text>
        <View onClick={() => Taro.showToast({title: '请先登录', icon: 'none'})} className="px-6 py-3 rounded-2xl text-white font-semibold" style={{ background: "#9CB48A" }}>登录</View>
      </View>
    );
  }

  const TABS = [
    { id: "rules",    label: "档期规则", icon: <AlignLeft className="w-4 h-4" /> },
    { id: "calendar", label: "日历预览", icon: <Text>📅</Text> },
    { id: "stats",    label: "统计",     icon: <BarChart2 className="w-4 h-4" /> },
    { id: "clients",  label: "来访档案", icon: <Text>👤</Text> },
  ] as const;

  return (
    <View className="min-h-svh" style={{ background: "#F5F0E8" }}>
      <View className="sticky top-0 z-10 px-5 pt-12 pb-3" style={{ background: "#F5F0E8" }}>
        <Text className="text-xl font-bold text-[#2C2420] mb-4">档期管理</Text>
        <View className="flex gap-0 rounded-2xl overflow-hidden p-1" style={{ background: "#EBE7DF" }}>
          {TABS.map(t => (
            <View key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold transition-all"
              style={{ background: tab === t.id ? "#9CB48A" : "transparent", color: tab === t.id ? "white" : "#7D736A", borderRadius: 12 }}>
              {t.icon} {t.label}
            </View>
          ))}
        </View>
      </View>

      <View>
        <View key={tab}}}}}>
          {tab === "rules"
            ? <RulesPanel rules={rules} onAdd={handleAdd} onDelete={handleDelete} saving={saving} />
            : tab === "calendar"
            ? <MonthCalendar rules={rules} />
            : tab === "stats"
            ? <StatsPanel />
            : <ClientsPanel />}
        </View>
      </View>
    </View>
  );
}

function StatsPanel() {
  const router = useRouter();
  const STATS = [
    { icon: "CalendarDays", label: "本月接单", value: "8", unit: "个", desc: "本月新增预约订单", href: "/counselor/bookings" },
    { icon: "Clock", label: "本月完成咨询", value: "6", unit: "小时", desc: "本月已完成咨询时长", href: "/counselor/bookings" },
    { icon: "Users", label: "接待来访", value: "5", unit: "个", desc: "累计接待来访人数", href: "/counselor/schedule?tab=clients" },
    { icon: "TrendingUp", label: "累计完成时长", value: "300", unit: "小时", desc: "累计完成咨询时长", href: "/counselor/bookings" },
  ];
  return (
    <View className="px-5 py-4">
      <View className="grid grid-cols-2 gap-3">
        {STATS.map(s => (
          <View key={s.label} onClick={() => router.push(s.href)}
            className="rounded-2xl p-4 text-left"
            style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", border: "1px solid #EBE7DF" }}>
            <View className="flex items-center gap-2 mb-2">
              {s.icon === "CalendarDays" && <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>}
              {s.icon === "Clock" && <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>}
              {s.icon === "Users" && <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3"/><path d="M20 20c0-2.21-1.79-4-4-4"/><circle cx="9" cy="8" r="3"/><path d="M3 20c0-2.76 2.24-5 6-5h0c3.76 0 6 2.24 6 5"/></svg>}
              {s.icon === "TrendingUp" && <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/><polyline points="16,7 22,7 22,13"/></svg>}
              <Text className="text-xs" style={{ color: "#9B8E82" }}>{s.label}</Text>
            </View>
            <View className="flex items-baseline gap-1">
              <Text className="text-2xl font-bold" style={{ color: "#2C2420" }}>{s.value}</Text>
              <Text className="text-sm" style={{ color: "#9B8E82" }}>{s.unit}</Text>
            </View>
            <Text className="text-xs mt-1.5" style={{ color: "#C4BDB5" }}>{s.desc} →</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ClientsPanel() {
  const router = useRouter();
  const MOCK = [
    { id: "client_a", name: "张小明", sessions: 8, completed: 6, next: "周二 14:00", status: "active" },
    { id: "client_b", name: "李晓芸", sessions: 3, completed: 3, next: "周四 10:00", status: "active" },
    { id: "client_c", name: "王浩然", sessions: 12, completed: 12, next: "—",         status: "paused" },
  ];
  const COLORS = ["#9CB48A","#C4A882","#89B4C8"];
  return (
    <View className="px-5 py-4 space-y-3">
      {MOCK.map((c, i) => (
        <View key={c.id}}
          onClick={() => Taro.navigateTo({url: '/pages/counselor/clients/${c.id}/index'})}
          className="w-full rounded-2xl p-4 text-left"
          style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <View className="flex items-center justify-between mb-2">
            <View className="flex items-center gap-3">
              <View className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base text-white flex-none"
                style={{ background: COLORS[i % COLORS.length] }}>
                {c.name.slice(0,1)}
              </View>
              <View>
                <Text className="text-sm font-semibold" style={{ color: "#2C2420" }}>{c.name}</Text>
                <Text className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>
                  共 {c.sessions} 次 · 已完成 {c.completed} 次
                </Text>
              </View>
            </View>
            <Text className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.status === "active" ? "text-green-700 bg-green-50" : "text-gray-500 bg-gray-100"}`}>
              {c.status === "active" ? "进行中" : "暂停"}
            </Text>
          </View>
          <View className="flex items-center gap-1 text-xs" style={{ color: "#9B8E82" }}>
            <Text>📅</Text>
            <Text>下次咨询: {c.next}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
