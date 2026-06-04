"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, MapPin, Share2, MessageCircle, Bookmark, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEazo } from "@eazo/sdk/react";
import { auth } from "@eazo/sdk";

// ── 可预约时间弹窗组件 ──
function AvailableTimesButton({ counselorId }: { counselorId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const WEEKDAY = ["日","一","二","三","四","五","六"];
  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    const label = `周${WEEKDAY[d.getDay()]} ${d.getMonth()+1}/${d.getDate()}`;
    const slots = i % 3 === 2 ? [] :
      i % 2 === 0 ? ["09:00","14:00","16:00"] : ["10:00","15:00"];
    return { label, slots };
  }).filter(d => d.slots.length > 0);

  return (
    <div className="mt-3">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl w-full justify-center text-sm font-medium"
        style={{background:"#E8DFCC",color:"#5A4E44",border:"1px solid #D4C8B0"}}>
        <CalendarDays className="w-4 h-4" style={{color:"var(--color-primary)"}} />
        {open ? "收起可预约时间" : "查看可预约时间"}
      </button>

      {open && (
        <div className="mt-2 rounded-2xl overflow-hidden" style={{border:"1px solid #EBE7DF",background:"white"}}>
          <div className="px-4 pt-4 pb-2 space-y-3">
            {days7.length === 0 ? (
              <p className="text-sm text-center py-4" style={{color:"#9B8E82"}}>暂无可预约时段，可与咨询师协调时间</p>
            ) : days7.map(day => (
              <div key={day.label}>
                <p className="text-xs font-semibold mb-2" style={{color:"#9B8E82"}}>{day.label}</p>
                <div className="flex flex-wrap gap-2">
                  {day.slots.map(slot => (
                    <button key={slot}
                      onClick={() => router.push(`/booking/${counselorId}`)}
                      className="px-3.5 py-1.5 rounded-full text-sm font-medium border"
                      style={{background:"#E4F0DC",color:"#3A6228",borderColor:"#CCE0C0"}}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4">
            <button onClick={() => router.push(`/booking/${counselorId}`)}
              className="w-full py-3 rounded-2xl text-white font-bold text-sm mt-2"
              style={{background:"var(--color-primary)"}}>
              立即预约
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


type ListItem = { id: string; value: string };

type Counselor = {
  id: string;
  displayName: string;
  bio: string;
  tagline: string;
  specialties: string[];
  approaches: string[];
  workingGroups: string[];
  sessionModes: string[];
  sessionDuration: number;
  pricePerSession: number;
  languages: string[];
  location: string;
  avatarUrl: string | null;
  isAccepting: boolean;
  counselorTypes: string[];
  isSupervisor: boolean;
  totalHours: number;
  sessionSettings?: string | null;
  qualifications?: (string | ListItem)[] | null;
  education?: (string | ListItem)[] | null;
  trainings?: (string | ListItem)[] | null;
  workExperiences?: (string | ListItem)[] | null;
  sessionDescription?: string | null;
};

const AV_COLORS = [
  { bg: "#D5E4D0", text: "#2D5A28" },
  { bg: "#E8DECE", text: "#6B5022" },
  { bg: "#D5DEF0", text: "#2A3F75" },
  { bg: "#EAD8D8", text: "#7A2828" },
  { bg: "#D5EEEA", text: "#1A6050" },
  { bg: "#EDE0C8", text: "#6B4A18" },
];

// 从 ListItem[] 或 string[] 中提取文本
function toStrings(arr?: (string | ListItem)[] | null): string[] {
  if (!arr) return [];
  return arr.map((x) => (typeof x === "string" ? x : x.value)).filter(Boolean);
}

// 板块标题
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold mb-3" style={{ color: "#1C1817" }}>
      {children}
    </h2>
  );
}

// 子标题（从业背景里的小标题）
function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-semibold mb-2" style={{ color: "#2C2420" }}>
      {children}
    </h3>
  );
}

// 圆点列表
function BulletList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-2 mb-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="mt-2 w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#9CB48A" }} />
          <span className="text-base leading-relaxed" style={{ color: "#2C2420" }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// 标签胶囊
function TagList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t) => (
        <span key={t} className="px-3.5 py-1.5 rounded-full text-sm font-medium"
          style={{ background: "#E8DFCC", color: "#5A7A3A", border: "1px solid #D4C8B0" }}>
          {t}
        </span>
      ))}
    </div>
  );
}

// 分段文字（保留换行）
function MultiPara({ text }: { text: string }) {
  const paras = text.split(/\n+/).filter(Boolean);
  return (
    <div className="space-y-3">
      {paras.map((p, i) => (
        <p key={i} className="text-base leading-relaxed" style={{ color: "#2C2420" }}>{p}</p>
      ))}
    </div>
  );
}

export function CounselorDetailScreen({ counselorId }: { counselorId: string }) {
  const router = useRouter();
  const auth = useEazo((s) => s.auth);
  const user = auth?.user;
  const [c, setC] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/counselors/${counselorId}`)
      .then((r) => r.json())
      .then((d) => { setC(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [counselorId]);

  if (loading) return (
    <div className="min-h-svh flex items-center justify-center" style={{ background: "#F5F0E8" }}>
      <div className="text-sm" style={{ color: "#9B8E82" }}>加载中…</div>
    </div>
  );
  if (!c) return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-3" style={{ background: "#F5F0E8" }}>
      <p className="text-base" style={{ color: "#2C2420" }}>咨询师信息不存在</p>
      <button onClick={() => router.back()} className="text-sm underline" style={{ color: "#9CB48A" }}>返回</button>
    </div>
  );

  const avColor = AV_COLORS[(c.displayName.charCodeAt(0) ?? 0) % AV_COLORS.length];
  const roleTags = [...(c.counselorTypes ?? []), ...(c.isSupervisor ? ["督导"] : [])];
  const ql = toStrings(c.qualifications);
  const ed = toStrings(c.education);
  const tr = toStrings(c.trainings);
  const we = toStrings(c.workExperiences);
  const hasBackground = ql.length || ed.length || tr.length || we.length;

  return (
    <div className="min-h-svh pb-28" style={{ background: "#F5F0E8" }}>
      {/* 返回 */}
      <div className="sticky top-0 z-20 flex items-center px-4 pt-12 pb-3" style={{ background: "#F5F0E8" }}>
        <motion.button whileTap={{ scale: 0.92 }} onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center border"
          style={{ background: "white", borderColor: "#DDD8D0" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "#6B5E52" }} />
        </motion.button>
      </div>

      {/* 个人信息头部 */}
      <div className="flex flex-col items-center px-6 pb-6">
        {/* 头像 */}
        {c.avatarUrl ? (
          <img src={c.avatarUrl} alt={c.displayName}
            className="w-28 h-28 rounded-[24px] object-cover mb-4"
            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.10)" }} />
        ) : (
          <div className="w-28 h-28 rounded-[24px] flex items-center justify-center text-5xl font-bold mb-4"
            style={{ background: avColor.bg, color: avColor.text, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
            {c.displayName[0]}
          </div>
        )}

        {/* 姓名 */}
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#1C1817" }}>{c.displayName}</h1>

        {/* 角色标签 */}
        {roleTags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mb-3">
            {roleTags.map((tag) => (
              <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{ background: "#E4F0DC", color: "#3A6228", border: "1px solid #C8DFC0" }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 累计咨询 + 所在地 */}
        {(c.totalHours > 0 || c.location) && (
          <div className="flex flex-col items-center gap-1.5">
            {c.totalHours > 0 && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" style={{ color: "#9CB48A" }} />
                <span className="text-sm" style={{ color: "#6B5E52" }}>累计咨询 <strong className="text-base" style={{ color: "#2C2420" }}>{c.totalHours}+</strong> 小时</span>
              </div>
            )}
            {c.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" style={{ color: "#9CB48A" }} />
                <span className="text-sm" style={{ color: "#9B8E82" }}>{c.location}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 咨询师寄语 */}
      {c.tagline && (
        <div className="mx-4 mb-5 px-5 py-5 rounded-2xl relative"
          style={{ background: "#E8DFCC" }}>
          <div className="absolute top-4 left-4 text-4xl font-serif leading-none" style={{ color: "#9CB48A", opacity: 0.6 }}>"</div>
          <p className="mt-4 pb-6 text-base italic leading-relaxed" style={{ color: "#2C2420" }}>{c.tagline}</p>
          <div className="absolute bottom-4 right-5 text-4xl font-serif leading-none" style={{ color: "#9CB48A", opacity: 0.6 }}>"</div>
        </div>
      )}

      {/* 正文各板块 */}
      <div className="px-5 space-y-0">

        {/* 关于我 */}
        {c.bio && (
          <div className="py-5 border-b" style={{ borderColor: "#DDD8D0" }}>
            <SectionTitle>关于我</SectionTitle>
            <MultiPara text={c.bio} />
          </div>
        )}

        {/* 擅长领域 */}
        {c.specialties?.length > 0 && (
          <div className="py-5 border-b" style={{ borderColor: "#DDD8D0" }}>
            <SectionTitle>擅长领域</SectionTitle>
            <TagList items={c.specialties} />
          </div>
        )}

        {/* 工作人群 */}
        {c.workingGroups?.length > 0 && (
          <div className="py-5 border-b" style={{ borderColor: "#DDD8D0" }}>
            <SectionTitle>工作人群</SectionTitle>
            <TagList items={c.workingGroups} />
          </div>
        )}

        {/* 咨询取向 */}
        {c.approaches?.length > 0 && (
          <div className="py-5 border-b" style={{ borderColor: "#DDD8D0" }}>
            <SectionTitle>咨询取向</SectionTitle>
            <TagList items={c.approaches} />
          </div>
        )}

        {/* 咨询设置 */}
        <div className="py-5 border-b" style={{ borderColor: "#DDD8D0" }}>
          <SectionTitle>咨询设置</SectionTitle>
          {/* 三格卡片 */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {/* 时长 */}
            <div className="flex flex-col items-center justify-center py-4 px-2 rounded-2xl" style={{ background: "#E8DFCC" }}>
              <svg viewBox="0 0 20 20" fill="none" stroke="#9CB48A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mb-1.5">
                <circle cx="10" cy="10" r="7.5"/><path d="M10 6v4l2.5 1.5"/>
              </svg>
              <span className="text-2xl font-bold leading-none" style={{ color: "#2C2420" }}>{c.sessionDuration}</span>
              <span className="text-xs mt-1" style={{ color: "#7D736A" }}>分钟 / 次</span>
            </div>
            {/* 费用 */}
            <div className="flex flex-col items-center justify-center py-4 px-2 rounded-2xl" style={{ background: "#E8DFCC" }}>
              <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 mb-1.5">
                <text x="10" y="15" textAnchor="middle" fontSize="16" fontWeight="700" fill="#9CB48A">¥</text>
              </svg>
              <span className="text-2xl font-bold leading-none" style={{ color: "#2C2420" }}>{c.pricePerSession}</span>
              <span className="text-xs mt-1" style={{ color: "#7D736A" }}>每次费用</span>
            </div>
            {/* 咨询方式 — 多模式图标 */}
            <div className="flex flex-col items-center justify-center py-4 px-2 rounded-2xl" style={{ background: "#E8DFCC" }}>
              {/* 图标行：视频/电话/面对面 */}
              <div className="flex items-center gap-1 mb-1.5">
                {(c.sessionModes ?? []).map((mode: string) => {
                  const m = mode.replace("咨询", "").trim();
                  if (m === "视频" || mode === "视频咨询") return (
                    <svg key={mode} viewBox="0 0 20 20" fill="none" stroke="#9CB48A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
                      <rect x="1" y="5" width="12" height="10" rx="2"/><path d="M13 8l6-3v10l-6-3"/>
                    </svg>
                  );
                  if (m === "语音" || m === "电话" || mode === "语音咨询") return (
                    <svg key={mode} viewBox="0 0 20 20" fill="none" stroke="#9CB48A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
                      <path d="M5 2a2 2 0 011.5.7l2 2.5a2 2 0 010 2.5l-.7.7a8 8 0 004.8 4.8l.7-.7a2 2 0 012.5 0l2.5 2a2 2 0 01.7 1.5c0 3-2.5 4-5 4C8 20 0 12 0 7c0-2.5 1-5 4-5h1z"/>
                    </svg>
                  );
                  if (m === "面对面" || m === "面谈" || mode === "面对面咨询") return (
                    <svg key={mode} viewBox="0 0 20 20" fill="none" stroke="#9CB48A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
                      <circle cx="10" cy="6" r="4"/><path d="M2 18c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  );
                  return null;
                })}
              </div>
              <span className="text-xs font-semibold text-center leading-snug" style={{ color: "#2C2420" }}>
                {(c.sessionModes ?? []).map((m: string) => m.replace("咨询", "")).join(" /\n")}
              </span>
              <span className="text-xs mt-1" style={{ color: "#7D736A" }}>咨询方式</span>
            </div>
          </div>
          {/* 接待语言 */}
          {c.languages?.length > 0 && (
            <p className="text-sm mb-3" style={{ color: "#6B5E52" }}>
              接待语言：{c.languages.join("、")}
            </p>
          )}
          {/* 说明文字 */}
          {c.sessionSettings && <MultiPara text={c.sessionSettings} />}

          {/* 查看可预约时间按钮 */}
          <AvailableTimesButton counselorId={c.id} />
        </div>

        {/* 从业背景 */}
        {hasBackground ? (
          <div className="py-5 border-b" style={{ borderColor: "#DDD8D0" }}>
            <SectionTitle>从业背景</SectionTitle>
            {ql.length > 0 && (<><SubTitle>从业资质</SubTitle><BulletList items={ql} /></>)}
            {ed.length > 0 && (<><SubTitle>教育背景</SubTitle><BulletList items={ed} /></>)}
            {tr.length > 0 && (<><SubTitle>受训经历</SubTitle><BulletList items={tr} /></>)}
            {we.length > 0 && (<><SubTitle>工作经验</SubTitle><BulletList items={we} /></>)}
          </div>
        ) : null}

        {/* 咨询过程与方式 */}
        {c.sessionDescription && (
          <div className="py-5">
            <SectionTitle>咨询过程与方式</SectionTitle>
            <MultiPara text={c.sessionDescription} />
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 border-t z-30"
        style={{ background: "rgba(245,240,232,0.95)", backdropFilter: "blur(8px)", borderColor: "#DDD8D0" }}>
        <div className="flex items-center gap-3">
          {/* 分享 */}
          <motion.button whileTap={{ scale: 0.92 }}
            className="flex flex-col items-center gap-1 w-12"
            style={{ color: "#6B5E52" }}
            onClick={() => router.push(`/counselors/${c.id}/card`)}>
            <Share2 className="w-5 h-5" />
            <span className="text-[10px]">分享</span>
          </motion.button>
          {/* 私信 */}
          <motion.button whileTap={{ scale: 0.92 }}
            className="flex flex-col items-center gap-1 w-12"
            style={{ color: "#6B5E52" }}
            onClick={() => { if (!user) { auth.login(); return; } window.location.href = `/messages`; }}>
            <MessageCircle className="w-5 h-5" />
            <span className="text-[10px]">私信</span>
          </motion.button>
          {/* 收藏 */}
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => setSaved(!saved)}
            className="flex flex-col items-center gap-1 w-12"
            style={{ color: saved ? "#9CB48A" : "#6B5E52" }}>
            <Bookmark className={`w-5 h-5 ${saved ? "fill-current" : ""}`} />
            <span className="text-[10px]">{saved ? "已收藏" : "收藏"}</span>
          </motion.button>
          {/* 预约咨询 */}
          <motion.button whileTap={{ scale: 0.97 }}
            className="flex-1 py-3 rounded-2xl text-white font-semibold text-base"
            style={{ background: c.isAccepting ? "#9CB48A" : "#C2BDB7" }}
            onClick={() => {
              if (!user) { auth.login(); return; }
              window.location.href = `/booking/${c.id}`;
            }}>
            {c.isAccepting ? "预约咨询" : "暂停接诊"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
