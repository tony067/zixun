"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Clock, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEazo } from "@eazo/sdk/react";
import { auth } from "@eazo/sdk";

type Counselor = {
  id: string; displayName: string; title: string; bio: string;
  specialties: string[]; counselorTypes: string[];
  sessionModes: string[]; sessionDuration: number; pricePerSession: number;
  isAccepting: boolean; isSupervisor: boolean; totalHours: number;
  rating: number; location: string; avatarUrl: string | null;
};

const CATEGORY_GRID = [
  { id: "心理咨询师", label: "心理\n咨询师", activeBg: "#9CB48A", passiveBg: "#EEF5EA", activeText: "#fff", passiveText: "#3a6b30" },
  { id: "ADHD",       label: "ADHD",       activeBg: "#E8936A", passiveBg: "#FDF0E8", activeText: "#fff", passiveText: "#c45c20" },
  { id: "ASD",        label: "ASD",        activeBg: "#7BAED4", passiveBg: "#E8F2FB", activeText: "#fff", passiveText: "#2563a8" },
  { id: "2天内可约",  label: "2天内\n可约", activeBg: "#7D736A", passiveBg: "#F3F1EE", activeText: "#fff", passiveText: "#555" },
  { id: "ADHD教练",   label: "ADHD\n教练",  activeBg: "#C084D4", passiveBg: "#F7EAF9", activeText: "#fff", passiveText: "#8b35a4" },
  { id: "特教老师",   label: "特教\n老师",  activeBg: "#5AB4A0", passiveBg: "#E6F5F2", activeText: "#fff", passiveText: "#24766a" },
  { id: "儿童青少年", label: "儿童\n青少年", activeBg: "#E87BA8", passiveBg: "#FDEDF4", activeText: "#fff", passiveText: "#b8345a" },
  { id: "本周可约",   label: "本周\n可约",  activeBg: "#7D736A", passiveBg: "#F3F1EE", activeText: "#fff", passiveText: "#555" },
];

const AVATAR_COLORS = [
  { bg: "#E5DCC5", text: "#6b5a30" },
  { bg: "#C4D8C0", text: "#2d5a28" },
  { bg: "#C0D0E0", text: "#1e3d6b" },
  { bg: "#D8C8E4", text: "#5a2878" },
  { bg: "#E8CFC8", text: "#7a2820" },
  { bg: "#C8DCD8", text: "#1a5a50" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "夜深了";
  if (h < 11) return "早上好";
  if (h < 13) return "上午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

function getAvailBadge(id: string, isAccepting: boolean) {
  if (!isAccepting) return null;
  const hash = id.charCodeAt(id.length - 1) % 3;
  if (hash === 0) return { label: "● 2 天内可约", color: "#4a9a4a" };
  return { label: "● 本周可约",   color: "#c87820" };
}

export function ExploreScreen() {
  const user = useEazo((s) => s.auth.user);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams();
      if (search) p.set("q", search);
      fetch(`/api/counselors?${p}`)
        .then(r => r.json())
        .then(d => setCounselors(Array.isArray(d) ? d : []))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const displayed = counselors.filter(c => {
    if (!activeCat) return true;
    if (activeCat === "2天内可约" || activeCat === "本周可约") return c.isAccepting;
    if (activeCat === "ADHD教练")   return c.counselorTypes?.includes("ADHD教练");
    if (activeCat === "特教老师")   return c.counselorTypes?.includes("特教老师");
    if (activeCat === "儿童青少年") return c.specialties?.some(s => s.includes("儿童") || s.includes("青少年"));
    return c.counselorTypes?.includes(activeCat) || c.specialties?.includes(activeCat);
  });

  return (
    <div className="min-h-svh" style={{ background: "#F5F1E8" }}>

      {/* 问候行 */}
      <div className="flex items-center justify-between px-4 pt-12 pb-2">
        <span className="text-sm" style={{ color: "#7D736A" }}>{getGreeting()}</span>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#EBE7DF] bg-white text-xs" style={{ color: "#3B332C" }}>
            <span>📖</span> 新手必读
          </button>
          {user ? (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ background: "#9CB48A" }}>
              {(user.name ?? user.email ?? "U")[0].toUpperCase()}
            </div>
          ) : (
            <button onClick={() => auth.login()} className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "#9CB48A" }}>
              登
            </button>
          )}
        </div>
      </div>

      {/* Hero Banner */}
      <div className="mx-4 mb-4">
        <div className="rounded-2xl overflow-hidden relative" style={{ background: "linear-gradient(135deg,#9CB48A 0%,#7a9a70 100%)", minHeight: 140 }}>
          <div className="absolute right-0 top-0 w-28 h-28 rounded-full opacity-20" style={{ background: "#fff", transform: "translate(30%,-30%)" }} />
          <div className="absolute right-4 bottom-0 w-20 h-20 rounded-full opacity-15" style={{ background: "#fff", transform: "translateY(40%)" }} />
          <div className="relative z-10 p-5">
            <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[11px] px-2.5 py-1 rounded-full mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />联盟认证平台
            </div>
            <h2 className="text-white font-bold text-xl leading-tight mb-3">神经多样性友好<br />咨询师联盟</h2>
            <div className="flex gap-2 flex-wrap">
              {["专业培训认证","按你的节奏","安全支持空间"].map(t => (
                <span key={t} className="text-white/80 text-[11px] bg-white/15 px-2.5 py-1 rounded-full">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 搜索 + 预约督导 */}
      <div className="flex items-center gap-2 px-4 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-full px-4 py-2.5 border border-[#EBE7DF]">
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#C2BDB7" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索名字、擅长..."
            className="flex-1 text-sm bg-transparent focus:outline-none" style={{ color: "#3B332C" }} />
        </div>
        <button className="px-3 py-2.5 rounded-full border text-xs font-medium whitespace-nowrap"
          style={{ borderColor: "#d8b4fe", background: "#faf5ff", color: "#7c3aed" }}>
          预约督导
        </button>
      </div>

      {/* 分类 2×4 网格 */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-4 gap-2">
          {CATEGORY_GRID.map(cat => {
            const active = activeCat === cat.id;
            return (
              <motion.button key={cat.id} whileTap={{ scale: 0.93 }}
                onClick={() => setActiveCat(active ? null : cat.id)}
                className="rounded-2xl flex items-center justify-center text-center py-3 px-1 min-h-[72px] transition-all"
                style={{ background: active ? cat.activeBg : cat.passiveBg }}>
                <span className="text-[12px] font-semibold leading-tight whitespace-pre-line"
                  style={{ color: active ? cat.activeText : cat.passiveText }}>
                  {cat.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 快捷筛选行 */}
      <div className="flex items-center gap-2 px-4 mb-3">
        {["城市","价格","咨询方向"].map(f => (
          <button key={f} className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#EBE7DF] bg-white text-xs" style={{ color: "#3B332C" }}>
            {f} <ChevronDown className="w-3 h-3" style={{ color: "#C2BDB7" }} />
          </button>
        ))}
        <button className="ml-auto w-8 h-8 rounded-full border border-[#EBE7DF] bg-white flex items-center justify-center">
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" stroke="#7D736A" strokeWidth="1.5">
            <path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* 咨询师列表 */}
      <div className="px-4 pb-32">
        {loading ? (
          [0,1,2].map(i => (
            <div key={i} className="mb-8">
              <div className="flex gap-4 mb-3">
                <div className="w-24 h-24 rounded-2xl skeleton flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-5 w-20 skeleton" /> <div className="h-4 w-28 skeleton" /> <div className="h-4 w-16 skeleton" />
                </div>
              </div>
              <div className="space-y-1.5 mb-3"><div className="h-4 w-full skeleton" /><div className="h-4 w-4/5 skeleton" /></div>
              <div className="h-8 w-full skeleton rounded-full" />
            </div>
          ))
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: "#7D736A" }}>暂无匹配的咨询师</div>
        ) : displayed.map((c, i) => {
          const col = AVATAR_COLORS[i % AVATAR_COLORS.length];
          const avail = getAvailBadge(c.id, c.isAccepting);
          const roles = [...(c.counselorTypes ?? [])];
          if (c.isSupervisor && !roles.includes("督导")) roles.push("督导");
          return (
            <Link key={c.id} href={`/counselors/${c.id}`}>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 280, damping: 32 }}
                className="mb-8">
                <div className="flex gap-4 items-start mb-3">
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} alt={c.displayName} className="w-24 h-24 rounded-2xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl font-bold"
                      style={{ background: col.bg, color: col.text }}>{c.displayName[0]}</div>
                  )}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className="text-base font-semibold" style={{ color: "#3B332C" }}>{c.displayName}</span>
                      {avail && <span className="text-[11px] font-medium flex-shrink-0" style={{ color: avail.color }}>{avail.label}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {roles.map(r => (
                        <span key={r} className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "#EEF5EA", color: "#3a6b30" }}>{r}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-xs" style={{ color: "#7D736A" }}>
                      <Clock className="w-3.5 h-3.5" />{c.sessionDuration} 分钟 / 次
                    </div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-3 line-clamp-3" style={{ color: "#3B332C" }}>{c.bio}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {c.specialties.slice(0, 4).map(s => (
                    <span key={s} className="text-[13px] px-3 py-1 rounded-full border border-[#EBE7DF] bg-[#FDFBF7]" style={{ color: "#3B332C" }}>{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold" style={{ color: "#3B332C" }}>¥{c.pricePerSession}</span>
                    <span className="text-sm ml-1" style={{ color: "#7D736A" }}>/ 次</span>
                  </div>
                  <div className="px-5 py-2.5 rounded-full text-sm font-medium text-white" style={{ background: "#9CB48A" }}>预约咨询</div>
                </div>
                {i < displayed.length - 1 && <div className="mt-6 border-t border-[#EBE7DF]" />}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
