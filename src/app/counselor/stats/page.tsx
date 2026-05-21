"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart2, Users, CheckCircle, Clock } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";

type Stats = { totalBookings: number; confirmed: number; completed: number; uniqueClients: number };

export default function CounselorStatsPage() {
  const user = useEazo((s) => s.auth.user);
  const [stats, setStats] = useState<Stats>({ totalBookings: 0, confirmed: 0, completed: 0, uniqueClients: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    request("/api/counselor/bookings").then(r => r.json()).then((d: any[]) => {
      if (!Array.isArray(d)) return;
      const clientIds = new Set(d.map(b => b.client?.id).filter(Boolean));
      setStats({
        totalBookings: d.length,
        confirmed: d.filter(b => b.status === "confirmed" || b.status === "paid").length,
        completed: d.filter(b => b.status === "completed").length,
        uniqueClients: clientIds.size,
      });
    }).finally(() => setLoading(false));
  }, [user]);

  const cards = [
    { icon: BarChart2, label: "总预约数", value: stats.totalBookings, color: "text-blue-500", bg: "bg-blue-50" },
    { icon: CheckCircle, label: "已确认", value: stats.confirmed, color: "text-[var(--color-mp-success)]", bg: "bg-green-50" },
    { icon: Clock, label: "已完成", value: stats.completed, color: "text-[var(--color-mp-muted)]", bg: "bg-gray-50" },
    { icon: Users, label: "来访人数", value: stats.uniqueClients, color: "text-purple-500", bg: "bg-purple-50" },
  ];

  return (
    <div className="min-h-svh bg-[var(--color-mp-surface)] pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-semibold text-[var(--color-mp-text)]">数据统计</h1>
        <p className="text-xs text-[var(--color-mp-muted)] mt-1">基于全部预约记录</p>
      </div>
      <div className="px-4 grid grid-cols-2 gap-3">
        {cards.map(({ icon: Icon, label, value, color, bg }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--color-mp-card)] rounded-3xl p-5 border border-[var(--color-mp-border)]">
            <div className={`w-10 h-10 rounded-2xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-[var(--color-mp-text)]">{loading ? "—" : value}</p>
            <p className="text-xs text-[var(--color-mp-muted)] mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
