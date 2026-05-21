"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Star, Clock, Video, Phone, X } from "lucide-react";
import Link from "next/link";
import { useEazo } from "@eazo/sdk/react";

type Counselor = {
  id: string; displayName: string; title: string; bio: string;
  specialties: string[]; sessionDuration: number; pricePerSession: number;
  sessionModes: string[]; isAccepting: boolean; rating: number;
  totalSessions: number; counselorTypes: string[]; isSupervisor: boolean;
};

const SPRING = { type: "spring" as const, stiffness: 280, damping: 35 };

const CARD_COLORS = [
  { bg: "linear-gradient(160deg,#eef6e8,#fdfbf7)", av: "#c8dfc0", text: "#2d5024" },
  { bg: "linear-gradient(160deg,#f5f0e4,#fdfbf7)", av: "#ddd0a8", text: "#524020" },
  { bg: "linear-gradient(160deg,#e8f0f5,#fdfbf7)", av: "#b4cedc", text: "#1e4258" },
  { bg: "linear-gradient(160deg,#f0ece4,#fdfbf7)", av: "#cfc4a8", text: "#52421e" },
  { bg: "linear-gradient(160deg,#eef0ea,#fdfbf7)", av: "#c4d4b4", text: "#324828" },
  { bg: "linear-gradient(160deg,#f5ecec,#fdfbf7)", av: "#d4b4b4", text: "#481e1e" },
];

function getRoleTags(c: Counselor) {
  const tags: string[] = [...(c.counselorTypes ?? [])];
  if (c.isSupervisor && !tags.includes("督导")) tags.push("督导");
  if (!tags.length) {
    if (c.title?.includes("咨询")) tags.push("心理咨询师");
    if (c.title?.includes("教练")) tags.push("ADHD教练");
    if (c.title?.includes("特教")) tags.push("特教老师");
  }
  return tags;
}

function CounselorCard({ c, idx }: { c: Counselor; idx: number }) {
  const col = CARD_COLORS[idx % CARD_COLORS.length];
  const roleTags = getRoleTags(c);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: idx * 0.04 }} whileTap={{ scale: 0.98 }}>
      <Link href={`/counselors/${c.id}`}>
        <div className="rounded-3xl overflow-hidden border border-[var(--color-mp-border)] shadow-sm"
          style={{ background: col.bg }}>
          <div className="px-5 pt-5 pb-4">
            {/* Top row */}
            <div className="flex items-start gap-4 mb-3">
              <div className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl font-bold shadow-sm"
                style={{ background: col.av, color: col.text }}>
                {c.displayName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-[var(--color-mp-text)]">{c.displayName}</h3>
                  {c.isAccepting && (
                    <span className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "rgba(156,180,138,0.18)", color: "#4a7a3a" }}>接受预约</span>
                  )}
                </div>
                {/* Role tags */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {roleTags.slice(0, 3).map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-[4px] font-semibold"
                      style={{ background: col.av + "cc", color: col.text, border: `1px solid ${col.av}` }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {/* Bio */}
            <p className="text-xs text-[var(--color-mp-muted)] leading-relaxed line-clamp-2 mb-3">{c.bio}</p>
            {/* Specialties */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {c.specialties.slice(0, 4).map(s => (
                <span key={s} className="text-[11px] px-2.5 py-1 rounded-full border"
                  style={{ background: "var(--color-mp-secondary)", color: "var(--color-mp-text)", borderColor: "var(--color-mp-border)" }}>
                  {s}
                </span>
              ))}
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-mp-border)]">
              <div className="flex gap-2 text-[var(--color-mp-primary)]">
                {c.sessionModes?.includes("视频") && <Video className="w-4 h-4" />}
                {c.sessionModes?.includes("语音") && <Phone className="w-4 h-4" />}
              </div>
              <span className="text-base font-semibold text-[var(--color-mp-text)]">
                ¥{c.pricePerSession}<span className="text-xs font-normal text-[var(--color-mp-muted)]">/次</span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="rounded-3xl border border-[var(--color-mp-border)] p-5" style={{ background: "var(--color-mp-card)" }}>
      <div className="flex gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl skeleton flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-28 skeleton" />
          <div className="h-3 w-40 skeleton" />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3 w-full skeleton" />
        <div className="h-3 w-3/4 skeleton" />
      </div>
      <div className="flex gap-1.5">
        {[1,2,3].map(i => <div key={i} className="h-6 w-14 rounded-full skeleton" />)}
      </div>
    </div>
  );
}

export function ExploreScreen() {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const user = useEazo(s => s.auth.user);

  const SPECIALTY_OPTIONS = ["ADHD","ASD","焦虑","情绪调节","感官敏感","读写障碍","执行功能","儿童心理","职场困境","创伤","女性成长"];

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (specialty) params.set("specialty", specialty);
    fetch(`/api/counselors?${params}`)
      .then(r => r.json()).then(d => setCounselors(Array.isArray(d) ? d : []))
      .catch(() => {}).finally(() => setLoading(false));
  }, [search, specialty]);

  return (
    <div className="min-h-svh" style={{ background: "var(--color-mp-surface)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-5 pt-12 md:pt-6 pb-4"
        style={{ background: "var(--color-mp-surface)", borderBottom: "1px solid var(--color-mp-border)" }}>
        <h1 className="text-xl font-semibold mb-3" style={{ color: "var(--color-mp-text)" }}>
          找到适合你的咨询师
        </h1>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl border"
            style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}>
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-mp-faint)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜索咨询师、专长…"
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: "var(--color-mp-text)" }} />
          </div>
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => setFilterOpen(true)}
            className="w-11 h-11 rounded-2xl border flex items-center justify-center"
            style={{ background: specialty ? "var(--color-mp-primary)" : "var(--color-mp-card)", borderColor: "var(--color-mp-border)" }}>
            <Filter className="w-4 h-4" style={{ color: specialty ? "#fff" : "var(--color-mp-muted)" }} />
          </motion.button>
        </div>
        {specialty && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
              style={{ background: "rgba(156,180,138,0.2)", color: "var(--color-mp-primary)" }}>
              {specialty}
              <button onClick={() => setSpecialty("")}><X className="w-3 h-3" /></button>
            </span>
          </div>
        )}
      </div>

      {/* List */}
      <div className="px-5 py-5 space-y-4 pb-28">
        {loading ? (
          <>{[1,2,3].map(i => <Skeleton key={i} />)}</>
        ) : counselors.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-base font-medium mb-2" style={{ color: "var(--color-mp-text)" }}>暂无匹配的咨询师</p>
            <p className="text-sm" style={{ color: "var(--color-mp-muted)" }}>试试调整筛选条件</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {counselors.map((c, i) => <CounselorCard key={c.id} c={c} idx={i} />)}
          </AnimatePresence>
        )}
      </div>

      {/* Filter sheet */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div className="fixed inset-0 z-40 flex items-end"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
            <motion.div className="relative w-full rounded-t-3xl p-6 pb-10"
              style={{ background: "var(--color-mp-card)" }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={SPRING}>
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--color-mp-border)" }} />
              <h3 className="text-base font-semibold mb-4" style={{ color: "var(--color-mp-text)" }}>筛选专长</h3>
              <div className="flex flex-wrap gap-2">
                {SPECIALTY_OPTIONS.map(s => (
                  <motion.button key={s} whileTap={{ scale: 0.95 }}
                    onClick={() => { setSpecialty(specialty === s ? "" : s); setFilterOpen(false); }}
                    className="text-sm px-3.5 py-2 rounded-full border transition-colors"
                    style={{
                      background: specialty === s ? "var(--color-mp-primary)" : "var(--color-mp-surface)",
                      color: specialty === s ? "#fff" : "var(--color-mp-text)",
                      borderColor: specialty === s ? "var(--color-mp-primary)" : "var(--color-mp-border)",
                    }}>
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
