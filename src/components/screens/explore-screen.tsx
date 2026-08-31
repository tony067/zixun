"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Clock, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getCitiesForProvince } from "@/lib/counselor-profile-data";

type Counselor = {
  id: string; displayName: string; title: string; bio: string;
  specialties: string[]; counselorTypes: string[]; isSupervisor: boolean;
  sessionModes: string[]; sessionDuration: number; pricePerSession: number;
  isAccepting: boolean; totalHours: number; rating: number; location: string;
  avatarUrl: string | null; gender?: string;
  pricingOptions?: { id: string; name: string; customName?: string; duration: number; price: number; sessions: number }[];
};

const CATEGORY_GRID = [
  { id: "心理咨询师", label: "心理\n咨询师", bg: "#EAF5E4", color: "#4A7A36" },
  { id: "ADHD",       label: "ADHD",         bg: "#FEF3E2", color: "#C86800" },
  { id: "ASD",        label: "ASD",          bg: "#EAF1FF", color: "#3060C0" },
  { id: "2天内",      label: "2天内\n可约",   bg: "#F8F6F0", color: "#999"    },
  { id: "ADHD教练",   label: "ADHD\n教练",    bg: "#FDE8F8", color: "#A030A0" },
  { id: "特教老师",   label: "特教\n老师",    bg: "#F0EBF8", color: "#7030B8" },
  { id: "儿童青少年", label: "儿童\n青少年",  bg: "#E5F7F0", color: "#207860" },
  { id: "本周",       label: "本周\n可约",    bg: "#F8F6F0", color: "#999"    },
];

const PROVINCES = [
  "全国/线上","北京","天津","上海","重庆",
  "河北","山西","辽宁","吉林","黑龙江",
  "江苏","浙江","安徽","福建","江西","山东",
  "河南","湖北","湖南","广东","海南",
  "四川","贵州","云南","陕西","甘肃",
  "青海","广西","内蒙古","西藏","宁夏","新疆",
  "香港","澳门","台湾",
];

const PRICE_OPTIONS = ["不限","300 以下","300－500","500 以上"];

const TIME_OPTIONS = ["上午（9-12时）","下午（12-18时）","晚上（18时以后）"];

const GENDER_OPTIONS = ["不限","女性咨询师","男性咨询师"];

const DIRECTION_OPTIONS = [
  "ADHD","ASD","情绪问题","睡眠问题","感官敏感","创伤",
  "读写障碍","女性成长","人际关系","职场困境","儿童/青少年",
  "家长支持","性议题","ADHD教练","特教老师",
];

const MODE_OPTIONS = ["视频","语音","面谈"];

const CARD_COLORS = [
  { tagBg: "#E0F0D8", tagText: "#2E6020", avBg: "#C8DEB8", avText: "#2E5020" },
  { tagBg: "#F2E8D8", tagText: "#6B4820", avBg: "#E8DECE", avText: "#6B5022" },
  { tagBg: "#D8ECF4", tagText: "#1A4A6A", avBg: "#C0D8E8", avText: "#1A4060" },
  { tagBg: "#EEE4CC", tagText: "#5A3A10", avBg: "#E4D8B8", avText: "#5A4218" },
  { tagBg: "#EAE0F4", tagText: "#4A1E6A", avBg: "#DDD0E8", avText: "#4A1E5A" },
  { tagBg: "#F8ECD8", tagText: "#703010", avBg: "#F0E0C8", avText: "#704020" },
];

function getCardColors(idx: number) {
  return CARD_COLORS[idx % CARD_COLORS.length];
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
  const daysOffset = (c.id.charCodeAt(c.id.length - 1) % 20) + 1;
  const earliest = new Date();
  earliest.setDate(earliest.getDate() + daysOffset);
  const month = earliest.getMonth() + 1;
  const day = earliest.getDate();
  const dateLabel = `最早 ${month}月${day}日`;
  if (h === 0) return { label: "2 天内可约", color: "#4CAF50" };
  if (h === 1) return { label: "本周可约",   color: "#FF9800" };
  return       { label: dateLabel,         color: "#9B8E82" };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "深夜好";
  if (h < 12) return "上午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

function BookLineIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-[18px] h-[18px]" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 5v11" stroke="#7D736A" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M10 6C8 5 5.5 5 3.5 6V16C5.5 15 8 15 10 16"
        stroke="#7D736A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 6C12 5 14.5 5 16.5 6V16C14.5 15 12 15 10 16"
        stroke="#7D736A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function FunnelIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4h14l-5 6v5l-4-2V10L3 4z"
        stroke="#7D736A" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

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

function CounselorCard({ c, idx }: { c: Counselor; idx: number }) {
  const router = useRouter();
  const col = getCardColors(idx);
  const roleTags = getRoleTags(c);
  const avail = getAvail(c);

  return (
    <motion.div whileTap={{ scale: 0.99 }}>
      <Link href={`/counselors/${c.id}`}>
        <div className="py-5" style={{ borderBottom: "1px solid #EBE7DF" }}>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-[88px] h-[88px] rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl font-bold overflow-hidden"
              style={{ background: col.avBg, color: col.avText }}>
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
                  <span key={t} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: col.tagBg, color: col.tagText }}>{t}</span>
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
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-baseline flex-wrap gap-x-1.5">
              {(() => {
                if (c.pricingOptions && c.pricingOptions.length > 0) {
                  const items = c.pricingOptions
                    .map(p => p.price)
                    .filter(p => p > 0);
                  if (items.length === 1) return (
                    <>
                      <span className="text-[19px] font-bold" style={{ color: "#2C2420" }}>¥{items[0]}</span>
                      <span className="text-[14px]" style={{ color: "#9B8E82" }}>/ 次起</span>
                    </>
                  );
                  return (
                    <>
                      {items.map((p, i) => (
                        <span key={i} className="text-[19px] font-bold" style={{ color: "#2C2420" }}>¥{p}</span>
                      ))}
                    </>
                  );
                }
                return (
                  <>
                    <span className="text-[19px] font-bold" style={{ color: "#2C2420" }}>¥{c.pricePerSession}</span>
                    <span className="text-[14px]" style={{ color: "#9B8E82" }}>/ 次</span>
                  </>
                );
              })()}
            </div>
            <motion.button whileTap={{ scale: 0.95 }}
              className="px-5 py-2.5 rounded-2xl text-white font-semibold text-[14px]"
              style={{ background: c.isAccepting ? "#9CB48A" : "#C2BDB7" }}
              onClick={e => {
                e.preventDefault();
                if (!c.isAccepting) return;
                router.push(`/booking/${c.id}`);
              }}>
              {c.isAccepting ? "预约咨询" : "已约满"}
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

export function ExploreScreen() {
  const { user } = useAuth();
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filterTab, setFilterTab] = useState<string | null>(null);

  const [filterProvince, setFilterProvince] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterPrice, setFilterPrice] = useState("");
  const [filterTime, setFilterTime] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterDir, setFilterDir] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<string[]>([]);

  const [showMoreProvinces, setShowMoreProvinces] = useState(false);

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
    if (activeCategory) {
      if (activeCategory === "2天内" || activeCategory === "本周") { if (!c.isAccepting) return false; }
      else if (activeCategory === "ADHD教练") { if (!c.counselorTypes?.includes("ADHD教练")) return false; }
      else if (activeCategory === "特教老师") { if (!c.counselorTypes?.includes("特教老师")) return false; }
      else if (activeCategory === "儿童青少年") { if (!c.specialties?.some(s => s.includes("儿童") || s.includes("青少年"))) return false; }
      else if (activeCategory === "ASD") { if (!c.specialties?.some(s => s.includes("ASD") || s.includes("自闭"))) return false; }
      else { if (!c.counselorTypes?.includes(activeCategory) && !c.specialties?.includes(activeCategory)) return false; }
    }
    if (filterProvince && filterProvince !== "全国/线上") {
      if (filterCity) {
        if (!c.location?.includes(filterCity)) return false;
      } else {
        const matchNames = getCitiesForProvince(filterProvince);
        const loc = c.location ?? "";
        if (!matchNames.some(n => loc.includes(n))) return false;
      }
    } else if (filterCity && filterCity !== "全国/线上") {
      if (!c.location?.includes(filterCity)) return false;
    }
    if (filterPrice && filterPrice !== "不限") {
      const price = c.pricePerSession;
      if (filterPrice === "300 以下" && price >= 300) return false;
      if (filterPrice === "300－500" && (price < 300 || price > 500)) return false;
      if (filterPrice === "500 以上" && price <= 500) return false;
    }
    if (filterTime) {
      if (!c.isAccepting) return false;
    }
    if (filterGender && filterGender !== "不限") {
      const gender = c.gender?.toLowerCase() ?? "";
      if (filterGender === "女性咨询师" && gender !== "female" && gender !== "女") return false;
      if (filterGender === "男性咨询师" && gender !== "male" && gender !== "男") return false;
    }
    if (filterDir.length > 0) {
      const hasDir = filterDir.some(d => c.specialties?.includes(d) || c.counselorTypes?.includes(d));
      if (!hasDir) return false;
    }
    if (filterMode.length > 0) {
      const hasMode = filterMode.some(m => c.sessionModes?.includes(m));
      if (!hasMode) return false;
    }
    return true;
  });

  const activeFilterCount = ((filterProvince && filterProvince !== "全国/线上") || (filterCity && filterCity !== "全国/线上") ? 1 : 0)
    + (filterPrice && filterPrice !== "不限" ? 1 : 0)
    + (filterTime ? 1 : 0)
    + (filterGender && filterGender !== "不限" ? 1 : 0)
    + filterDir.length
    + filterMode.length;

  const hasFilters = activeFilterCount > 0 || activeCategory || search;

  const clearFilters = () => {
    setFilterProvince("");
    setFilterCity("");
    setFilterPrice("");
    setFilterTime("");
    setFilterGender("");
    setFilterDir([]);
    setFilterMode([]);
    setActiveCategory(null);
    setSearch("");
    setShowFilter(false);
  };

  const applyFilters = () => {
    setShowFilter(false);
  };

  const router = useRouter();

  const displayProvinces = showMoreProvinces ? PROVINCES : PROVINCES.slice(0, 8);

  return (
    <div className="min-h-svh" style={{ background: "#F5F1E8" }}>
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px]" style={{ color: "#C2BDB7" }}>{getGreeting()}</span>
            {user && <span className="text-[13px] font-medium" style={{ color: "#7D736A" }}>{user.name ?? user.email?.split("@")[0] ?? ""}</span>}
          </div>
          <div className="text-[17px] font-semibold leading-tight mt-0.5" style={{ color: "#2C2420" }}>MindPace</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.href="/guide"}
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
            <button onClick={() => router.push("/login")}
              className="w-8 h-8 rounded-full text-[13px] font-semibold"
              style={{ background: "#9CB48A", color: "white", display:"flex", alignItems:"center", justifyContent:"center" }}>
              登录
            </button>
          )}
        </div>
      </div>

      <div className="mx-4 mb-4 rounded-3xl overflow-hidden relative"
        style={{ background: "linear-gradient(160deg, #8BAE80 0%, #9BBC90 35%, #B8D0AA 65%, #C9DAB8 100%)", minHeight: 168 }}>
        <div className="absolute right-0 top-0 w-52 h-52 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.22)", transform: "translate(32%,-32%)" }} />
        <div className="absolute right-8 top-12 w-24 h-24 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.12)", transform: "translate(20%,0)" }} />
        <div className="absolute left-0 bottom-0 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.10)", transform: "translate(-35%,35%)" }} />
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
        <div className="flex mb-4" style={{ gap: "10px" }}>
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-2xl"
            style={{ background: "white", border: "1px solid #E8E4DC" }}>
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#C2BDB7" }} />
            <input type="text" placeholder="搜索名字、擅长..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 text-[15px] bg-transparent focus:outline-none" style={{ color: "#2C2420" }} />
          </div>
          <button className="px-3 py-1 rounded-full text-[12px] font-medium whitespace-nowrap"
            style={{ background: "#F0EAF8", color: "#7040C0", border: "1px solid #D8C8F0" }}>
            预约督导
          </button>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="grid grid-cols-3 gap-1.5 flex-1">
            {CATEGORY_GRID.filter(c => c.id !== "2天内" && c.id !== "本周").map(cat => {
              const active = activeCategory === cat.id;
              return (
                <motion.button key={cat.id} whileTap={{ scale: 0.93 }}
                  onClick={() => setActiveCategory(active ? null : cat.id)}
                  className="rounded-2xl flex items-center justify-center text-center font-semibold"
                  style={{
                    background: active ? "#888" : cat.bg,
                    color: active ? "white" : cat.color,
                    fontSize: 13, whiteSpace: "pre-line", lineHeight: 1.3,
                    minHeight: 74,
                  }}>
                  {cat.label}
                </motion.button>
              );
            })}
          </div>
          <div style={{ width: 1, background: "#EBE7DF", borderRadius: 1, alignSelf: "stretch" }} />
          <div className="flex flex-col gap-1.5" style={{ width: 88 }}>
            {CATEGORY_GRID.filter(c => c.id === "2天内" || c.id === "本周").map(cat => {
              const active = activeCategory === cat.id;
              return (
                <motion.button key={cat.id} whileTap={{ scale: 0.93 }}
                  onClick={() => setActiveCategory(active ? null : cat.id)}
                  className="rounded-2xl flex items-center justify-center text-center font-semibold flex-1"
                  style={{
                    background: active ? "#888" : cat.bg,
                    color: active ? "white" : cat.color,
                    fontSize: 13, whiteSpace: "pre-line", lineHeight: 1.3,
                    minHeight: 74,
                  }}>
                  {cat.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          {[
            { key: "city",      label: filterCity || filterProvince || "地区",      active: !!(filterCity || filterProvince) },
            { key: "price",     label: filterPrice || "价格",     active: !!filterPrice },
            { key: "direction", label: filterDir.length ? `方向(${filterDir.length})` : "咨询方向", active: filterDir.length > 0 },
          ].map(f => (
            <motion.button key={f.key} whileTap={{ scale: 0.95 }}
              onClick={() => { setFilterTab(f.key); setShowFilter(true); }}
              className="flex items-center justify-center gap-0.5 px-3 py-1 rounded-full text-[12px]"
              style={{
                minWidth: 64,
                background: f.active ? "#9CB48A" : "white",
                border: `1px solid ${f.active ? "#9CB48A" : "#E0DAD0"}`,
                color: f.active ? "white" : "#7D736A",
              }}>
              {f.label}<ChevronDown className="w-2.5 h-2.5 ml-0.5" style={{ color: f.active ? "white" : "#C2BDB7" }} />
            </motion.button>
          ))}
          {hasFilters && (
            <button onClick={clearFilters} className="text-[12px]" style={{ color: "#9B8E82" }}>
              清除
            </button>
          )}
          <button onClick={() => { setFilterTab(null); setShowFilter(true); }}
            className="ml-auto w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: activeFilterCount > 0 ? "#9CB48A" : "white", border: `1px solid ${activeFilterCount > 0 ? "#9CB48A" : "#E0DAD0"}` }}>
            <FunnelIcon />
          </button>
        </div>

        <div className="pb-28">
          {loading ? (
            <><Skeleton /><Skeleton /><Skeleton /></>
          ) : displayed.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-base font-medium mb-2" style={{ color: "#2C2420" }}>暂无匹配的咨询师</p>
              <button onClick={clearFilters} className="text-sm" style={{ color: "#9CB48A" }}>清除筛选</button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {displayed.map((c, i) => <CounselorCard key={c.id} c={c} idx={i} />)}
            </AnimatePresence>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showFilter && (
          <>
            <motion.div className="fixed inset-0 bg-black/30 z-40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowFilter(false)} />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
              style={{ background: "#FDFBF7", maxHeight: "85svh" }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              drag="y" dragConstraints={{ top: 0 }} dragElastic={0.15}
              onDragEnd={(_e, info) => { if (info.offset.y > 60) setShowFilter(false); }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: "#DDD8D0" }} />
              <div className="flex items-center justify-between px-5 py-3 border-b flex-none" style={{ borderColor: "#EBE7DF" }}>
                <span className="text-base font-semibold" style={{ color: "#2C2420" }}>筛选</span>
                <button onClick={() => setShowFilter(false)} className="w-8 h-8 flex items-center justify-center rounded-full"
                  style={{ background: "#F5F1E8" }}>
                  <X className="w-4 h-4" style={{ color: "#7D736A" }} />
                </button>
              </div>
              <div className="overflow-y-auto px-5 py-4 flex-1">
                <div className="space-y-5">
                  {(filterTab === null || filterTab === "city") && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3" style={{ color: "#2C2420" }}>地区</h3>
                      {!filterProvince || filterProvince === "全国/线上" ? (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {displayProvinces.map(p => (
                              <OptionPill key={p} label={p}
                                active={filterProvince === p}
                                onToggle={() => {
                                  setFilterProvince(p);
                                  setFilterCity("");
                                  if (filterTab === "city") setShowFilter(false);
                                }} />
                            ))}
                          </div>
                          {PROVINCES.length > displayProvinces.length && (
                            <button onClick={() => setShowMoreProvinces(!showMoreProvinces)}
                              className="flex items-center gap-1 text-xs mt-2" style={{ color: "#9CB48A" }}>
                              {showMoreProvinces ? "收起" : "更多"}<ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            <button onClick={() => { setFilterProvince(""); setFilterCity(""); }}
                              className="text-xs flex items-center gap-0.5" style={{ color: "#9CB48A" }}>
                              <ChevronRight className="w-3 h-3 rotate-180" />返回省份
                            </button>
                            <span className="text-xs" style={{ color: "#7D736A" }}>已选：{filterProvince}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {getCitiesForProvince(filterProvince).map(city => (
                              <OptionPill key={city} label={city}
                                active={filterCity === city}
                                onToggle={() => {
                                  setFilterCity(city);
                                  if (filterTab === "city") setShowFilter(false);
                                }} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {(filterTab === null || filterTab === "price") && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3" style={{ color: "#2C2420" }}>费用</h3>
                      <div className="flex flex-wrap gap-2">
                        {PRICE_OPTIONS.map(p => (
                          <OptionPill key={p} label={p}
                            active={filterPrice === p}
                            onToggle={() => {
                              setFilterPrice(p);
                              if (filterTab === "price") setShowFilter(false);
                            }} />
                        ))}
                      </div>
                    </div>
                  )}

                  {filterTab === null && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3" style={{ color: "#2C2420" }}>可选时间</h3>
                      <div className="flex flex-wrap gap-2">
                        {TIME_OPTIONS.map(t => (
                          <OptionPill key={t} label={t}
                            active={filterTime === t}
                            onToggle={() => setFilterTime(filterTime === t ? "" : t)} />
                        ))}
                      </div>
                    </div>
                  )}

                  {filterTab === null && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3" style={{ color: "#2C2420" }}>性别偏好</h3>
                      <div className="flex flex-wrap gap-2">
                        {GENDER_OPTIONS.map(g => (
                          <OptionPill key={g} label={g}
                            active={filterGender === g}
                            onToggle={() => setFilterGender(filterGender === g ? "" : g)} />
                        ))}
                      </div>
                    </div>
                  )}

                  {(filterTab === null || filterTab === "direction") && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3" style={{ color: "#2C2420" }}>咨询方向</h3>
                      <div className="flex flex-wrap gap-2">
                        {DIRECTION_OPTIONS.map(d => (
                          <OptionPill key={d} label={d}
                            active={filterDir.includes(d)}
                            onToggle={() => {
                              setFilterDir(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]);
                              if (filterTab === "direction") setShowFilter(false);
                            }} />
                        ))}
                      </div>
                    </div>
                  )}

                  {filterTab === null && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3" style={{ color: "#2C2420" }}>咨询方式</h3>
                      <div className="flex flex-wrap gap-2">
                        {MODE_OPTIONS.map(m => (
                          <OptionPill key={m} label={m}
                            active={filterMode.includes(m)}
                            onToggle={() => setFilterMode(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m])} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {filterTab === null && (
                <div className="px-5 py-4 border-t flex-none" style={{ borderColor: "#EBE7DF", background: "#FDFBF7" }}>
                  <div className="flex gap-3">
                    <button onClick={clearFilters}
                      className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                      style={{ background: "#F5F1E8", color: "#7D736A", border: "1px solid #DDD8D0" }}>
                      清除全部
                    </button>
                    <button onClick={applyFilters}
                      className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white"
                      style={{ background: "#9CB48A" }}>
                      应用筛选
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}