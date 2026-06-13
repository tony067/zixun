"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Users, CalendarCheck, Clock } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";

type Stats = {
  totalBookings: number;
  completedSessions: number;
  confirmedSessions: number;
  pendingCount: number;
  uniqueClients: number;
};

export default function CounselorStatsPage() {
  const { user: user } = useEazo();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    request("/api/counselor/stats").then(r => r.json()).then(setStats).finally(() => setLoading(false));
  }, [user]);

  const cards = stats ? [
    { icon: CalendarCheck, label: "总预约", value: stats.totalBookings, color: "text-[var(--color-mp-primary)]" },
    { icon: BarChart3, label: "已完成", value: stats.completedSessions, color: "text-[var(--color-mp-success)]" },
    { icon: Clock, label: "待确认", value: stats.pendingCount, color: "text-[var(--color-mp-warning)]" },
    { icon: Users, label: "来访人数", value: stats.uniqueClients, color: "text-purple-500" },
  ] : [];

  return (
    <div className="min-h-svh bg-[var(--color-mp-surface)] pb-24">
      <div className="sticky top-0 z-10 bg-[var(--color-mp-surface)] px-5 pt-12 pb-4 border-b border-[var(--color-mp-border)]">
        <h1 className="text-xl font-semibold text-[var(--color-mp-text)]">数据统计</h1>
      </div>
      <div className="px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {cards.map(({ icon: Icon, label, value, color }) => (
              <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--color-mp-card)] border border-[var(--color-mp-border)] rounded-2xl p-4">
                <Icon className={`w-6 h-6 ${color} mb-2`} />
                <p className="text-2xl font-bold text-[var(--color-mp-text)]">{value}</p>
                <p className="text-xs text-[var(--color-mp-muted)] mt-0.5">{label}</p>
              </motion.div>
            ))}
          </div>
        )}
        {!loading && stats && (
          <div className="mt-4 bg-[var(--color-mp-card)] border border-[var(--color-mp-border)] rounded-2xl p-4">
            <p className="text-sm font-medium text-[var(--color-mp-text)] mb-1">已确认咨询</p>
            <p className="text-3xl font-bold text-[var(--color-mp-primary)]">{stats.confirmedSessions}</p>
          </div>
        )}
      </div>
    </div>
  );
}
