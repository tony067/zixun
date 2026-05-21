"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, ChevronDown, Clock } from "lucide-react";
import Link from "next/link";
import { useEazo } from "@eazo/sdk/react";

type Counselor = {
  id: string; displayName: string; title: string; bio: string;
  specialties: string[]; counselorTypes: string[]; isSupervisor: boolean;
  sessionModes: string[]; sessionDuration: number; pricePerSession: number;
  isAccepting: boolean; totalHours: number; rating: number;
  location: string; avatarUrl: string | null;
};

/* ── 分类 grid (2×4) ─────────────────────────── */
const CATEGORY_GRID = [
  { id: "counselor", label: "心理\n咨询师", bg: "#EAF2E8", text: "#3A6B30", border: "#C2DEB8" },
  { id: "adhd",     label: "ADHD",   bg: "#FFF3E0", text: "#E65100", border: "#FFB74D" },
  { id: "asd",      label: "ASD",    bg: "#E3F2FD", text: "#1565C0", border: "#90CAF9" },
  { id: "avail2",   label: "2天内\n可约", bg: "#fff", text: "#5C5C5C", border: "#DDD" },
  { id: "coach",    label: "ADHD\n教练", bg: "#FCE4EC", text: "#C2185B", border: "#F48FB1" },
  { id: "sped",     label: "特教\n老师", bg: "#E8EAF6", text: "#3949AB", border: "#9FA8DA" },
  { id: "youth",    label: "儿童\n青少年", bg: "#E8F5E9", text: "#2E7D32", border: "#A5D6A7" },
  { id: "availW",   label: "本周\n可约",  bg: "#fff", text: "#5C5C5C", border: "#DDD" },
];

/* ── 咨询师卡片头像颜色 ──────────────────────── */
const AVATAR_COLORS = [
  { bg: "#D4DEB8", text: "#3A5020" },
  { bg: "#C8DDD4", text: "#1E4A38" },
  { bg: "#D4D8E8", text: "#2A3470" },
  { bg: "#E8D4C8", text: "#5A2E1A" },
  { bg: "#D4C8E0", text: "#3A1E5A" },
  { bg: "#C8D8D4", text: "#1A4040" },
];

function getRoleTags(c: Counselor) {
  const tags = [...(c.counselorTypes ?? [])];
  if (c.isSupervisor && !tags.includes("督导")) tags.push("督导");
  if (tags.length === 0) {
    if (c.title?.includes("咨询师") || c.title?.includes("心理")) tags.push("心理咨询师");
    if (c.title?.includes("教练")) tags.push("ADHD教练");
    if (c.title?.includes("特教")) tags.push("特教老师");
  }
  return tags;
}

function CounselorCard({ c, idx }: { c: Counselor; idx: number }) {
  const col = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const roleTags = getRoleTags(c);
  const availTag = idx % 3 === 0 ? "● 2 天内可约" : "● 本周可约";
  const availColor = idx % 3 === 0 ? "#2E7D32" : "#E65100";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05, type: "spring", stiffness: 300, damping: 30 }}
      whileTap={{ scale: 0.985 }}
    >
      <Link href={`/counselors/${c.id}`}>
        <div className="pb-5 border-b border-[#EBE7DF]">
          {/* 上半：头像 + 名字区 */}
          <div className="flex items-start gap-3 mb-3">
            {c.avatarUrl ? (
              <img src={c.avatarUrl} alt={c.displayName}
                className="w-[88px] h-[88px] rounded-2xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-[88px] h-[88px] rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0"
                style={{ background: col.bg, color: col.text }}>
                {c.displayName[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <span className="text-lg font-semibold text-[#2A2420]">{c.displayName}</span>
                <span className="text-xs font-medium whitespace-nowrap" style={{ color: availColor }}>{availTag}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {roleTags.map(t => (
                  <span key={t} className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                    style={{ background: "#EAF2E8", color: "#3A6B30" }}>{t}</span>
                ))}
              </div>
              <div className="flex items-center gap-1 mt-1.5 text-xs text-[#7D736A]">
                <Clock className="w-3.5 h-3.5" />
                <span>{c.sessionDuration} 分钟 / 次</span>
              </div>
            </div>
          </div>
          {/* 简介 */}
          <p className="text-sm text-[#3B332C] leading-relaxed mb-3 line-clamp-3">{c.bio}</p>
          {/* 专长标签 */}
          <div className="flex flex-wrap gap-2 mb-3">
            {c.specialties.slice(0, 4).map(s => (
              <span key={s} className="text-xs px-3 py-1 rounded-full border border-[#DDD8D0] text-[#7D736A]">{s}</span>
            ))}
          </div>
          {/* 价格 + 预约 */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-[#2A2420]">¥{c.pricePerSession}</span>
              <span className="text-sm text-[#7D736A]"> / 次</span>
            </div>
            <button className="px-6 py-2.5 rounded-2xl text-white text-sm font-semibold"
              style={{ background: "#9CB48A" }}>
              预约咨询
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="pb-5 border-b border-[#EBE7DF]">
      <div className="flex gap-3 mb-3">
        <div className="w-[88px] h-[88px] rounded-2xl skeleton flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-5 w-28 skeleton" /><div className="h-4 w-20 skeleton" /><div className="h-4 w-16 skeleton" />
        </div>
      </div>
      <div className="space-y-2 mb-3"><div className="h-4 w-full skeleton" /><div className="h-4 w-4/5 skeleton" /></div>
      <div className="flex justify-between"><div className="h-6 w-20 skeleton" /><div className="h-9 w-24 rounded-2xl skeleton" /></div>
    </div>
  );
}

const FILTER_CATS = [
  { id: "city", label: "城市" },
  { id: "price", label: "价格" },
  { id: "direction", label: "咨询方向" },
];

export function ExploreScreen() {
  const user = useEazo((s) => s.auth.user);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/counselors")
      .then(r => r.json())
      .then(d => setCounselors(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = counselors.filter(c => {
    if (search && !c.displayName.includes(search) && !c.bio?.includes(search) &&
        !c.specialties?.some(s => s.includes(search))) return false;
    if (activeCat === "counselor" && !getRoleTags(c).includes("心理咨询师")) return false;
    if (activeCat === "adhd" && !c.specialties?.includes("ADHD") && !getRoleTags(c).includes("ADHD教练")) return false;
    if (activeCat === "asd" && !c.specialties?.includes("ASD")) return false;
    if (activeCat === "coach" && !getRoleTags(c).includes("ADHD教练")) return false;
    if (activeCat === "sped" && !getRoleTags(c).includes("特教老师")) return false;
    if (activeCat === "youth" && !c.specialties?.some(s => s.includes("儿童") || s.includes("青少年"))) return false;
    return true;
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "上午好" : hour < 18 ? "下午好" : "晚上好";

  return (
    <div className="min-h-svh" style={{ background: "#F5F1E8" }}>
      {/* 顶部问候行 */}
      <div className="flex items-center justify-between px-5 pt-12 pb-3">
        <span className="text-base text-[#7D736A]">{greeting}</span>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#DDD8D0] bg-white text-xs text-[#5C5C5C]">
            <span>📖</span> 新手必读
          </button>
          <div className="w-8 h-8 rounded-full bg-[#9CB48A] flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0] ?? "1"}
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="mx-5 mb-5 rounded-3xl overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, #7EA870 0%, #9CB48A 60%, #B5CC9E 100%)", minHeight: 160 }}>
        <div className="relative z-10 px-5 pt-5 pb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3 text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
            联盟认证平台
          </div>
          <h1 className="text-2xl font-bold text-white leading-snug mb-4">
            神经多样性友好<br />咨询师联盟
          </h1>
          <div className="flex gap-2 flex-wrap">
            {["专业培训认证", "按你的节奏", "安全支持空间"].map(t => (
              <span key={t} className="text-xs px-3 py-1 rounded-full text-white"
                style={{ background: "rgba(255,255,255,0.25)" }}>{t}</span>
            ))}
          </div>
        </div>
        {/* 装饰圆 */}
        <div className="absolute right-5 top-5 w-24 h-24 rounded-full opacity-20" style={{ background: "#fff" }} />
        <div className="absolute right-10 bottom-0 w-16 h-16 rounded-full opacity-10" style={{ background: "#fff", transform: "translateY(40%)" }} />
      </div>

      <div className="px-5">
        {/* 搜索 + 预约督导 */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-[#DDD8D0]">
            <Search className="w-4 h-4 text-[#C2BDB7] flex-shrink-0" />
            <input type="text" placeholder="搜索名字、擅长…" value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none text-[#2A2420] placeholder:text-[#C2BDB7]" />
          </div>
          <button className="px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap"
            style={{ background: "#EDE8F8", color: "#6B4FC4", border: "none" }}>
            预约督导
          </button>
        </div>

        {/* 2×4 分类 grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {CATEGORY_GRID.map(cat => (
            <motion.button key={cat.id} whileTap={{ scale: 0.93 }}
              onClick={() => setActiveCat(p => p === cat.id ? null : cat.id)}
              className="rounded-2xl py-3 px-1 flex items-center justify-center text-center text-xs font-semibold leading-tight border transition-all"
              style={{
                background: activeCat === cat.id ? cat.text : cat.bg,
                color: activeCat === cat.id ? "#fff" : cat.text,
                borderColor: cat.border,
                whiteSpace: "pre-wrap",
                minHeight: 56,
              }}>
              {cat.label}
            </motion.button>
          ))}
        </div>

        {/* 筛选行 */}
        <div className="flex items-center gap-2 mb-5">
          {FILTER_CATS.map(f => (
            <button key={f.id}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#DDD8D0] bg-white text-xs text-[#5C5C5C]">
              {f.label} <ChevronDown className="w-3 h-3" />
            </button>
          ))}
          <button onClick={() => setFilterOpen(true)}
            className="ml-auto w-9 h-9 rounded-full border border-[#DDD8D0] bg-white flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4 text-[#7D736A]" />
          </button>
        </div>

        {/* 列表 */}
        <div className="space-y-5 pb-28">
          {loading ? (
            [1,2,3].map(i => <Skeleton key={i} />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-[#7D736A]">暂无匹配的咨询师</p>
              <button onClick={() => { setSearch(""); setActiveCat(null); }}
                className="mt-3 text-xs text-[#9CB48A]">清除筛选</button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((c, i) => <CounselorCard key={c.id} c={c} idx={i} />)}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
