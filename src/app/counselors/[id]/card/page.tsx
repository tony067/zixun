"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { request } from "@/lib/api/request";

type CounselorData = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  counselorTypes?: string[];
  location?: string;
  tagline?: string;
  targetGroups?: string[];
  workingGroups?: string[];
  pricePerSession?: string;
};

// 叶形 SVG 头像
function LeafAvatar({ name, color, avatarUrl }: { name: string; color: string; avatarUrl?: string }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 100, height: 112 }}>
      {/* 叶子轮廓 */}
      <svg viewBox="0 0 100 112" className="absolute inset-0 w-full h-full" fill="none">
        <path
          d="M50 4 C72 4 94 24 94 50 C94 78 72 108 50 108 C28 108 6 78 6 50 C6 24 28 4 50 4 Z"
          fill={color}
          opacity="0.92"
        />
      </svg>
      {/* 头像内容 */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
            style={{
              clipPath: "path('M50 4 C72 4 94 24 94 50 C94 78 72 108 50 108 C28 108 6 78 6 50 C6 24 28 4 50 4 Z')",
            }}
          />
        ) : (
          <span className="text-3xl font-bold text-white" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
            {name?.[0] ?? "?"}
          </span>
        )}
      </div>
    </div>
  );
}

// 标签胶囊（带小图标文字）
const TAG_ICONS: Record<string, string> = {
  "儿童": "◎", "青少年": "◎", "成人": "◎", "ADHD": "⊕", "ASD": "⊕",
  "焦虑": "~", "抑郁": "~", "家庭": "◈", "亲密关系": "◈",
  "职场": "▷", "学业": "▷", "情绪": "≋", "自我成长": "↗",
};
function TagPill({ label }: { label: string }) {
  const key = Object.keys(TAG_ICONS).find(k => label.includes(k));
  const icon = key ? TAG_ICONS[key] : "·";
  return (
    <span
      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-sm"
      style={{ background: "rgba(156,180,138,0.12)", color: "#5A7A3A", border: "1px solid rgba(156,180,138,0.3)", fontWeight: 500 }}
    >
      <span style={{ fontSize: 11, opacity: 0.7 }}>{icon}</span>
      {label}
    </span>
  );
}

export default function CounselorCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [counselor, setCounselor] = useState<CounselorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request(`/api/counselors/${id}`)
      .then(r => r.json())
      .then(d => { setCounselor(d.counselor ?? d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const detailUrl = typeof window !== "undefined"
    ? `${window.location.origin}/counselors/${id}`
    : `https://mindpace.app/counselors/${id}`;

  const COLOR_MAP: Record<string, string> = {
    "心理咨询师": "#9CB48A",
    "ADHD教练":   "#C8956A",
    "特教老师":    "#7BAFD4",
  };
  const leafColor = counselor?.counselorTypes?.[0]
    ? (COLOR_MAP[counselor.counselorTypes[0]] ?? "#9CB48A")
    : "#9CB48A";

  const roleLabel = counselor?.counselorTypes?.[0] ?? "咨询师";

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#F5F0E8" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#9CB48A", borderTopColor: "transparent" }} />
    </div>
  );

  if (!counselor) return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: "#F5F0E8" }}>
      <p className="text-sm" style={{ color: "#9B8E82" }}>加载失败</p>
      <button className="mt-4 text-sm underline" style={{ color: "#9CB48A" }} onClick={() => router.back()}>返回</button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#EEEBE4" }}>

      {/* 顶部导航 */}
      <div className="flex items-center px-5 pt-12 pb-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.6)" }}
        >
          <ArrowLeft className="w-4 h-4" style={{ color: "#5A4E44" }} />
        </button>
        <span className="ml-3 text-sm font-medium" style={{ color: "#5A4E44" }}>咨询师名片</span>
      </div>

      {/* 名片主体 */}
      <div className="flex-1 flex items-start justify-center px-6 pt-2 pb-8">
        <div
          className="w-full rounded-3xl overflow-hidden"
          style={{ background: "#FAF8F3", boxShadow: "0 8px 40px rgba(80,60,40,0.12), 0 2px 8px rgba(80,60,40,0.06)" }}
        >
          {/* 顶部装饰带 */}
          <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${leafColor} 0%, ${leafColor}88 100%)` }} />

          <div className="px-8 pt-8 pb-8 flex flex-col items-center">

            {/* 叶形头像 */}
            <LeafAvatar name={counselor.displayName ?? ""} color={leafColor} avatarUrl={counselor.avatarUrl} />

            {/* 姓名 + 角色 */}
            <h1 className="mt-4 text-2xl font-bold tracking-wide" style={{ color: "#2C2420" }}>
              {counselor.displayName}
            </h1>
            <p className="mt-1 text-sm font-medium" style={{ color: "#9B8E82" }}>{roleLabel}</p>

            {/* 分隔线 */}
            <div className="w-12 h-px my-5" style={{ background: "rgba(156,180,138,0.35)" }} />

            {/* 来访者寄语 */}
            {counselor.tagline ? (
              <div className="w-full mb-6">
                {/* 引号 */}
                <div className="text-3xl leading-none mb-2" style={{ color: leafColor, opacity: 0.5, fontFamily: "Georgia, serif" }}>"</div>
                <p
                  className="text-center text-base leading-relaxed"
                  style={{ color: "#3A3028", fontWeight: 400, letterSpacing: "0.01em" }}
                >
                  {counselor.tagline}
                </p>
              </div>
            ) : null}

            {/* 工作人群标签 */}
            {counselor.targetGroups && counselor.targetGroups.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {counselor.targetGroups.slice(0, 4).map(g => (
                  <TagPill key={g} label={g} />
                ))}
              </div>
            )}

            {/* 底部信息行 */}
            <div className="w-full flex items-center justify-between pt-4" style={{ borderTop: "1px solid rgba(156,180,138,0.2)" }}>
              {/* 费用 */}
              <div>
                <p className="text-xs mb-0.5" style={{ color: "#9B8E82" }}>咨询费用</p>
                <p className="text-base font-bold" style={{ color: "#2C2420" }}>
                  {counselor.pricePerSession ? `¥${counselor.pricePerSession} / 次` : "面议"}
                </p>
              </div>
              {/* 二维码 */}
              <div className="flex flex-col items-center gap-1">
                <div className="p-2 rounded-xl" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}>
                  <QRCodeSVG value={detailUrl} size={56} fgColor="#2C2420" bgColor="white" level="M" />
                </div>
                <p className="text-xs" style={{ color: "#9B8E82" }}>扫码预约</p>
              </div>
            </div>

            {/* MindPace 品牌 */}
            <div className="mt-5 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: leafColor }} />
              <span className="text-xs font-semibold tracking-widest" style={{ color: "#9B8E82", letterSpacing: "0.15em" }}>MINDPACE</span>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: leafColor }} />
            </div>

          </div>
        </div>
      </div>

      {/* 底部操作 */}
      <div className="px-6 pb-10 flex gap-3">
        <button
          onClick={() => router.push(`/counselors/${id}`)}
          className="flex-1 py-4 rounded-2xl text-base font-bold tracking-widest"
          style={{ background: "#7A5C40", color: "white", letterSpacing: "0.15em" }}
        >
          查 看 详 情
        </button>
      </div>

    </div>
  );
}
