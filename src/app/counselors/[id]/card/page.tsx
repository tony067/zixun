"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { request } from "@/lib/api/request";

type CounselorData = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  counselorTypes?: string[];
  location?: string;
  tagline?: string;
  specialties?: string[];
  targetGroups?: string[];
  pricePerSession?: string;
  sessionDuration?: number;
};

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
    "ADHD教练":   "#E8A87C",
    "特教老师":    "#7BAFD4",
  };
  const tagColor = counselor?.counselorTypes?.[0]
    ? (COLOR_MAP[counselor.counselorTypes[0]] ?? "#9CB48A")
    : "#9CB48A";

  const initials = counselor?.displayName?.trim()[0] ?? "?";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F0E8" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#9CB48A" }} />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F0EBE1" }}>
      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => router.back()}
          className="p-2 rounded-full" style={{ background: "rgba(0,0,0,0.08)" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "#2C2420" }} />
        </button>
        <span className="text-sm font-medium" style={{ color: "#5A4E44" }}>咨询师名片</span>
        <button className="p-2 rounded-full" style={{ background: "rgba(0,0,0,0.08)" }}>
          <Download className="w-4 h-4" style={{ color: "#2C2420" }} />
        </button>
      </div>

      {/* 名片主体 */}
      <div className="flex-1 flex items-center justify-center px-6 py-4">
        <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: "white" }}>

          {/* 顶部彩色背景区 */}
          <div className="relative h-48 flex items-end justify-center pb-0"
            style={{
              background: `linear-gradient(160deg, ${tagColor}CC 0%, ${tagColor}88 60%, #E8DFCC 100%)`,
            }}>
            {/* 装饰圆 */}
            <div className="absolute top-4 right-4 w-24 h-24 rounded-full opacity-20"
              style={{ background: "white" }} />
            <div className="absolute top-12 right-16 w-12 h-12 rounded-full opacity-15"
              style={{ background: "white" }} />
            <div className="absolute bottom-8 left-6 w-16 h-16 rounded-full opacity-10"
              style={{ background: "white" }} />

            {/* 头像 */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden"
                style={{ background: tagColor }}>
                {counselor?.avatarUrl ? (
                  <img src={counselor.avatarUrl} alt={counselor.displayName}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white">
                    {initials}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 内容区 */}
          <div className="px-6 pt-14 pb-6">
            {/* 姓名和标签 */}
            <div className="text-center mb-5">
              <h1 className="text-2xl font-bold mb-2" style={{ color: "#1A1512" }}>
                {counselor?.displayName}
              </h1>
              <div className="flex flex-wrap gap-1.5 justify-center mb-3">
                {counselor?.counselorTypes?.map(t => (
                  <span key={t} className="text-xs px-3 py-1 rounded-full font-medium text-white"
                    style={{ background: COLOR_MAP[t] ?? "#9CB48A" }}>
                    {t}
                  </span>
                ))}
                {counselor?.location && (
                  <span className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{ background: "#F0EBE1", color: "#6B5E52" }}>
                    📍 {counselor.location}
                  </span>
                )}
              </div>

              {/* 寄语 */}
              {counselor?.tagline && (
                <div className="relative px-4 py-3 rounded-2xl mx-2"
                  style={{ background: "#F5F0E8" }}>
                  <span className="absolute top-2 left-3 text-xl leading-none font-serif"
                    style={{ color: tagColor, opacity: 0.6 }}>"</span>
                  <p className="text-sm leading-relaxed px-4"
                    style={{ color: "#3A3028" }}>
                    {counselor.tagline}
                  </p>
                  <span className="absolute bottom-2 right-3 text-xl leading-none font-serif"
                    style={{ color: tagColor, opacity: 0.6 }}>"</span>
                </div>
              )}
            </div>

            {/* 工作人群 */}
            {counselor?.targetGroups && counselor.targetGroups.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold mb-2 text-center" style={{ color: "#9B8E82" }}>擅长工作人群</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {counselor.targetGroups.slice(0, 6).map(g => (
                    <span key={g} className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: "#EAE5DC", color: "#5A4E44" }}>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 分隔线 */}
            <div className="border-t my-4" style={{ borderColor: "#EDE8E0" }} />

            {/* 底部 QR + 费用 */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                {counselor?.pricePerSession && (
                  <div>
                    <span className="text-xs" style={{ color: "#9B8E82" }}>咨询费用</span>
                    <p className="text-xl font-bold" style={{ color: "#1A1512" }}>
                      ¥{counselor.pricePerSession}
                      <span className="text-sm font-normal ml-1" style={{ color: "#9B8E82" }}>/ 次</span>
                    </p>
                  </div>
                )}
                <p className="text-xs mt-1" style={{ color: "#9B8E82" }}>扫码查看详情</p>
                <p className="text-xs font-medium" style={{ color: tagColor }}>MindPace</p>
              </div>

              {/* QR码 */}
              <div className="p-2 rounded-2xl border" style={{ borderColor: "#EDE8E0", background: "white" }}>
                <QRCodeSVG
                  value={detailUrl}
                  size={80}
                  fgColor="#2C2420"
                  bgColor="white"
                  level="M"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="text-center pb-8 px-6">
        <p className="text-xs" style={{ color: "#9B8E82" }}>长按名片可保存 · 扫码进入详情页预约</p>
      </div>
    </div>
  );
}
