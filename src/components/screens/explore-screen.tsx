"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, SlidersHorizontal, ChevronDown } from "lucide-react";
import Link from "next/link";

type Counselor = {
  id: string; displayName: string; title: string; bio: string;
  specialties: string[]; counselorTypes: string[];
  sessionModes: string[]; sessionDuration: number; pricePerSession: number;
  isAccepting: boolean; isSupervisor: boolean; totalHours: number;
  rating: number; location: string; avatarUrl: string | null;
};

// 8格分类标签（2行×4列）
const CATEGORY_GRID = [
  { id: "心理咨询师", label: "心理\n咨询师", bg: "#EEF5EA", text: "#3a6b30", activeBg: "#9CB48A", activeText: "#fff" },
  { id: "ADHD",       label: "ADHD",         bg: "#FDF0E8", text: "#c45c20", activeBg: "#E8936A", activeText: "#fff" },
  { id: "ASD",        label: "ASD",          bg: "#E8F2FB", text: "#2563a8", activeBg: "#7BAED4", activeText: "#fff" },
  { id: "2天内可约",  label: "2天内\n可约",  bg: "#F3F1EE", text: "#5a534e", activeBg: "#7D736A", activeText: "#fff" },
  { id: "ADHD教练",   label: "ADHD\n教练",   bg: "#F7EAF9", text: "#8b35a4", activeBg: "#C084D4", activeText: "#fff" },
  { id: "特教老师",   label: "特教\n老师",   bg: "#E6F5F2", text: "#24766a", activeBg: "#5AB4A0", activeText: "#fff" },
  { id: "儿童\n青少年", label: "儿童\n青少年", bg: "#FDEDF4", text: "#b8345a", activeBg: "#E87BA8", activeText: "#fff" },
  { id: "本周可约",   label: "本周\n可约",   bg: "#F3F1EE", text: "#5a534e", activeBg: "#7D736A", activeText: "#fff" },
];

const AVATAR_COLORS = [
  { bg: "#E5DCC5", text: "#6b5a30" },
  { bg: "#C4D8C0", text: "#2d5a28" },
  { bg: "#C0D0E0", text: "#1e3d6b" },
  { bg: "#D8C8E4", text: "#5a2878" },
  { bg: "#E8CFC8", text: "#7a3020" },
  { bg: "#B8D8D4", text: "#1a5a54" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "夜深了";
  if (h < 10) return "早上好";
  if (h < 13) return "上午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

export function ExploreScreen() {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [direction, setDirection] = useState("");

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set("q", search);
    fetch(`/api/counselors?${p}`)
      .then(r => r.json()).then(d => setCounselors(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [search]);

  // 前端筛选
  const displayed = counselors.filter(c => {
    if (!activeCategory) return true;
    if (activeCategory === "2天内可约" || activeCategory === "本周可约") return c.isAccepting;
    if (activeCategory === "ADHD") return c.specialties.includes("ADHD") || c.counselorTypes.includes("ADHD");
    if (activeCategory === "ASD") return c.specialties.some(s => s.includes("ASD") || s.includes("自闭"));
    if (activeCategory === "ADHD教练") return c.counselorTypes.includes("ADHD教练");
    if (activeCategory === "特教老师") return c.counselorTypes.includes("特教老师");
    if (activeCategory === "儿童\n青少年") return c.specialties.some(s => s.includes("儿童") || s.includes("青少年"));
    return c.counselorTypes.includes(activeCategory) || c.title.includes(activeCategory);
  });

  return (
    <div className="min-h-svh pb-24" style={{ background: "#F5F1E8" }}>
      {/* 问候行 */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <span className="text-base" style={{ color: "#7D736A" }}>{getGreeting()}</span>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#EBE7DF] text-xs"
            style={{ background: "#FDFBF7", color: "#7D736A" }}>
            📖 新手必读
          </button>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "#9CB48A" }}>1</div>
        </div>
      </div>

      {/* Banner */}
      <div className="mx-4 rounded-2xl overflow-hidden relative mb-4" style={{
        background: "linear-gradient(135deg, #9CB48A 0%, #7a9e6c 100%)", minHeight: 160
      }}>
        <div className="relative z-10 p-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3"
            style={{ background: "rgba(255,255,255,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
            <span className="text-xs text-white font-medium">联盟认证平台</span>
          </div>
          <h2 className="text-xl font-bold text-white leading-tight mb-4">
            神经多样性友好<br />咨询师联盟
          </h2>
          <div className="flex gap-2 flex-wrap">
            {["专业培训认证", "按你的节奏", "安全支持空间"].map(t => (
              <span key={t} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>{t}</span>
            ))}
          </div>
        </div>
        {/* 装饰圆 */}
        <div className="absolute right-4 top-4 w-24 h-24 rounded-full opacity-20"
          style={{ background: "rgba(255,255,255,0.5)" }} />
        <div className="absolute right-10 bottom-4 w-14 h-14 rounded-full opacity-15"
          style={{ background: "rgba(255,255,255,0.5)" }} />
      </div>

      <div className="px-4">
        {/* 搜索栏 + 预约督导 */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-full border border-[#EBE7DF]"
            style={{ background: "#FDFBF7" }}>
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#C2BDB7" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜索名字、擅长…" className="flex-1 text-sm bg-transparent focus:outline-none"
              style={{ color: "#3B332C" }} />
          </div>
          <button className="px-4 py-2.5 rounded-full text-sm font-medium text-white flex-shrink-0"
            style={{ background: "#a08bc8" }}>预约督导</button>
        </div>

        {/* 8格分类 */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {CATEGORY_GRID.map(cat => {
            const active = activeCategory === cat.id;
            return (
              <motion.button key={cat.id} whileTap={{ scale: 0.93 }}
                onClick={() => setActiveCategory(active ? null : cat.id)}
                className="rounded-2xl py-3 px-1 text-center text-xs font-semibold leading-tight transition-all"
                style={{
                  background: active ? cat.activeBg : cat.bg,
                  color: active ? cat.activeText : cat.text,
                  whiteSpace: "pre-line",
                }}>
                {cat.label}
              </motion.button>
            );
          })}
        </div>

        {/* 筛选行 */}
        <div className="flex items-center gap-2 mb-5">
          {[
            { label: "城市", val: city, setter: setCity },
            { label: "价格", val: priceRange, setter: setPriceRange },
            { label: "咨询方向", val: direction, setter: setDirection },
          ].map(({ label, val, setter }) => (
            <button key={label} className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#EBE7DF] text-xs"
              style={{ background: "#FDFBF7", color: val ? "#9CB48A" : "#7D736A" }}>
              {val || label}<ChevronDown className="w-3 h-3" />
            </button>
          ))}
          <button className="ml-auto w-9 h-9 rounded-full border border-[#EBE7DF] flex items-center justify-center"
            style={{ background: "#FDFBF7" }}>
            <SlidersHorizontal className="w-4 h-4" style={{ color: "#7D736A" }} />
          </button>
        </div>

        {/* 咨询师列表 */}
        <div className="pb-4">
          {loading ? (
            [1,2,3].map(i => (
              <div key={i} className="mb-6 pb-6 border-b border-[#EBE7DF]">
                <div className="flex gap-3 mb-3">
                  <div className="w-16 h-16 rounded-2xl skeleton flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-24 skeleton" /><div className="h-3 w-20 skeleton" />
                  </div>
                </div>
                <div className="space-y-1.5"><div className="h-3 w-full skeleton" /><div className="h-3 w-3/4 skeleton" /></div>
              </div>
            ))
          ) : displayed.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm" style={{ color: "#7D736A" }}>暂无匹配的咨询师</p>
            </div>
          ) : displayed.map((c, i) => {
            const avatarCol = AVATAR_COLORS[c.displayName.charCodeAt(0) % AVATAR_COLORS.length];
            const roleTags = [...(c.counselorTypes ?? [])];
            if (c.isSupervisor && !roleTags.includes("督导")) roleTags.push("督导");
            const availLabel = c.isAccepting ? "2 天内可约" : null;

            return (
              <Link key={c.id} href={`/counselors/${c.id}`}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`mb-6 pb-6 ${i < displayed.length - 1 ? "border-b border-[#EBE7DF]" : ""}`}>

                  {/* 头像 + 姓名行 */}
                  <div className="flex items-start gap-3 mb-3">
                    {c.avatarUrl ? (
                      <img src={c.avatarUrl} alt={c.displayName}
                        className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                        style={{ background: avatarCol.bg, color: avatarCol.text }}>
                        {c.displayName[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base font-semibold" style={{ color: "#3B332C" }}>{c.displayName}</span>
                        {availLabel && (
                          <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: "#9CB48A" }}>
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#9CB48A" }} />
                            {availLabel}
                          </span>
                        )}
                      </div>
                      {/* 角色标签 */}
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {roleTags.map(t => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "#EEF5EA", color: "#3a6b30" }}>{t}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-xs" style={{ color: "#7D736A" }}>
                        <Clock className="w-3 h-3" />
                        {c.sessionDuration} 分钟 / 次
                      </div>
                    </div>
                  </div>

                  {/* 简介 */}
                  <p className="text-sm leading-relaxed mb-3 line-clamp-3" style={{ color: "#3B332C" }}>{c.bio}</p>

                  {/* 专长标签 */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {c.specialties.slice(0, 5).map(s => (
                      <span key={s} className="text-xs px-3 py-1 rounded-full border border-[#EBE7DF]"
                        style={{ background: "#FDFBF7", color: "#3B332C" }}>{s}</span>
                    ))}
                  </div>

                  {/* 价格 + 预约按钮 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold" style={{ color: "#3B332C" }}>¥{c.pricePerSession}</span>
                      <span className="text-sm ml-1" style={{ color: "#7D736A" }}>/ 次</span>
                    </div>
                    <div className="px-5 py-2.5 rounded-full text-sm font-medium text-white"
                      style={{ background: "#9CB48A" }}>预约咨询</div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
