"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, CalendarCheck, ShieldCheck } from "lucide-react";
import { request } from "@/lib/api/request";

type Booking = {
  id: string;
  status: string;
  scheduledAt: string;
  priceAmount: number | null;
  counselor: { id: string; displayName: string } | null;
  client: { id: string; name: string | null; email: string | null } | null;
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_confirmation: { label: "待确认", color: "text-amber-600 bg-amber-50" },
  confirmed:           { label: "已确认", color: "text-green-700 bg-green-50" },
  completed:           { label: "已完成", color: "text-[var(--color-mp-muted)] bg-[var(--color-mp-border)]" },
  cancelled:           { label: "已取消", color: "text-red-600 bg-red-50" },
  rejected:            { label: "已拒绝", color: "text-red-500 bg-red-50" },
  pending_payment:     { label: "待支付", color: "text-blue-600 bg-blue-50" },
  paid:                { label: "已支付", color: "text-blue-700 bg-blue-50" },
};

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/bookings").then(r => r.json()).then(d => {
      setBookings(Array.isArray(d) ? d : []);
    }).finally(() => setLoading(false));
  }, []);

  const total = bookings.length;
  const pending = bookings.filter(b => b.status === "pending_confirmation").length;
  const completed = bookings.filter(b => b.status === "completed").length;

  return (
    <div className="min-h-svh bg-[var(--color-mp-surface)] pb-24">
      <div className="sticky top-0 z-10 bg-[var(--color-mp-surface)] px-5 pt-12 pb-4 border-b border-[var(--color-mp-border)]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[var(--color-mp-primary)]" />
          <h1 className="text-xl font-semibold text-[var(--color-mp-text)]">管理后台</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-5 grid grid-cols-3 gap-3">
        {[
          { label: "总预约", value: total, icon: CalendarCheck, color: "text-[var(--color-mp-primary)]" },
          { label: "待确认", value: pending, icon: Users, color: "text-amber-500" },
          { label: "已完成", value: completed, icon: ShieldCheck, color: "text-green-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--color-mp-card)] border border-[var(--color-mp-border)] rounded-2xl p-3 text-center">
            <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
            <p className="text-xl font-bold text-[var(--color-mp-text)]">{value}</p>
            <p className="text-[10px] text-[var(--color-mp-faint)]">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Booking list */}
      <div className="px-4 space-y-2">
        <p className="text-xs font-medium text-[var(--color-mp-faint)] uppercase tracking-wider mb-2">所有预约</p>
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)
        ) : bookings.map(b => {
          const s = STATUS_MAP[b.status] ?? { label: b.status, color: "text-gray-600 bg-gray-100" };
          return (
            <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--color-mp-card)] border border-[var(--color-mp-border)] rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-mp-text)] truncate">
                    {b.client?.name ?? b.client?.email ?? "来访者"} → {b.counselor?.displayName ?? "咨询师"}
                  </p>
                  <p className="text-xs text-[var(--color-mp-muted)] mt-0.5">
                    {new Date(b.scheduledAt).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {b.priceAmount ? `  ·  ¥${b.priceAmount}` : ""}
                  </p>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${s.color}`}>{s.label}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
