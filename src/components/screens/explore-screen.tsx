"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Clock, X } from "lucide-react";
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
  { id: "ADHD",       label: "ADHD",         bg: "#FEF3E2", color: "#C86800" },
  { id: "ASD",        label: "ASD",          bg: "#EAF1FF", color: "#3060C0" },
  { id: "2天内",      label: "2天内\n可约",   bg: "#FAF8F2", color: "#888"    },
  { id: "ADHD教练",   label: "ADHD\n教练",    bg: "#FDE8F8", color: "#A030A0" },
  { id: "特教老师",   label: "特教\n老师",    bg: "#F0EBF8", color: "#7030B8" },
  { id: "儿童青少年", label: "儿童\n青少年",  bg: "#E5F7F0", color: "#207860" },
  { id: "本周",       label: "本周\n可约",    bg: "#FAF8F2", color: "#888"    },
];

// 省份列表
const PROVINCES = [
  "全国/线上","北京","天津","上海","重庆",
  "河北","山西","辽宁","吉林","黑龙江",
  "江苏","浙江","安徽","福建","江西","山东",
  "河南","湖北","湖南","广东","海南",
  "四川","贵州","云南","陕西","甘肃",
  "青海","广西","内蒙古","西藏","宁夏","新疆",
  "香港","澳门","台湾",
];

// 价格选项（照截图）
const PRICE_OPTIONS = ["不限","300 以下","300－500","500 以上"];

// 咨询方向选项（照截图）
const DIRECTION_OPTIONS = [
  "ADHD","ASD","情绪问题","睡眠问题","感官敏感","创伤",
  "读写障碍","女性成长","人际关系","职场困境","儿童/青少年",
  "家长支持","性议题","ADHD教练","特教老师",
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

/* ── 线条风书本图标（打开书本，两页）── */
function BookLineIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
      {/* 翻开的书：两页向外展开 */}
      <path d="M10 5v11" stroke="#7D736A" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M10 6C8 5 5.5 5 3.5 6V16C5.5 15 8 15 10 16"
        stroke="#7D736A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 6C12 5 14.5 5 16.5 6V16C14.5 15 12 15 10 16"
        stroke="#7D736A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── 标准漏斗图标（宽顶窄底三角形，无竖线）── */
function BookIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-[18px] h-[18px]" xmlns="http://www.w3.org/2000/svg">
      {/* 左页 */}
      <path d="M10 16V5C10 5 7.5 4 5 4.5C3.5 4.8 3 5.5 3 5.5V16.5C3 16.5 4 16 6 16C8 16 10 16 10 16Z"
        stroke="#7D736A" strokeWidth="1.4" strokeLinejoin="round"/>
      {/* 右页 */}
      <path d="M10 16V5C10 5 12.5 4 15 4.5C16.5 4.8 17 5.5 17 5.5V16.5C17 16.5 16 16 14 16C12 16 10 16 10 16Z"
        stroke="#7D736A" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  );
}

function FunnelIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
      {/* 漏斗：平顶大梯形收窄到竖管 */}
      <path d="M2.5 4h15l-5.5 6.5V17l-4-2v-4.5L2.5 4z"
        stroke="#7D736A" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

/* ── 底部弹窗基座 ── */
function BottomSheet({ title, onClose, children }: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <motion.div className="fixed inset-0 bg-black/30 z-40"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} />
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
        style={{ background: "#FDFBF7", maxHeight: "80svh" }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        drag="y" dragConstraints={{ top: 0 }} dragElastic={0.15}
        onDragEnd={(_e, info) => { if (info.offset.y > 60) onClose(); }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: "#DDD8D0" }} />
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#EBE7DF" }}>
          <span className="text-base font-semibold" style={{ color: "#2C2420" }}>{title}</span>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: "#F5F1E8" }}>
            <X className="w-4 h-4" style={{ color: "#7D736A" }} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: "calc(80svh - 80px)" }}>
          {children}
        </div>
      </motion.div>
    </>
  );
}

/* ── 选项胶囊 ── */
function OptionPill({ label, active, onToggle }: {
  label: string; active: boolean; onToggle: () => void;
}) {
  return (
    <motion.button whileTap={{ scale: 0.94 }} onClick={onToggle}
      className="px-3.5 py-1.5 rounded-full text-sm border transition-colors"
      style={{
        background: active ? "#9CB48A" : "#F5F1E8",
        color: active ? "white" : "#7D736A",
        borderColor: active ? "#9CB48A" : "#DDD8D0",
      }}>
      {label}
    </motion.button>
  );
}

/* ── 新手必读内容 ── */
const GUIDE_SECTIONS = [
  {
    title: "什么是心理咨询？",
    content: "心理咨询是一个安全、保密的空间，由经过专业训练的咨询师陪伴你探索内心、处理困扰。它不是「聊天」，也不是「被教导」，而是帮助你更了解自己、找到属于自己的方式。",
  },
  {
    title: "神经多样性是什么？",
    content: "神经多样性（Neurodiversity）指的是人类大脑和神经系统的自然多样性，包括 ADHD、ASD（自闭症谱系）、读写障碍等。这些不是「病」，而是不同的认知和感知方式。",
  },
  {
    title: "如何选择咨询师？",
    content: "你可以关注：① 咨询师的擅长领域是否和你的困扰匹配；② 咨询方式（视频/语音/面谈）是否适合你；③ 价格是否在你的预算内。第一次可以选几位都看看，感受一下是否「合得来」。",
  },
  {
    title: "第一次咨询会发生什么？",
    content: "第一次通常是「初始访谈」——咨询师会了解你来访的原因、背景和期望。你不需要准备很多，放松地说说自己的情况就好。这也是你评估咨询师是否适合自己的机会。",
  },
  {
    title: "咨询的频率和周期？",
    content: "大多数咨询每1-2周一次，每次50分钟左右。一般建议先做3-6次，再决定是否继续。有的人咨询几次就有很大收获，有的人会长期咨询陪伴自己成长——没有固定标准。",
  },
  {
    title: "关于保密原则",
    content: "咨询内容严格保密。只有在你有伤害自己或他人的紧急风险时，咨询师才会打破保密。你在咨询室说的话，不会传到任何其他人那里。",
  },
];

/* ── 咨询师卡片 ── */
function CounselorCard({ c }: { c: Counselor }) {
  const av = getAv(c.id);
  const roleTags = getRoleTags(c);
  const avail = getAvail(c);

  return (
    <motion.div whileTap={{ scale: 0.99 }}>
      <Link href={`/counselors/${c.id}`}>
        <div className="py-5" style={{ borderBottom: "1px solid #EBE7DF" }}>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-[88px] h-[88px] rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl font-bold overflow-hidden"
              style={{ background: av.bg, color: av.text }}>
              {c.avatarUrl
                ? <img src={c.avatarUrl} alt={c.displayName} className="w-full h-full object-cover" />
                : c.displayName[0]}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[18px] font-semibold" style={{ color: "#2C2420" }}>{c.displayName}</span>
                {avail && (
                  <span className="text-[12px] font-medium flex-shrink-0 flex items-center gap-1" style={{ color: avail.color }}>
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: avail.color }} />
                    {avail.label}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {roleTags.map(t => (
                  <span key={t} className="text-[13px] px-2.5 py-0.5 rounded-full font-medium"
                    style={{ background: "#EEF5EA", color: "#4A7A36" }}>{t}</span>
                ))}
              </div>
              <div className="flex items-center gap-1 text-[13px]" style={{ color: "#9B8E82" }}>
                <Clock className="w-3.5 h-3.5" />
                {c.sessionDuration} 分钟 / 次
              </div>
            </div>
          </div>
          <p className="text-[15px] leading-relaxed mb-3 line-clamp-3" style={{ color: "#4A4240" }}>{c.bio}</p>
          {c.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {c.specialties.slice(0, 5).map(s => (
                <span key={s} className="text-[13px] px-3 py-1 rounded-full border"
                  style={{ borderColor: "#DDD8D0", color: "#7D736A" }}>{s}</span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[24px] font-bold" style={{ color: "#2C2420" }}>¥{c.pricePerSession}</span>
              <span className="text-[14px] ml-1" style={{ color: "#9B8E82" }}>/ 次</span>
            </div>
            <motion.button whileTap={{ scale: 0.95 }}
              className="px-5 py-2.5 rounded-2xl text-white font-semibold text-[15px]"
              style={{ background: "#9CB48A" }} onClick={e => e.preventDefault()}>
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
          <div className="h-5 w-24 skeleton" /><div className="h-4 w-20 skeleton rounded-full" /><div className="h-4 w-16 skeleton" />
        </div>
      </div>
      <div className="space-y-2 mb-3"><div className="h-4 skeleton" /><div className="h-4 w-4/5 skeleton" /></div>
    </div>
  );
}

/* ══ 主屏幕 ══ */
export function ExploreScreen() {
  const user = useEazo((s) => s.auth.user);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // 筛选状态
  const [filterCity, setFilterCity] = useState("");
  const [filterPrice, setFilterPrice] = useState("");
  const [filterDir, setFilterDir] = useState<string[]>([]);

  // 弹窗显示状态
  const [openModal, setOpenModal] = useState<"city"|"price"|"direction"|"guide"|null>(null);

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
    if (!activeCategory) {
      // 只应用弹窗筛选
    } else {
      if (activeCategory === "2天内" || activeCategory === "本周") { if (!c.isAccepting) return false; }
      else if (activeCategory === "ADHD教练") { if (!c.counselorTypes?.includes("ADHD教练")) return false; }
      else if (activeCategory === "特教老师") { if (!c.counselorTypes?.includes("特教老师")) return false; }
      else if (activeCategory === "儿童青少年") { if (!c.specialties?.some(s => s.includes("儿童") || s.includes("青少年"))) return false; }
      else if (activeCategory === "ASD") { if (!c.specialties?.some(s => s.includes("ASD") || s.includes("自闭"))) return false; }
      else { if (!c.counselorTypes?.includes(activeCategory) && !c.specialties?.includes(activeCategory)) return false; }
    }
    // 省份筛选
    if (filterCity && filterCity !== "全国/线上") {
      if (!c.location?.includes(filterCity)) return false;
    }
    // 价格筛选
    if (filterPrice && filterPrice !== "不限") {
      const price = c.pricePerSession;
      if (filterPrice === "300 以下" && price >= 300) return false;
      if (filterPrice === "300－500" && (price < 300 || price > 500)) return false;
      if (filterPrice === "500 以上" && price <= 500) return false;
    }
    // 咨询方向筛选
    if (filterDir.length > 0) {
      const hasDir = filterDir.some(d => c.specialties?.includes(d) || c.counselorTypes?.includes(d));
      if (!hasDir) return false;
    }
    return true;
  });

  // 活跃筛选数量
  const activeFilterCount = (filterCity && filterCity !== "全国/线上" ? 1 : 0)
    + (filterPrice && filterPrice !== "不限" ? 1 : 0)
    + filterDir.length;

  return (
    <div className="min-h-svh" style={{ background: "#F5F1E8" }}>
      {/* ── 顶栏 ── */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <span className="text-[15px]" style={{ color: "#9B8E82" }}>{getGreeting()}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenModal("guide")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px]"
            style={{ borderColor: "#C8C4BC", color: "#7D736A", background: "white" }}>
            <BookLineIcon />新手必读
          </button>
          {user ? (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: "#9CB48A", color: "white" }}>
              {(user.name ?? user.email ?? "?")[0].toUpperCase()}
            </div>
          ) : (
            <button onClick={() => auth.login()}
              className="w-8 h-8 rounded-full text-[13px] font-semibold"
              style={{ background: "#9CB48A", color: "white", display:"flex", alignItems:"center", justifyContent:"center" }}>
              登录
            </button>
          )}
        </div>
      </div>

      {/* ── Banner ── */}
      <div className="mx-4 mb-4 rounded-3xl overflow-hidden relative"
        style={{ background: "linear-gradient(145deg, #6A9058 0%, #8DB87A 55%, #A8C898 100%)", minHeight: 168 }}>
        <div className="absolute right-0 top-0 w-44 h-44 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.18)", transform: "translate(30%,-30%)" }} />
        <div className="absolute right-10 bottom-0 w-28 h-28 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.10)", transform: "translateY(45%)" }} />
        <div className="relative z-10 px-5 pt-5 pb-6">
          <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full text-[12px] font-medium"
            style={{ background: "rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.96)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />联盟认证平台
          </div>
          <h2 className="font-bold text-white leading-snug mb-4" style={{ fontSize: 22 }}>
            神经多样性友好<br />咨询师联盟
          </h2>
          <div className="flex gap-2 flex-wrap mb-4">
            {["专业培训认证","按你的节奏","安全支持空间"].map(t => (
              <span key={t} className="text-[12px] px-2.5 py-1 rounded-full font-medium"
                style={{ background: "rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.95)" }}>{t}</span>
            ))}
          </div>
          <div className="flex gap-1.5">
            {[0,1,2,3].map(i => (
              <div key={i} className="h-1.5 rounded-full"
                style={{ width: i===0?20:6, background: i===0?"white":"rgba(255,255,255,0.4)" }} />
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
              className="flex-1 text-[15px] bg-transparent focus:outline-none" style={{ color: "#2C2420" }} />
          </div>
          {/* 预约督导：更紧凑 */}
          <button className="px-3 py-1 rounded-xl text-[12px] font-medium whitespace-nowrap"
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
                  minHeight: 72, fontSize: 14, whiteSpace: "pre-line", lineHeight: 1.3,
                }}>
                {cat.label}
              </motion.button>
            );
          })}
        </div>

        {/* ── 筛选行 ── */}
        <div className="flex items-center gap-1.5 mb-4">
          {[
            { key: "city",      label: filterCity || "城市",      active: !!filterCity },
            { key: "price",     label: filterPrice || "价格",     active: !!filterPrice },
            { key: "direction", label: filterDir.length ? `方向(${filterDir.length})` : "咨询方向", active: filterDir.length > 0 },
          ].map(f => (
            <motion.button key={f.key} whileTap={{ scale: 0.95 }}
              onClick={() => setOpenModal(f.key as "city"|"price"|"direction")}
              className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-full text-[13px]"
              style={{
                background: f.active ? "#9CB48A" : "white",
                border: `1px solid ${f.active ? "#9CB48A" : "#E0DAD0"}`,
                color: f.active ? "white" : "#7D736A",
              }}>
              {f.label}<ChevronDown className="w-3 h-3 ml-0.5" style={{ color: f.active ? "white" : "#C2BDB7" }} />
            </motion.button>
          ))}
          <button className="ml-auto w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: activeFilterCount > 0 ? "#9CB48A" : "white", border: `1px solid ${activeFilterCount > 0 ? "#9CB48A" : "#E0DAD0"}` }}>
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
              <button onClick={() => { setActiveCategory(null); setSearch(""); setFilterCity(""); setFilterPrice(""); setFilterDir([]); }}
                className="text-sm" style={{ color: "#9CB48A" }}>清除筛选</button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {displayed.map(c => <CounselorCard key={c.id} c={c} />)}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ══ 弹窗 ══ */}
      <AnimatePresence>
        {/* 城市/省份弹窗 */}
        {openModal === "city" && (
          <BottomSheet title="选择省份" onClose={() => setOpenModal(null)}>
            <div className="flex flex-wrap gap-2 pb-4">
              {PROVINCES.map(p => (
                <OptionPill key={p} label={p}
                  active={filterCity === p}
                  onToggle={() => { setFilterCity(filterCity === p ? "" : p); setOpenModal(null); }} />
              ))}
            </div>
          </BottomSheet>
        )}

        {/* 价格弹窗 */}
        {openModal === "price" && (
          <BottomSheet title="价格" onClose={() => setOpenModal(null)}>
            <div className="flex flex-wrap gap-2 pb-4">
              {PRICE_OPTIONS.map(p => (
                <OptionPill key={p} label={p}
                  active={filterPrice === p}
                  onToggle={() => { setFilterPrice(filterPrice === p ? "" : p); setOpenModal(null); }} />
              ))}
            </div>
          </BottomSheet>
        )}

        {/* 咨询方向弹窗 */}
        {openModal === "direction" && (
          <BottomSheet title="咨询方向" onClose={() => setOpenModal(null)}>
            <div className="flex flex-wrap gap-2 pb-6">
              {DIRECTION_OPTIONS.map(d => (
                <OptionPill key={d} label={d}
                  active={filterDir.includes(d)}
                  onToggle={() => setFilterDir(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])} />
              ))}
            </div>
            {filterDir.length > 0 && (
              <div className="pt-2 border-t" style={{ borderColor: "#EBE7DF" }}>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setOpenModal(null)}
                  className="w-full py-3 rounded-2xl text-white font-semibold"
                  style={{ background: "#9CB48A" }}>
                  确认（已选 {filterDir.length} 项）
                </motion.button>
              </div>
            )}
          </BottomSheet>
        )}

        {/* 新手必读弹窗 */}
        {openModal === "guide" && (
          <BottomSheet title="新手必读" onClose={() => setOpenModal(null)}>
            <div className="space-y-5 pb-6">
              {GUIDE_SECTIONS.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                      style={{ background: "#9CB48A" }}>{i + 1}</span>
                    <span className="text-[15px] font-semibold" style={{ color: "#2C2420" }}>{s.title}</span>
                  </div>
                  <p className="text-[14px] leading-relaxed ml-7" style={{ color: "#5C5552" }}>{s.content}</p>
                </div>
              ))}
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>
    </div>
  );
}
