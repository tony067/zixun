"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Star, Clock, Video, Phone, Users } from "lucide-react";
import Link from "next/link";

type Counselor = {
  id: string; displayName: string; title: string; bio: string;
  specialties: string[]; counselorTypes: string[]; isSupervisor: boolean;
  sessionModes: string[]; sessionDuration: number; pricePerSession: number;
  isAccepting: boolean; rating: number; totalHours: number; avatarUrl: string | null;
};

const SPRING = { type: "spring" as const, stiffness: 260, damping: 30 };
const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  "心理咨询师": { bg: "#dcf3d4", text: "#3d7a30" },
  "ADHD教练":   { bg: "#fef3c7", text: "#854d0e" },
  "特教老师":   { bg: "#dbeafe", text: "#1d4ed8" },
  "督导":       { bg: "#f3e8ff", text: "#7c3aed" },
};
const SPECIALTIES = [
  "ADHD","ASD","焦虑","情绪调节","感官敏感","执行功能","儿童青少年","读写障碍","职场困境","创伤",
];

function Avatar({ name, url }: { name: string; url: string | null }) {
  const colors = ["#D4E8CA","#E5DCC5","#DBEAFE","#F3E8FF","#FEF3C7","#FCE7F3"];
  const ci = name.charCodeAt(0) % colors.length;
  if (url) return <img src={url} alt={name} className="w-16 h-16 rounded-2xl object-cover" />;
  return (
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
      style={{ background: colors[ci], color: "#3B332C" }}>{name[0]}</div>
  );
}

function CounselorCard({ c }: { c: Counselor }) {
  const roles = [...(c.counselorTypes ?? []), ...(c.isSupervisor ? ["督导"] : [])];
  const rating = (c.rating / 10).toFixed(1);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} whileTap={{ scale: 0.985 }}>
      <Link href={`/counselors/${c.id}`}>
        <div className="rounded-3xl p-5 border shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow"
          style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}>
          <div className="flex gap-4 items-start mb-3">
            <Avatar name={c.displayName} url={c.avatarUrl} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-base font-semibold" style={{ color: "var(--color-mp-text)" }}>{c.displayName}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {roles.map(r => (
                      <span key={r} className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: ROLE_COLORS[r]?.bg ?? "#F5F1E8", color: ROLE_COLORS[r]?.text ?? "#7D736A" }}>{r}</span>
                    ))}
                  </div>
                </div>
                {c.isAccepting && (
                  <span className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "#dcf3d4", color: "#3d7a30" }}>接受预约</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[11px]" style={{ color: "var(--color-mp-muted)" }}>
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3" style={{ color: "var(--color-mp-warning)", fill: "var(--color-mp-warning)" }} />{rating}
                </span>
                <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{c.sessionDuration}min</span>
                <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{c.totalHours}h</span>
              </div>
            </div>
          </div>
          <p className="text-sm leading-relaxed mb-3 line-clamp-2" style={{ color: "var(--color-mp-muted)" }}>{c.bio}</p>
          <div className="flex flex-wrap gap-1 mb-3">
            {c.specialties.slice(0, 4).map(s => (
              <span key={s} className="text-[11px] px-2.5 py-0.5 rounded-full border"
                style={{ background: "var(--color-mp-surface)", borderColor: "var(--color-mp-border)", color: "var(--color-mp-muted)" }}>{s}</span>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--color-mp-border)" }}>
            <div className="flex gap-2">
              {c.sessionModes.includes("视频") && <Video className="w-4 h-4" style={{ color: "var(--color-mp-primary)" }} />}
              {c.sessionModes.includes("语音") && <Phone className="w-4 h-4" style={{ color: "var(--color-mp-primary)" }} />}
            </div>
            <div className="font-semibold" style={{ color: "var(--color-mp-text)" }}>
              ¥{c.pricePerSession}<span className="text-sm font-normal" style={{ color: "var(--color-mp-muted)" }}>/次</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="rounded-3xl p-5 border" style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}>
      <div className="flex gap-4 mb-3"><div className="w-16 h-16 rounded-2xl skeleton flex-shrink-0" /><div className="flex-1 space-y-2"><div className="h-5 w-24 skeleton" /><div className="h-4 w-36 skeleton" /></div></div>
      <div className="space-y-2 mb-3"><div className="h-4 w-full skeleton" /><div className="h-4 w-3/4 skeleton" /></div>
      <div className="flex gap-2"><div className="h-6 w-14 rounded-full skeleton" /><div className="h-6 w-16 rounded-full skeleton" /></div>
    </div>
  );
}

export function ExploreScreen() {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeSpec, setActiveSpec] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (search) sp.set("q", search);
    if (activeSpec) sp.set("specialty", activeSpec);
    fetch(`/api/counselors?${sp}`)
      .then(r => r.json())
      .then(d => setCounselors(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [search, activeSpec]);

  return (
    <div className="min-h-svh" style={{ background: "var(--color-mp-surface)" }}>
      {/* Hero */}
      <div className="relative overflow-hidden px-5 pt-14 pb-8" style={{ background: "linear-gradient(135deg,#9CB48A 0%,#7a9b6a 100%)" }}>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3 text-xs font-semibold"
            style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}>✦ 联盟认证平台</div>
          <h1 className="text-2xl font-bold text-white mb-1">神经多样性友好咨询师联盟</h1>
          <p className="text-sm text-white/75">专注 ADHD · ASD · 感官敏感 · 学习差异</p>
        </div>
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full opacity-20" style={{ background: "#fff", transform: "translate(30%,-30%)" }} />
      </div>

      {/* Search bar */}
      <div className="px-5 -mt-4 relative z-10 mb-4">
        <div className="rounded-2xl flex items-center gap-3 px-4 py-3 shadow-md border"
          style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-mp-faint)" }} />
          <input type="text" placeholder="搜索咨询师、擅长领域…" value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent focus:outline-none" style={{ color: "var(--color-mp-text)" }} />
        </div>
      </div>

      {/* Specialty tags */}
      <div className="px-5 mb-4">
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-mp-muted)" }}>按擅长领域筛选</p>
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map(s => (
            <motion.button key={s} whileTap={{ scale: 0.93 }} onClick={() => setActiveSpec(activeSpec === s ? null : s)}
              className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
              style={activeSpec === s
                ? { background: "var(--color-mp-primary)", color: "#fff", borderColor: "var(--color-mp-primary)" }
                : { background: "var(--color-mp-card)", color: "var(--color-mp-muted)", borderColor: "var(--color-mp-border)" }}>
              {s}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-5 mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-mp-muted)" }}>
          {loading ? "加载中…" : `${counselors.length} 位支持者`}
        </span>
        {activeSpec && <button onClick={() => setActiveSpec(null)} className="text-xs" style={{ color: "var(--color-mp-primary)" }}>清除筛选</button>}
      </div>

      <div className="px-5 pb-28 space-y-4">
        {loading ? [1,2,3].map(i => <Skeleton key={i} />) :
         counselors.length === 0 ? (
           <div className="text-center py-20">
             <div className="text-4xl mb-3">🌿</div>
             <div className="text-base font-medium mb-1" style={{ color: "var(--color-mp-text)" }}>暂无匹配的咨询师</div>
           </div>
         ) : (
           <AnimatePresence mode="popLayout">
             {counselors.map(c => <CounselorCard key={c.id} c={c} />)}
           </AnimatePresence>
         )}
      </div>
    </div>
  );
}
