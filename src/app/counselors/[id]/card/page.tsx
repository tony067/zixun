"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

const ROLE_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  "心理咨询师": { bg: "#E4F0DC", text: "#3A6228", border: "#CCE0C0" },
  "ADHD教练":   { bg: "#FFF0E0", text: "#A05A20", border: "#F0CFA0" },
  "特教老师":   { bg: "#E8E0F8", text: "#5030A0", border: "#C8B8F0" },
  "default":    { bg: "#E8DFCC", text: "#5A7A3A", border: "#D4C8B0" },
};

export default function CounselorCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [counselor, setCounselor] = useState<CounselorData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    request(`/api/counselors/${id}`).then(r => r.json()).then(d => {
      setCounselor(d.counselor ?? d);
    });
  }, [id]);

  if (!counselor) return (
    <div className="flex items-center justify-center h-screen" style={{ background: "#F5F0E8" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#9CB48A", borderTopColor: "transparent" }} />
    </div>
  );

  const roleKey = counselor.counselorTypes?.[0] ?? "default";
  const roleColors = ROLE_COLOR[roleKey] ?? ROLE_COLOR["default"];
  const roleLabel = counselor.counselorTypes?.join(" · ") ?? "心理咨询师";
  const groups = (counselor.workingGroups ?? counselor.targetGroups ?? []) as string[];
  const cardUrl = typeof window !== "undefined"
    ? `${window.location.origin}/counselors/${id}`
    : `https://mindpace.app/counselors/${id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cardUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between py-8 px-5"
      style={{ background: "linear-gradient(160deg, #8BAE80 0%, #9BBC90 35%, #B8D0AA 65%, #C9DAB8 100%)" }}>

      {/* 顶部装饰文字 */}
      <div className="flex items-center gap-2 self-start mb-2">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.7)" }} />
        <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.8)", letterSpacing: "0.08em" }}>MindPace · 联盟认证咨询师</span>
      </div>

      {/* 主名片卡片 */}
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: "#FAF8F3" }}>

        {/* 卡片顶部渐变 Banner */}
        <div className="relative flex justify-center"
          style={{ background: "linear-gradient(160deg, #8BAE80 0%, #9BBC90 50%, #C9DAB8 100%)", height: 96 }}>
          <div className="absolute" style={{ top: -16, right: -16, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
          <div className="absolute" style={{ top: 16, right: 36, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
          {/* 大圆形头像浮在 Banner 底部 */}
          <div className="absolute"
            style={{ bottom: -44, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
            <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg"
              style={{ border: "4px solid #FAF8F3", background: roleColors.bg }}>
              {counselor.avatarUrl ? (
                <img src={counselor.avatarUrl} alt={counselor.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold"
                  style={{ color: roleColors.text }}>
                  {(counselor.displayName ?? "?")[0]}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 卡片内容 */}
        <div className="flex flex-col items-center px-7 pb-7" style={{ paddingTop: 56 }}>

          {/* 姓名 */}
          <h1 className="text-2xl font-bold text-center" style={{ color: "#2C2420", letterSpacing: "0.04em" }}>
            {counselor.displayName}
          </h1>

          {/* 角色标签 */}
          <span className="mt-2 px-3.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: roleColors.bg, color: roleColors.text, border: `1px solid ${roleColors.border}` }}>
            {roleLabel}
          </span>

          {/* 分隔 */}
          <div className="w-10 h-px my-5" style={{ background: "rgba(156,180,138,0.4)" }} />

          {/* 来访者寄语 */}
          {counselor.tagline ? (
            <div className="w-full mb-6 relative">
              <span className="absolute -top-2 left-0 text-3xl font-serif leading-none"
                style={{ color: "#9CB48A", opacity: 0.7, fontFamily: "Georgia, serif" }}>"</span>
              <p className="text-base text-center leading-relaxed px-4 pt-3"
                style={{ color: "#4A3F38", fontStyle: "italic" }}>
                {counselor.tagline}
              </p>
              <span className="absolute -bottom-3 right-0 text-3xl font-serif leading-none"
                style={{ color: "#9CB48A", opacity: 0.7, fontFamily: "Georgia, serif" }}>"</span>
            </div>
          ) : (
            <p className="text-sm text-center mb-6" style={{ color: "#9B8E82" }}>暂无寄语</p>
          )}

          {/* 工作人群标签 */}
          {groups.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {groups.slice(0, 6).map(g => (
                <span key={g} className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: "#E8DFCC", color: "#5A7A3A", border: "1px solid #D4C8B0" }}>
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* 二维码 */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="p-2 rounded-xl" style={{ background: "white", border: "1px solid #EBE7DF" }}>
              <QRCodeSVG value={cardUrl} size={72} fgColor="#3A6228" bgColor="white" level="M" />
            </div>
            <p className="text-xs" style={{ color: "#9B8E82" }}>扫码查看详情页</p>
          </div>

        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="w-full max-w-sm flex gap-3 mt-6">
        {/* 复制链接 */}
        <button onClick={handleCopy}
          className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-semibold"
          style={{ background: "rgba(255,255,255,0.25)", color: "white", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.4)" }}>
          {copied ? "已复制" : "复制链接"}
        </button>
        {/* 立即预约 */}
        <button onClick={() => router.push(`/booking/${id}`)}
          className="flex-1 py-3.5 rounded-2xl text-sm font-bold tracking-widest"
          style={{ background: "rgba(255,255,255,0.9)", color: "#3A6228" }}>
          立 即 预 约
        </button>
      </div>

      {/* 底部品牌 */}
      <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.6)", letterSpacing: "0.15em" }}>
        MINDPACE · 神经多样性友好咨询平台
      </p>

    </div>
  );
}
