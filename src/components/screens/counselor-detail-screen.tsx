"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, MapPin, Share2, MessageCircle, Bookmark, CalendarCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEazo } from "@eazo/sdk/react";
import { auth } from "@eazo/sdk";

type Counselor = {
  id: string; displayName: string; title: string; bio: string; tagline: string;
  specialties: string[]; approaches: string[]; workingGroups: string[];
  sessionModes: string[]; sessionDuration: number; pricePerSession: number;
  languages: string[]; location: string; avatarUrl: string | null;
  isAccepting: boolean; counselorTypes: string[]; isSupervisor: boolean;
  totalHours: number; totalSessions: number; rating: number;
  qualifications?: string[] | null;
  education?: string[] | null;
  trainings?: string[] | null;
  workExperiences?: string[] | null;
  sessionDescription?: string | null;
};

const AV_COLORS = [
  { bg: "#E8DECE", text: "#6B5022" },
  { bg: "#D5E4D0", text: "#2D5A28" },
  { bg: "#D5DEF0", text: "#2A3F75" },
  { bg: "#E8D5E8", text: "#622060" },
  { bg: "#D5EEEA", text: "#1A6050" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-5 border-b" style={{ borderColor: "#EBE7DF" }}>
      <h3 className="text-[17px] font-bold mb-3" style={{ color: "#3B332C" }}>{title}</h3>
      {children}
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <span key={item} className="text-[14px] px-3 py-1.5 rounded-full border"
          style={{ borderColor: "#C2BDB7", color: "#3B332C", background: "transparent" }}>
          {item}
        </span>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[15px]" style={{ color: "#3B332C" }}>
          <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#9CB48A" }} />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function CounselorDetailScreen({ counselorId }: { counselorId: string }) {
  const router = useRouter();
  const user = useEazo((s) => s.auth.user);
  const [c, setC] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const av = AV_COLORS[counselorId.charCodeAt(counselorId.length - 1) % AV_COLORS.length];

  useEffect(() => {
    fetch(`/api/counselors/${counselorId}`)
      .then(r => r.json()).then(setC).finally(() => setLoading(false));
  }, [counselorId]);

  if (loading) return (
    <div className="min-h-svh px-5 pt-16" style={{ background: "#F5F1E8" }}>
      <div className="w-20 h-20 rounded-2xl skeleton mx-auto mb-4" />
      <div className="h-6 w-32 skeleton mx-auto mb-2" />
      <div className="h-5 w-20 skeleton mx-auto mb-8" />
      {[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-2xl mb-4" />)}
    </div>
  );

  if (!c) return (
    <div className="min-h-svh flex items-center justify-center" style={{ background: "#F5F1E8" }}>
      <p style={{ color: "#7D736A" }}>未找到该咨询师</p>
    </div>
  );

  const roleTags = [...(c.counselorTypes ?? [])];
  if (c.isSupervisor && !roleTags.includes("督导")) roleTags.push("督导");

  return (
    <div className="min-h-svh pb-28" style={{ background: "#F5F1E8" }}>
      {/* 返回按钮 */}
      <div className="sticky top-0 z-20 px-4 pt-12 pb-3" style={{ background: "rgba(245,241,232,0.92)", backdropFilter: "blur(8px)" }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center border"
          style={{ background: "white", borderColor: "#EBE7DF" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "#7D736A" }} />
        </motion.button>
      </div>

      {/* ── 头部：头像 + 姓名 + 角色 + 时长 + 位置 ── */}
      <div className="flex flex-col items-center px-5 pb-5 pt-2 border-b" style={{ borderColor: "#EBE7DF" }}>
        {c.avatarUrl ? (
          <img src={c.avatarUrl} alt={c.displayName} className="w-24 h-24 rounded-2xl object-cover mb-3" />
        ) : (
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold mb-3"
            style={{ background: av.bg, color: av.text }}>
            {c.displayName[0]}
          </div>
        )}
        <h1 className="text-[22px] font-bold mb-2" style={{ color: "#3B332C" }}>{c.displayName}</h1>
        {roleTags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mb-3">
            {roleTags.map(t => (
              <span key={t} className="text-sm px-3 py-1 rounded-full font-medium"
                style={{ background: "#EEF5EA", color: "#5A8040" }}>{t}</span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1 text-sm mb-1" style={{ color: "#7D736A" }}>
          <Clock className="w-3.5 h-3.5" />
          累计咨询 <span className="font-semibold mx-1">{c.totalHours}+</span> 小时
        </div>
        {c.location && (
          <div className="flex items-center gap-1 text-sm" style={{ color: "#7D736A" }}>
            <MapPin className="w-3.5 h-3.5" />
            {c.location}
          </div>
        )}
      </div>

      {/* ── 主体内容区 ── */}
      <div className="px-5" style={{ background: "white" }}>
        {/* 寄语卡 */}
        {c.tagline && (
          <div className="py-5 border-b" style={{ borderColor: "#EBE7DF" }}>
            <div className="rounded-2xl p-5 relative" style={{ background: "#EEEAE0" }}>
              <div className="text-4xl font-serif leading-none mb-3 opacity-40 select-none" style={{ color: "#9CB48A" }}>
                &ldquo;
              </div>
              <p className="text-[16px] leading-relaxed" style={{ color: "#3B332C" }}>{c.tagline}</p>
              <p className="text-right text-sm mt-3" style={{ color: "#9CB48A" }}>—— {c.displayName}</p>
            </div>
          </div>
        )}

        {/* 关于我 */}
        {c.bio && (
          <Section title="关于我">
            <p className="text-[15px] leading-relaxed" style={{ color: "#4A4240" }}>{c.bio}</p>
          </Section>
        )}

        {/* 擅长领域 */}
        {c.specialties?.length > 0 && (
          <Section title="擅长领域">
            <TagList items={c.specialties} />
          </Section>
        )}

        {/* 工作人群 */}
        {c.workingGroups?.length > 0 && (
          <Section title="工作人群">
            <TagList items={c.workingGroups} />
          </Section>
        )}

        {/* 咨询取向 */}
        {c.approaches?.length > 0 && (
          <Section title="咨询取向">
            <TagList items={c.approaches} />
          </Section>
        )}

        {/* 咨询设置：3格 */}
        <Section title="咨询设置">
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {[
              { icon: "⏱", top: String(c.sessionDuration), bottom: "分钟 / 次" },
              { icon: "¥", top: String(c.pricePerSession), bottom: "每次费用" },
              { icon: "📹", top: c.sessionModes.join(" /\n"), bottom: "咨询方式" },
            ].map((box, i) => (
              <div key={i} className="rounded-2xl p-3.5 flex flex-col items-center text-center"
                style={{ background: "#F0EBE0" }}>
                <span className="text-2xl mb-1">{box.icon}</span>
                <p className="text-[17px] font-bold leading-snug" style={{ color: "#3B332C" }}>{box.top}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#7D736A" }}>{box.bottom}</p>
              </div>
            ))}
          </div>
          {c.languages?.length > 0 && (
            <p className="text-[14px]" style={{ color: "#7D736A" }}>
              咨询语言：{c.languages.join("、")}
            </p>
          )}
        </Section>

        {/* 从业背景 */}
        {(c.qualifications?.length || c.education?.length || c.trainings?.length || c.workExperiences?.length) ? (
          <Section title="从业背景">
            {c.qualifications?.length ? (
              <div className="mb-5">
                <h4 className="text-[15px] font-semibold mb-2" style={{ color: "#3B332C" }}>从业资质</h4>
                <BulletList items={c.qualifications} />
              </div>
            ) : null}
            {c.education?.length ? (
              <div className="mb-5">
                <h4 className="text-[15px] font-semibold mb-2" style={{ color: "#3B332C" }}>教育背景</h4>
                <BulletList items={c.education} />
              </div>
            ) : null}
            {c.trainings?.length ? (
              <div className="mb-5">
                <h4 className="text-[15px] font-semibold mb-2" style={{ color: "#3B332C" }}>受训经历</h4>
                <BulletList items={c.trainings} />
              </div>
            ) : null}
            {c.workExperiences?.length ? (
              <div>
                <h4 className="text-[15px] font-semibold mb-2" style={{ color: "#3B332C" }}>工作经验</h4>
                <BulletList items={c.workExperiences} />
              </div>
            ) : null}
          </Section>
        ) : null}

        {/* 咨询过程与方式 */}
        {c.sessionDescription && (
          <Section title="咨询过程与方式">
            <p className="text-[15px] leading-relaxed whitespace-pre-line" style={{ color: "#4A4240" }}>
              {c.sessionDescription}
            </p>
          </Section>
        )}
      </div>

      {/* ── 底部固定操作栏 ── */}
      <div className="fixed bottom-0 inset-x-0 z-30 px-4 py-3 border-t flex items-center gap-3"
        style={{ background: "white", borderColor: "#EBE7DF", paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}>
        {/* 分享 */}
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <button className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "#F5F1E8" }}>
            <Share2 className="w-4.5 h-4.5" style={{ color: "#7D736A" }} />
          </button>
          <span className="text-[10px]" style={{ color: "#7D736A" }}>分享</span>
        </div>
        {/* 私信 */}
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <button className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "#F5F1E8" }}>
            <MessageCircle className="w-4.5 h-4.5" style={{ color: "#7D736A" }} />
          </button>
          <span className="text-[10px]" style={{ color: "#7D736A" }}>私信</span>
        </div>
        {/* 收藏 */}
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <button onClick={() => setBookmarked(!bookmarked)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "#F5F1E8" }}>
            <Bookmark className="w-4.5 h-4.5"
              style={{ color: bookmarked ? "#9CB48A" : "#7D736A", fill: bookmarked ? "#9CB48A" : "none" }} />
          </button>
          <span className="text-[10px]" style={{ color: "#7D736A" }}>收藏</span>
        </div>
        {/* 预约咨询 */}
        <motion.button whileTap={{ scale: 0.97 }} className="flex-1 py-3 rounded-2xl text-white font-semibold text-[16px]"
          style={{ background: c.isAccepting ? "#9CB48A" : "#C2BDB7" }}
          onClick={() => {
            if (!user) { auth.login(); return; }
            window.location.href = `/booking/${c.id}`;
          }}>
          {c.isAccepting ? "预约咨询" : "暂停接诊"}
        </motion.button>
      </div>
    </div>
  );
}
