"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Star, Clock, X, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEazo } from "@eazo/sdk/react";
import { auth } from "@eazo/sdk";

type Counselor = {
  id: string; displayName: string; title: string; bio: string;
  specialties: string[]; approaches: string[]; counselorTypes: string[];
  sessionModes: string[]; sessionDuration: number; pricePerSession: number;
  isAccepting: boolean; isSupervisor: boolean; totalHours: number;
  rating: number; location: string; avatarUrl: string | null;
};

const SPEC_TAGS = ["ADHD","ASD","焦虑","情绪调节","感官敏感","创伤","读写障碍","执行功能","睡眠","儿童","青少年","职场","女性成长"];
const MODE_TAGS = ["视频","语音","面谈"];

const CARD_COLORS = [
  { from: "#EEF4EA", to: "#F7FAF4", av: "#C8DBC0", tx: "#2D5024" },
  { from: "#F2EDE2", to: "#F9F7F2", av: "#D9CEB5", tx: "#5C4A20" },
  { from: "#E8F0F9", to: "#F2F6FC", av: "#B8CDE8", tx: "#1E3D6B" },
  { from: "#F5EAF0", to: "#FAF5F8", av: "#E0B8D0", tx: "#6B2050" },
  { from: "#EAF3F0", to: "#F4FAF8", av: "#B8D8D0", tx: "#1A5048" },
];

function getRoleTags(c: Counselor) {
  const tags = [...(c.counselorTypes ?? [])];
  if (c.isSupervisor && !tags.includes("督导")) tags.push("督导");
  if (tags.length === 0 && c.title) {
    if (c.title.includes("咨询师") || c.title.includes("心理")) tags.push("心理咨询师");
    if (c.title.includes("教练")) tags.push("ADHD教练");
    if (c.title.includes("特教")) tags.push("特教老师");
  }
  return tags;
}

function AvatarPlaceholder({ name, color }: { name: string; color: (typeof CARD_COLORS)[0] }) {
  return (
    <div
      className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl font-bold"
      style={{ background: color.av, color: color.tx }}
    >{name[0]}</div>
  );
}

function CounselorCard({ c, idx }: { c: Counselor; idx: number }) {
  const col = CARD_COLORS[idx % CARD_COLORS.length];
  const roleTags = getRoleTags(c);
  const rating = (c.rating / 10).toFixed(1);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04, type: "spring", stiffness: 260, damping: 30 }}
      whileTap={{ scale: 0.98 }}>
      <Link href={`/counselors/${c.id}`}>
        <div
          className="rounded-3xl border overflow-hidden p-5"
          style={{
            background: `linear-gradient(145deg, ${col.from} 0%, ${col.to} 100%)`,
            borderColor: "var(--color-mp-border)",
            boxShadow: "0 2px 12px rgba(59,51,44,0.04)",
          }}>
          <div className="flex gap-4 items-start mb-4">
            <AvatarPlaceholder name={c.displayName} color={col} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <div className="text-base font-semibold" style={{ color: "var(--color-mp-text)" }}>{c.displayName}</div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: "var(--color-mp-muted)" }}>
                    <Star className="w-3 h-3 fill-[var(--color-mp-warning)] text-[var(--color-mp-warning)]" />
                    {rating}
                    <span>·</span>
                    <Clock className="w-3 h-3" />
                    {c.totalHours}+ 小时
                    {c.location && <><span>·</span>{c.location}</>}
                  </div>
                </div>
                {c.isAccepting && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                    style={{ background: "rgba(156,180,138,.18)", color: "var(--color-mp-primary)" }}>
                    接受预约
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {roleTags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
                    style={{ background: col.av + "99", color: col.tx }}>{t}</span>
                ))}
                {c.sessionModes.map(m => (
                  <span key={m} className="text-[10px] px-2 py-0.5 rounded-md"
                    style={{ background: "var(--color-mp-secondary)", color: "var(--color-mp-muted)" }}>{m}</span>
                ))}
              </div>
            </div>
          </div>

          <p className="text-sm leading-relaxed line-clamp-2 mb-4" style={{ color: "var(--color-mp-muted)" }}>{c.bio}</p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {c.specialties.slice(0, 5).map(s => (
              <span key={s} className="text-[11px] px-2.5 py-0.5 rounded-full border"
                style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)", color: "var(--color-mp-muted)" }}>
                {s}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--color-mp-border)" }}>
            <div className="text-base font-bold" style={{ color: "var(--color-mp-text)" }}>
              ¥{c.pricePerSession}
              <span className="text-xs font-normal ml-1" style={{ color: "var(--color-mp-muted)" }}>/ 次</span>
            </div>
            <div className="text-xs px-3 py-1.5 rounded-xl font-medium text-white"
              style={{ background: "var(--color-mp-primary)" }}>预约咨询</div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function CounselorSkeleton() {
  return (
    <div className="rounded-3xl border p-5" style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}>
      <div className="flex gap-4 items-start mb-4">
        <div className="w-20 h-20 rounded-2xl skeleton flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-5 w-28 skeleton" /><div className="h-4 w-36 skeleton" /><div className="h-4 w-20 skeleton" />
        </div>
      </div>
      <div className="space-y-2 mb-4"><div className="h-4 w-full skeleton" /><div className="h-4 w-3/4 skeleton" /></div>
      <div className="flex gap-1.5"><div className="h-6 w-14 rounded-full skeleton" /><div className="h-6 w-20 rounded-full skeleton" /></div>
    </div>
  );
}

export function ExploreScreen() {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSpec, setFilterSpec] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (filterSpec) params.set("specialty", filterSpec);
    const timer = setTimeout(() => {
      fetch(`/api/counselors?${params}`)
        .then(r => r.json()).then(data => { setCounselors(Array.isArray(data) ? data : []); setLoading(false); })
        .catch(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filterSpec]);

  const displayed = filterMode
    ? counselors.filter(c => c.sessionModes.includes(filterMode))
    : counselors;

  return (
    <div className="min-h-svh" style={{ background: "var(--color-mp-surface)" }}>
      {/* Banner */}
      <div className="px-5 pt-12 pb-6" style={{ background: "linear-gradient(160deg, #9CB48A 0%, #7a9a6a 100%)" }}>
        <div className="text-white/70 text-xs font-medium mb-1">神经多样性友好</div>
        <div className="text-white text-2xl font-bold mb-0.5">找到适合你的咨询师</div>
        <div className="text-white/60 text-sm">ADHD · ASD · 情绪支持 · 特殊学习</div>
      </div>

      {/* Search */}
      <div className="sticky top-0 z-10 px-5 py-3" style={{ background: "var(--color-mp-surface)" }}>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{ background: "var(--color-mp-card)", border: "1px solid var(--color-mp-border)" }}>
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-mp-faint)" }} />
            <input
              className="flex-1 text-sm bg-transparent outline-none"
              placeholder="搜索咨询师、专长..."
              style={{ color: "var(--color-mp-text)" }}
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => setShowFilter(v => !v)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: showFilter ? "var(--color-mp-primary)" : "var(--color-mp-card)", border: "1px solid var(--color-mp-border)" }}>
            <Filter className="w-4 h-4" style={{ color: showFilter ? "#fff" : "var(--color-mp-muted)" }} />
          </button>
        </div>

        {/* Filter chips */}
        <AnimatePresence>
          {showFilter && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="pt-3 space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-mp-faint)" }}>咨询方向</div>
                <div className="flex flex-wrap gap-1.5">
                  {SPEC_TAGS.map(t => (
                    <button key={t} onClick={() => setFilterSpec(filterSpec === t ? null : t)}
                      className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                      style={{
                        background: filterSpec === t ? "var(--color-mp-primary)" : "var(--color-mp-card)",
                        borderColor: filterSpec === t ? "var(--color-mp-primary)" : "var(--color-mp-border)",
                        color: filterSpec === t ? "#fff" : "var(--color-mp-muted)",
                      }}>{t}</button>
                  ))}
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-wide mt-2" style={{ color: "var(--color-mp-faint)" }}>咨询方式</div>
                <div className="flex gap-1.5">
                  {MODE_TAGS.map(t => (
                    <button key={t} onClick={() => setFilterMode(filterMode === t ? null : t)}
                      className="text-xs px-3 py-1 rounded-full border transition-colors"
                      style={{
                        background: filterMode === t ? "var(--color-mp-primary)" : "var(--color-mp-card)",
                        borderColor: filterMode === t ? "var(--color-mp-primary)" : "var(--color-mp-border)",
                        color: filterMode === t ? "#fff" : "var(--color-mp-muted)",
                      }}>{t}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* List */}
      <div className="px-5 pb-8 space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-mp-faint)" }}>
          {loading ? "加载中..." : `${displayed.length} 位支持者`}
        </div>
        {loading ? (
          <><CounselorSkeleton /><CounselorSkeleton /><CounselorSkeleton /></>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🌿</div>
            <div className="text-base font-medium mb-2" style={{ color: "var(--color-mp-text)" }}>暂无匹配的咨询师</div>
            <div className="text-sm" style={{ color: "var(--color-mp-muted)" }}>试试调整筛选条件</div>
          </div>
        ) : (
          displayed.map((c, i) => <CounselorCard key={c.id} c={c} idx={i} />)
        )}
      </div>
    </div>
  );
}
