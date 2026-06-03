"use client";
import { use } from "react";
import CounselorCardScreen from "@/components/screens/counselor-card-screen";

type CounselorData = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  counselorTypes?: string[];
  location?: string;
  tagline?: string;
  targetGroups?: string[];
  workingGroups?: string[];
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
  const cardRef = useRef<HTMLDivElement>(null);
  const [counselor, setCounselor] = useState<CounselorData | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    request(`/api/counselors/${id}`).then(r => r.json()).then(d => {
      setCounselor(d.counselor ?? d);
    });
  }, [id]);

  const cardUrl = typeof window !== "undefined"
    ? `${window.location.origin}/counselors/${id}`
    : `https://mindpace.app/counselors/${id}`;

  const handleSave = async () => {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, useCORS: true, backgroundColor: null, logging: false,
      });
      const link = document.createElement("a");
      link.download = `${counselor?.displayName ?? "咨询师"}-名片.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("保存失败，请截图保存");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cardUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-between py-8 px-5"
      style={{ background: "linear-gradient(160deg, #8BAE80 0%, #9BBC90 35%, #B8D0AA 65%, #C9DAB8 100%)" }}>

      {/* 顶部返回 */}
      <div className="w-full max-w-sm flex items-center justify-between mb-4">
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
          style={{ background: "rgba(255,255,255,0.25)", color: "white", backdropFilter: "blur(8px)" }}>
          <ArrowLeft className="w-3.5 h-3.5" />
          返回
        </button>
        <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em" }}>
          MindPace · 联盟认证咨询师
        </span>
      </div>

      {/* 名片主体（截图区域） */}
      <div ref={cardRef} className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: "#FAF8F3" }}>

        {/* Banner */}
        <div className="relative flex justify-center"
          style={{ background: "linear-gradient(160deg, #8BAE80 0%, #9BBC90 50%, #C9DAB8 100%)", height: 100 }}>
          <div className="absolute" style={{ top: -20, right: -20, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
          <div className="absolute" style={{ top: 18, right: 40, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
          {/* 大圆形头像 */}
          <div className="absolute" style={{ bottom: -48, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
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

        {/* 内容区 */}
        <div className="flex flex-col items-center px-7 pb-8" style={{ paddingTop: 60 }}>
          {/* 姓名 */}
          <h1 className="text-2xl font-bold text-center" style={{ color: "#2C2420", letterSpacing: "0.04em" }}>
            {counselor.displayName}
          </h1>

          {/* 角色标签 */}
          <span className="mt-2.5 px-3.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: roleColors.bg, color: roleColors.text, border: `1px solid ${roleColors.border}` }}>
            {roleLabel}
          </span>

          {/* 分隔线 */}
          <div className="w-10 h-px my-5" style={{ background: "rgba(156,180,138,0.4)" }} />

          {/* 来访者寄语 */}
          {counselor.tagline ? (
            <div className="w-full relative mb-6">
              <span className="absolute -top-3 left-1 text-4xl leading-none"
                style={{ color: "#9CB48A", opacity: 0.6, fontFamily: "Georgia, serif" }}>"</span>
              <p className="text-sm text-center leading-relaxed px-5 pt-4 pb-2"
                style={{ color: "#4A3F38", fontStyle: "italic", lineHeight: 1.8 }}>
                {counselor.tagline}
              </p>
              <span className="absolute -bottom-4 right-1 text-4xl leading-none"
                style={{ color: "#9CB48A", opacity: 0.6, fontFamily: "Georgia, serif" }}>"</span>
            </div>
          ) : (
            <p className="text-sm text-center mb-6 italic" style={{ color: "#9B8E82" }}>暂无寄语</p>
          )}

          {/* 工作人群标签 */}
          {groups.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-2 mb-6">
              {groups.slice(0, 6).map(g => (
                <span key={g} className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: "#E8DFCC", color: "#5A7A3A", border: "1px solid #D4C8B0" }}>
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* 分隔线 */}
          <div className="w-full h-px mb-6" style={{ background: "rgba(156,180,138,0.2)" }} />

          {/* 品牌 + 二维码 */}
          <div className="w-full flex items-center justify-between">
            <div>
              <p className="text-xs font-bold tracking-widest mb-1" style={{ color: "#9CB48A" }}>MINDPACE</p>
              <p className="text-xs leading-relaxed" style={{ color: "#9B8E82", maxWidth: 140 }}>
                神经多样性友好<br />心理咨询平台
              </p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="p-1.5 rounded-xl" style={{ background: "white", border: "1px solid #EBE7DF" }}>
                <QRCodeSVG value={cardUrl} size={64} fgColor="#3A6228" bgColor="white" level="M" />
              </div>
              <p className="text-xs" style={{ color: "#9B8E82" }}>扫码预约</p>
            </div>
          </div>
        </div>
      </div>

      {/* 提示 */}
      <p className="text-xs mt-4 mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
        点击「保存名片」下载图片，发送给来访者扫码预约
      </p>

      {/* 底部操作按钮 */}
      <div className="w-full max-w-sm flex gap-3">
        <button onClick={handleCopy}
          className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-medium"
          style={{ background: "rgba(255,255,255,0.25)", color: "white", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.4)", flexShrink: 0 }}>
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
