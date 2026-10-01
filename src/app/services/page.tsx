"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { request } from "@/lib/api/request";

type CounselorInfo = {
  id: string; userId: string; displayName: string; title: string | null;
  avatarUrl: string | null; bio: string | null; counselorTypes: string[] | null;
  specialties: string[] | null; customSpecialties: string[] | null;
};
type ServiceItem = {
  id: string; name: string; tagline: string | null; price: number;
  counselorName: string; counselorTypes: string[] | null; counselor: CounselorInfo | null;
};

export default function ServicesScreen() {
  const router = useRouter();
  const [list, setList] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request("/api/services").then(r => r.json())
      .then(d => setList(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 按老师分组
  const groups: { counselor: CounselorInfo | null; items: ServiceItem[] }[] = [];
  for (const s of list) {
    const key = s.counselor?.id ?? "unknown";
    let g = groups.find(x => x.counselor?.id === key);
    if (!g) { g = { counselor: s.counselor, items: [] }; groups.push(g); }
    g.items.push(s);
  }

  const avatarOf = (c: CounselorInfo | null, size = "w-12 h-12") => c?.avatarUrl
    ? <img src={c.avatarUrl} alt={c.displayName} className={`${size} rounded-full object-cover flex-none`} />
    : <div className={`${size} rounded-full flex-none flex items-center justify-center text-base font-bold text-white`}
        style={{ background: "var(--color-primary)" }}>{(c?.displayName ?? "师").charAt(0)}</div>;

  return (
    <div className="min-h-svh pb-28" style={{ background: "var(--color-surface)" }}>
      {/* 顶部标题 + 我的评估订单入口 */}
      <div className="px-5 pt-14 pb-3 flex items-start justify-between" style={{ background: "var(--color-surface)" }}>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>个性服务</h1>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>评估测评等特色服务，由专业老师为你完成</p>
        </div>
        <button onClick={() => { if (!localStorage.getItem("mindpace_token")) { router.push("/login"); return; } router.push("/my-services"); }}
          className="flex items-center gap-0.5 text-xs font-semibold px-3 py-1.5 rounded-full mt-0.5 shrink-0"
          style={{ background: "#F0F7EC", color: "#3A6228" }}>
          我的订单<ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 按老师分组的服务列表（一个老师一张完整卡片：老师头部 + 卡内服务列表） */}
      <div className="px-5 pb-6 space-y-4">
        {loading && <p className="text-sm text-center pt-10" style={{ color: "var(--color-text-muted)" }}>加载中…</p>}
        {!loading && list.length === 0 && (
          <div className="text-center pt-16">
            <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>暂无上架服务</p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>服务上架后将在这里展示</p>
          </div>
        )}
        {groups.map(({ counselor, items }, gi) => (
          <motion.div key={counselor?.id ?? gi} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.05 }}
            className="rounded-2xl overflow-hidden" style={{ background: "var(--color-card)", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            {/* 老师头部（纯展示，不跳转；完整档案入口在服务详情/订单页） */}
            <div className="flex items-start gap-3 px-4 pt-4 pb-3">
              {avatarOf(counselor)}
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {counselor?.displayName ?? "老师"}
                  {counselor?.title ? <span className="text-xs font-medium ml-2" style={{ color: "var(--color-text-muted)" }}>{counselor.title}</span> : null}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>
                  {[
                    ...(counselor?.counselorTypes ?? []),
                    ...(counselor?.specialties ?? []).slice(0, 2),
                    ...(counselor?.customSpecialties ?? []).slice(0, 1),
                  ].join(" · ") || "个性服务老师"}
                </p>
                {counselor?.bio && (
                  <p className="text-xs mt-1.5 leading-relaxed line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>{counselor.bio}</p>
                )}
              </div>
            </div>
            {/* 卡内服务列表 */}
            <div className="px-4 pb-4">
              {items.map((s, i) => (
                <motion.button key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: gi * 0.05 + i * 0.04 }}
                  onClick={() => router.push(`/services/${s.id}`)}
                  className="w-full text-left rounded-xl p-3.5 cursor-pointer"
                  style={{
                    background: "var(--color-surface)",
                    marginTop: i > 0 ? 10 : 6,
                  }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{s.name}</p>
                      {s.tagline && <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>{s.tagline}</p>}
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-1.5">
                      <p className="text-base font-black" style={{ color: "var(--color-primary)" }}>¥{s.price}</p>
                      <ChevronRight className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
