import { useState, useEffect, useRef } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Input, ScrollView, Image, Swiper, SwiperItem, Textarea } from '@tarojs/components'
import { request } from '../../api/request'
import { useAuthStore } from '../../store/authStore'

import { useState, useEffect } from "react";

type Counselor = {
  id: string; displayName: string; title: string; bio: string;
  specialties: string[]; counselorTypes: string[]; isSupervisor: boolean;
  sessionModes: string[]; sessionDuration: number; pricePerSession: number;
  isAccepting: boolean; totalHours: number; rating: number; location: string;
  avatarUrl: string | null;
};

// 8格分类 — 左6彩色 + 右2米色，整体 grid 用 gap，左右分组体现间距
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

// 每组颜色：角色标签 + 头像保持一致，按卡片 index 轮转
const CARD_COLORS = [
  { tagBg: "#E0F0D8", tagText: "#2E6020", avBg: "#C8DEB8", avText: "#2E5020" }, // 绿
  { tagBg: "#F2E8D8", tagText: "#6B4820", avBg: "#E8DECE", avText: "#6B5022" }, // 暖米
  { tagBg: "#D8ECF4", tagText: "#1A4A6A", avBg: "#C0D8E8", avText: "#1A4060" }, // 水蓝
  { tagBg: "#EEE4CC", tagText: "#5A3A10", avBg: "#E4D8B8", avText: "#5A4218" }, // 麦色
  { tagBg: "#EAE0F4", tagText: "#4A1E6A", avBg: "#DDD0E8", avText: "#4A1E5A" }, // 薰衣草
  { tagBg: "#F8ECD8", tagText: "#703010", avBg: "#F0E0C8", avText: "#704020" }, // 浅杏
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
  // 根据 id hash 生成一个未来几天内的"最早可预约"日期
  const daysOffset = (c.id.charCodeAt(c.id.length - 1) % 20) + 1; // 1~20 天
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

/* ── 线条风书本图标（打开书本，两页）── */
function BookLineIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-[18px] h-[18px]" xmlns="http://www.w3.org/2000/svg">
      {/* 翻开的书：两页向外展开，尺寸加大 */}
      <path d="M10 5v11" stroke="#7D736A" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M10 6C8 5 5.5 5 3.5 6V16C5.5 15 8 15 10 16"
        stroke="#7D736A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 6C12 5 14.5 5 16.5 6V16C14.5 15 12 15 10 16"
        stroke="#7D736A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── 漏斗图标（三角形轮廓，线条风格）── */
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
      <path d="M3 4h14l-5 6v5l-4-2V10L3 4z"
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
      <View className="fixed inset-0 bg-black/30 z-40"}}}
        onClick={onClose} />
      <View
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
        style={{ background: "#FDFBF7", maxHeight: "80svh" }}}}}}
        drag="y" dragConstraints={{ top: 0 }} dragElastic={0.15}
        onDragEnd={(_e, info) => { if (info.offset.y > 60) onClose(); }}
      >
        <View className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: "#DDD8D0" }} />
        <View className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#EBE7DF" }}>
          <Text className="text-base font-semibold" style={{ color: "#2C2420" }}>{title}</Text>
          <View onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: "#F5F1E8" }}>
            <Text>✕</Text>
          </View>
        </View>
        <View className="overflow-y-auto px-5 py-4" style={{ maxHeight: "calc(80svh - 80px)" }}>
          {children}
        </View>
      </View>
    </>
  );
}

/* ── 选项胶囊 ── */
function OptionPill({ label, active, onToggle }: {
  label: string; active: boolean; onToggle: () => void;
}) {
  return (
    <View} onClick={onToggle}
      className="px-3.5 py-1.5 rounded-full text-sm border transition-colors"
      style={{
        background: active ? "#9CB48A" : "#F5F1E8",
        color: active ? "white" : "#7D736A",
        borderColor: active ? "#9CB48A" : "#DDD8D0",
      }}>
      {label}
    </View>
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
function CounselorCard({ c, idx }: { c: Counselor; idx: number }) {
  const router = useRouter();
  const col = getCardColors(idx);
  const roleTags = getRoleTags(c);
  const avail = getAvail(c);

  return (
    <View}>
      <Link href={`/counselors/${c.id}`}>
        <View className="py-5" style={{ borderBottom: "1px solid #EBE7DF" }}>
          <View className="flex items-start gap-3 mb-3">
            <View className="w-[88px] h-[88px] rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl font-bold overflow-hidden"
              style={{ background: col.avBg, color: col.avText }}>
              {c.avatarUrl
                ? <Image src={c.avatarUrl} alt={c.displayName} className="w-full h-full object-cover" />
                : c.displayName[0]}
            </View>
            <View className="flex-1 min-w-0 pt-0.5">
              <View className="flex items-center justify-between gap-2 mb-1.5">
                <Text className="text-[18px] font-semibold" style={{ color: "#2C2420" }}>{c.displayName}</Text>
                {avail && (
                  <Text className="text-[12px] font-medium flex-shrink-0 flex items-center gap-1" style={{ color: avail.color }}>
                    <Text className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: avail.color }} />
                    {avail.label}
                  </Text>
                )}
              </View>
              <View className="flex flex-wrap gap-1.5 mb-1.5">
                {roleTags.map(t => (
                  <Text key={t} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: col.tagBg, color: col.tagText }}>{t}</Text>
                ))}
              </View>
              <View className="flex items-center gap-1 text-[13px]" style={{ color: "#9B8E82" }}>
                <Text>⏱</Text>
                {c.sessionDuration} 分钟 / 次
              </View>
            </View>
          </View>
          <Text className="text-[15px] leading-relaxed mb-3 line-clamp-3" style={{ color: "#4A4240" }}>{c.bio}</Text>
          {c.specialties.length > 0 && (
            <View className="flex flex-wrap gap-2 mb-3">
              {c.specialties.slice(0, 5).map(s => (
                <Text key={s} className="text-[13px] px-3 py-1 rounded-full border"
                  style={{ borderColor: "#DDD8D0", color: "#7D736A" }}>{s}</Text>
              ))}
            </View>
          )}
          <View className="flex items-center justify-between mt-1">
            <View>
              <Text className="text-[19px] font-bold" style={{ color: "#2C2420" }}>¥{c.pricePerSession}</Text>
              <Text className="text-[14px] ml-1" style={{ color: "#9B8E82" }}>/ 次</Text>
            </View>
            <View}
              className="px-5 py-2.5 rounded-2xl text-white font-semibold text-[14px]"
              style={{ background: "#9CB48A" }}
              onClick={e => { e.preventDefault(); Taro.navigateTo({url: '/pages/booking/index?id=${c.id}'}); }}>
              预约咨询
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function Skeleton() {
  return (
    <View className="py-5" style={{ borderBottom: "1px solid #EBE7DF" }}>
      <View className="flex gap-3 mb-3">
        <View className="w-[88px] h-[88px] rounded-2xl skeleton flex-shrink-0" />
        <View className="flex-1 space-y-2 pt-1">
          <View className="h-5 w-24 skeleton" /><View className="h-4 w-20 skeleton rounded-full" /><View className="h-4 w-16 skeleton" />
        </View>
      </View>
      <View className="space-y-2 mb-3"><View className="h-4 skeleton" /><View className="h-4 w-4/5 skeleton" /></View>
    </View>
  );
}

/* ══ 主屏幕 ══ */
export default function ExploreScreen() {
  const { user } = useAuthStore() => s.auth.user);
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
    request(`/api/counselors?${p}`)
      
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

  const router = useRouter();

  return (
    <View className="min-h-svh" style={{ background: "#F5F1E8" }}>
      {/* ── 顶栏 ── */}
      <View className="flex items-center justify-between px-4 pt-12 pb-3">
        <View>
          <View className="flex items-center gap-1.5">
            <Text className="text-[13px]" style={{ color: "#C2BDB7" }}>{getGreeting()}</Text>
            {user && <Text className="text-[13px] font-medium" style={{ color: "#7D736A" }}>{user.name ?? user.email?.split("@")[0] ?? ""}</Text>}
          </View>
          <View className="text-[17px] font-semibold leading-tight mt-0.5" style={{ color: "#2C2420" }}>MindPace</View>
        </View>
        <View className="flex items-center gap-2">
          <View
            onClick={() => Taro.navigateTo({url: "/guide"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px]"
            style={{ borderColor: "#C8C4BC", color: "#7D736A", background: "white" }}>
            <BookLineIcon />新手必读
          </View>
          {user ? (
            <View className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: "#9CB48A", color: "white" }}>
              {(user.name ?? user.email ?? "?")[0].toUpperCase()}
            </View>
          ) : (
            <View onClick={() => Taro.showToast({title: '请先登录', icon: 'none'})}
              className="w-8 h-8 rounded-full text-[13px] font-semibold"
              style={{ background: "#9CB48A", color: "white", display:"flex", alignItems:"center", justifyContent:"center" }}>
              登录
            </View>
          )}
        </View>
      </View>

      {/* ── Banner ── */}
      <View className="mx-4 mb-4 rounded-3xl overflow-hidden relative"
        style={{ background: "linear-gradient(160deg, #8BAE80 0%, #9BBC90 35%, #B8D0AA 65%, #C9DAB8 100%)", minHeight: 168 }}>
        {/* 右上大圆 */}
        <View className="absolute right-0 top-0 w-52 h-52 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.22)", transform: "translate(32%,-32%)" }} />
        {/* 右中小圆 */}
        <View className="absolute right-8 top-12 w-24 h-24 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.12)", transform: "translate(20%,0)" }} />
        {/* 左下装饰圆 */}
        <View className="absolute left-0 bottom-0 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.10)", transform: "translate(-35%,35%)" }} />
        <View className="relative z-10 px-5 pt-5 pb-6">
          <View className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full text-[12px] font-medium"
            style={{ background: "rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.96)" }}>
            <Text className="w-1.5 h-1.5 rounded-full bg-white inline-block" />联盟认证平台
          </View>
          <Text className="font-bold text-white leading-snug mb-4" style={{ fontSize: 22 }}>
            神经多样性友好<br />咨询师联盟
          </Text>
          <View className="flex gap-2 flex-wrap mb-4">
            {["专业培训认证","按你的节奏","安全支持空间"].map(t => (
              <Text key={t} className="text-[12px] px-2.5 py-1 rounded-full font-medium"
                style={{ background: "rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.95)" }}>{t}</Text>
            ))}
          </View>
          <View className="flex gap-1.5">
            {[0,1,2,3].map(i => (
              <View key={i} className="h-1.5 rounded-full"
                style={{ width: i===0?20:6, background: i===0?"white":"rgba(255,255,255,0.4)" }} />
            ))}
          </View>
        </View>
      </View>

      <View className="px-4">
        {/* ── 搜索 + 预约督导 ── */}
        <View className="flex mb-4" style={{ gap: "10px" }}>
          <View className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-2xl"
            style={{ background: "white", border: "1px solid #E8E4DC" }}>
            <Text>🔍</Text>
            <Input type="text" placeholder="搜索名字、擅长..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 text-[15px] bg-transparent focus:outline-none" style={{ color: "#2C2420" }} />
          </View>
          {/* 预约督导：和旧版一样紧凑 */}
          <View className="px-3 py-1 rounded-full text-[12px] font-medium whitespace-nowrap"
            style={{ background: "#F0EAF8", color: "#7040C0", border: "1px solid #D8C8F0" }}>
            预约督导
          </View>
        </View>

        {/* ── 8格分类：左6彩色(3×2) + 右2米色(1×2)，中间gap分隔 ── */}
        <View className="flex gap-3 mb-4">
          {/* 左：6个彩色格，3列2行 */}
          <View className="grid grid-cols-3 gap-1.5 flex-1">
            {CATEGORY_GRID.filter(c => c.id !== "2天内" && c.id !== "本周").map(cat => {
              const active = activeCategory === cat.id;
              return (
                <View key={cat.id}}
                  onClick={() => setActiveCategory(active ? null : cat.id)}
                  className="rounded-2xl flex items-center justify-center text-center font-semibold"
                  style={{
                    background: active ? "#888" : cat.bg,
                    color: active ? "white" : cat.color,
                    fontSize: 13, whiteSpace: "pre-line", lineHeight: 1.3,
                    minHeight: 74,
                  }}>
                  {cat.label}
                </View>
              );
            })}
          </View>
          {/* 分割线 */}
          <View style={{ width: 1, background: "#EBE7DF", borderRadius: 1, alignSelf: "stretch" }} />
          {/* 右：2个米色格，1列2行 */}
          <View className="flex flex-col gap-1.5" style={{ width: 88 }}>
            {CATEGORY_GRID.filter(c => c.id === "2天内" || c.id === "本周").map(cat => {
              const active = activeCategory === cat.id;
              return (
                <View key={cat.id}}
                  onClick={() => setActiveCategory(active ? null : cat.id)}
                  className="rounded-2xl flex items-center justify-center text-center font-semibold flex-1"
                  style={{
                    background: active ? "#888" : cat.bg,
                    color: active ? "white" : cat.color,
                    fontSize: 13, whiteSpace: "pre-line", lineHeight: 1.3,
                    minHeight: 74,
                  }}>
                  {cat.label}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── 筛选行（清除内联在右侧）── */}
        <View className="flex items-center gap-1.5 mb-3">
          {[
            { key: "city",      label: filterCity || "地区",      active: !!filterCity },
            { key: "price",     label: filterPrice || "价格",     active: !!filterPrice },
            { key: "direction", label: filterDir.length ? `方向(${filterDir.length})` : "咨询方向", active: filterDir.length > 0 },
          ].map(f => (
            <View key={f.key}}
              onClick={() => setOpenModal(f.key as "city"|"price"|"direction")}
              className="flex items-center justify-center gap-0.5 px-3 py-1 rounded-full text-[12px]"
              style={{
                minWidth: 64,
                background: f.active ? "#9CB48A" : "white",
                border: `1px solid ${f.active ? "#9CB48A" : "#E0DAD0"}`,
                color: f.active ? "white" : "#7D736A",
              }}>
              {f.label}<Text>∨</Text>
            </View>
          ))}
          {/* 清除按钮：有激活筛选时内联显示 */}
          {(activeCategory || activeFilterCount > 0 || search) && (
            <View
              onClick={() => { setActiveCategory(null); setSearch(""); setFilterCity(""); setFilterPrice(""); setFilterDir([]); }}
              className="text-[12px]"
              style={{ color: "#9B8E82" }}>
              清除
            </View>
          )}
          <View className="ml-auto w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: activeFilterCount > 0 ? "#9CB48A" : "white", border: `1px solid ${activeFilterCount > 0 ? "#9CB48A" : "#E0DAD0"}` }}>
            <FunnelIcon />
          </View>
        </View>

        {/* ── 列表 ── */}
        <View className="pb-28">
          {loading ? (
            <><Skeleton /><Skeleton /><Skeleton /></>
          ) : displayed.length === 0 ? (
            <View className="text-center py-20">
              <Text className="text-base font-medium mb-2" style={{ color: "#2C2420" }}>暂无匹配的咨询师</Text>
              <View onClick={() => { setActiveCategory(null); setSearch(""); setFilterCity(""); setFilterPrice(""); setFilterDir([]); }}
                className="text-sm" style={{ color: "#9CB48A" }}>清除筛选</View>
            </View>
          ) : (
            <View>
              {displayed.map((c, i) => <CounselorCard key={c.id} c={c} idx={i} />)}
            </View>
          )}
        </View>
      </View>

      {/* ══ 弹窗 ══ */}
      <View>
        {/* 城市/省份弹窗 */}
        {openModal === "city" && (
          <BottomSheet title="选择省份" onClose={() => setOpenModal(null)}>
            <View className="flex flex-wrap gap-2 pb-4">
              {PROVINCES.map(p => (
                <OptionPill key={p} label={p}
                  active={filterCity === p}
                  onToggle={() => { setFilterCity(filterCity === p ? "" : p); setOpenModal(null); }} />
              ))}
            </View>
          </BottomSheet>
        )}

        {/* 价格弹窗 */}
        {openModal === "price" && (
          <BottomSheet title="价格" onClose={() => setOpenModal(null)}>
            <View className="flex flex-wrap gap-2 pb-4">
              {PRICE_OPTIONS.map(p => (
                <OptionPill key={p} label={p}
                  active={filterPrice === p}
                  onToggle={() => { setFilterPrice(filterPrice === p ? "" : p); setOpenModal(null); }} />
              ))}
            </View>
          </BottomSheet>
        )}

        {/* 咨询方向弹窗 */}
        {openModal === "direction" && (
          <BottomSheet title="咨询方向" onClose={() => setOpenModal(null)}>
            <View className="flex flex-wrap gap-2 pb-6">
              {DIRECTION_OPTIONS.map(d => (
                <OptionPill key={d} label={d}
                  active={filterDir.includes(d)}
                  onToggle={() => { const isSelected = filterDir.includes(d); setFilterDir(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]); if (!isSelected) setOpenModal(null); }} />
              ))}
            </View>

          </BottomSheet>
        )}

        {/* 新手必读弹窗 */}
        {openModal === "guide" && (
          <BottomSheet title="新手必读" onClose={() => setOpenModal(null)}>
            <View className="space-y-5 pb-6">
              {GUIDE_SECTIONS.map((s, i) => (
                <View key={i}>
                  <View className="flex items-center gap-2 mb-2">
                    <Text className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                      style={{ background: "#9CB48A" }}>{i + 1}</Text>
                    <Text className="text-[15px] font-semibold" style={{ color: "#2C2420" }}>{s.title}</Text>
                  </View>
                  <Text className="text-[14px] leading-relaxed ml-7" style={{ color: "#5C5552" }}>{s.content}</Text>
                </View>
              ))}
            </View>
          </BottomSheet>
        )}
      </View>
    </View>
  );
}
