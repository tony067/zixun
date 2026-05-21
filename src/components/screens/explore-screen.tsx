"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Clock, BookOpen } from "lucide-react";
import Link from "next/link";
import { useEazo } from "@eazo/sdk/react";
import { auth } from "@eazo/sdk";

type Counselor = {
  id: string; displayName: string; title: string; bio: string;
  specialties: string[]; counselorTypes: string[]; isSupervisor: boolean;
  sessionModes: string[]; sessionDuration: number; pricePerSession: number;
  isAccepting: boolean; totalHours: number; rating: number; location: string;
  avatarUrl: string | null;
};

// 8 格分类，左6色彩、右2灰色（时间）
const CATEGORY_GRID = [
  { id: "心理咨询师", label: "心理\n咨询师", bg: "#E8F2E4", color: "#5A8040", typeKey: "counselorType" },
  { id: "ADHD",       label: "ADHD",      bg: "#FEF3E2", color: "#D4720A", typeKey: "specialty" },
  { id: "ASD",        label: "ASD",       bg: "#EAF1FF", color: "#3B6FD4", typeKey: "specialty" },
  { id: "2天内",      label: "2天内\n可约", bg: "#F7F7F7", color: "#888",   typeKey: "time" },
  { id: "ADHD教练",   label: "ADHD\n教练", bg: "#FDE8F8", color: "#B040B0", typeKey: "counselorType" },
  { id: "特教老师",   label: "特教\n老师", bg: "#F0EBF8", color: "#8040C0", typeKey: "counselorType" },
  { id: "儿童青少年", label: "儿童\n青少年", bg: "#E5F7F0", color: "#258060", typeKey: "counselorType" },
  { id: "本周",       label: "本周\n可约", bg: "#F7F7F7", color: "#888",   typeKey: "time" },
];

const AV_COLORS = [
  { bg: "#E8DECE", text: "#6B5022" },
  { bg: "#D5E4D0", text: "#2D5A28" },
  { bg: "#D5DEF0", text: "#2A3F75" },
  { bg: "#E8D5E8", text: "#622060" },
  { bg: "#D5EEEA", text: "#1A6050" },
  { bg: "#E8E4D0", text: "#5A4A22" },
];

function getAv(id: string) {
  return AV_COLORS[id.charCodeAt(id.length - 1) % AV_COLORS.length];
}

function getRoleTags(c: Counselor) {
  const tags = [...(c.counselorTypes ?? [])];
  if (c.isSupervisor && !tags.includes("督导")) tags.push("督导");
  if (tags.length === 0 && c.title) {
    if (c.title.includes("咨询")) tags.push("心理咨询师");
    if (c.title.includes("教练")) tags.push("ADHD教练");
    if (c.title.includes("特教")) tags.push("特教老师");
  }
  return tags;
}

function getAvailLabel(c: Counselor): { label: string; color: string } {
  if (!c.isAccepting) return { label: "", color: "" };
  // 简单模拟：rating 奇数 = 2天内，偶数 = 本周
  const is2d = c.rating % 2 === 1;
  return is2d
    ? { label: "2 天内可约", color: "#4CAF50" }
    : { label: "本周可约", color: "#FF9800" };
}

function CounselorCard({ c }: { c: Counselor }) {
  const av = getAv(c.id);
  const roleTags = getRoleTags(c);
  const avail = getAvailLabel(c);

  return (
    <motion.div whileTap={{ scale: 0.99 }}>
      <Link href={`/counselors/${c.id}`}>
        <div className="py-5 flex flex-col gap-2" style={{ borderBottom: "1px solid #EBE7DF" }}>
          {/* 头像行 */}
          <div className="flex items-start gap-3">
            <div className="w-[90px] h-[90px] rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl font-bold overflow-hidden"
              style={{ background: av.bg, color: av.text }}>
              {c.avatarUrl
                ? <img src={c.avatarUrl} alt={c.displayName} className="w-full h-full object-cover" />
                : c.displayName[0]
              }
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[18px] font-semibold" style={{ color: "#3B332C" }}>{c.displayName}</span>
                {avail.label && (
                  <span className="text-[12px] flex-shrink-0" style={{ color: avail.color }}>
                    ● {avail.label}
                  </span>
                )}
              </div>
              {roleTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {roleTags.map(t => (
                    <span key={t} className="text-[13px] px-2.5 py-0.5 rounded-full font-medium"
                      style={{ background: "#EEF5EA", color: "#5A8040" }}>{t}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1 text-[13px]" style={{ color: "#9B8E82" }}>
                <Clock className="w-3.5 h-3.5" />
                {c.sessionDuration} 分钟 / 次
              </div>
            </div>
          </div>
          {/* 简介 */}
          <p className="text-[15px] leading-relaxed line-clamp-3" style={{ color: "#4A4240" }}>{c.bio}</p>
          {/* 专长标签 */}
          {c.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {c.specialties.slice(0, 5).map(s => (
                <span key={s} className="text-[13px] px-3 py-1 rounded-full border"
                  style={{ borderColor: "#C2BDB7", color: "#3B332C", background: "transparent" }}>{s}</span>
              ))}
            </div>
          )}
          {/* 价格 + 预约按钮 */}
          <div className="flex items-center justify-between mt-1">
            <div>
              <span className="text-[24px] font-bold" style={{ color: "#3B332C" }}>¥{c.pricePerSession}</span>
              <span className="text-[14px] ml-1" style={{ color: "#9B8E82" }}>/ 次</span>
            </div>
            <motion.button whileTap={{ scale: 0.95 }}
              className="px-5 py-2.5 rounded-2xl text-white font-semibold text-[15px]"
              style={{ background: "#9CB48A" }}
              onClick={e => e.preventDefault()}>
              预约咨询
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function CounselorSkeleton() {
  return (
    <div className="py-5" style={{ borderBottom: "1px solid #EBE7DF" }}>
      <div className="flex gap-3 mb-3">
        <div className="w-[90px] h-[90px] rounded-2xl skeleton flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-5 w-28 skeleton" />
          <div className="h-4 w-20 skeleton" />
          <div className="h-4 w-16 skeleton" />
        </div>
      </div>
      <div className="space-y-2"><div className="h-4 w-full skeleton" /><div className="h-4 w-4/5 skeleton" /></div>
    </div>
  );
}

export function ExploreScreen() {
  const user = useEazo((s) => s.auth.user);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return "深夜好";
    if (h < 12) return "上午好";
    if (h < 18) return "下午好";
    return "晚上好";
  })();

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (activeCategory && !["2天内","本周"].includes(activeCategory)) {
      params.set("specialty", activeCategory);
    }
    fetch(`/api/counselors?${params}`)
      .then(r => r.json())
      .then(d => setCounselors(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [search, activeCategory]);

  const displayed = counselors.filter(c => {
    if (activeCategory === "2天内") return c.rating % 2 === 1 && c.isAccepting;
    if (activeCategory === "本周") return c.rating % 2 === 0 && c.isAccepting;
    return true;
  });

  return (
    <div className="min-h-svh" style={{ background: "#F5F1E8" }}>
      {/* ── 顶栏 ── */}
      <div className="px-5 pt-14 pb-3 flex items-center justify-between">
        <span className="text-[16px]" style={{ color: "#9B8E82" }}>{greeting}</span>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px]"
            style={{ borderColor: "#C2BDB7", color: "#7D736A", background: "white" }}>
            <BookOpen className="w-3.5 h-3.5" />新手必读
          </button>
          {user ? (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{ background: "#9CB48A", color: "white" }}>
              {(user.name ?? user.email ?? "?")[0].toUpperCase()}
            </div>
          ) : (
            <button onClick={() => auth.login()}
              className="px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ background: "transparent", color: "#9CB48A", border: "1px solid #9CB48A" }}>
              登录
            </button>
          )}
        </div>
      </div>

      {/* ── 绿色 Banner ── */}
      <div className="mx-5 mb-4 rounded-3xl overflow-hidden relative"
        style={{ background: "linear-gradient(145deg, #8DB87E 0%, #A8C898 100%)", minHeight: 160 }}>
        <div className="relative z-10 p-5">
          <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full text-[12px] font-medium"
            style={{ background: "rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.95)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
            联盟认证平台
          </div>
          <h2 className="text-[24px] font-bold leading-snug mb-4 text-white">
            神经多样性友好<br />咨询师联盟
          </h2>
          <div className="flex gap-2 flex-wrap">
            {["专业培训认证", "按你的节奏", "安全支持空间"].map(t => (
              <span key={t} className="text-[13px] px-3 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.95)" }}>{t}</span>
            ))}
          </div>
        </div>
        {/* 装饰圆 */}
        <div className="absolute right-4 top-4 w-20 h-20 rounded-full opacity-20" style={{ background: "rgba(255,255,255,0.8)" }} />
        <div className="absolute right-0 bottom-0 w-32 h-32 rounded-full opacity-10 translate-x-8 translate-y-8" style={{ background: "white" }} />
      </div>

      {/* ── 搜索 + 预约督导 ── */}
      <div className="px-5 mb-4 flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl"
          style={{ background: "white", border: "1px solid #EBE7DF" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#C2BDB7" }} />
          <input
            className="flex-1 text-[15px] bg-transparent outline-none"
            placeholder="搜索名字、擅长..."
            style={{ color: "#3B332C" }}
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Link href="/supervisor">
          <button className="px-4 py-2.5 rounded-2xl text-[14px] font-medium flex-shrink-0"
            style={{ background: "#EEE8F8", color: "#7040C0", border: "1px solid #DDD0F0" }}>
            预约督导
          </button>
        </Link>
      </div>

      {/* ── 8格分类 ── */}
      <div className="px-5 mb-3 grid grid-cols-4 gap-2">
        {CATEGORY_GRID.map(cat => {
          const active = activeCategory === cat.id;
          return (
            <motion.button key={cat.id} whileTap={{ scale: 0.93 }}
              onClick={() => setActiveCategory(active ? null : cat.id)}
              className="rounded-2xl py-3 flex items-center justify-center text-center leading-tight font-semibold text-[14px]"
              style={{
                background: active ? cat.color : cat.bg,
                color: active ? "white" : cat.color,
                minHeight: 62,
                whiteSpace: "pre-line",
              }}>
              {cat.label}
            </motion.button>
          );
        })}
      </div>

      {/* ── 筛选行 ── */}
      <div className="px-5 mb-3 flex items-center gap-2">
        {["城市", "价格", "咨询方向"].map(f => (
          <button key={f} className="flex items-center gap-1 px-3 py-2 rounded-full text-[14px]"
            style={{ background: "white", border: "1px solid #EBE7DF", color: "#7D736A" }}>
            {f}<ChevronDown className="w-3 h-3" />
          </button>
        ))}
        <button className="ml-auto w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "white", border: "1px solid #EBE7DF" }}>
          <SlidersHorizontal className="w-4 h-4" style={{ color: "#7D736A" }} />
        </button>
      </div>

      {/* ── 咨询师列表 ── */}
      <div className="px-5 pb-28">
        {loading
          ? <><CounselorSkeleton /><CounselorSkeleton /><CounselorSkeleton /></>
          : displayed.length === 0
          ? (
            <div className="text-center py-20">
              <p className="text-[16px] font-medium mb-2" style={{ color: "#3B332C" }}>暂无匹配的咨询师</p>
              <button onClick={() => { setActiveCategory(null); setSearch(""); }}
                className="text-[14px]" style={{ color: "#9CB48A" }}>清除筛选</button>
            </div>
          )
          : displayed.map(c => <CounselorCard key={c.id} c={c} />)
        }
      </div>
    </div>
  );
}
