"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, MapPin, Share2, MessageCircle, Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Counselor = {
  id: string; displayName: string; title: string; bio: string; tagline: string;
  specialties: string[]; approaches: string[]; workingGroups: string[];
  sessionModes: string[]; sessionDuration: number; pricePerSession: number;
  languages: string[]; location: string; avatarUrl: string | null;
  isAccepting: boolean; counselorTypes: string[]; isSupervisor: boolean;
  totalHours: number; totalSessions: number; rating: number;
  qualifications?: string[]; education?: string[];
  trainings?: string[]; workExperiences?: string[];
  sessionDescription?: string;
};

const AVATAR_BG: Record<number, { bg: string; text: string }> = {
  0: { bg: "#C4D8C0", text: "#2d5a28" },
  1: { bg: "#E5DCC5", text: "#6b5a30" },
  2: { bg: "#C0D0E0", text: "#1e3d6b" },
  3: { bg: "#D8C8E4", text: "#5a2878" },
  4: { bg: "#E8CFC8", text: "#7a3020" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-5 border-b border-[#EBE7DF]">
      <h3 className="text-base font-bold mb-3" style={{ color: "#3B332C" }}>{title}</h3>
      {children}
    </div>
  );
}

function TagList({ items, bg = "#F5F1E8", border = "#EBE7DF", color = "#3B332C" }: {
  items: string[]; bg?: string; border?: string; color?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(t => (
        <span key={t} className="text-sm px-3 py-1.5 rounded-full border"
          style={{ background: bg, borderColor: border, color }}>{t}</span>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: "#3B332C" }}>
          <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: "#9CB48A" }} />
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
    <div className="min-h-svh p-6 space-y-4" style={{ background: "#F5F1E8" }}>
      <div className="w-24 h-24 rounded-2xl skeleton mx-auto" />
      <div className="h-6 w-32 skeleton mx-auto" />
      <div className="h-4 w-48 skeleton mx-auto" />
      {[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
    </div>
  );

  if (!c) return (
    <div className="min-h-svh flex items-center justify-center" style={{ background: "#F5F1E8" }}>
      <p className="text-sm" style={{ color: "#7D736A" }}>未找到该咨询师</p>
    </div>
  );

  const avatarCol = AVATAR_BG[c.displayName.charCodeAt(0) % 5];
  const roleTags = [...(c.counselorTypes ?? [])];
  if (c.isSupervisor && !roleTags.includes("督导")) roleTags.push("督导");

  return (
    <div className="min-h-svh pb-28" style={{ background: "#F5F1E8" }}>
      {/* 返回按钮 */}
      <div className="sticky top-0 z-10 px-4 pt-12 pb-2" style={{ background: "#F5F1E8" }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center border border-[#EBE7DF]"
          style={{ background: "#FDFBF7" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "#7D736A" }} />
        </motion.button>
      </div>

      <div className="px-4">
        {/* 大头像 + 姓名 + 角色 + 累计时长 + 地区 */}
        <div className="text-center mb-6 pt-2">
          {c.avatarUrl ? (
            <img src={c.avatarUrl} alt={c.displayName}
              className="w-24 h-24 rounded-2xl object-cover mx-auto mb-4 shadow-sm" />
          ) : (
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold mx-auto mb-4 shadow-sm"
              style={{ background: avatarCol.bg, color: avatarCol.text }}>
              {c.displayName[0]}
            </div>
          )}
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#3B332C" }}>{c.displayName}</h1>
          {/* 角色标签 */}
          <div className="flex flex-wrap justify-center gap-1.5 mb-3">
            {roleTags.map(t => (
              <span key={t} className="text-sm px-3 py-1 rounded-full font-medium"
                style={{ background: "#EEF5EA", color: "#3a6b30" }}>{t}</span>
            ))}
          </div>
          {/* 累计时长 */}
          {c.totalHours > 0 && (
            <div className="flex items-center justify-center gap-1.5 text-sm mb-1.5" style={{ color: "#7D736A" }}>
              <Clock className="w-4 h-4" />
              累计咨询 <span className="font-semibold">{c.totalHours}+</span> 小时
            </div>
          )}
          {/* 地区 */}
          {c.location && (
            <div className="flex items-center justify-center gap-1 text-sm" style={{ color: "#7D736A" }}>
              <MapPin className="w-3.5 h-3.5" />
              {c.location}
              {c.sessionModes.includes("视频") && "（视频全国可约）"}
            </div>
          )}
        </div>

        {/* 咨询师寄语 */}
        {c.tagline && (
          <div className="rounded-2xl p-5 mb-2 relative" style={{ background: "#EDE8DC" }}>
            <span className="text-4xl font-serif absolute top-3 left-4 opacity-30" style={{ color: "#9CB48A" }}>"</span>
            <p className="text-base leading-relaxed pt-4 italic" style={{ color: "#3B332C" }}>{c.tagline}</p>
            <p className="text-right text-sm mt-3" style={{ color: "#7D736A" }}>—— {c.displayName}</p>
          </div>
        )}

        {/* 分隔线 */}
        <div className="border-t border-[#EBE7DF] my-2" />

        {/* 关于我 */}
        {c.bio && (
          <Section title="关于我">
            <p className="text-sm leading-relaxed" style={{ color: "#3B332C" }}>{c.bio}</p>
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

        {/* 咨询设置三格 */}
        <Section title="咨询设置">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-2xl p-3 text-center" style={{ background: "#EDE8DC" }}>
              <div className="text-xl font-bold" style={{ color: "#3B332C" }}>{c.sessionDuration}</div>
              <div className="text-xs mt-1" style={{ color: "#7D736A" }}>分钟 / 次</div>
            </div>
            <div className="rounded-2xl p-3 text-center" style={{ background: "#EDE8DC" }}>
              <div className="text-xl font-bold" style={{ color: "#3B332C" }}>{c.pricePerSession}</div>
              <div className="text-xs mt-1" style={{ color: "#7D736A" }}>每次费用</div>
            </div>
            <div className="rounded-2xl p-3 text-center" style={{ background: "#EDE8DC" }}>
              <div className="text-sm font-medium leading-tight" style={{ color: "#3B332C" }}>
                {c.sessionModes.join(" / ")}
              </div>
              <div className="text-xs mt-1" style={{ color: "#7D736A" }}>咨询方式</div>
            </div>
          </div>
        </Section>

        {/* 从业背景 */}
        {(c.qualifications?.length || c.education?.length || c.trainings?.length || c.workExperiences?.length) ? (
          <Section title="从业背景">
            {c.qualifications?.length ? (
              <div className="mb-4">
                <h4 className="text-sm font-bold mb-2" style={{ color: "#3B332C" }}>从业资质</h4>
                <BulletList items={c.qualifications} />
              </div>
            ) : null}
            {c.education?.length ? (
              <div className="mb-4">
                <h4 className="text-sm font-bold mb-2" style={{ color: "#3B332C" }}>教育背景</h4>
                <BulletList items={c.education} />
              </div>
            ) : null}
            {c.trainings?.length ? (
              <div className="mb-4">
                <h4 className="text-sm font-bold mb-2" style={{ color: "#3B332C" }}>受训经历</h4>
                <BulletList items={c.trainings} />
              </div>
            ) : null}
            {c.workExperiences?.length ? (
              <div className="mb-4">
                <h4 className="text-sm font-bold mb-2" style={{ color: "#3B332C" }}>工作经验</h4>
                <BulletList items={c.workExperiences} />
              </div>
            ) : null}
          </Section>
        ) : null}

        {/* 咨询过程与方式 */}
        {c.sessionDescription && (
          <Section title="咨询过程与方式">
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#3B332C" }}>{c.sessionDescription}</p>
          </Section>
        )}
      </div>

      {/* 底部固定操作栏 */}
      <div className="fixed bottom-0 inset-x-0 z-30 flex items-center gap-4 px-4 py-4 border-t border-[#EBE7DF]"
        style={{ background: "#FDFBF7", paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}>
        {/* 分享 */}
        <button className="flex flex-col items-center gap-0.5">
          <Share2 className="w-5 h-5" style={{ color: "#7D736A" }} />
          <span className="text-[10px]" style={{ color: "#7D736A" }}>分享</span>
        </button>
        {/* 私信 */}
        <button className="flex flex-col items-center gap-0.5">
          <MessageCircle className="w-5 h-5" style={{ color: "#7D736A" }} />
          <span className="text-[10px]" style={{ color: "#7D736A" }}>私信</span>
        </button>
        {/* 收藏 */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setBookmarked(v => !v)}
          className="flex flex-col items-center gap-0.5">
          <Bookmark className="w-5 h-5"
            style={{ color: bookmarked ? "#9CB48A" : "#7D736A", fill: bookmarked ? "#9CB48A" : "none" }} />
          <span className="text-[10px]" style={{ color: "#7D736A" }}>收藏</span>
        </motion.button>
        {/* 预约咨询 */}
        {c.isAccepting ? (
          <Link href={`/booking/${c.id}`} className="flex-1">
            <motion.button whileTap={{ scale: 0.97 }}
              className="w-full py-3 rounded-full text-sm font-semibold text-white"
              style={{ background: "#9CB48A" }}>
              预约咨询
            </motion.button>
          </Link>
        ) : (
          <div className="flex-1 py-3 rounded-full text-sm text-center"
            style={{ background: "#EBE7DF", color: "#C2BDB7" }}>暂停接诊</div>
        )}
      </div>
    </div>
  );
}
