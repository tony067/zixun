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
  singleDate?: string; singleTime?: string;
  startTime: string; durationMinutes: number;
  validFrom?: string; validUntil?: string;
  fixedClientId?: string; blockNote?: string;
  isActive: boolean;
};

const WEEKDAY_LABELS = ["一","二","三","四","五","六","日"];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2,"0")}:00`);

// ── 工具函数 ──────────────────────────────────────────────────────────────────
function timeEnd(start: string, minutes: number): string {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + (m || 0) + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
function timePeriod(start: string): string {
  const h = parseInt(start);
  if (h < 12) return "上午";
  if (h < 18) return "下午";
  return "晚上";
}

// 解析某天所有规则，合并「循环被单次屏蔽」的情况
type SlotDisplay = {
  id: string;
  startTime: string;
  endTime: string;
  period: string;
  type: "available" | "blocked" | "fixed";
  isRecurring: boolean;
  overriddenByBlock: boolean; // 循环可预约被单次屏蔽覆盖
  recurringId?: string;       // 原循环规则 id（用于「删除循环规则」）
  ruleId: string;             // 操作时用的 id（单次优先）
};

function getDaySlots(rules: Rule[], dateStr: string): SlotDisplay[] {
  const date = new Date(dateStr);
  const jsDay = date.getDay();
  const weekday = jsDay === 0 ? 6 : jsDay - 1;

  const recurring = rules.filter(r => {
    if (!r.isActive || r.isSingle) return false;
    const wds: number[] = Array.isArray(r.weekdays) ? r.weekdays
      : typeof r.weekdays === "string" && r.weekdays ? r.weekdays.split(",").map(Number) : [];
    return wds.includes(weekday);
  });

  const singles = rules.filter(r => r.isActive && r.isSingle && r.singleDate === dateStr);

  const slots: SlotDisplay[] = [];

  // 处理循环规则
  for (const r of recurring) {
    const st = r.startTime;
    // 检查这个时间点是否被单次规则覆盖
    const override = singles.find(s => (s.singleTime ?? s.startTime) === st);
    if (override) {
      // 循环被单次覆盖，显示单次的状态
      if (override.type === "blocked") {
        slots.push({
          id: override.id, startTime: st,
          endTime: timeEnd(st, override.durationMinutes),
          period: timePeriod(st), type: "blocked",
          isRecurring: true, overriddenByBlock: true,
          recurringId: r.id, ruleId: override.id,
        });
      } else {
        slots.push({
          id: override.id, startTime: st,
          endTime: timeEnd(st, override.durationMinutes),
          period: timePeriod(st), type: override.type,
          isRecurring: false, overriddenByBlock: false,
          ruleId: override.id,
        });
      }
    } else {
      slots.push({
        id: r.id, startTime: st,
        endTime: timeEnd(st, r.durationMinutes),
        period: timePeriod(st), type: r.type,
        isRecurring: true, overriddenByBlock: false,
        recurringId: r.id, ruleId: r.id,
      });
    }
  }

  // 处理单次规则（未被循环覆盖的）
  for (const s of singles) {
    const st = s.singleTime ?? s.startTime;
    const alreadyIn = slots.some(sl => sl.startTime === st);
    if (!alreadyIn) {
      slots.push({
        id: s.id, startTime: st,
        endTime: timeEnd(st, s.durationMinutes),
        period: timePeriod(st), type: s.type,
        isRecurring: false, overriddenByBlock: false,
        ruleId: s.id,
      });
    }
  }

  return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

// ── 月视图日历（下拉平铺式）────────────────────────────────────────────────
function MonthCalendar({ rules, onDayClick, expandedDate, onSlotEdit, onSlotDelete, onRecurringDelete, onAddClick }: {
  rules: Rule[];
  onDayClick: (dateStr: string) => void;
  expandedDate: string | null;
  onSlotEdit: (slot: SlotDisplay, dateStr: string) => void;
  onSlotDelete: (slot: SlotDisplay) => void;
  onRecurringDelete: (slot: SlotDisplay) => void;
  onAddClick: (dateStr: string) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const minYear = today.getFullYear();
  const minMonth = today.getMonth();
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);
  const maxYear = maxDate.getFullYear();
  const maxMonth = maxDate.getMonth();

  const canPrev = !(year === minYear && month === minMonth);
  const canNext = !(year === maxYear && month === maxMonth);

  const prevMonth = () => {
    if (!canPrev) return;
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (!canNext) return;
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const firstDayMon = firstDay === 0 ? 6 : firstDay - 1;
  const monthName = new Date(year, month, 1).toLocaleDateString("zh-CN", { year: "numeric", month: "long" });

  function getDayColor(day: number): string | null {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const slots = getDaySlots(rules, dateStr);
    if (slots.length === 0) return null;
    if (slots.some(s => s.type === "blocked")) return "#E8A0A0";
    if (slots.some(s => s.type === "fixed")) return "#F4C97A";
    return "#9CB48A";
  }

  return (
    <div className="pb-6">
      {/* 月份导航 */}
      <div className="flex items-center justify-between px-4 mb-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={prevMonth}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: canPrev ? "#EBE7DF" : "transparent", opacity: canPrev ? 1 : 0.3 }}>
          <ChevronRight size={18} className="rotate-180" style={{ color: "#6B5E52" }} />
        </motion.button>
        <span className="text-base font-bold" style={{ color: "#2C2420" }}>{monthName}</span>
        <motion.button whileTap={{ scale: 0.9 }} onClick={nextMonth}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: canNext ? "#EBE7DF" : "transparent", opacity: canNext ? 1 : 0.3 }}>
          <ChevronRight size={18} style={{ color: "#6B5E52" }} />
        </motion.button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 px-4 mb-2">
        {WEEKDAY_LABELS.map(d => (
          <div key={d} className="text-center text-[11px] font-semibold" style={{ color: "#9B8E82" }}>{d}</div>
        ))}
      </div>

      {/* 日期格 */}
      <div className="grid grid-cols-7 px-4 gap-y-1">
        {Array.from({ length: firstDayMon }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
          const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isExpanded = expandedDate === dateStr;
          const color = getDayColor(day);

          return (
            <div key={day} className="flex flex-col items-center gap-0.5">
              <button
                onClick={() => !isPast && onDayClick(dateStr)}
                disabled={isPast}
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all active:scale-95"
                style={{
                  background: isExpanded ? "#3A6228" : color ?? (isToday ? "#EBE7DF" : "transparent"),
                  color: isExpanded ? "white" : color ? "white" : isToday ? "#3A6228" : isPast ? "#C4BDB5" : "#2C2420",
                  fontWeight: isToday ? 700 : 500,
                  border: isToday && !color && !isExpanded ? "2px solid #9CB48A" : "none",
                }}>
                {day}
              </button>
              {color && !isExpanded && (
                <div className="w-1 h-1 rounded-full" style={{ background: color }} />
              )}
              {!color && <div className="h-1" />}
            </div>
          );
        })}
      </div>

      {/* 展开的时间段列表（在日历下方平铺） */}
      <AnimatePresence>
        {expandedDate && expandedDate.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`) && (() => {
          const slots = getDaySlots(rules, expandedDate);
          const dayNum = parseInt(expandedDate.split("-")[2]);
          const displayDate = new Date(expandedDate).toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });

          // 按上午/下午/晚上分组
          const groups: { label: string; slots: SlotDisplay[] }[] = [];
          const periods = ["上午", "下午", "晚上"];
          for (const p of periods) {
            const ps = slots.filter(s => s.period === p);
            if (ps.length > 0) groups.push({ label: p, slots: ps });
          }

          return (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mx-4 mt-3 rounded-2xl overflow-hidden"
              style={{ background: "#FDFBF7", border: "1px solid #EBE7DF", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>

              {/* 日期标题 */}
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #F0EDE8" }}>
                <span className="text-sm font-bold" style={{ color: "#2C2420" }}>{displayDate}</span>
                <button onClick={() => onAddClick(expandedDate)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: "#E4F0DC", color: "#3A6228" }}>
                  <Plus size={12} />新增时间段
                </button>
              </div>

              {/* 时间段列表 */}
              {slots.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm" style={{ color: "#C4BDB5" }}>该天暂无档期</p>
                  <p className="text-xs mt-1" style={{ color: "#D4CFC9" }}>点击右上角新增时间段</p>
                </div>
              ) : (
                <div className="px-4 py-3 space-y-4">
                  {groups.map(g => (
                    <div key={g.label}>
                      <p className="text-[11px] font-semibold mb-2" style={{ color: "#C4BDB5" }}>{g.label}</p>
                      <div className="space-y-2">
                        {g.slots.map((slot, i) => (
                          <button key={i}
                            onClick={() => onSlotEdit(slot, expandedDate)}
                            className="w-full flex items-center justify-between rounded-2xl px-3 py-3 text-left active:scale-[0.99] transition-all"
                            style={{
                              background: "#F5F1E8",
                              opacity: slot.overriddenByBlock ? 0.85 : 1,
                            }}>
                            <div className="flex items-center gap-2.5">
                              {/* 类型小胶囊 — 和档期规则一致 */}
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{
                                background: slot.type === "blocked" ? "#FEE2E2" : slot.type === "fixed" ? "#FEF3C7" : "#9CB48A",
                                color: slot.type === "blocked" ? "#EF4444" : slot.type === "fixed" ? "#D97706" : "white",
                              }}>
                                {slot.type === "available" ? "可预约" : slot.type === "blocked" ? "已屏蔽" : "固定"}
                              </span>
                              {/* 时间 */}
                              <span className="text-sm font-bold" style={{
                                textDecoration: slot.overriddenByBlock ? "line-through" : "none",
                                color: slot.type === "blocked" ? "#DC2626" : slot.type === "fixed" ? "#D97706" : "#2C2420",
                              }}>
                                {slot.startTime} — {slot.endTime}
                              </span>
                              {/* 循环图标 */}
                              {slot.isRecurring && (
                                <span className="text-[10px]" style={{ color: "#9B8E82" }}>↺</span>
                              )}
                            </div>
                            {/* 右侧箭头提示可点击 */}
                            <ChevronRight size={14} style={{ color: "#C4BDB5", flexShrink: 0 }} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* 图例 */}
      <div className="flex gap-5 mt-4 justify-center">
        {[
          { color: "#9CB48A", label: "可预约" },
          { color: "#F4C97A", label: "固定档期" },
          { color: "#E8A0A0", label: "屏蔽时段" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-xs" style={{ color: "#9B8E82" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 规则卡片 ──────────────────────────────────────────────────────────────────








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
  const dayStr = rule.isSingle
    ? (rule.singleDate ?? "")
    : (wdArr.map(d => `周${WEEKDAY_LABELS[d]}`).join("、") || "");
  const timeStr = rule.isSingle ? (rule.singleTime ?? rule.startTime) : rule.startTime;
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
        <p className="text-sm font-medium text-[#2C2420]">{dayStr} · {timeStr}（{rule.durationMinutes} 分钟）</p>
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
  const [showSingles, setShowSingles] = useState(false);

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

      {/* 循环规则 — 规则列表只显示循环规则，单次安排在日历中管理 */}
      {rules.filter(r => !r.isSingle).length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: "#9B8E82" }}>还没有设置循环规则</p>
          <p className="text-xs mt-1" style={{ color: "#C4BDB5" }}>单次安排请在「日历」标签中管理</p>
        </div>
      )}
      {rules.filter(r => !r.isSingle).map(r => <RuleBadge key={r.id} rule={r} onDelete={onDelete} />)}

      {/* 单次安排入口提示 — 不在此列出，引导去日历查看 */}
      {rules.filter(r => r.isSingle).length > 0 && (
        <div>
          <button onClick={() => setShowSingles(v => !v)}
            className="w-full flex items-center justify-between py-2.5 px-4 rounded-2xl"
            style={{ background: "#F5F1E8" }}>
            <span className="text-sm font-medium" style={{ color: "#2C2420" }}>
              单次安排（{rules.filter(r => r.isSingle).length} 条）
            </span>
            <ChevronRight size={16}
              style={{ color: "#9B8E82", transition: "transform 0.2s",
                transform: showSingles ? "rotate(90deg)" : "rotate(0deg)" }} />
          </button>
          <AnimatePresence>
            {showSingles && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2 space-y-2">
                {rules.filter(r => r.isSingle).map(r => <RuleBadge key={r.id} rule={r} onDelete={onDelete} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <>
            <motion.div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.3)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)} />
            <motion.div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-y-auto"
              style={{ background: "#FDFBF7", maxHeight: "85vh" }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              <div className="px-5 pt-5 pb-2 flex items-center justify-between sticky top-0" style={{ background: "#FDFBF7" }}>
                <p className="text-base font-bold" style={{ color: "#2C2420" }}>新增档期规则</p>
                <button onClick={() => setShowForm(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#EBE7DF" }}>
                  <ChevronRight size={16} className="rotate-90" style={{ color: "#6B5E52" }} />
                </button>
              </div>
              <div className="px-5 pb-10 space-y-4">
                <div>
                  <p className="text-xs mb-2" style={{ color: "#9B8E82" }}>规则类型</p>
                  <div className="flex gap-2">
                    {(["recurring","single"] as const).map(m => (
                      <button key={m} onClick={() => set("mode", m)}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                        style={{ background: form.mode === m ? "#9CB48A" : "#F5F0E8",
                          color: form.mode === m ? "white" : "#6B5E52",
                          border: form.mode === m ? "1px solid #9CB48A" : "1px solid #EBE7DF" }}>
                        {m === "recurring" ? "🔁 循环（每周）" : "📅 单次（指定日期）"}
                      </button>
                    ))}
                  </div>
                </div>
                {form.mode === "recurring" && (
                  <div>
                    <p className="text-xs mb-2" style={{ color: "#9B8E82" }}>每周哪几天（可多选）</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {WEEKDAY_LABELS.map((d, i) => (
                        <button key={i} onClick={() => toggleDay(i)}
                          className="w-9 h-9 rounded-full text-xs font-semibold"
                          style={{ background: form.weekdays.includes(i) ? "#9CB48A" : "#F5F0E8",
                            color: form.weekdays.includes(i) ? "white" : "#6B5E52",
                            border: form.weekdays.includes(i) ? "1px solid #9CB48A" : "1px solid #EBE7DF" }}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {form.mode === "single" && (
                  <div>
                    <p className="text-xs mb-2" style={{ color: "#9B8E82" }}>指定日期</p>
                    <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                      className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                      style={{ background: "#F5F0E8", border: "1px solid #EBE7DF", color: "#2C2420" }} />
                  </div>
                )}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="text-xs mb-2" style={{ color: "#9B8E82" }}>开始时间</p>
                    <select value={form.startTime} onChange={e => set("startTime", e.target.value)}
                      className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                      style={{ background: "#F5F0E8", border: "1px solid #EBE7DF", color: "#2C2420" }}>
                      {HOUR_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs mb-2" style={{ color: "#9B8E82" }}>时长</p>
                    <div className="flex gap-1.5">
                      {[50, 90].map(d => (
                        <button key={d} onClick={() => set("durationMinutes", d)}
                          className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                          style={{ background: form.durationMinutes === d ? "#9CB48A" : "#F5F0E8",
                            color: form.durationMinutes === d ? "white" : "#6B5E52",
                            border: form.durationMinutes === d ? "1px solid #9CB48A" : "1px solid #EBE7DF" }}>
                          {d}分
                        </button>
                      ))}
                      <button onClick={() => set("durationMinutes", "custom")}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                        style={{ background: form.durationMinutes === "custom" ? "#9CB48A" : "#F5F0E8",
                          color: form.durationMinutes === "custom" ? "white" : "#6B5E52",
                          border: form.durationMinutes === "custom" ? "1px solid #9CB48A" : "1px solid #EBE7DF" }}>
                        自定义
                      </button>
                    </div>
                    {form.durationMinutes === "custom" && (
                      <input type="number" value={form.customDuration}
                        onChange={e => set("customDuration", e.target.value)}
                        placeholder="输入分钟数" className="w-full mt-2 text-sm px-3 py-2 rounded-xl outline-none"
                        style={{ background: "#F5F0E8", border: "1px solid #EBE7DF", color: "#2C2420" }} />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs mb-2" style={{ color: "#9B8E82" }}>档期类型</p>
                  <div className="flex gap-2">
                    {([["available","可预约"],["fixed","固定档期"]] as const).map(([id, label]) => (
                      <button key={id} onClick={() => set("type", id as "available" | "fixed")}
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                        style={{ background: form.type === id ? (id === "fixed" ? "#F59E0B" : "#9CB48A") : "#F5F0E8",
                          color: form.type === id ? "white" : "#6B5E52",
                          border: form.type === id ? `1px solid ${id === "fixed" ? "#F59E0B" : "#9CB48A"}` : "1px solid #EBE7DF" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {form.mode === "recurring" && (
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <p className="text-xs mb-2" style={{ color: "#9B8E82" }}>开始生效</p>
                      <input type="date" value={form.validFrom} onChange={e => set("validFrom", e.target.value)}
                        className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                        style={{ background: "#F5F0E8", border: "1px solid #EBE7DF", color: "#2C2420" }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs mb-2" style={{ color: "#9B8E82" }}>截止（空=长期）</p>
                      <input type="date" value={form.validUntil} onChange={e => set("validUntil", e.target.value)}
                        className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                        style={{ background: "#F5F0E8", border: "1px solid #EBE7DF", color: "#2C2420" }} />
                    </div>
                  </div>
                )}
                {canSubmit && (
                  <div className="px-3 py-2.5 rounded-xl text-xs" style={{ background: "#E4F0DC", color: "#6B5E52" }}>
                    {form.mode === "recurring"
                      ? `每 ${form.weekdays.map(d => `周${WEEKDAY_LABELS[d]}`).join("、")} 的 ${form.startTime}，每次 ${actualDur} 分钟`
                      : `${form.date} ${form.startTime}，时长 ${actualDur} 分钟`}
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)}
                    className="flex-1 h-12 rounded-2xl text-sm font-medium"
                    style={{ background: "#EBE7DF", color: "#7D736A" }}>取消</button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={submit}
                    disabled={!canSubmit || saving}
                    className="flex-1 h-12 rounded-2xl text-sm font-semibold text-white"
                    style={{ background: canSubmit && !saving ? "#9CB48A" : "#C0B8B0" }}>
                    {saving ? "保存中…" : "保存规则"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
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
  // 时间格修改弹窗
  const [editingSlot, setEditingSlot] = useState<{ rule: Rule; dateStr: string } | null>(null);
  const [editType, setEditType] = useState<"available" | "blocked" | "fixed">("available");
  const [dayType, setDayType] = useState<"available" | "blocked" | "fixed">("available");
  const [dayStartTime, setDayStartTime] = useState("09:00");
  const [dayDuration, setDayDuration] = useState(50);
  const [dayFixedClientId, setDayFixedClientId] = useState("");
  const [addingDay, setAddingDay] = useState(false);
  // 下拉平铺状态
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [editingSlotDisplay, setEditingSlotDisplay] = useState<{ slot: SlotDisplay; dateStr: string } | null>(null);
  const [addingDateModal, setAddingDateModal] = useState<string | null>(null);

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
    await request("/api/counselor/schedule", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
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
            ? <MonthCalendar rules={rules}
                expandedDate={expandedDate}
                onDayClick={(d) => setExpandedDate(expandedDate === d ? null : d)}
                onSlotEdit={(slot, dateStr) => setEditingSlotDisplay({ slot, dateStr })}
                onSlotDelete={async (slot) => {
                  if (!confirm("确认删除该时间段？")) return;
                  await request("/api/counselor/schedule", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: slot.ruleId }),
                  });
                  await loadRules();
                }}
                onRecurringDelete={async (slot) => {
                  if (!confirm("确认删除整条循环规则？")) return;
                  await request("/api/counselor/schedule", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: slot.recurringId }),
                  });
                  await loadRules();
                }}
                onAddClick={(d) => { setAddingDateModal(d); setDayType("available"); setDayStartTime("09:00"); setDayDuration(50); }}
              />
            : tab === "stats"
            ? <StatsPanel />
            : <ClientsPanel />}
        </motion.div>
      </AnimatePresence>

      {/* 新增时间段弹窗 */}
      <AnimatePresence>
        {addingDateModal && (
          <>
            <motion.div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.3)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAddingDateModal(null)} />
            <motion.div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-y-auto"
              style={{ background: "#FDFBF7", maxHeight: "75vh" }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              <div className="px-5 pt-5 pb-2 flex items-center justify-between sticky top-0" style={{ background: "#FDFBF7" }}>
                <div>
                  <p className="text-base font-bold" style={{ color: "#2C2420" }}>新增时间段</p>
                  <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{addingDateModal}</p>
                </div>
                <button onClick={() => setAddingDateModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#EBE7DF" }}>
                  <ChevronRight size={16} className="rotate-90" style={{ color: "#6B5E52" }} />
                </button>
              </div>
              <div className="px-5 pb-8 space-y-4 mt-2">
                {/* 类型 */}
                <div className="flex gap-2">
                  {(["available", "fixed"] as const).map(t => (
                    <button key={t} onClick={() => setDayType(t)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                      style={{ background: dayType === t ? (t === "fixed" ? "#F59E0B" : "#9CB48A") : "#EBE7DF", color: dayType === t ? "white" : "#7D736A" }}>
                      {t === "available" ? "可预约" : "固定档期"}
                    </button>
                  ))}
                </div>
                {/* 时间 + 时长 */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <p className="text-xs mb-1.5" style={{ color: "#9B8E82" }}>开始时间</p>
                    <select value={dayStartTime} onChange={e => setDayStartTime(e.target.value)}
                      className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                      style={{ background: "#F5F1E8", border: "1px solid #EBE7DF", color: "#2C2420" }}>
                      {HOUR_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs mb-1.5" style={{ color: "#9B8E82" }}>时长</p>
                    <select value={dayDuration} onChange={e => setDayDuration(Number(e.target.value))}
                      className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                      style={{ background: "#F5F1E8", border: "1px solid #EBE7DF", color: "#2C2420" }}>
                      {[25, 50, 60, 90, 120].map(d => <option key={d} value={d}>{d}分钟</option>)}
                    </select>
                  </div>
                </div>
                {dayType === "fixed" && (
                  <div>
                    <p className="text-xs mb-1.5" style={{ color: "#9B8E82" }}>指定来访者 ID（选填）</p>
                    <input value={dayFixedClientId} onChange={e => setDayFixedClientId(e.target.value)}
                      placeholder="来访者用户 ID"
                      className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                      style={{ background: "#F5F1E8", border: "1px solid #EBE7DF", color: "#2C2420" }} />
                  </div>
                )}
                <button disabled={addingDay} onClick={async () => {
                  setAddingDay(true);
                  try {
                    await request("/api/counselor/schedule", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        type: dayType, isSingle: true,
                        singleDate: addingDateModal, singleTime: dayStartTime,
                        durationMinutes: dayDuration,
                        fixedClientId: dayType === "fixed" ? dayFixedClientId : undefined,
                      }),
                    });
                    await loadRules();
                    setDayFixedClientId("");
                    setAddingDateModal(null);
                  } finally { setAddingDay(false); }
                }} className="w-full py-3 rounded-2xl text-sm font-semibold text-white"
                  style={{ background: addingDay ? "#C0B8B0" : "#9CB48A" }}>
                  {addingDay ? "保存中…" : "保存"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 修改时间段弹窗 */}
      <AnimatePresence>
        {editingSlotDisplay && (
          <>
            <motion.div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.3)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingSlotDisplay(null)} />
            <motion.div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
              style={{ background: "#FDFBF7" }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              <div className="px-5 pt-5 pb-2 flex items-center justify-between">
                <div>
                  <p className="text-base font-bold" style={{ color: "#2C2420" }}>
                    {editingSlotDisplay.slot.startTime} — {editingSlotDisplay.slot.endTime}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>
                    {editingSlotDisplay.dateStr} · {editingSlotDisplay.slot.isRecurring ? "循环规则" : "单次"}
                    {editingSlotDisplay.slot.overriddenByBlock && " · 循环已被屏蔽"}
                  </p>
                </div>
                <button onClick={() => setEditingSlotDisplay(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#EBE7DF" }}>
                  <ChevronRight size={16} className="rotate-90" style={{ color: "#6B5E52" }} />
                </button>
              </div>
              <div className="px-5 pt-3 pb-8 space-y-2">

                {/* ① 已屏蔽（循环被单次覆盖）→ 恢复 + 删除循环 */}
                {editingSlotDisplay.slot.overriddenByBlock && (
                  <>
                    <button onClick={async () => {
                      // 删掉覆盖它的单次屏蔽记录
                      const block = rules.find(r =>
                        r.isSingle && r.type === "blocked" &&
                        r.singleDate === editingSlotDisplay.dateStr &&
                        (r.singleTime === editingSlotDisplay.slot.startTime || r.singleTime === editingSlotDisplay.slot.singleTime)
                      );
                      if (block) {
                        await request("/api/counselor/schedule", {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: block.id }),
                        });
                      }
                      await loadRules();
                      setEditingSlotDisplay(null);
                    }} className="w-full py-3 rounded-2xl text-sm font-semibold"
                      style={{ background: "#E4F0DC", color: "#3A6228" }}>
                      恢复这次可预约
                    </button>
                    <button onClick={async () => {
                      if (!confirm("确认删除整条循环规则？删除后该规则所有时间都不再开放。")) return;
                      await request("/api/counselor/schedule", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: editingSlotDisplay.slot.recurringId }),
                      });
                      await loadRules();
                      setEditingSlotDisplay(null);
                    }} className="w-full py-3 rounded-2xl text-sm font-semibold"
                      style={{ background: "#FEE2E2", color: "#EF4444" }}>
                      删除循环规则
                    </button>
                  </>
                )}

                {/* ② 循环可预约（未被屏蔽）→ 取消这次 + 删除循环规则 */}
                {editingSlotDisplay.slot.isRecurring && !editingSlotDisplay.slot.overriddenByBlock && (
                  <>
                    <button onClick={async () => {
                      // 新增一条单次屏蔽记录覆盖这次
                      await request("/api/counselor/schedule", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          type: "blocked",
                          isSingle: true,
                          singleDate: editingSlotDisplay.dateStr,
                          singleTime: editingSlotDisplay.slot.startTime,
                          durationMinutes: editingSlotDisplay.slot.durationMinutes ?? 50,
                        }),
                      });
                      await loadRules();
                      setEditingSlotDisplay(null);
                    }} className="w-full py-3 rounded-2xl text-sm font-semibold"
                      style={{ background: "#FEE2E2", color: "#EF4444" }}>
                      取消这次
                    </button>
                    <button onClick={async () => {
                      if (!confirm("确认删除整条循环规则？删除后该规则所有时间都不再开放。")) return;
                      await request("/api/counselor/schedule", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: editingSlotDisplay.slot.recurringId }),
                      });
                      await loadRules();
                      setEditingSlotDisplay(null);
                    }} className="w-full py-3 rounded-2xl text-sm font-semibold"
                      style={{ background: "#F5F1E8", color: "#9B8E82" }}>
                      删除循环规则
                    </button>
                  </>
                )}

                {/* ③ 单次可预约 → 只有删除 */}
                {!editingSlotDisplay.slot.isRecurring && !editingSlotDisplay.slot.overriddenByBlock && (
                  <button onClick={async () => {
                    if (!confirm("确认删除该时间段？")) return;
                    await request("/api/counselor/schedule", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: editingSlotDisplay.slot.id }),
                    });
                    await loadRules();
                    setEditingSlotDisplay(null);
                  }} className="w-full py-3 rounded-2xl text-sm font-semibold"
                    style={{ background: "#FEE2E2", color: "#EF4444" }}>
                    删除该时间段
                  </button>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
                    });
                    await loadRules();
                    setEditingSlotDisplay(null);
                  }} className="w-full py-3 rounded-2xl text-sm font-semibold"
                    style={{ background: "#FEE2E2", color: "#EF4444" }}>
                    删除该时间段
                  </button>
                )}
                {/* 循环规则：屏蔽这一天 / 删除循环规则 */}
                {editingSlotDisplay.slot.isRecurring && !editingSlotDisplay.slot.overriddenByBlock && (
                  <>
                    <button onClick={async () => {
                      if (!confirm(`确认屏蔽 ${editingSlotDisplay.dateStr} 这一天的该时间段？`)) return;
                      await request("/api/counselor/schedule", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          type: "blocked", isSingle: true,
                          singleDate: editingSlotDisplay.dateStr,
                          singleTime: editingSlotDisplay.slot.startTime,
                          durationMinutes: editingSlotDisplay.slot.endTime
                            ? (parseInt(editingSlotDisplay.slot.endTime) - parseInt(editingSlotDisplay.slot.startTime)) * 60
                            : 50,
                        }),
                      });
                      await loadRules();
                      setEditingSlotDisplay(null);
                    }} className="w-full py-3 rounded-2xl text-sm font-semibold"
                      style={{ background: "#FEF3C7", color: "#D97706" }}>
                      仅屏蔽这一天
                    </button>
                    <button onClick={async () => {
                      if (!confirm("确认删除整条循环规则？所有关联日期都会失效。")) return;
                      await request("/api/counselor/schedule", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: editingSlotDisplay.slot.recurringId }),
                      });
                      await loadRules();
                      setEditingSlotDisplay(null);
                    }} className="w-full py-3 rounded-2xl text-sm font-semibold"
                      style={{ background: "#FEE2E2", color: "#EF4444" }}>
                      删除循环规则
                    </button>
                  </>
                )}
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
    { icon: "CalendarDays", label: "本月接单", value: stats?.monthBookings ?? "—", unit: "个", desc: "本月新增预约订单", href: "/counselor/bookings" },
    { icon: "Clock", label: "本月完成咨询", value: stats?.monthHours ?? "—", unit: "小时", desc: "本月已完成咨询时长", href: "/counselor/bookings" },
    { icon: "Users", label: "接待来访", value: stats?.totalClients ?? "—", unit: "个", desc: "累计接待来访人数", href: "/counselor/schedule?tab=clients" },
    { icon: "TrendingUp", label: "累计完成时长", value: stats?.totalHours ?? "—", unit: "小时", desc: "累计完成咨询时长", href: "/counselor/bookings" },
  ];
  return (
    <div className="px-5 py-4">
      <div className="grid grid-cols-2 gap-3">
        {STATS.map(s => (
          <button key={s.label} onClick={() => router.push(s.href)}
            className="rounded-2xl p-4 text-left"
            style={{ background: "#FDFBF7", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", border: "1px solid #EBE7DF" }}>
            <div className="flex items-center gap-2 mb-2">
              {s.icon === "CalendarDays" && <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>}
              {s.icon === "Clock" && <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>}
              {s.icon === "Users" && <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3"/><path d="M20 20c0-2.21-1.79-4-4-4"/><circle cx="9" cy="8" r="3"/><path d="M3 20c0-2.76 2.24-5 6-5h0c3.76 0 6 2.24 6 5"/></svg>}
              {s.icon === "TrendingUp" && <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/><polyline points="16,7 22,7 22,13"/></svg>}
              <p className="text-xs" style={{ color: "#9B8E82" }}>{s.label}</p>
            </div>
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
          style={{ background: "#FDFBF7", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
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
