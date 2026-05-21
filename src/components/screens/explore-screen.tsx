"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, ChevronDown, Clock } from "lucide-react";
import Link from "next/link";
import { useEazo } from "@eazo/sdk/react";

type Counselor = {
  id: string; displayName: string; title: string; bio: string;
  specialties: string[]; counselorTypes: string[]; isSupervisor: boolean;
  sessionModes: string[]; sessionDuration: number; pricePerSession: number;
  isAccepting: boolean; totalHours: number; rating: number;
  location: string; avatarUrl: string | null; workingGroups: string[];
};

// 分类标签（2×4格）
const CATEGORY_GRID = [
  { id: "心理咨询师", label: "心理\n咨询师", bg: "#EBF2E6", color: "#4A7A40", type: "role" },
  { id: "ADHD",       label: "ADHD",     bg: "#FEF3E2", color: "#C47F17", type: "role" },
  { id: "ASD",        label: "ASD",      bg: "#E6EFF8", color: "#2E6DA4", type: "role" },
  { id: "2days",      label: "2天内\n可约", bg: "#F5F5F5", color: "#555",  type: "avail" },
  { id: "ADHD教练",   label: "ADHD\n教练", bg: "#F0EAF8", color: "#6B3FA0", type: "role" },
  { id: "特教老师",   label: "特教\n老师", bg: "#FCE8E8", color: "#C0392B", type: "role" },
  { id: "儿童青少年", label: "儿童\n青少年", bg: "#E8F5F0", color: "#1A7A5A", type: "role" },
  { id: "week",       label: "本周\n可约",  bg: "#F5F5F5", color: "#555",  type: "avail" },
];

const CITY_OPTIONS = ["不限","北京","上海","广州","深圳","成都","杭州","南京","线上"];
const PRICE_OPTIONS = ["不限","300以下","300-500","500-800","800以上"];
const DIRECTION_OPTIONS = ["不限","ADHD","ASD","焦虑","情绪调节","感官敏感","执行功能","创伤","读写障碍","睡眠","家庭关系","女性成长"];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6)  return "夜深了";
  if (h < 11) return "早上好";
  if (h < 13) return "上午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

function getAvailBadge(c: Counselor): { text: string; color: string } | null {
  if (!c.isAccepting) return null;
  const hash = c.id.charCodeAt(c.id.length - 1);
  if (hash % 3 === 0) return { text: "● 2 天内可约", color: "#3D9970" };
  if (hash % 3 === 1) return { text: "● 本周可约",   color: "#C47F17" };
  return { text: "● 接受预约",   color: "#3D9970" };
}

// 头像颜色
const AVATAR_COLORS = [
  { bg: "#D4C5B0", text: "#5C4A2A" },
  { bg: "#B8D0C8", text: "#2A5C50" },
  { bg: "#C8CEDE", text: "#2A3E5C" },
  { bg: "#D0C8D8", text: "#4A3A5C" },
  { bg: "#D0D8C0", text: "#3A4E2A" },
];

function CounselorCard({ c, idx }: { c: Counselor; idx: number }) {
  const col = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const badge = getAvailBadge(c);
  const roleTags = c.counselorTypes?.length ? c.counselorTypes : (c.isSupervisor ? ["督导"] : []);

  return (
    <Link href={`/counselors/${c.id}`}>
      <div className="py-5 border-b border-[#EBE7DF]">
        <div className="flex gap-4 items-start mb-3">
          {/* 头像 */}
          <div
            className="w-[88px] h-[88px] rounded-[18px] flex items-center justify-center text-3xl font-bold flex-shrink-0"
            style={{ background: col.bg, color: col.text }}
          >
            {c.displayName[0]}
          </div>
          {/* 信息区 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="text-lg font-semibold text-[#3B332C]">{c.displayName}</span>
              {badge && <span className="text-xs font-medium flex-shrink-0 mt-0.5" style={{ color: badge.color }}>{badge.text}</span>}
            </div>
            {/* 角色标签 */}
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {roleTags.map(t => (
                <span key={t} className="text-xs px-2.5 py-0.5 rounded-full font-medium text-[#4A7A40] bg-[#EBF2E6]">{t}</span>
              ))}
            </div>
            {/* 时长 */}
            <div className="flex items-center gap-1 text-sm text-[#7D736A]">
              <Clock className="w-3.5 h-3.5" />
              <span>{c.sessionDuration} 分钟 / 次</span>
            </div>
          </div>
        </div>

        {/* 简介 */}
        <p className="text-sm text-[#5C5552] leading-relaxed mb-3 line-clamp-3">{c.bio}</p>

        {/* 专长标签 */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {c.specialties.slice(0, 5).map(s => (
            <span key={s} className="text-xs px-3 py-1 rounded-full border border-[#DDD8D0] text-[#6B6560]">{s}</span>
          ))}
        </div>

        {/* 价格 + 预约按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-[#3B332C]">¥{c.pricePerSession}</span>
            <span className="text-sm text-[#9B9590] ml-1">/ 次</span>
          </div>
          <motion.div
            whileTap={{ scale: 0.96 }}
            className="px-6 py-2.5 rounded-2xl text-sm font-semibold text-white"
            style={{ background: "#9CB48A" }}
          >
            预约咨询
          </motion.div>
        </div>
      </div>
    </Link>
  );
}

function DropdownPanel({ label, options, value, onChange, onClose }: {
  label: string; options: string[]; value: string;
  onChange: (v: string) => void; onClose: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="absolute top-full left-0 mt-1 bg-white rounded-2xl shadow-xl border border-[#EBE7DF] z-50 min-w-[140px] overflow-hidden">
      {options.map(opt => (
        <button key={opt} onClick={() => { onChange(opt); onClose(); }}
          className={`w-full text-left px-4 py-3 text-sm transition-colors ${opt === value ? "text-[#9CB48A] font-semibold bg-[#F0F7EC]" : "text-[#3B332C] hover:bg-[#F9F6F0]"}`}>
          {opt}
        </button>
      ))}
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="py-5 border-b border-[#EBE7DF]">
      <div className="flex gap-4 mb-3">
        <div className="w-[88px] h-[88px] rounded-[18px] skeleton flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-28 skeleton" />
          <div className="h-5 w-20 rounded-full skeleton" />
          <div className="h-4 w-24 skeleton" />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-4 w-full skeleton" />
        <div className="h-4 w-4/5 skeleton" />
        <div className="h-4 w-2/3 skeleton" />
      </div>
      <div className="flex gap-2 mb-3">
        {[1,2,3].map(i => <div key={i} className="h-7 w-16 rounded-full skeleton" />)}
      </div>
    </div>
  );
}

export function ExploreScreen() {
  const user = useEazo((s) => s.auth.user);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [city, setCity] = useState("不限");
  const [price, setPrice] = useState("不限");
  const [direction, setDirection] = useState("不限");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (search) sp.set("q", search);
    fetch(`/api/counselors?${sp}`)
      .then(r => r.json())
      .then(d => setCounselors(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [search]);

  // 客户端筛选
  const filtered = counselors.filter(c => {
    if (activeCategory) {
      if (activeCategory === "2days" || activeCategory === "week") {
        if (!c.isAccepting) return false;
      } else if (!c.counselorTypes?.includes(activeCategory) && c.isSupervisor !== (activeCategory === "督导") && activeCategory !== "ASD") {
        const specMatch = c.specialties?.some(s => s.includes(activeCategory));
        const typeMatch = c.counselorTypes?.includes(activeCategory);
        const roleMatch = activeCategory === "ADHD教练" && c.counselorTypes?.includes("ADHD教练");
        const specTagMatch = c.specialties?.includes(activeCategory);
        if (!specMatch && !typeMatch && !specTagMatch) return false;
      }
    }
    if (direction !== "不限" && !c.specialties?.includes(direction)) return false;
    return true;
  });

  const FILTER_ROW = [
    { id: "city",  label: "城市",    value: city,      setValue: setCity,      options: CITY_OPTIONS },
    { id: "price", label: "价格",    value: price,     setValue: setPrice,     options: PRICE_OPTIONS },
    { id: "dir",   label: "咨询方向", value: direction, setValue: setDirection, options: DIRECTION_OPTIONS },
  ];

  return (
    <div className="min-h-svh bg-[#F5F1E8]">
      {/* 顶栏 */}
      <div className="sticky top-0 z-20 bg-[#F5F1E8] px-4 pt-4 pb-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-base text-[#7D736A]">{getGreeting()}</span>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#EBE7DF] bg-white text-xs text-[#3B332C]">
              <span>📖</span>新手必读
            </button>
            <div className="w-8 h-8 rounded-full bg-[#9CB48A] flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0] ?? user?.email?.[0] ?? "?"}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4">
        {/* Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden mb-4"
          style={{ background: "linear-gradient(135deg, #8FAF7E 0%, #A8C49A 50%, #C9D9BF 100%)", minHeight: 160 }}>
          <div className="p-5 pb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3 text-xs font-medium"
              style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}>
              ● 联盟认证平台
            </div>
            <h1 className="text-xl font-bold text-white mb-3 leading-tight">
              神经多样性友好<br />咨询师联盟
            </h1>
            <div className="flex gap-2 flex-wrap">
              {["专业培训认证","按你的节奏","安全支持空间"].map(t => (
                <span key={t} className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}>{t}</span>
              ))}
            </div>
          </div>
          <div className="absolute right-0 top-0 w-36 h-36 rounded-full opacity-20"
            style={{ background: "#fff", transform: "translate(30%,-30%)" }} />
          <div className="absolute right-8 bottom-0 w-24 h-24 rounded-full opacity-15"
            style={{ background: "#fff", transform: "translateY(40%)" }} />
        </div>

        {/* 搜索栏 */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-full bg-white border border-[#EBE7DF]">
            <Search className="w-4 h-4 text-[#BCBAB7] flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜索名字、擅长..."
              className="flex-1 text-sm bg-transparent focus:outline-none text-[#3B332C] placeholder:text-[#BCBAB7]" />
          </div>
          <Link href="/booking-supervisor">
            <motion.button whileTap={{ scale: 0.95 }}
              className="px-4 py-3 rounded-full text-sm font-semibold text-white flex-shrink-0"
              style={{ background: "#7C6FAC" }}>
              预约督导
            </motion.button>
          </Link>
        </div>

        {/* 2×4 分类格 */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {CATEGORY_GRID.map(cat => {
            const active = activeCategory === cat.id;
            return (
              <motion.button key={cat.id} whileTap={{ scale: 0.93 }}
                onClick={() => setActiveCategory(active ? null : cat.id)}
                className="rounded-2xl py-3 flex items-center justify-center text-center transition-all"
                style={{
                  background: active ? cat.color : cat.bg,
                  border: active ? `1.5px solid ${cat.color}` : "1.5px solid transparent",
                }}>
                <span className="text-xs font-semibold leading-tight whitespace-pre-line"
                  style={{ color: active ? "#fff" : cat.color }}>
                  {cat.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* 筛选行 */}
        <div className="flex items-center gap-2 mb-5 relative">
          {FILTER_ROW.map(f => (
            <div key={f.id} className="relative">
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => setOpenDropdown(openDropdown === f.id ? null : f.id)}
                className={`flex items-center gap-1 px-3.5 py-2 rounded-full border text-sm font-medium transition-colors ${f.value !== "不限" ? "bg-[#F0F7EC] border-[#9CB48A] text-[#4A7A40]" : "bg-white border-[#DDD8D0] text-[#3B332C]"}`}>
                {f.value !== "不限" ? f.value : f.label}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === f.id ? "rotate-180" : ""}`} />
              </motion.button>
              <AnimatePresence>
                {openDropdown === f.id && (
                  <DropdownPanel label={f.label} options={f.options} value={f.value}
                    onChange={f.setValue} onClose={() => setOpenDropdown(null)} />
                )}
              </AnimatePresence>
            </div>
          ))}
          <motion.button whileTap={{ scale: 0.9 }} className="ml-auto w-9 h-9 rounded-full bg-white border border-[#DDD8D0] flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4 text-[#7D736A]" />
          </motion.button>
        </div>

        {/* 咨询师列表 */}
        <div className="pb-28">
          {loading ? (
            [1,2,3].map(i => <Skeleton key={i} />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-base font-medium text-[#3B332C] mb-2">暂无匹配的咨询师</p>
              <p className="text-sm text-[#9B9590]">试试调整筛选条件</p>
            </div>
          ) : (
            <AnimatePresence>
              {filtered.map((c, i) => <CounselorCard key={c.id} c={c} idx={i} />)}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* 关闭浮层 */}
      {openDropdown && <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />}
    </div>
  );
}
