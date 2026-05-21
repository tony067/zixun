"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Users, CalendarDays, AlertCircle } from "lucide-react";
import { request } from "@/lib/api/request";

type Booking = { id: string; status: string; scheduledAt: string; counselor: { displayName: string } | null; client: { name: string | null; email: string | null } | null };

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_confirmation: { label: "待确认", color: "text-[var(--color-mp-warning)]" },
  confirmed: { label: "已确认", color: "text-[var(--color-mp-success)]" },
  completed: { label: "已完成", color: "text-[var(--color-mp-muted)]" },
  cancelled: { label: "已取消", color: "text-[var(--color-mp-error)]" },
  paid: { label: "已支付", color: "text-blue-500" },
};

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request("/api/admin/bookings").then(r => r.json()).then(d => {
      setBookings(Array.isArray(d) ? d : []);
    }).finally(() => setLoading(false));
  }, []);

  const total = bookings.length;
  const pending = bookings.filter(b => b.status === "pending_confirmation").length;
  const confirmed = bookings.filter(b => ["confirmed","paid"].includes(b.status)).length;

  return (
    <div className="min-h-svh bg-[var(--color-mp-surface)] pb-24">
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-[var(--color-mp-primary)]" />
        <h1 className="text-xl font-semibold text-[var(--color-mp-text)]">管理控制台</h1>
      </div>

      {/* Stats */}
      <div className="px-4 grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "全部预约", value: total, color: "text-[var(--color-mp-text)]" },
          { label: "待确认", value: pending, color: "text-[var(--color-mp-warning)]" },
          { label: "进行中", value: confirmed, color: "text-[var(--color-mp-success)]" },
        ].map(item => (
          <div key={item.label} className="bg-[var(--color-mp-card)] rounded-2xl p-3 border border-[var(--color-mp-border)] text-center">
            <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-[10px] text-[var(--color-mp-muted)] mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Bookings list */}
      <div className="px-4 space-y-2">
        <p className="text-xs font-semibold text-[var(--color-mp-muted)] uppercase tracking-wider mb-2">全部预约记录</p>
        {loading ? [1,2,3,4].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />) :
          bookings.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle className="w-10 h-10 text-[var(--color-mp-faint)] mx-auto mb-3" />
              <p className="text-sm text-[var(--color-mp-muted)]">暂无预约记录</p>
            </div>
          ) : bookings.map(b => {
            const s = STATUS_MAP[b.status] ?? { label: b.status, color: "text-[var(--color-mp-faint)]" };
            return (
              <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-[var(--color-mp-card)] rounded-2xl p-4 border border-[var(--color-mp-border)]">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-medium text-[var(--color-mp-text)]">
                    {b.client?.name ?? b.client?.email ?? "来访者"}
                    <span className="text-[var(--color-mp-muted)]"> → </span>
                    {b.counselor?.displayName ?? "咨询师"}
                  </p>
                  <span className={`text-xs font-medium ${s.color}`}>{s.label}</span>
                </div>
                <p className="text-xs text-[var(--color-mp-muted)]">
                  {new Date(b.scheduledAt).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </motion.div>
            );
          })
        }
      </div>
    </div>
  );
}
