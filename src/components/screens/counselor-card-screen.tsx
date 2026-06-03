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
  const exportRef = useRef<HTMLDivElement>(null);
  const [counselor, setCounselor] = useState<CounselorData | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    request(`/api/counselors/${id}`).then(r => r.json())
      .then(d => setCounselor(d.counselor ?? d)).catch(console.error);
  }, [id]);

  const qrUrl = typeof window !== "undefined"
    ? `${window.location.origin}/counselors/${id}` : `https://mindpace.app/counselors/${id}`;

  const role = counselor?.counselorTypes?.[0] ?? "default";
  const roleColor = ROLE_COLOR[role] ?? ROLE_COLOR["default"];
  const groups: string[] = counselor?.workingGroups ?? counselor?.targetGroups ?? [];

  const handleSave = async () => {
    if (!exportRef.current) return;
    setSaving(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(exportRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
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
    <div className="flex items-center justify-center h-screen" style={{ background: "#8BAE80" }}>
      <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
    </div>
  );

  const initials = counselor.displayName?.slice(0, 1) ?? "咨";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg,#8BAE80 0%,#9BBC90 35%,#B8D0AA 65%,#C9DAB8 100%)" }}>
      {/* 顶部返回栏 */}
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="p-2 rounded-full" style={{ background: "rgba(255,255,255,0.25)" }}>
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <span className="ml-3 text-white text-sm font-medium">咨询师名片</span>
      </div>

      {/* ── 可导出的完整名片区域 ── */}
      <div className="flex-1 flex items-center justify-center px-6 pb-4">
        <div ref={exportRef} style={{
          width: "100%", maxWidth: 360,
          background: "linear-gradient(160deg,#7A9E78 0%,#8CAF89 40%,#A3C49F 70%,#BED5B4 100%)",
          borderRadius: 28, overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          fontFamily: "'PingFang SC','Helvetica Neue',sans-serif",
        }}>
          {/* 名片顶部 — 渐变Banner + 装饰圆 + 联盟认证 */}
          <div style={{ position: "relative", height: 140, overflow: "hidden",
            background: "linear-gradient(145deg,#5D8A5A 0%,#7A9E78 50%,#96B895 100%)" }}>
            {/* 装饰圆 */}
            <div style={{ position:"absolute", top:-30, right:-30, width:140, height:140,
              borderRadius:"50%", background:"rgba(255,255,255,0.10)" }} />
            <div style={{ position:"absolute", top:20, right:40, width:60, height:60,
              borderRadius:"50%", background:"rgba(255,255,255,0.08)" }} />
            <div style={{ position:"absolute", bottom:-20, left:20, width:80, height:80,
              borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />

            {/* 联盟认证标签 */}
            <div style={{ position:"absolute", top:20, left:20,
              background:"rgba(255,255,255,0.22)", borderRadius:20,
              padding:"4px 12px", display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }} />
              <span style={{ color:"#fff", fontSize:11, fontWeight:600, letterSpacing:1 }}>联盟认证咨询师</span>
            </div>

            {/* 头像 — 悬浮在Banner底部 */}
            <div style={{ position:"absolute", bottom:-44, left:"50%", transform:"translateX(-50%)",
              width:88, height:88, borderRadius:"50%",
              border:"4px solid #fff", boxShadow:"0 4px 20px rgba(0,0,0,0.15)",
              overflow:"hidden", background: roleColor.bg }}>
              {counselor.avatarUrl
                ? <img src={counselor.avatarUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:32, fontWeight:700, color: roleColor.text }}>{initials}</div>
              }
            </div>
          </div>

          {/* 名片主体 — 暖白卡 */}
          <div style={{ background:"#FAF8F3", margin:"0 12px 12px", borderRadius:"0 0 20px 20px",
            padding:"52px 20px 24px", marginTop:0 }}>

            {/* 姓名 */}
            <div style={{ textAlign:"center", marginBottom:8 }}>
              <span style={{ fontSize:22, fontWeight:700, color:"#2C2420", letterSpacing:2 }}>
                {counselor.displayName}
              </span>
            </div>

            {/* 角色标签 */}
            <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:16, flexWrap:"wrap" }}>
              {(counselor.counselorTypes ?? ["心理咨询师"]).map(t => {
                const c = ROLE_COLOR[t] ?? ROLE_COLOR["default"];
                return (
                  <span key={t} style={{ background:c.bg, color:c.text,
                    border:`1px solid ${c.border}`, borderRadius:99,
                    fontSize:12, padding:"3px 12px", fontWeight:500 }}>{t}</span>
                );
              })}
            </div>

            {/* 分隔线 */}
            <div style={{ height:1, background:"#EBE7DF", margin:"0 8px 16px" }} />

            {/* 来访者寄语 */}
            {counselor.tagline && (
              <div style={{ marginBottom:16, padding:"0 4px", position:"relative" }}>
                <span style={{ fontSize:28, color:"#9CB48A", fontFamily:"Georgia,serif",
                  position:"absolute", top:-8, left:0, lineHeight:1 }}>"</span>
                <p style={{ fontSize:13, color:"#5A4E44", lineHeight:1.75, textAlign:"center",
                  fontStyle:"italic", padding:"0 20px" }}>
                  {counselor.tagline}
                </p>
                <span style={{ fontSize:28, color:"#9CB48A", fontFamily:"Georgia,serif",
                  position:"absolute", bottom:-12, right:0, lineHeight:1 }}>"</span>
              </div>
            )}

            {/* 工作人群标签 */}
            {groups.length > 0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, justifyContent:"center", marginBottom:20 }}>
                {groups.slice(0,6).map(g => (
                  <span key={g} style={{ background:"#E8DFCC", color:"#5A7A3A",
                    border:"1px solid #D4C8B0", borderRadius:99,
                    fontSize:11, padding:"3px 10px" }}>{g}</span>
                ))}
              </div>
            )}

            {/* 分隔线 */}
            <div style={{ height:1, background:"#EBE7DF", margin:"0 8px 16px" }} />

            {/* 底部：品牌 + 二维码 */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 4px" }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:"#3A6228", letterSpacing:3 }}>MINDPACE</div>
                <div style={{ fontSize:10, color:"#9B8E82", marginTop:2, letterSpacing:0.5 }}>神经多样性友好咨询平台</div>
              </div>
              <div style={{ background:"#fff", padding:6, borderRadius:12,
                border:"1px solid #EBE7DF", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                <QRCodeSVG value={qrUrl} size={60} fgColor="#3A6228" bgColor="#fff" level="M" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div style={{ textAlign:"center", color:"rgba(255,255,255,0.75)", fontSize:12, paddingBottom:12 }}>
        扫描二维码 · 预约咨询
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 px-6 pb-10">
        <button onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
          style={{ background:"rgba(255,255,255,0.2)", color:"#fff", backdropFilter:"blur(8px)" }}>
          <Link2 className="w-4 h-4" />
          {copied ? "已复制" : "复制链接"}
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
          style={{ background:"rgba(255,255,255,0.92)", color:"#3A6228", opacity: saving ? 0.7 : 1 }}>
          <Download className="w-4 h-4" />
          {saving ? "保存中…" : "保存名片"}
        </button>
      </div>
    </div>
  );
}
