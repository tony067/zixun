"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, ChevronDown, Clock, BookOpen, X } from "lucide-react";
import Link from "next/link";
import { useEazo } from "@eazo/sdk/react";

type Counselor = {
  id: string; displayName: string; title: string; bio: string;
  specialties: string[]; counselorTypes: string[]; isSupervisor: boolean;
  sessionModes: string[]; sessionDuration: number; pricePerSession: number;
  isAccepting: boolean; totalHours: number; rating: number; avatarUrl: string | null;
  location: string;
};

// 分类方格配置 — 2行×4列
const CATEGORIES = [
  { id: "心理咨询师", label: "心理\n咨询师", bg: "#EDF5E9", color: "#4a7a4a" },
  { id: "ADHD",     label: "ADHD",       bg: "#FFF3E0", color: "#E65100" },
  { id: "ASD",      label: "ASD",        bg: "#E3F2FD", color: "#1565C0" },
  { id: "avail2d",  label: "2天内\n可约", bg: "#F5F5F5", color: "#555" },
  { id: "ADHD教练", label: "ADHD\n教练", bg: "#FCE4EC", color: "#C2185B" },
  { id: "特教老师", label: "特教\n老师",  bg: "#EDE7F6", color: "#6A1B9A" },
  { id: "儿童青少年",label: "儿童\n青少年",bg: "#E0F7FA", color: "#00838F" },
  { id: "availWk",  label: "本周\n可约",  bg: "#F5F5F5", color: "#555" },
];

// 头像颜色方案
const AVATAR_COLORS = [
  { bg: "#D4C4A8", text: "#5C4A20" },
  { bg: "#B8D4B0", text: "#2D5024" },
  { bg: "#A8C4D8", text: "#1E3D6B" },
  { bg: "#C8B8D4", text: "#3D1E5C" },
  { bg: "#D4B8B8", text: "#5C1E1E" },
  { bg: "#B8D0C4", text: "#1E4A3D" },
];

function getRoleTags(c: Counselor): string[] {
  const tags = [...(c.counselorTypes ?? [])];
  if (c.isSupervisor && !tags.includes("督导")) tags.push("督导");
  if (tags.length === 0 && c.title) {
    if (c.title.includes("咨询")) tags.push("心理咨询师");
    if (c.title.includes("教练")) tags.push("ADHD教练");
    if (c.title.includes("特教")) tags.push("特教老师");
  }
  return tags.slice(0, 2);
}

function availLabel(c: Counselor): { text: string; color: string } {
  const hash = c.id.charCodeAt(c.id.length - 1);
  if (hash % 3 === 0) return { text: "● 2 天内可约", color: "#4CAF50" };
  if (hash % 3 === 1) return { text: "● 本周可约", color: "#FF9800" };
  return { text: "● 接受预约", color: "#9CB48A" };
}

function CounselorCard({ c, idx }: { c: Counselor; idx: number }) {
  const ac = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const roleTags = getRoleTags(c);
  const avail = availLabel(c);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04, type: "spring", stiffness: 280, damping: 32 }}
      whileTap={{ scale: 0.985 }}
    >
      <Link href={`/counselors/${c.id}`}>
        <div className="bg-[#FDFAF6] rounded-2xl px-4 pt-4 pb-4 mb-3">
          {/* Row 1: avatar + meta + avail */}
          <div className="flex gap-3 mb-3">
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-bold flex-shrink-0"
              style={{ background: ac.bg, color: ac.text }}
            >
              {c.avatarUrl
                ? <img src={c.avatarUrl} alt={c.displayName} className="w-full h-full object-cover rounded-xl" />
                : c.displayName[0]
              }
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[17px] font-semibold text-[#2C2420] leading-tight">{c.displayName}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {roleTags.map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "#EAF3EC", color: "#4a7a4a" }}>{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-[#7D736A]">
                    <Clock className="w-3 h-3" />
                    <span>{c.sessionDuration} 分钟 / 次</span>
                  </div>
                </div>
                <span className="text-xs font-medium flex-shrink-0 mt-0.5" style={{ color: avail.color }}>
                  {avail.text}
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <p className="text-sm text-[#4A4540] leading-relaxed mb-3 line-clamp-3">{c.bio}</p>

          {/* Specialty tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {c.specialties.slice(0, 4).map(s => (
              <span key={s} className="text-xs px-2.5 py-1 rounded-full border border-[#E0DBD4] text-[#7D736A]">
                {s}
              </span>
            ))}
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-[#2C2420]">¥{c.pricePerSession}</span>
              <span className="text-sm text-[#9B8E82]"> / 次</span>
            </div>
            <div
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#9CB48A" }}
            >
              预约咨询
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="bg-[#FDFAF6] rounded-2xl p-4 mb-3">
      <div className="flex gap-3 mb-3">
        <div className="w-20 h-20 rounded-xl skeleton flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-2">
          <div className="h-5 w-28 skeleton" />
          <div className="h-4 w-20 skeleton" />
          <div className="h-3 w-16 skeleton" />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-4 skeleton" />
        <div className="h-4 w-3/4 skeleton" />
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-6 w-14 rounded-full skeleton" />
        <div className="h-6 w-16 rounded-full skeleton" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-7 w-20 skeleton" />
        <div className="h-9 w-24 rounded-xl skeleton" />
      </div>
    </div>
  );
}

export function ExploreScreen() {
  const user = useEazo((s) => s.auth.user);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (search) sp.set("q", search);
    fetch(`/api/counselors?${sp}`)
      .then(r => r.json())
      .then(d => setCounselors(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [search]);

  const filtered = counselors.filter(c => {
    if (!activeCategory) return true;
    if (activeCategory === "avail2d" || activeCategory === "availWk") return c.isAccepting;
    if (activeCategory === "ASD") return c.specialties?.some(s => s.includes("ASD") || s.includes("自闭"));
    if (activeCategory === "ADHD") return c.specialties?.some(s => s.includes("ADHD")) || c.counselorTypes?.includes("ADHD教练");
    return c.counselorTypes?.includes(activeCategory) || c.specialties?.some(s => s.includes(activeCategory));
  });

  return (
    <div className="min-h-svh" style={{ background: "#F5F1EA" }}>
      {/* 顶部问候栏 */}
      <div className="px-4 pt-12 pb-3 flex items-center justify-between">
        <span className="text-base text-[#7D736A]">
          {(() => { const h = new Date().getHours(); if (h<6) return "深夜好"; if (h<12) return "上午好"; if (h<18) return "下午好"; return "晚上好"; })()}
        </span>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#C8C0B4] text-xs text-[#7D736A]">
            <BookOpen className="w-3.5 h-3.5" />新手必读
          </button>
          <div className="w-8 h-8 rounded-full bg-[#9CB48A] flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0] ?? "1"}
          </div>
        </div>
      </div>

      {/* 绿色 Banner */}
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, #8BAD7A 0%, #9CB48A 50%, #B8C9A4 100%)", minHeight: 140 }}>
        <div className="relative z-10 p-5">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
            <span className="text-xs text-white/90 font-medium">联盟认证平台</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-3 leading-tight">
            神经多样性友好<br />咨询师联盟
          </h2>
          <div className="flex gap-2">
            {["专业培训认证","按你的节奏","安全支持空间"].map(t => (
              <span key={t} className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                style={{ background: "rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.95)" }}>{t}</span>
            ))}
          </div>
        </div>
        {/* 装饰圆 */}
        <div className="absolute right-0 top-0 w-28 h-28 rounded-full opacity-20"
          style={{ background: "rgba(255,255,255,0.4)", transform: "translate(30%, -30%)" }} />
        <div className="absolute right-6 bottom-0 w-16 h-16 rounded-full opacity-15"
          style={{ background: "rgba(255,255,255,0.3)", transform: "translateY(40%)" }} />
      </div>

      {/* 搜索栏 + 预约督导 */}
      <div className="flex items-center gap-2 px-4 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-2xl px-3 py-2.5 shadow-sm">
          <Search className="w-4 h-4 text-[#B0A89E] flex-shrink-0" />
          <input
            type="text"
            placeholder="搜索名字、擅长..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent focus:outline-none text-[#2C2420] placeholder:text-[#C0B8B0]"
          />
          {search && (
            <button onClick={() => setSearch("")}><X className="w-3.5 h-3.5 text-[#B0A89E]" /></button>
          )}
        </div>
        <button className="px-4 py-2.5 rounded-2xl text-sm font-medium text-white flex-shrink-0"
          style={{ background: "#7C6FA0" }}>
          预约督导
        </button>
      </div>

      {/* 2×4 分类方格 */}
      <div className="px-4 mb-4 grid grid-cols-4 gap-2">
        {CATEGORIES.map(cat => (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.93 }}
            onClick={() => setActiveCategory(p => p === cat.id ? "" : cat.id)}
            className="aspect-square rounded-2xl flex items-center justify-center text-center text-[13px] font-semibold whitespace-pre-line leading-tight transition-all"
            style={{
              background: activeCategory === cat.id ? cat.color : cat.bg,
              color: activeCategory === cat.id ? "#fff" : cat.color,
              boxShadow: activeCategory === cat.id ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
            }}
          >
            {cat.label}
          </motion.button>
        ))}
      </div>

      {/* 筛选行 */}
      <div className="px-4 mb-4 flex items-center gap-2">
        {["城市","价格","咨询方向"].map(f => (
          <button key={f} className="flex items-center gap-1 px-3.5 py-2 rounded-full bg-white border border-[#E0DBD4] text-sm text-[#5C5550]">
            {f}<ChevronDown className="w-3.5 h-3.5" />
          </button>
        ))}
        <button className="ml-auto w-9 h-9 rounded-full bg-white border border-[#E0DBD4] flex items-center justify-center flex-shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-[#7D736A]" />
        </button>
      </div>

      {/* 咨询师列表 */}
      <div className="px-4 pb-28">
        {loading
          ? [1,2,3].map(i => <Skeleton key={i} />)
          : filtered.length === 0
          ? (
            <div className="text-center py-16">
              <p className="text-base text-[#7D736A] mb-2">暂无匹配的咨询师</p>
              <button onClick={() => setActiveCategory("")} className="text-sm text-[#9CB48A]">查看全部</button>
            </div>
          )
          : (
            <AnimatePresence mode="popLayout">
              {filtered.map((c, i) => <CounselorCard key={c.id} c={c} idx={i} />)}
            </AnimatePresence>
          )
        }
      </div>
    </div>
  );
}
