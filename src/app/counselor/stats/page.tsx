"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart2, Users, CalendarCheck, Clock } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";

type Stats = { totalBookings: number; completedSessions: number; confirmedSessions: number; pendingCount: number; uniqueClients: number };

export default function CounselorStatsPage() {
  const user = useEazo((s) => s.auth.user);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!user) return;
    request("/api/counselor/stats").then(r => r.json()).then(setStats);
  }, [user]);

  const cards = [
    { icon: CalendarCheck, label: "待确认预约", value: stats?.pendingCount ?? 0, color: "text-amber-500" },
    { icon: BarChart2, label: "已完成咨询", value: stats?.completedSessions ?? 0, color: "text-[var(--color-mp-primary)]" },
    { icon: Users, label: "接待来访", value: stats?.uniqueClients ?? 0, color: "text-blue-500" },
    { icon: Clock, label: "确认中预约", value: stats?.confirmedSessions ?? 0, color: "text-purple-500" },
  ];

  return (
    <div className="min-h-svh bg-[var(--color-mp-surface)] pb-24">
      <div className="sticky top-0 z-10 bg-[var(--color-mp-surface)] px-5 pt-12 pb-4 border-b border-[var(--color-mp-border)]">
        <h1 className="text-xl font-semibold text-[var(--color-mp-text)]">数据统计</h1>
      </div>
      <div className="px-4 py-5">
        <div className="grid grid-cols-2 gap-3">
          {cards.map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-[var(--color-mp-card)] rounded-3xl p-5 border border-[var(--color-mp-border)]">
              <c.icon className={`w-6 h-6 ${c.color} mb-3`} />
              <p className="text-2xl font-bold text-[var(--color-mp-text)]">{stats ? c.value : "—"}</p>
              <p className="text-xs text-[var(--color-mp-faint)] mt-1">{c.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
