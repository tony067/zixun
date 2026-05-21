"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, MessageCircle, Bookmark, Clock, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEazo } from "@eazo/sdk/react";

type Counselor = {
  id: string; displayName: string; title: string; bio: string; tagline: string;
  specialties: string[]; approaches: string[]; workingGroups: string[];
  sessionModes: string[]; sessionDuration: number; pricePerSession: number;
  languages: string[]; location: string; avatarUrl: string | null;
  counselorTypes: string[]; isSupervisor: boolean;
  totalHours: number; totalSessions: number; rating: number;
  qualifications?: string[]; education?: string[]; trainings?: string[]; workExperiences?: string[];
  sessionDescription?: string;
};

const AVATAR_COLORS: Record<string, { bg: string; text: string }> = {
  "陈": { bg: "#C8DEB8", text: "#2E5020" },
  "李": { bg: "#D4C8E8", text: "#3A1E60" },
  "王": { bg: "#D8E8E0", text: "#1A4838" },
  "张": { bg: "#E8D8C8", text: "#5A2E10" },
  "林": { bg: "#C8E0E8", text: "#1A3850" },
  "余": { bg: "#E0E8C8", text: "#3A5010" },
  "刘": { bg: "#E8C8D8", text: "#5A1838" },
  "冯": { bg: "#D8C8E0", text: "#2E1860" },
};
const DEFAULT_AV = { bg: "#DDD8D0", text: "#5C5050" };

function getAv(name: string) { return AVATAR_COLORS[name[0]] ?? DEFAULT_AV; }

function getRoleTags(c: Counselor) {
  const tags = [...(c.counselorTypes ?? [])];
  if (c.isSupervisor && !tags.includes("督导")) tags.push("督导");
  if (tags.length === 0) {
    if (c.title?.includes("咨询师") || c.title?.includes("心理")) tags.push("心理咨询师");
    if (c.title?.includes("教练")) tags.push("ADHD教练");
    if (c.title?.includes("特教")) tags.push("特教老师");
  }
  return tags;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-5 border-t border-[#EBE7DF]">
      <h3 className="text-base font-bold text-[#2A2420] mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Tags({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(t => (
        <span key={t} className="text-sm px-3 py-1 rounded-full border border-[#DDD8D0] text-[#5C5C5C]"
          style={{ background: "#F5F1E8" }}>{t}</span>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-[#3B332C] leading-relaxed">
          <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#9CB48A" }} />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function CounselorDetailScreen({ counselorId }: { counselorId: string }) {
  const router = useRouter();
  const [c, setC] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    fetch(`/api/counselors/${counselorId}`)
      .then(r => r.json()).then(setC).finally(() => setLoading(false));
  }, [counselorId]);

  if (loading) return (
    <div className="min-h-svh" style={{ background: "#F5F1E8" }}>
      <div className="flex flex-col items-center pt-20 gap-4 px-5">
        <div className="w-24 h-24 rounded-3xl skeleton" />
        <div className="h-6 w-32 skeleton" /><div className="h-4 w-24 skeleton" />
      </div>
    </div>
  );

  if (!c) return (
    <div className="min-h-svh flex items-center justify-center" style={{ background: "#F5F1E8" }}>
      <p className="text-[#7D736A] text-sm">未找到该咨询师</p>
    </div>
  );

  const roleTags = getRoleTags(c);
  const av = getAv(c.displayName);
  const qualifications = c.qualifications ?? [];
  const education = c.education ?? [];
  const trainings = c.trainings ?? [];
  const workExperiences = c.workExperiences ?? [];

  return (
    <div className="min-h-svh pb-24" style={{ background: "#F5F1E8" }}>
      {/* 返回 */}
      <div className="px-5 pt-12 pb-2">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-[#5C5C5C]" />
        </motion.button>
      </div>

      <div className="px-5">
        {/* 头像 + 基本信息 */}
        <div className="flex flex-col items-center text-center pt-4 pb-5">
          {c.avatarUrl ? (
            <img src={c.avatarUrl} alt={c.displayName} className="w-24 h-24 rounded-3xl object-cover mb-4" />
          ) : (
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl font-bold mb-4"
              style={{ background: av.bg, color: av.text }}>
              {c.displayName[0]}
            </div>
          )}
          <h1 className="text-2xl font-bold text-[#2A2420] mb-2">{c.displayName}</h1>
          <div className="flex flex-wrap gap-1.5 justify-center mb-3">
            {roleTags.map(t => (
              <span key={t} className="text-sm px-3 py-1 rounded-full font-medium"
                style={{ background: "#EAF2E8", color: "#3A6B30" }}>{t}</span>
            ))}
          </div>
          <div className="flex items-center gap-1 text-sm text-[#7D736A] mb-1">
            <Clock className="w-4 h-4" />
            <span>累计咨询 <strong className="text-[#2A2420]">{c.totalHours}+</strong> 小时</span>
          </div>
          {c.location && (
            <div className="flex items-center gap-1 text-sm text-[#7D736A]">
              <MapPin className="w-4 h-4" />
              <span>{c.location}（视频全国可约）</span>
            </div>
          )}
        </div>

        {/* 寄语卡 */}
        {c.tagline && (
          <div className="rounded-2xl p-5 mb-1 relative overflow-hidden"
            style={{ background: "#EBE7D8" }}>
            <div className="text-5xl font-serif leading-none text-[#9CB48A] opacity-30 absolute top-1 left-3">"</div>
            <p className="text-base text-[#3B332C] leading-relaxed pt-4 pl-1">{c.tagline}</p>
            <p className="text-right text-sm text-[#7D736A] mt-3">—— {c.displayName}</p>
          </div>
        )}

        {/* 关于我 */}
        {c.bio && <Section title="关于我"><p className="text-sm text-[#3B332C] leading-relaxed">{c.bio}</p></Section>}

        {/* 擅长领域 */}
        {(c.specialties?.length > 0) && <Section title="擅长领域"><Tags items={c.specialties} /></Section>}

        {/* 工作人群 */}
        {(c.workingGroups?.length > 0) && <Section title="工作人群"><Tags items={c.workingGroups} /></Section>}

        {/* 咨询取向 */}
        {(c.approaches?.length > 0) && <Section title="咨询取向"><Tags items={c.approaches} /></Section>}

        {/* 咨询设置 */}
        <Section title="咨询设置">
          <div className="grid grid-cols-3 gap-3">
            {[
              { top: String(c.sessionDuration), bottom: "分钟 / 次", icon: "⏱" },
              { top: String(c.pricePerSession), bottom: "每次费用", icon: "¥" },
              { top: c.sessionModes.join(" / "), bottom: "咨询方式", icon: "📹", small: true },
            ].map((g, i) => (
              <div key={i} className="rounded-2xl p-3 text-center" style={{ background: "#EBE7D8" }}>
                <div className="text-xl mb-1">{g.icon}</div>
                <div className={`font-bold text-[#2A2420] ${(g as any).small ? "text-xs leading-tight" : "text-lg"}`}>{g.top}</div>
                <div className="text-xs text-[#7D736A] mt-0.5">{g.bottom}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* 从业背景 */}
        {(qualifications.length + education.length + trainings.length + workExperiences.length > 0) && (
          <Section title="从业背景">
            {qualifications.length > 0 && <div className="mb-4"><h4 className="text-sm font-bold text-[#2A2420] mb-2">从业资质</h4><BulletList items={qualifications} /></div>}
            {education.length > 0 && <div className="mb-4"><h4 className="text-sm font-bold text-[#2A2420] mb-2">教育背景</h4><BulletList items={education} /></div>}
            {trainings.length > 0 && <div className="mb-4"><h4 className="text-sm font-bold text-[#2A2420] mb-2">受训经历</h4><BulletList items={trainings} /></div>}
            {workExperiences.length > 0 && <div><h4 className="text-sm font-bold text-[#2A2420] mb-2">工作经验</h4><BulletList items={workExperiences} /></div>}
          </Section>
        )}

        {/* 咨询过程与方式 */}
        {c.sessionDescription && (
          <Section title="咨询过程与方式">
            <p className="text-sm text-[#3B332C] leading-relaxed whitespace-pre-line">{c.sessionDescription}</p>
          </Section>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-[#EBE7DF]"
        style={{ background: "#FAF8F2", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center gap-4 px-5 py-3 max-w-2xl mx-auto">
          <button className="flex flex-col items-center gap-0.5 text-[#7D736A]">
            <Share2 className="w-5 h-5" /><span className="text-[10px]">分享</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 text-[#7D736A]">
            <MessageCircle className="w-5 h-5" /><span className="text-[10px]">私信</span>
          </button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setBookmarked(b => !b)}
            className="flex flex-col items-center gap-0.5" style={{ color: bookmarked ? "#9CB48A" : "#7D736A" }}>
            <Bookmark className={`w-5 h-5 ${bookmarked ? "fill-[#9CB48A]" : ""}`} />
            <span className="text-[10px]">收藏</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }}
            className="flex-1 py-3 rounded-2xl text-white font-semibold text-sm"
            style={{ background: "#9CB48A" }}
            onClick={() => router.push(`/booking/${c.id}`)}>
            预约咨询
          </motion.button>
        </div>
      </div>
    </div>
  );
}
