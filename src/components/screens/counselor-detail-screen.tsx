"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, MapPin, Share2, MessageCircle, Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";

type Counselor = {
  id: string; displayName: string; title: string; bio: string; tagline: string;
  specialties: string[]; approaches: string[]; workingGroups: string[];
  sessionModes: string[]; sessionDuration: number; pricePerSession: number;
  languages: string[]; location: string; avatarUrl: string | null;
  isAccepting: boolean; counselorTypes: string[]; isSupervisor: boolean;
  totalHours: number; totalSessions: number; rating: number;
  qualifications: string[]; education: string[];
  trainings: string[]; workExperiences: string[];
  sessionDescription: string;
};

const AVATAR_COLORS = [
  { bg: "#D4EBC8", text: "#2D5A20" },
  { bg: "#C8D8E8", text: "#1E3D5C" },
  { bg: "#E8D0C8", text: "#5C2A1E" },
  { bg: "#D0C8E8", text: "#3A2A5C" },
  { bg: "#C8E8D8", text: "#1E5C3A" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-bold text-[#2A2420] mt-7 mb-3">{children}</h2>;
}

function TagList({ items, color = "bg-[#F5F1E8] text-[#5C5552] border-[#DDD8D0]" }: { items: string[]; color?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(t => (
        <span key={t} className={`text-sm px-3.5 py-1.5 rounded-full border ${color}`}>{t}</span>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-1.5 w-2 h-2 rounded-full bg-[#9CB48A] flex-shrink-0" />
          <span className="text-sm text-[#3B332C] leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Divider() {
  return <div className="h-px bg-[#EBE7DF] my-0" />;
}

export function CounselorDetailScreen({ counselorId }: { counselorId: string }) {
  const router = useRouter();
  const [c, setC] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/counselors/${counselorId}`)
      .then(r => r.json()).then(setC).finally(() => setLoading(false));
  }, [counselorId]);

  if (loading) return (
    <div className="min-h-svh bg-[#F5F1E8] p-6 space-y-4">
      <div className="w-24 h-24 rounded-2xl skeleton mx-auto" />
      <div className="h-7 w-32 skeleton mx-auto" />
      <div className="h-28 skeleton rounded-2xl" />
      {[1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}
    </div>
  );

  if (!c) return (
    <div className="min-h-svh flex items-center justify-center bg-[#F5F1E8]">
      <p className="text-[#7D736A]">未找到该咨询师</p>
    </div>
  );

  const colorIdx = c.id.charCodeAt(c.id.length - 1) % AVATAR_COLORS.length;
  const col = AVATAR_COLORS[colorIdx];
  const roleTags = c.counselorTypes?.length ? c.counselorTypes : (c.isSupervisor ? ["督导"] : []);

  return (
    <div className="min-h-svh bg-[#F5F1E8] pb-28">
      {/* 返回按钮 */}
      <div className="sticky top-0 z-10 bg-[#F5F1E8]/95 backdrop-blur px-4 pt-12 pb-2 flex items-center">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white border border-[#EBE7DF] flex items-center justify-center shadow-sm">
          <ArrowLeft className="w-4 h-4 text-[#7D736A]" />
        </motion.button>
      </div>

      <div className="px-5">
        {/* Hero：居中头像 + 姓名 + 角色标签 + 时长 + 地点 */}
        <div className="flex flex-col items-center pt-2 pb-6">
          <div className="w-28 h-28 rounded-[22px] flex items-center justify-center text-4xl font-bold mb-4 shadow-sm"
            style={{ background: col.bg, color: col.text }}>
            {c.displayName[0]}
          </div>
          <h1 className="text-2xl font-bold text-[#2A2420] mb-2">{c.displayName}</h1>
          {roleTags.map(t => (
            <span key={t} className="text-sm px-4 py-1 rounded-full font-medium text-[#4A7A40] bg-[#EBF2E6] mb-2">
              {t}
            </span>
          ))}
          <div className="flex items-center gap-1 text-sm text-[#7D736A] mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>累计咨询 <strong className="text-[#3B332C]">{c.totalHours}+</strong> 小时</span>
          </div>
          {c.location && (
            <div className="flex items-center gap-1 text-sm text-[#9B9590]">
              <MapPin className="w-3.5 h-3.5" />
              <span>{c.location}</span>
            </div>
          )}
        </div>

        <Divider />

        {/* 寄语卡 */}
        {c.tagline && (
          <div className="my-5 bg-[#EDE8DC] rounded-2xl px-5 py-5 relative overflow-hidden">
            <span className="absolute top-2 left-3 text-4xl font-serif text-[#9CB48A] leading-none opacity-60">"</span>
            <p className="text-sm text-[#3B332C] leading-relaxed pt-4 italic">{c.tagline}</p>
            <p className="text-right text-xs text-[#9B9590] mt-3">—— {c.displayName}</p>
          </div>
        )}

        <Divider />

        {/* 关于我 */}
        {c.bio && (
          <>
            <SectionTitle>关于我</SectionTitle>
            <p className="text-sm text-[#3B332C] leading-relaxed">{c.bio}</p>
            <Divider className="mt-6" />
          </>
        )}

        {/* 擅长领域 */}
        {c.specialties?.length > 0 && (
          <>
            <SectionTitle>擅长领域</SectionTitle>
            <TagList items={c.specialties} />
            <div className="mt-6" /><Divider />
          </>
        )}

        {/* 工作人群 */}
        {c.workingGroups?.length > 0 && (
          <>
            <SectionTitle>工作人群</SectionTitle>
            <TagList items={c.workingGroups} />
            <div className="mt-6" /><Divider />
          </>
        )}

        {/* 咨询取向 */}
        {c.approaches?.length > 0 && (
          <>
            <SectionTitle>咨询取向</SectionTitle>
            <TagList items={c.approaches} />
            <div className="mt-6" /><Divider />
          </>
        )}

        {/* 咨询设置 */}
        <SectionTitle>咨询设置</SectionTitle>
        <div className="grid grid-cols-3 gap-3 mb-2">
          <div className="bg-[#EDE8DC] rounded-2xl p-4 flex flex-col items-center gap-1">
            <span className="text-lg text-[#9CB48A]">🕐</span>
            <p className="text-xl font-bold text-[#3B332C]">{c.sessionDuration}</p>
            <p className="text-xs text-[#9B9590] text-center">分钟 / 次</p>
          </div>
          <div className="bg-[#EDE8DC] rounded-2xl p-4 flex flex-col items-center gap-1">
            <span className="text-lg text-[#9CB48A]">¥</span>
            <p className="text-xl font-bold text-[#3B332C]">{c.pricePerSession}</p>
            <p className="text-xs text-[#9B9590] text-center">每次费用</p>
          </div>
          <div className="bg-[#EDE8DC] rounded-2xl p-4 flex flex-col items-center justify-center gap-1">
            <span className="text-lg text-[#9CB48A]">📹</span>
            <p className="text-xs font-medium text-[#3B332C] text-center leading-tight">
              {c.sessionModes.join(" / ")}
            </p>
            <p className="text-xs text-[#9B9590] text-center">咨询方式</p>
          </div>
        </div>
        <Divider />

        {/* 从业背景 */}
        {(c.qualifications?.length > 0 || c.education?.length > 0 || c.trainings?.length > 0 || c.workExperiences?.length > 0) && (
          <>
            <SectionTitle>从业背景</SectionTitle>
            {c.qualifications?.length > 0 && (
              <><h3 className="text-sm font-bold text-[#3B332C] mb-2">从业资质</h3><BulletList items={c.qualifications} /><div className="mt-4"/></>
            )}
            {c.education?.length > 0 && (
              <><h3 className="text-sm font-bold text-[#3B332C] mb-2">教育背景</h3><BulletList items={c.education} /><div className="mt-4"/></>
            )}
            {c.trainings?.length > 0 && (
              <><h3 className="text-sm font-bold text-[#3B332C] mb-2">受训经历</h3><BulletList items={c.trainings} /><div className="mt-4"/></>
            )}
            {c.workExperiences?.length > 0 && (
              <><h3 className="text-sm font-bold text-[#3B332C] mb-2">工作经验</h3><BulletList items={c.workExperiences} /></>
            )}
            <div className="mt-6" /><Divider />
          </>
        )}

        {/* 咨询过程与方式 */}
        {c.sessionDescription && (
          <>
            <SectionTitle>咨询过程与方式</SectionTitle>
            <div className="text-sm text-[#3B332C] leading-relaxed space-y-3">
              {c.sessionDescription.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 底部固定操作栏 */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-[#EBE7DF] bg-[#F5F1E8]/98 backdrop-blur px-5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
        <div className="flex items-center gap-4 max-w-lg mx-auto">
          <div className="flex gap-5 flex-shrink-0">
            <button className="flex flex-col items-center gap-0.5">
              <Share2 className="w-5 h-5 text-[#9B9590]" />
              <span className="text-[10px] text-[#9B9590]">分享</span>
            </button>
            <button className="flex flex-col items-center gap-0.5">
              <MessageCircle className="w-5 h-5 text-[#9B9590]" />
              <span className="text-[10px] text-[#9B9590]">私信</span>
            </button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSaved(v => !v)} className="flex flex-col items-center gap-0.5">
              <Bookmark className={`w-5 h-5 ${saved ? "text-[#9CB48A] fill-[#9CB48A]" : "text-[#9B9590]"}`} />
              <span className={`text-[10px] ${saved ? "text-[#9CB48A]" : "text-[#9B9590]"}`}>收藏</span>
            </motion.button>
          </div>
          <Link href={`/booking/${c.id}`} className="flex-1">
            <motion.button whileTap={{ scale: 0.97 }}
              className="w-full h-12 rounded-2xl font-semibold text-white text-base shadow-md"
              style={{ background: "#9CB48A" }}>
              预约咨询
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  );
}
