"use client";
import { useState, useEffect } from "react";
import { CalendarDays, AlignLeft } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";
import { WeekCalendar, type CalSlot } from "@/components/schedule/week-calendar";
import { RulesPanel } from "@/components/schedule/rules-panel";

export function CounselorScheduleScreen() {
  const user = useEazo((s) => s.auth.user);
  const [tab, setTab] = useState<"calendar"|"rules">("calendar");
  const [rules, setRules] = useState<CalSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadRules = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await request("/api/counselor/schedule");
      if (res.ok) {
        const data = await res.json();
        setRules(Array.isArray(data) ? data : []);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { loadRules(); }, [user]);

  const handleAdd = async (form: Record<string, unknown>) => {
    setSaving(true);
    try {
      await request("/api/counselor/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await loadRules();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await request(`/api/counselor/schedule/${id}`, { method: "DELETE" });
    await loadRules();
  };

  const TABS = [
    { id: "calendar", label: "日历预览", icon: <CalendarDays className="w-4 h-4" /> },
    { id: "rules",    label: "档期规则", icon: <AlignLeft className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="flex flex-col min-h-svh" style={{ background: "var(--color-mp-surface)" }}>
      {/* Header */}
      <div className="px-5 pt-12 md:pt-6 pb-3 border-b" style={{ borderColor: "var(--color-mp-border)", background: "var(--color-mp-card)" }}>
        <h1 className="text-xl font-semibold mb-3" style={{ color: "var(--color-mp-text)" }}>档期管理</h1>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--color-mp-border)" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === t.id ? "var(--color-mp-card)" : "transparent",
                color: tab === t.id ? "var(--color-mp-text)" : "var(--color-mp-muted)",
                boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: "var(--color-mp-faint)" }}>加载中…</p>
        </div>
      ) : tab === "calendar" ? (
        <WeekCalendar slots={rules} />
      ) : (
        <RulesPanel
          rules={rules.map(r => ({ ...r, isActive: true }))}
          onAdd={handleAdd as any}
          onDelete={handleDelete}
          saving={saving}
        />
      )}
    </div>
  );
}
