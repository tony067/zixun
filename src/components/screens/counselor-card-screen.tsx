"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { request } from "@/lib/api/request";
import { ArrowLeft, Download, Link2 } from "lucide-react";

type CounselorData = {
  id: string; displayName: string; avatarUrl?: string;
  counselorTypes?: string[]; tagline?: string;
  targetGroups?: string[]; workingGroups?: string[];
};

const ROLE_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  "心理咨询师": { bg: "#E4F0DC", text: "#3A6228", border: "#CCE0C0" },
  "ADHD教练":   { bg: "#FFF0E0", text: "#A05A20", border: "#F0CFA0" },
  "特教老师":   { bg: "#E8E0F8", text: "#5030A0", border: "#C8B8F0" },
  "default":    { bg: "#E8DFCC", text: "#5A7A3A", border: "#D4C8B0" },
};

export default function CounselorCardScreen({ id }: { id: string }) {
  const router = useRouter();
  const fullCardRef = useRef<HTMLDivElement>(null);
  const [counselor, setCounselor] = useState<CounselorData | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    request(`/api/counselors/${id}`).then(r => r.json())
      .then(d => setCounselor(d.counselor ?? d)).catch(console.error);
  }, [id]);

  const qrUrl = typeof window !== "undefined"
    ? `${window.location.origin}/counselors/${id}`
    : `https://mindpace-9fd897a7.eazo.dev/counselors/${id}`;

  const handleSave = async () => {
    if (!fullCardRef.current || saving) return;
    setSaving(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(fullCardRef.current, {
        scale: 3, useCORS: true, allowTaint: true,
        backgroundColor: null, logging: false,
      });
      const link = document.createElement("a");
      link.download = `${counselor?.displayName ?? "咨询师"}-名片.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch { alert("保存失败，请截屏保存"); }
    finally { setSaving(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!counselor) return (
    <div className="flex items-center justify-center h-screen" style={{ background: "#F5F0E8" }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: "#9CB48A", borderTopColor: "transparent" }} />
    </div>
  );

  const roleKey = counselor.counselorTypes?.[0] ?? "default";
  const roleColors = ROLE_COLOR[roleKey] ?? ROLE_COLOR["default"];
  const roleLabel = counselor.counselorTypes?.join(" · ") ?? "心理咨询师";
  const groups = (counselor.workingGroups ?? counselor.targetGroups ?? []) as string[];
  const initial = (counselor.displayName ?? "?")[0];

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-5"
      style={{ background: "linear-gradient(160deg, #8BAE80 0%, #9BBC90 35%, #B8D0AA 65%, #C9DAB8 100%)" }}>

      {/* 顶部导航（不含在截图内） */}
      <div className="w-full max-w-sm flex items-center justify-between mb-6">
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
          style={{ background: "rgba(255,255,255,0.28)", color: "white", backdropFilter: "blur(8px)" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> 返回
        </button>
        <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.75)", letterSpacing: "0.12em" }}>
          MindPace · 联盟认证咨询师
        </span>
      </div>

      {/* ── 截图区域：完整带绿色背景的名片 ── */}
      <div ref={fullCardRef} className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #8BAE80 0%, #9BBC90 35%, #B8D0AA 65%, #C9DAB8 100%)",
          boxShadow: "0 24px 64px rgba(60,90,50,0.3)",
        }}>

        {/* 名片内顶部标题（截图中显示） */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px 0" }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.7)" }}>MINDPACE</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", letterSpacing: "0.05em" }}>联盟认证咨询师</span>
        </div>

        {/* 装饰圆 + 头像区 */}
        <div style={{ position: "relative", height: 110 }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
          <div style={{ position: "absolute", top: 24, right: 40, width: 55, height: 55, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{
            position: "absolute", bottom: -40, left: "50%", transform: "translateX(-50%)",
            width: 92, height: 92, borderRadius: "50%",
            border: "4px solid white", boxShadow: "0 4px 20px rgba(60,90,50,0.2)",
            overflow: "hidden", background: "#D6E8C8",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {counselor.avatarUrl
              ? <img src={counselor.avatarUrl} alt={counselor.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 34, fontWeight: 700, color: "#3A6228" }}>{initial}</span>
            }
          </div>
        </div>

        {/* 白色圆角卡片内容区 */}
        <div style={{ background: "#FAF8F3", borderRadius: "20px 20px 20px 20px", margin: "0 10px 10px", padding: "52px 24px 28px" }}>
          {/* 姓名 */}
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#2C2420", margin: 0, letterSpacing: "0.05em" }}>
              {counselor.displayName}
            </h2>
          </div>
          {/* 角色标签 */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
            <span style={{
              fontSize: 13, fontWeight: 500, padding: "4px 18px", borderRadius: 999,
              background: roleColors.bg, color: roleColors.text, border: `1px solid ${roleColors.border}`,
            }}>{roleLabel}</span>
          </div>
          {/* 分隔线 */}
          <div style={{ height: 1, background: "#EBE7DF", margin: "0 12px 20px" }} />
          {/* 寄语 */}
          <div style={{ position: "relative", padding: "0 8px", marginBottom: 20, minHeight: 80 }}>
            <span style={{ fontSize: 30, lineHeight: 1, color: "#9CB48A", position: "absolute", top: -6, left: 0, fontFamily: "Georgia, serif" }}>"</span>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: "#4A3F38", textAlign: "center", padding: "8px 20px 0", margin: 0, fontStyle: "italic" }}>
              {counselor.tagline ?? "每一次鼓起勇气来到这里，都值得被看见。"}
            </p>
            <span style={{ fontSize: 30, lineHeight: 1, color: "#9CB48A", position: "absolute", bottom: -10, right: 0, fontFamily: "Georgia, serif" }}>"</span>
          </div>
          {/* 工作人群标签 */}
          {groups.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 24 }}>
              {groups.slice(0, 6).map(g => (
                <span key={g} style={{
                  fontSize: 12, padding: "4px 14px", borderRadius: 999,
                  background: "#E8DFCC", color: "#5A7A3A", border: "1px solid #D4C8B0",
                }}>{g}</span>
              ))}
            </div>
          )}
          {/* 底部品牌 + 二维码 */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingTop: 18, borderTop: "1px solid #EBE7DF" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.2em", color: "#7A9E78", marginBottom: 4 }}>MINDPACE</div>
              <div style={{ fontSize: 11, color: "#9B8E82", lineHeight: 1.7 }}>神经多样性友好<br />心理咨询平台</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ background: "white", padding: 8, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                <QRCodeSVG value={qrUrl} size={64} fgColor="#3A6228" bgColor="white" />
              </div>
              <span style={{ fontSize: 10, color: "#9B8E82" }}>扫码预约</span>
            </div>
          </div>
        </div>
      </div>

      {/* 提示语 */}
      <p className="text-xs mt-5 text-center" style={{ color: "rgba(255,255,255,0.65)", maxWidth: 260, lineHeight: 1.6 }}>
        点击「保存名片」下载完整名片图片<br />发给来访者扫码预约
      </p>

      {/* 操作按钮 */}
      <div className="flex gap-3 w-full max-w-sm mt-4">
        <button onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium"
          style={{ background: "rgba(255,255,255,0.22)", color: "white", backdropFilter: "blur(8px)" }}>
          <Link2 className="w-4 h-4" />
          {copied ? "已复制" : "复制链接"}
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
          style={{ background: "rgba(255,255,255,0.92)", color: "#3A6228", opacity: saving ? 0.7 : 1 }}>
          <Download className="w-4 h-4" />
          {saving ? "保存中…" : "保存名片"}
        </button>
      </div>
    </div>
  );
}
