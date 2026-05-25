"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Clock } from "lucide-react";
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

// 8格分类
const CATEGORY_GRID = [
  { id: "心理咨询师", label: "心理\n咨询师", bg: "#EAF5E4", color: "#4A7A36" },
  { id: "ADHD",       label: "ADHD",        bg: "#FEF3E2", color: "#C86800" },
  { id: "ASD",        label: "ASD",         bg: "#EAF1FF", color: "#3060C0" },
  { id: "2天内",      label: "2天内\n可约",  bg: "#FAF8F2", color: "#888"    },
  { id: "ADHD教练",   label: "ADHD\n教练",   bg: "#FDE8F8", color: "#A030A0" },
  { id: "特教老师",   label: "特教\n老师",   bg: "#F0EBF8", color: "#7030B8" },
  { id: "儿童青少年", label: "儿童\n青少年", bg: "#E5F7F0", color: "#207860" },
  { id: "本周",       label: "本周\n可约",   bg: "#FAF8F2", color: "#888"    },
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

function getRoleTags(c: Counselor): string[] {
  const tags = [...(c.counselorTypes ?? [])];
  if (c.isSupervisor && !tags.includes("督导")) tags.push("督导");
  if (tags.length === 0 && c.title) {
    if (c.title.includes("咨询")) tags.push("心理咨询师");
    if (c.title.includes("教练")) tags.push("ADHD教练");
    if (c.title.includes("特教")) tags.push("特教老师");
  }
  return tags;
}

function getAvail(c: Counselor) {
  if (!c.isAccepting) return null;
  const h = c.rating % 3;
  if (h === 0) return { label: "2 天内可约", color: "#4CAF50" };
  if (h === 1) return { label: "本周可约",   color: "#FF9800" };
  return       { label: "接受预约",   color: "#9CB48A" };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "深夜好";
  if (h < 12) return "上午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

/* ── 漏斗图标（三横线＋竖线样式）── */
function FunnelIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 5h14M5 10h10M7 15h6" stroke="#7D736A" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14 13v4" stroke="#7D736A" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* ── 咨询师卡片 ── */
function CounselorCard({ c }: { c: Counselor }) {
  const av = getAv(c.id);
  const roleTags = getRoleTags(c);
  const avail = getAvail(c);

  return (
    <motion.div whileTap={{ scale: 0.99 }}>
      <Link href={`/counselors/${c.id}`}>
        <div className="py-5" style={{ borderBottom: "1px solid #EBE7DF" }}>
          {/* 头像 + 姓名行 */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className="w-[88px] h-[88px] rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl font-bold overflow-hidden"
              style={{ background: av.bg, color: av.text }}
            >
              {c.avatarUrl
                ? <img src={c.avatarUrl} alt={c.displayName} className="w-full h-full object-cover" />
                : c.displayName[0]
              }
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              {/* 名字 + 可约状态 */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[18px] font-semibold" style={{ color: "#2C2420" }}>
                  {c.displayName}
                </span>
                {avail && (
                  <span className="text-[12px] font-medium flex-shrink-0 flex items-center gap-1" style={{ color: avail.color }}>
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: avail.color }} />
                    {avail.label}
                  </span>
                )}
              </div>
              {/* 角色标签单独一行 */}
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {roleTags.map(t => (
                  <span key={t} className="text-[13px] px-2.5 py-0.5 rounded-full font-medium"
                    style={{ background: "#EEF5EA", color: "#4A7A36" }}>{t}</span>
                ))}
              </div>
              {/* 时长 */}
              <div className="flex items-center gap-1 text-[13px]" style={{ color: "#9B8E82" }}>
                <Clock className="w-3.5 h-3.5" />
                {c.sessionDuration} 分钟 / 次
              </div>
            </div>
          </div>
          {/* 简介 */}
          <p className="text-[15px] leading-relaxed mb-3 line-clamp-3" style={{ color: "#4A4240" }}>{c.bio}</p>
          {/* 专长标签 */}
          {c.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {c.specialties.slice(0, 5).map(s => (
                <span key={s} className="text-[13px] px-3 py-1 rounded-full border"
                  style={{ borderColor: "#DDD8D0", color: "#7D736A" }}>{s}</span>
              ))}
            </div>
          )}
          {/* 价格 + 预约按钮 */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[24px] font-bold" style={{ color: "#2C2420" }}>¥{c.pricePerSession}</span>
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

function Skeleton() {
  return (
    <div className="py-5" style={{ borderBottom: "1px solid #EBE7DF" }}>
      <div className="flex gap-3 mb-3">
        <div className="w-[88px] h-[88px] rounded-2xl skeleton flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-5 w-24 skeleton" />
          <div className="h-4 w-20 skeleton rounded-full" />
          <div className="h-4 w-16 skeleton" />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-4 skeleton" /><div className="h-4 w-4/5 skeleton" />
      </div>
    </div>
  );
}

/* ══ 主页面 ══ */
export function ExploreScreen() {
  const user = useEazo((s) => s.auth.user);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set("q", search);
    fetch(`/api/counselors?${p}`)
      .then(r => r.json())
      .then(d => setCounselors(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [search]);

  const displayed = counselors.filter(c => {
    if (!activeCategory) return true;
    if (activeCategory === "2天内" || activeCategory === "本周") return c.isAccepting;
    if (activeCategory === "ADHD教练") return c.counselorTypes?.includes("ADHD教练");
    if (activeCategory === "特教老师") return c.counselorTypes?.includes("特教老师");
    if (activeCategory === "儿童青少年") return c.specialties?.some(s => s.includes("儿童") || s.includes("青少年"));
    if (activeCategory === "ASD") return c.specialties?.some(s => s.includes("ASD") || s.includes("自闭"));
    return c.counselorTypes?.includes(activeCategory) || c.specialties?.includes(activeCategory);
  });

  return (
    <div className="min-h-svh" style={{ background: "#F5F1E8" }}>
      {/* ── 顶栏 ── */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <span className="text-[15px]" style={{ color: "#9B8E82" }}>{getGreeting()}</span>
        <div className="flex items-center gap-2">
          {/* 新手必读 */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px]"
            style={{ borderColor: "#C8C4BC", color: "#7D736A", background: "white" }}>
            <span style={{ fontSize: 16 }}>📖</span>新手必读
          </button>
          {/* 头像/登录 */}
          {user ? (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: "#9CB48A", color: "white" }}>
              {(user.name ?? user.email ?? "1")[0] === "1" ? "1" : (user.name ?? user.email ?? "?")[0].toUpperCase()}
            </div>
          ) : (
            <button onClick={() => auth.login()}
              className="w-8 h-8 rounded-full text-[13px] font-semibold"
              style={{ background: "#9CB48A", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
              登录
            </button>
          )}
        </div>
      </div>

      {/* ── Banner ── */}
      <div className="mx-4 mb-4 rounded-3xl overflow-hidden relative"
        style={{ background: "linear-gradient(145deg, #6A9058 0%, #8DB87A 55%, #A8C898 100%)", minHeight: 168 }}>
        {/* 装饰圆 */}
        <div className="absolute right-0 top-0 w-44 h-44 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.18)", transform: "translate(30%,-30%)" }} />
        <div className="absolute right-10 bottom-0 w-28 h-28 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.10)", transform: "translateY(45%)" }} />
        <div className="relative z-10 px-5 pt-5 pb-6">
          <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full text-[12px] font-medium"
            style={{ background: "rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.96)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
            联盟认证平台
          </div>
          {/* 标题 — 截图里更大 */}
          <h2 className="font-bold text-white leading-snug mb-4" style={{ fontSize: 22 }}>
            神经多样性友好<br />咨询师联盟
          </h2>
          <div className="flex gap-2 flex-wrap mb-4">
            {["专业培训认证", "按你的节奏", "安全支持空间"].map(t => (
              <span key={t} className="text-[12px] px-2.5 py-1 rounded-full font-medium"
                style={{ background: "rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.95)" }}>{t}</span>
            ))}
          </div>
          {/* 页面指示圆点 */}
          <div className="flex gap-1.5">
            {[0,1,2,3].map(i => (
              <div key={i} className="h-1.5 rounded-full"
                style={{ width: i === 0 ? 20 : 6, background: i === 0 ? "white" : "rgba(255,255,255,0.4)" }} />
            ))}
          </div>
        </div>
      </div>

      <div className="px-4">
        {/* ── 搜索 + 预约督导 ── */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-2xl"
            style={{ background: "white", border: "1px solid #E8E4DC" }}>
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#C2BDB7" }} />
            <input type="text" placeholder="搜索名字、擅长..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 text-[15px] bg-transparent focus:outline-none"
              style={{ color: "#2C2420" }} />
          </div>
          <button className="px-3.5 py-2 rounded-2xl text-[13px] font-medium whitespace-nowrap"
            style={{ background: "#F0EAF8", color: "#7040C0", border: "1px solid #D8C8F0" }}>
            预约督导
          </button>
        </div>

        {/* ── 8格分类 ── */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {CATEGORY_GRID.map(cat => {
            const active = activeCategory === cat.id;
            return (
              <motion.button key={cat.id} whileTap={{ scale: 0.93 }}
                onClick={() => setActiveCategory(active ? null : cat.id)}
                className="rounded-2xl flex items-center justify-center text-center font-semibold"
                style={{
                  background: active ? cat.color : cat.bg,
                  color: active ? "white" : cat.color,
                  minHeight: 72,
                  fontSize: 14,
                  whiteSpace: "pre-line",
                  lineHeight: 1.3,
                }}>
                {cat.label}
              </motion.button>
            );
          })}
        </div>

        {/* ── 筛选行 ── */}
        <div className="flex items-center gap-1.5 mb-4">
          {["城市", "价格", "咨询方向"].map(f => (
            <button key={f} className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-full text-[13px]"
              style={{ background: "white", border: "1px solid #E0DAD0", color: "#7D736A" }}>
              {f}<ChevronDown className="w-3 h-3 ml-0.5" style={{ color: "#C2BDB7" }} />
            </button>
          ))}
          <button className="ml-auto w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "white", border: "1px solid #E0DAD0" }}>
            <FunnelIcon />
          </button>
        </div>

        {/* ── 列表 ── */}
        <div className="pb-28">
          {loading ? (
            <><Skeleton /><Skeleton /><Skeleton /></>
          ) : displayed.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-base font-medium mb-2" style={{ color: "#2C2420" }}>暂无匹配的咨询师</p>
              <button onClick={() => { setActiveCategory(null); setSearch(""); }}
                className="text-sm" style={{ color: "#9CB48A" }}>清除筛选</button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {displayed.map(c => <CounselorCard key={c.id} c={c} />)}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
