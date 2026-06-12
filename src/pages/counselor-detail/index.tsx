import { useState, useEffect, useRef } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Input, ScrollView, Image, Swiper, SwiperItem, Textarea } from '@tarojs/components'
import { request } from '../../api/request'
import { useAuthStore } from '../../store/authStore'

import { useState, useEffect } from "react";

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
    <View className="mt-3">
      <View onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl w-full justify-center text-sm font-medium"
        style={{background:"#E8DFCC",color:"#5A4E44",border:"1px solid #D4C8B0"}}>
        <Text>📅</Text>
        {open ? "收起可预约时间" : "查看可预约时间"}
      </View>

      {open && (
        <View className="mt-2 rounded-2xl overflow-hidden" style={{border:"1px solid #EBE7DF",background:"white"}}>
          <View className="px-4 pt-4 pb-2 space-y-3">
            {days7.length === 0 ? (
              <Text className="text-sm text-center py-4" style={{color:"#9B8E82"}}>暂无可预约时段，可与咨询师协调时间</Text>
            ) : days7.map(day => (
              <View key={day.label}>
                <Text className="text-xs font-semibold mb-2" style={{color:"#9B8E82"}}>{day.label}</Text>
                <View className="flex flex-wrap gap-2">
                  {day.slots.map(slot => (
                    <View key={slot}
                      onClick={() => Taro.navigateTo({url: '/pages/booking/index?id=${counselorId}'})}
                      className="px-3.5 py-1.5 rounded-full text-sm font-medium border"
                      style={{background:"#E4F0DC",color:"#3A6228",borderColor:"#CCE0C0"}}>
                      {slot}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
          <View className="px-4 pb-4">
            <View onClick={() => Taro.navigateTo({url: '/pages/booking/index?id=${counselorId}'})}
              className="w-full py-3 rounded-2xl text-white font-bold text-sm mt-2"
              style={{background:"var(--color-primary)"}}>
              立即预约
            </View>
          </View>
        </View>
      )}
    </View>
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
    <Text className="text-lg font-bold mb-3" style={{ color: "#1C1817" }}>
      {children}
    </Text>
  );
}

// 子标题（从业背景里的小标题）
function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-base font-semibold mb-2" style={{ color: "#2C2420" }}>
      {children}
    </Text>
  );
}

// 圆点列表
function BulletList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <View className="space-y-2 mb-4">
      {items.map((item, i) => (
        <View key={i} className="flex items-start gap-2.5">
          <Text className="mt-2 w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#9CB48A" }} />
          <Text className="text-base leading-relaxed" style={{ color: "#2C2420" }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// 标签胶囊
function TagList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <View className="flex flex-wrap gap-2">
      {items.map((t) => (
        <Text key={t} className="px-3.5 py-1.5 rounded-full text-sm font-medium"
          style={{ background: "#E8DFCC", color: "#5A7A3A", border: "1px solid #D4C8B0" }}>
          {t}
        </Text>
      ))}
    </View>
  );
}

// 分段文字（保留换行）
function MultiPara({ text }: { text: string }) {
  const paras = text.split(/\n+/).filter(Boolean);
  return (
    <View className="space-y-3">
      {paras.map((p, i) => (
        <Text key={i} className="text-base leading-relaxed" style={{ color: "#2C2420" }}>{p}</Text>
      ))}
    </View>
  );
}

export default function CounselorDetailScreen({ counselorId }: { counselorId: string }) {
  const router = useRouter();
  const user = auth?.user;
  const [c, setC] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    request(`/api/counselors/${counselorId}`)
      .then((r) => r.json())
      .then((d) => { setC(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [counselorId]);

  if (loading) return (
    <View className="min-h-svh flex items-center justify-center" style={{ background: "#F5F0E8" }}>
      <View className="text-sm" style={{ color: "#9B8E82" }}>加载中…</View>
    </View>
  );
  if (!c) return (
    <View className="min-h-svh flex flex-col items-center justify-center gap-3" style={{ background: "#F5F0E8" }}>
      <Text className="text-base" style={{ color: "#2C2420" }}>咨询师信息不存在</Text>
      <View onClick={() => Taro.navigateBack()} className="text-sm underline" style={{ color: "#9CB48A" }}>返回</View>
    </View>
  );

  const avColor = AV_COLORS[(c.displayName.charCodeAt(0) ?? 0) % AV_COLORS.length];
  const roleTags = [...(c.counselorTypes ?? []), ...(c.isSupervisor ? ["督导"] : [])];
  const ql = toStrings(c.qualifications);
  const ed = toStrings(c.education);
  const tr = toStrings(c.trainings);
  const we = toStrings(c.workExperiences);
  const hasBackground = ql.length || ed.length || tr.length || we.length;

  return (
    <View className="min-h-svh pb-28" style={{ background: "#F5F0E8" }}>
      {/* 返回 */}
      <View className="sticky top-0 z-20 flex items-center px-4 pt-12 pb-3" style={{ background: "#F5F0E8" }}>
        <View} onClick={() => Taro.navigateBack()}
          className="w-9 h-9 rounded-full flex items-center justify-center border"
          style={{ background: "white", borderColor: "#DDD8D0" }}>
          <Text>←</Text>
        </View>
      </View>

      {/* 个人信息头部 */}
      <View className="flex flex-col items-center px-6 pb-6">
        {/* 头像 */}
        {c.avatarUrl ? (
          <Image src={c.avatarUrl} alt={c.displayName}
            className="w-28 h-28 rounded-[24px] object-cover mb-4"
            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.10)" }} />
        ) : (
          <View className="w-28 h-28 rounded-[24px] flex items-center justify-center text-5xl font-bold mb-4"
            style={{ background: avColor.bg, color: avColor.text, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
            {c.displayName[0]}
          </View>
        )}

        {/* 姓名 */}
        <Text className="text-3xl font-bold mb-2" style={{ color: "#1C1817" }}>{c.displayName}</Text>

        {/* 角色标签 */}
        {roleTags.length > 0 && (
          <View className="flex flex-wrap justify-center gap-1.5 mb-3">
            {roleTags.map((tag) => (
              <Text key={tag} className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{ background: "#E4F0DC", color: "#3A6228", border: "1px solid #C8DFC0" }}>
                {tag}
              </Text>
            ))}
          </View>
        )}

        {/* 累计咨询 + 所在地 */}
        {(c.totalHours > 0 || c.location) && (
          <View className="flex flex-col items-center gap-1.5">
            {c.totalHours > 0 && (
              <View className="flex items-center gap-1.5">
                <Text>⏱</Text>
                <Text className="text-sm" style={{ color: "#6B5E52" }}>累计咨询 <strong className="text-base" style={{ color: "#2C2420" }}>{c.totalHours}+</strong> 小时</Text>
              </View>
            )}
            {c.location && (
              <View className="flex items-center gap-1.5">
                <Text>📍</Text>
                <Text className="text-sm" style={{ color: "#9B8E82" }}>{c.location}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* 咨询师寄语 */}
      {c.tagline && (
        <View className="mx-4 mb-5 px-5 py-5 rounded-2xl relative"
          style={{ background: "#E8DFCC" }}>
          <View className="absolute top-4 left-4 text-4xl font-serif leading-none" style={{ color: "#9CB48A", opacity: 0.6 }}>"</View>
          <Text className="mt-4 pb-6 text-base italic leading-relaxed" style={{ color: "#2C2420" }}>{c.tagline}</Text>
          <View className="absolute bottom-4 right-5 text-4xl font-serif leading-none" style={{ color: "#9CB48A", opacity: 0.6 }}>"</View>
        </View>
      )}

      {/* 正文各板块 */}
      <View className="px-5 space-y-0">

        {/* 关于我 */}
        {c.bio && (
          <View className="py-5 border-b" style={{ borderColor: "#DDD8D0" }}>
            <SectionTitle>关于我</SectionTitle>
            <MultiPara text={c.bio} />
          </View>
        )}

        {/* 擅长领域 */}
        {c.specialties?.length > 0 && (
          <View className="py-5 border-b" style={{ borderColor: "#DDD8D0" }}>
            <SectionTitle>擅长领域</SectionTitle>
            <TagList items={c.specialties} />
          </View>
        )}

        {/* 工作人群 */}
        {c.workingGroups?.length > 0 && (
          <View className="py-5 border-b" style={{ borderColor: "#DDD8D0" }}>
            <SectionTitle>工作人群</SectionTitle>
            <TagList items={c.workingGroups} />
          </View>
        )}

        {/* 咨询取向 */}
        {c.approaches?.length > 0 && (
          <View className="py-5 border-b" style={{ borderColor: "#DDD8D0" }}>
            <SectionTitle>咨询取向</SectionTitle>
            <TagList items={c.approaches} />
          </View>
        )}

        {/* 咨询设置 */}
        <View className="py-5 border-b" style={{ borderColor: "#DDD8D0" }}>
          <SectionTitle>咨询设置</SectionTitle>
          {/* 三格卡片 */}
          <View className="grid grid-cols-3 gap-2.5 mb-4">
            {/* 时长 */}
            <View className="flex flex-col items-center justify-center py-4 px-2 rounded-2xl" style={{ background: "#E8DFCC" }}>
              <svg viewBox="0 0 20 20" fill="none" stroke="#9CB48A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mb-1.5">
                <circle cx="10" cy="10" r="7.5"/><path d="M10 6v4l2.5 1.5"/>
              </svg>
              <Text className="text-2xl font-bold leading-none" style={{ color: "#2C2420" }}>{c.sessionDuration}</Text>
              <Text className="text-xs mt-1" style={{ color: "#7D736A" }}>分钟 / 次</Text>
            </View>
            {/* 费用 */}
            <View className="flex flex-col items-center justify-center py-4 px-2 rounded-2xl" style={{ background: "#E8DFCC" }}>
              <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 mb-1.5">
                <text x="10" y="15" textAnchor="middle" fontSize="16" fontWeight="700" fill="#9CB48A">¥</text>
              </svg>
              <Text className="text-2xl font-bold leading-none" style={{ color: "#2C2420" }}>{c.pricePerSession}</Text>
              <Text className="text-xs mt-1" style={{ color: "#7D736A" }}>每次费用</Text>
            </View>
            {/* 咨询方式 — 多模式图标 */}
            <View className="flex flex-col items-center justify-center py-4 px-2 rounded-2xl" style={{ background: "#E8DFCC" }}>
              {/* 图标行：视频/电话/面对面 */}
              <View className="flex items-center gap-1 mb-1.5">
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
              </View>
              <Text className="text-xs font-semibold text-center leading-snug" style={{ color: "#2C2420" }}>
                {(c.sessionModes ?? []).map((m: string) => m.replace("咨询", "")).join(" /\n")}
              </Text>
              <Text className="text-xs mt-1" style={{ color: "#7D736A" }}>咨询方式</Text>
            </View>
          </View>
          {/* 接待语言 */}
          {c.languages?.length > 0 && (
            <Text className="text-sm mb-3" style={{ color: "#6B5E52" }}>
              接待语言：{c.languages.join("、")}
            </Text>
          )}
          {/* 说明文字 */}
          {c.sessionSettings && <MultiPara text={c.sessionSettings} />}

          {/* 查看可预约时间按钮 */}
          <AvailableTimesButton counselorId={c.id} />
        </View>

        {/* 从业背景 */}
        {hasBackground ? (
          <View className="py-5 border-b" style={{ borderColor: "#DDD8D0" }}>
            <SectionTitle>从业背景</SectionTitle>
            {ql.length > 0 && (<><SubTitle>从业资质</SubTitle><BulletList items={ql} /></>)}
            {ed.length > 0 && (<><SubTitle>教育背景</SubTitle><BulletList items={ed} /></>)}
            {tr.length > 0 && (<><SubTitle>受训经历</SubTitle><BulletList items={tr} /></>)}
            {we.length > 0 && (<><SubTitle>工作经验</SubTitle><BulletList items={we} /></>)}
          </View>
        ) : null}

        {/* 咨询过程与方式 */}
        {c.sessionDescription && (
          <View className="py-5">
            <SectionTitle>咨询过程与方式</SectionTitle>
            <MultiPara text={c.sessionDescription} />
          </View>
        )}
      </View>

      {/* 底部操作栏 */}
      <View className="fixed bottom-0 left-0 right-0 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 border-t z-30"
        style={{ background: "rgba(245,240,232,0.95)", backdropFilter: "blur(8px)", borderColor: "#DDD8D0" }}>
        <View className="flex items-center gap-3">
          {/* 分享 */}
          <View}
            className="flex flex-col items-center gap-1 w-12"
            style={{ color: "#6B5E52" }}
            onClick={() => Taro.navigateTo({url: '/pages/counselors/index?id=${c.id}/card'})}>
            <Text>↗</Text>
            <Text className="text-[10px]">分享</Text>
          </View>
          {/* 私信 */}
          <View}
            className="flex flex-col items-center gap-1 w-12"
            style={{ color: "#6B5E52" }}
            onClick={() => { if (!user) { Taro.showToast({title: '请先登录', icon: 'none'}); return; } Taro.navigateTo({url: `/messages`; }}>
            <Text>💬</Text>
            <Text className="text-[10px]">私信</Text>
          </View>
          {/* 收藏 */}
          <View}
            onClick={() => {
              const ids: string[] = JSON.parse(localStorage.getItem("favorite_counselors") ?? "[]");
              const next = saved ? ids.filter(i => i !== c.id) : [...ids, c.id];
              localStorage.setItem("favorite_counselors", JSON.stringify(next));
              setSaved(!saved);
            }}
            className="flex flex-col items-center gap-1 w-12"
            style={{ color: saved ? "#9CB48A" : "#6B5E52" }}>
            <Text>♡</Text>
            <Text className="text-[10px]">{saved ? "已收藏" : "收藏"}</Text>
          </View>
          {/* 预约咨询 */}
          <View}
            className="flex-1 py-3 rounded-2xl text-white font-semibold text-base"
            style={{ background: c.isAccepting ? "#9CB48A" : "#C2BDB7" }}
            onClick={() => {
              if (!user) { Taro.showToast({title: '请先登录', icon: 'none'}); return; }
              Taro.navigateTo({url: `/booking/${c.id}`;
            }}>
            {c.isAccepting ? "预约咨询" : "暂停接诊"}
          </View>
        </View>
      </View>
    </View>
  );
}
