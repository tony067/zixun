"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, ChevronDown, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useEazo } from "@eazo/sdk/react";
import { auth } from "@eazo/sdk";

type Counselor = {
  id: string; displayName: string; title: string; bio: string;
  specialties: string[]; counselorTypes: string[]; isSupervisor: boolean;
  sessionModes: string[]; sessionDuration: number; pricePerSession: number;
  isAccepting: boolean; totalHours: number; rating: number; avatarUrl: string | null;
};

/* ── 分类 grid（2 行 × 4 列）── */
const CATEGORY_GRID = [
  [
    { id: "心理咨询师", label: "心理\n咨询师",    bg: "#EEF5EA", color: "#5A8040" },
    { id: "ADHD",      label: "ADHD",             bg: "#FFF5E8", color: "#D97706" },
    { id: "ASD",       label: "ASD",              bg: "#EAF3FC", color: "#2D7BB5" },
    { id: "2天内",     label: "2天内\n可约",       bg: "#F5F5F5", color: "#555" },
  ],
  [
    { id: "ADHD教练",  label: "ADHD\n教练",        bg: "#FEF0F8", color: "#B03A8C" },
    { id: "特教老师",  label: "特教\n老师",         bg: "#F0F8EE", color: "#3A7A40" },
    { id: "儿童青少年",label: "儿童\n青少年",       bg: "#EBF5F0", color: "#2A806A" },
    { id: "本周",      label: "本周\n可约",         bg: "#F5F5F5", color: "#555" },
  ],
];

const FILTER_PILLS = ["城市", "价格", "咨询方向"];

/* ── 每位咨询师的头像背景色 ── */
const AV_COLORS = [
  { bg: "#E8DECE", text: "#6B5022" },
  { bg: "#D5E4D0", text: "#2D5A28" },
  { bg: "#D5DEF0", text: "#2A3F75" },
  { bg: "#E8D5E8", text: "#622060" },
  { bg: "#D5EEEA", text: "#1A6050" },
  { bg: "#EEE8D5", text: "#6B5525" },
];

function getHour() { return new Date().getHours(); }
function getGreeting() {
  const h = getHour();
  if (h < 6)  return "夜深了";
  if (h < 12) return "上午好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

function AvailBadge({ isAccepting }: { isAccepting: boolean }) {
  if (!isAccepting) return null;
  // Simple mock: alternate between 2天内 / 本周
  return (
    <span className="text-xs font-medium" style={{ color: "#9CB48A" }}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#9CB48A] inline-block mr-1" />
      2 天内可约
    </span>
  );
}

function CounselorCard({ c, idx }: { c: Counselor; idx: number }) {
  const av = AV_COLORS[idx % AV_COLORS.length];
  const roleTags = [...(c.counselorTypes ?? [])];
  if (c.isSupervisor && !roleTags.includes("督导")) roleTags.push("督导");

  return (
    <Link href={`/counselors/${c.id}`}>
      <div className="px-5 py-5 border-b" style={{ borderColor: "#EBE7DF" }}>
        {/* 头像行 */}
        <div className="flex items-start gap-4 mb-3">
          {c.avatarUrl ? (
            <img src={c.avatarUrl} alt={c.displayName}
              className="w-[88px] h-[88px] rounded-2xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-[88px] h-[88px] rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl font-bold"
              style={{ background: av.bg, color: av.text }}>
              {c.displayName[0]}
            </div>
          )}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[17px] font-semibold" style={{ color: "#3B332C" }}>{c.displayName}</span>
              <AvailBadge isAccepting={c.isAccepting} />
            </div>
            {/* 角色标签 */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {roleTags.map(t => (
                <span key={t} className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                  style={{ background: "#EEF5EA", color: "#5A8040" }}>{t}</span>
              ))}
            </div>
            {/* 时长 */}
            <div className="flex items-center gap-1 mt-2 text-sm" style={{ color: "#7D736A" }}>
              <Clock className="w-3.5 h-3.5" />
              {c.sessionDuration} 分钟 / 次
            </div>
          </div>
        </div>

        {/* 简介 */}
        <p className="text-[15px] leading-relaxed mb-3 line-clamp-3" style={{ color: "#4A4240" }}>
          {c.bio}
        </p>

        {/* 专长标签 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {c.specialties.slice(0, 4).map(s => (
            <span key={s} className="text-[13px] px-3 py-1 rounded-full border"
              style={{ borderColor: "#DDD9D2", color: "#7D736A", background: "transparent" }}>
              {s}
            </span>
          ))}
        </div>

        {/* 价格 + 预约按钮 */}
        <div className="flex items-center justify-between">
          <div className="text-[22px] font-bold" style={{ color: "#3B332C" }}>
            ¥{c.pricePerSession}
            <span className="text-base font-normal ml-1" style={{ color: "#7D736A" }}>/ 次</span>
          </div>
          <div className="px-5 py-2.5 rounded-xl font-medium text-white text-[15px]"
            style={{ background: "#9CB48A" }}>
            预约咨询
          </div>
        </div>
      </div>
    </Link>
  );
}

function CounselorSkeleton() {
  return (
    <div className="px-5 py-5 border-b" style={{ borderColor: "#EBE7DF" }}>
      <div className="flex gap-4 mb-3">
        <div className="w-[88px] h-[88px] rounded-2xl skeleton flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-5 w-24 skeleton" />
          <div className="h-4 w-16 skeleton rounded-full" />
          <div className="h-4 w-20 skeleton" />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-4 w-full skeleton" />
        <div className="h-4 w-5/6 skeleton" />
        <div className="h-4 w-4/6 skeleton" />
      </div>
      <div className="h-8 w-24 skeleton rounded-xl ml-auto" />
    </div>
  );
}

export function ExploreScreen() {
  const user = useEazo((s) => s.auth.user);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    fetch(`/api/counselors?${params}`)
      .then(r => r.json())
      .then(d => setCounselors(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [search]);

  const displayed = activeCategory
    ? counselors.filter(c => {
        if (activeCategory === "2天内" || activeCategory === "本周") return c.isAccepting;
        if (activeCategory === "ADHD教练") return c.counselorTypes?.includes("ADHD教练");
        if (activeCategory === "特教老师") return c.counselorTypes?.includes("特教老师");
        if (activeCategory === "儿童青少年") return c.specialties?.some(s => s.includes("儿童") || s.includes("青少年"));
        if (["ADHD","ASD"].includes(activeCategory)) return c.specialties?.includes(activeCategory);
        return c.counselorTypes?.includes(activeCategory);
      })
    : counselors;

  return (
    <div className="min-h-svh" style={{ background: "#F5F1E8" }}>
      {/* ── 顶部问候 ── */}
      <div className="flex items-center justify-between px-5 pt-12 pb-3">
        <span className="text-base" style={{ color: "#7D736A" }}>{getGreeting()}</span>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-sm"
            style={{ borderColor: "#C2BDB7", color: "#7D736A", background: "transparent" }}>
            <span className="text-base">📖</span>
            新手必读
          </button>
          <div className="w-8 h-8 rounded-full bg-[#9CB48A] flex items-center justify-center text-white text-xs font-bold">
            {user ? (user.name ?? user.email ?? "我")[0] : "1"}
          </div>
        </div>
      </div>

      {/* ── Banner ── */}
      <div className="mx-5 rounded-2xl overflow-hidden mb-4" style={{ background: "linear-gradient(135deg, #9CB48A 0%, #7a9a68 100%)" }}>
        <div className="px-5 pt-4 pb-5 relative">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3 text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.95)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
            联盟认证平台
          </div>
          <div className="text-[22px] font-bold leading-tight text-white mb-3">
            神经多样性友好<br />咨询师联盟
          </div>
          <div className="flex flex-wrap gap-2">
            {["专业培训认证", "按你的节奏", "安全支持空间"].map(tag => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)" }}>
                {tag}
              </span>
            ))}
          </div>
          <div className="absolute right-4 top-4 w-20 h-20 rounded-full opacity-20" style={{ background: "white" }} />
          <div className="absolute right-8 bottom-0 w-12 h-12 rounded-full opacity-10" style={{ background: "white" }} />
        </div>
      </div>

      {/* ── 搜索 + 预约督导 ── */}
      <div className="flex gap-2 px-5 mb-4">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl"
          style={{ background: "white", border: "1px solid #EBE7DF" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#C2BDB7" }} />
          <input
            className="flex-1 text-[15px] bg-transparent outline-none"
            placeholder="搜索名字、擅长..."
            style={{ color: "#3B332C" }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap flex-shrink-0"
          style={{ background: "#EDE8F8", color: "#7B5EA7", border: "none" }}>
          预约督导
        </button>
      </div>

      {/* ── 分类 grid 2×4 ── */}
      <div className="px-5 mb-4 space-y-2">
        {CATEGORY_GRID.map((row, ri) => (
          <div key={ri} className="grid grid-cols-4 gap-2">
            {row.map(cell => {
              const active = activeCategory === cell.id;
              return (
                <motion.button key={cell.id} whileTap={{ scale: 0.94 }}
                  onClick={() => setActiveCategory(active ? null : cell.id)}
                  className="rounded-2xl py-3 flex items-center justify-center text-center text-[13px] font-semibold whitespace-pre-line leading-tight"
                  style={{
                    background: active ? cell.color : cell.bg,
                    color: active ? "white" : cell.color,
                    minHeight: 64,
                  }}>
                  {cell.label}
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── 筛选行 ── */}
      <div className="flex items-center gap-2 px-5 mb-2 overflow-x-auto">
        {FILTER_PILLS.map(label => (
          <button key={label} className="flex items-center gap-1 px-3 py-1.5 rounded-full border flex-shrink-0 text-sm"
            style={{ borderColor: "#C2BDB7", color: "#3B332C", background: "white" }}>
            {label}
            <ChevronDown className="w-3.5 h-3.5" style={{ color: "#C2BDB7" }} />
          </button>
        ))}
        <div className="ml-auto flex-shrink-0">
          <button className="w-9 h-9 rounded-full border flex items-center justify-center"
            style={{ borderColor: "#C2BDB7", background: "white" }}>
            <SlidersHorizontal className="w-4 h-4" style={{ color: "#7D736A" }} />
          </button>
        </div>
      </div>

      {/* ── 咨询师列表 ── */}
      <div style={{ background: "white" }}>
        {loading ? (
          <>{[1,2,3].map(i => <CounselorSkeleton key={i} />)}</>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🌿</div>
            <p className="text-base font-medium mb-1" style={{ color: "#3B332C" }}>暂无匹配的咨询师</p>
            <p className="text-sm" style={{ color: "#7D736A" }}>试试调整筛选条件</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {displayed.map((c, i) => <CounselorCard key={c.id} c={c} idx={i} />)}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
