"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { request } from "@/lib/api/request";

type Order = {
  id: string; serviceName: string | null; price: number; status: string;
  counselorName?: string; createdAt: string; reportAt?: string | null;
};

// 订单状态文案/配色（与项目色板一致）
const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending_payment: { label: "待支付",  color: "#C66B2E", bg: "#FAE9DD" },
  paid:            { label: "待填写问卷", color: "#3A6228", bg: "#E4F0DC" },
  submitted:       { label: "已提交 · 等待报告", color: "#3A9B8E", bg: "#E4F2F0" },
  completed:       { label: "已完成 · 可看报告", color: "white", bg: "#9CB48A" },
  refunded:        { label: "已退款",  color: "#B07D2A", bg: "#FEF9EE" },
  cancelled:       { label: "已取消",  color: "#9B8E82", bg: "#EBE7DF" },
};

export default function MyServicesScreen() {
  const router = useRouter();
  const [list, setList] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request("/api/service-orders").then(r => r.json())
      .then(d => setList(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-svh pb-28" style={{ background: "var(--color-surface)" }}>
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => router.push("/services")}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-[#DDD8D0]">
          <ArrowLeft className="w-4 h-4 text-[#6B5E52]" />
        </button>
        <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>我的评估订单</h1>
      </div>

      <div className="px-5 space-y-3">
        {loading && <p className="text-sm text-center pt-10" style={{ color: "var(--color-text-muted)" }}>加载中…</p>}
        {!loading && list.length === 0 && (
          <div className="text-center pt-16">
            <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>还没有评估订单</p>
            <button onClick={() => router.push("/services")}
              className="mt-4 px-5 py-2.5 rounded-2xl text-white text-sm font-bold" style={{ background: "var(--color-primary)" }}>
              去看看个性服务
            </button>
          </div>
        )}
        {list.map((o, i) => {
          const st = STATUS[o.status] ?? STATUS.cancelled;
          return (
            <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => router.push(`/my-services/${o.id}`)}
              className="rounded-2xl p-4 cursor-pointer" style={{ background: "var(--color-card)", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>{o.serviceName ?? "评估服务"}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                    下单于 {new Date(o.createdAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                    {o.reportAt ? ` · 报告完成于 ${new Date(o.reportAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}` : ""}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ color: st.color, background: st.bg }}>{st.label}</span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm font-black" style={{ color: "var(--color-primary)" }}>¥{o.price}</p>
                {o.status === "paid" && <span className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>去填写问卷 →</span>}
                {o.status === "completed" && <span className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>查看报告 →</span>}
                {o.status === "pending_payment" && <span className="text-xs font-bold" style={{ color: "#C66B2E" }}>去支付 →</span>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
