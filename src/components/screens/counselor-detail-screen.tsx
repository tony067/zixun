"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Share2, MessageCircle, Bookmark, Clock, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";

type Counselor = {
  id: string; displayName: string; title: string; bio: string; tagline: string;
  specialties: string[]; approaches: string[]; workingGroups: string[];
  sessionModes: string[]; sessionDuration: number; pricePerSession: number;
  languages: string[]; location: string; avatarUrl: string | null;
  counselorTypes: string[]; isSupervisor: boolean;
  totalHours: number; totalSessions: number; rating: number;
  qualifications?: string[]; education?: string[]; trainings?: string[];
  workExperiences?: string[]; sessionDescription?: string;
};

// 头像背景色——按姓氏首字分配
const AVATAR_PALETTES: { bg: string; text: string }[] = [
  { bg: "#C8DEB8", text: "#2E5020" },
  { bg: "#D4C4A8", text: "#5C4A20" },
  { bg: "#A8C4D8", text: "#1E3D6B" },
  { bg: "#C8B8D4", text: "#3D1E5C" },
  { bg: "#B8D4C8", text: "#1E4A3D" },
  { bg: "#D8C4B8", text: "#5C3A20" },
];

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-5 border-b border-[#EAE4DC]">
      <h3 className="text-base font-bold text-[#2C2420] mb-3">{title}</h3>
      {children}
    </div>
  );
}

function TagList({ items, bg = "#F0EDE8", color = "#5C5550" }: { items: string[]; bg?: string; color?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <span key={item} className="text-sm px-3 py-1.5 rounded-full border border-[#E0DBD4]"
          style={{ background: bg, color }}>
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
        <li key={i} className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: "#9CB48A" }} />
          <span className="text-sm text-[#4A4540] leading-relaxed">{item}</span>
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

  useEffect(() => {
    fetch(`/api/counselors/${counselorId}`)
      .then(r => r.json())
      .then(setC)
      .finally(() => setLoading(false));
  }, [counselorId]);

  if (loading) return (
    <div className="min-h-svh" style={{ background: "#F5F1EA" }}>
      <div className="h-12 flex items-center px-4 pt-12">
        <div className="w-9 h-9 rounded-full skeleton" />
      </div>
      <div className="flex flex-col items-center py-8 px-5">
        <div className="w-24 h-24 rounded-2xl skeleton mb-3" />
        <div className="h-6 w-32 skeleton mb-2" />
        <div className="h-4 w-20 skeleton" />
      </div>
    </div>
  );

  if (!c) return (
    <div className="min-h-svh flex items-center justify-center" style={{ background: "#F5F1EA" }}>
      <p className="text-[#7D736A]">未找到该咨询师</p>
    </div>
  );

  const palette = AVATAR_PALETTES[c.displayName.charCodeAt(0) % AVATAR_PALETTES.length];
  const roleTags = getRoleTags(c);

  return (
    <div className="min-h-svh pb-24" style={{ background: "#F5F1EA" }}>
      {/* 返回按钮 */}
      <div className="flex items-center px-4 pt-12 pb-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-[#5C5550]" />
        </motion.button>
      </div>

      {/* 头像 + 姓名区 */}
      <div className="flex flex-col items-center pb-5 border-b border-[#EAE4DC] px-5">
        <div
          className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold mb-3"
          style={{ background: palette.bg, color: palette.text }}
        >
          {c.avatarUrl
            ? <img src={c.avatarUrl} alt={c.displayName} className="w-full h-full object-cover rounded-2xl" />
            : c.displayName[0]
          }
        </div>
        <h1 className="text-2xl font-semibold text-[#2C2420] mb-2">{c.displayName}</h1>
        <div className="flex flex-wrap justify-center gap-2 mb-3">
          {roleTags.map(t => (
            <span key={t} className="text-sm px-3 py-1 rounded-full font-medium"
              style={{ background: "#EAF3EC", color: "#4a7a4a" }}>{t}</span>
          ))}
        </div>
        <div className="flex items-center gap-1 text-sm text-[#7D736A] mb-1">
          <Clock className="w-3.5 h-3.5" />
          <span>累计咨询 {c.totalHours}+ 小时</span>
        </div>
        {c.location && (
          <div className="flex items-center gap-1 text-sm text-[#9B8E82]">
            <MapPin className="w-3.5 h-3.5" />
            <span>{c.location}{c.sessionModes?.includes("视频") ? "（视频全国可约）" : ""}</span>
          </div>
        )}
      </div>

      {/* 寄语卡 */}
      {c.tagline && (
        <div className="mx-5 my-5 rounded-2xl px-5 py-4 relative" style={{ background: "#E8E0CC" }}>
          <span className="absolute top-2 left-3 text-3xl font-serif leading-none opacity-50 text-[#9B8E82]">"</span>
          <p className="text-sm text-[#3C3228] leading-relaxed pt-4 pb-2">{c.tagline}</p>
          <p className="text-xs text-right text-[#9B8E82] mt-1">—— {c.displayName}</p>
        </div>
      )}

      {/* 关于我 */}
      <Section title="关于我">
        <p className="text-sm text-[#4A4540] leading-relaxed">{c.bio}</p>
      </Section>

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

      {/* 咨询设置 */}
      <Section title="咨询设置">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { top: <Clock className="w-4 h-4 text-[#7D736A]" />, val: String(c.sessionDuration), unit: "分钟 / 次" },
            { top: <span className="text-sm text-[#7D736A]">¥</span>, val: String(c.pricePerSession), unit: "每次费用" },
            { top: null, val: c.sessionModes?.join(" / "), unit: "咨询方式" },
          ].map((item, i) => (
            <div key={i} className="rounded-2xl p-3 text-center" style={{ background: "#EAE4DC" }}>
              <div className="flex justify-center mb-1">{item.top ?? <span className="h-4" />}</div>
              <p className="text-xl font-bold text-[#2C2420]">{item.val}</p>
              <p className="text-[10px] text-[#9B8E82] mt-0.5">{item.unit}</p>
            </div>
          ))}
        </div>
        {c.languages?.length > 0 && (
          <p className="text-sm text-[#7D736A]">语言：{c.languages.join("、")}</p>
        )}
      </Section>

      {/* 从业背景 */}
      {(c.qualifications?.length || c.education?.length || c.trainings?.length || c.workExperiences?.length) ? (
        <Section title="从业背景">
          <div className="space-y-5">
            {c.qualifications?.length ? (
              <div>
                <h4 className="text-sm font-semibold text-[#2C2420] mb-2">从业资质</h4>
                <BulletList items={c.qualifications} />
              </div>
            ) : null}
            {c.education?.length ? (
              <div>
                <h4 className="text-sm font-semibold text-[#2C2420] mb-2">教育背景</h4>
                <BulletList items={c.education} />
              </div>
            ) : null}
            {c.trainings?.length ? (
              <div>
                <h4 className="text-sm font-semibold text-[#2C2420] mb-2">受训经历</h4>
                <BulletList items={c.trainings} />
              </div>
            ) : null}
            {c.workExperiences?.length ? (
              <div>
                <h4 className="text-sm font-semibold text-[#2C2420] mb-2">工作经验</h4>
                <BulletList items={c.workExperiences} />
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      {/* 咨询过程与方式 */}
      {c.sessionDescription && (
        <Section title="咨询过程与方式">
          <p className="text-sm text-[#4A4540] leading-relaxed whitespace-pre-line">
            {c.sessionDescription}
          </p>
        </Section>
      )}

      {/* 底部固定操作栏 */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#EAE4DC] px-4 py-3 flex items-center gap-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}>
        <div className="flex gap-5 flex-shrink-0">
          <button className="flex flex-col items-center gap-0.5 text-[10px] text-[#9B8E82]">
            <Share2 className="w-5 h-5" />分享
          </button>
          <button className="flex flex-col items-center gap-0.5 text-[10px] text-[#9B8E82]">
            <MessageCircle className="w-5 h-5" />私信
          </button>
          <button className="flex flex-col items-center gap-0.5 text-[10px] text-[#9B8E82]"
            onClick={() => setBookmarked(p => !p)}>
            <Bookmark className={`w-5 h-5 ${bookmarked ? "fill-[#9CB48A] text-[#9CB48A]" : ""}`} />收藏
          </button>
        </div>
        {c.isAccepting !== false ? (
          <Link href={`/booking/${c.id}`} className="flex-1">
            <motion.button whileTap={{ scale: 0.97 }}
              className="w-full py-3 rounded-2xl text-white font-semibold text-base"
              style={{ background: "#9CB48A" }}>
              预约咨询
            </motion.button>
          </Link>
        ) : (
          <div className="flex-1 py-3 rounded-2xl text-center text-[#9B8E82] bg-[#EAE4DC] text-sm">暂停接诊</div>
        )}
      </div>
    </div>
  );
}

// Need Link import
import Link from "next/link";
