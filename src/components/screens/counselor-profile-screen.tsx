"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";

import {
  ProfileForm, EMPTY_PROFILE, SectionKey, SECTIONS,
  COUNSELOR_TYPE_OPTIONS, SPECIALTY_OPTIONS, WORKING_GROUP_OPTIONS,
  APPROACH_OPTIONS, SESSION_MODE_OPTIONS, LANGUAGE_OPTIONS, DURATION_OPTIONS,
} from "@/lib/counselor-profile-data";
import { ProfileSections } from "@/components/profile/profile-sections";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { TagPicker, ListEditor, Field, TextArea } from "@/components/profile/profile-fields";

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: "草稿",   color: "text-[#9B8E82]", bg: "bg-[#F0EDE8]" },
  submitted: { label: "审核中", color: "text-[#D97706]", bg: "bg-[#FEF3C7]" },
  approved:  { label: "已通过", color: "text-[#16A34A]", bg: "bg-[#DCFCE7]" },
  rejected:  { label: "已退回", color: "text-[#DC2626]", bg: "bg-[#FEF2F2]" },
};

function sectionCompleted(key: SectionKey, form: ProfileForm): boolean {
  switch (key) {
    case "basic":     return !!form.displayName;
    case "tagline":   return !!form.tagline;
    case "specialty": return form.specialties.length > 0;
    case "working":   return form.workingGroups.length > 0;
    case "approach":  return form.approaches.length > 0;
    case "settings":  return form.sessionModes.length > 0 && !!form.pricePerSession;
    case "background":return form.qualifications.length > 0 || form.education.length > 0;
    case "process":   return !!form.sessionDescription;
    default:          return false;
  }
}

export function CounselorProfileScreen() {
  const user = useEazo((s) => s.auth.user);
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>({ ...EMPTY_PROFILE });
  const [openSection, setOpenSection] = useState<SectionKey | null>("basic");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    request("/api/counselor/profile").then(r => r.json()).then(data => {
      if (data.exists && data.profile) {
        const p = data.profile;
        setForm({
          avatarUrl: p.avatarUrl ?? "",
          displayName: p.displayName ?? "",
          counselorTypes: p.counselorTypes ?? [],
          isSupervisor: p.isSupervisor ?? false,
          location: p.location ?? "",
          totalHours: p.totalHours ? String(p.totalHours) : "",
          bio: p.bio ?? "",
          tagline: p.tagline ?? "",
          specialties: p.specialties ?? [],
          workingGroups: p.workingGroups ?? [],
          approaches: p.approaches ?? [],
          sessionModes: p.sessionModes ?? [],
          sessionDuration: p.sessionDuration ? String(p.sessionDuration) : "50",
          pricePerSession: p.pricePerSession ? String(p.pricePerSession) : "",
          languages: p.languages ?? [],
          sessionDescription: p.sessionDescription ?? "",
          qualifications: p.qualifications ?? [],
          education: p.education ?? [],
          trainings: p.trainings ?? [],
          workExperiences: p.workExperiences ?? [],
          reviewStatus: p.reviewStatus ?? "draft",
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const set = <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const save = async (action: "save" | "submit") => {
    if (!user) return;
    setSaving(true);
    try {
      await request("/api/counselor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, action }),
      });
      if (action === "submit") set("reviewStatus", "submitted");
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = useCallback((key: SectionKey) => {
    setOpenSection(prev => prev === key ? null : key);
  }, []);

  const completed = new Set(
    SECTIONS.map(s => s.key).filter(k => sectionCompleted(k as SectionKey, form))
  ) as Set<SectionKey>;

  const statusInfo = STATUS_LABEL[form.reviewStatus] ?? STATUS_LABEL.draft;
  const canSubmit = form.displayName && form.tagline && form.sessionModes.length > 0;

  const renderSection = (key: SectionKey) => {
    switch (key) {
      case "basic": return (
        <div>
          <AvatarUploader avatarUrl={form.avatarUrl} displayName={form.displayName} onChange={v => set("avatarUrl", v)} />
          <Field label="姓名" required value={form.displayName} placeholder="你的姓名" onChange={v => set("displayName", v)} />
          <div className="mb-4">
            <div className="text-sm font-medium text-[#2C2420] mb-1">咨询师类别 <span className="text-[#9CB48A]">*</span> <span className="text-xs font-normal text-[#9B8E82]">决定首页角色标签</span></div>
            <div className="text-xs text-[#9B8E82] mb-3">可多选，选择你的主要工作类型</div>
            <div className="space-y-2">
              {COUNSELOR_TYPE_OPTIONS.map(opt => {
                const sel = form.counselorTypes.includes(opt.id);
                return (
                  <button key={opt.id} onClick={() => set("counselorTypes", sel ? form.counselorTypes.filter(x => x !== opt.id) : [...form.counselorTypes, opt.id])}
                    className={["w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all",
                      sel ? "border-[#9CB48A] bg-[#F0F7ED]" : "border-[#DDD8D0] bg-white"
                    ].join(" ")}>
                    <div className={["w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      sel ? "border-[#9CB48A] bg-[#9CB48A]" : "border-[#DDD8D0]"
                    ].join(" ")}>
                      {sel && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className={["text-sm font-semibold", sel ? "text-[#9CB48A]" : "text-[#2C2420]"].join(" ")}>{opt.label}</div>
                      <div className="text-xs text-[#9B8E82]">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mb-4">
            <div className="text-sm font-medium text-[#2C2420] mb-1">是否为督导</div>
            <div className="text-xs text-[#9B8E82] mb-3">督导标签会显示在你的咨询师卡片上，并可被来访通过「预约督导」筛选找到</div>
            <div className="flex gap-3">
              {[{ v: true, label: "是，我是督导" }, { v: false, label: "否" }].map(opt => (
                <button key={String(opt.v)} onClick={() => set("isSupervisor", opt.v)}
                  className={["flex-1 py-3 rounded-2xl border text-sm font-medium transition-all",
                    form.isSupervisor === opt.v ? "bg-[#9CB48A] text-white border-[#9CB48A]" : "bg-white text-[#2C2420] border-[#DDD8D0]"
                  ].join(" ")}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <Field label="所在地" hint="填写城市名，平台会自动按省份归类（例：上海、广州）" value={form.location} placeholder="城市名" onChange={v => set("location", v)} />
          <Field label="累计咨询小时数" value={form.totalHours} placeholder="例：700" type="number" onChange={v => set("totalHours", v)} />
          <TextArea label="简介" required
            hint="在首页咨询师列表卡片上显示（100-300字），也会在你的主页单独展示"
            value={form.bio} rows={6}
            placeholder="简短介绍自己的背景、风格和服务..."
            onChange={v => set("bio", v)} />
        </div>
      );

      case "tagline": return (
        <TextArea label="咨询师寄语" required
          hint="一段真诚的话，会在主页以大字引语形式呈现（50-200字）"
          value={form.tagline} rows={6}
          placeholder="写一段给来访者的话，让他们感受到你的温度..."
          onChange={v => set("tagline", v)} />
      );

      case "specialty": return (
        <TagPicker label="擅长领域" hint="选择你擅长的方向（可多选）"
          options={SPECIALTY_OPTIONS} selected={form.specialties}
          onChange={v => set("specialties", v)} allowCustom />
      );

      case "working": return (
        <TagPicker label="工作人群" hint="你主要服务哪些群体？（可多选）"
          options={WORKING_GROUP_OPTIONS} selected={form.workingGroups}
          onChange={v => set("workingGroups", v)} allowCustom />
      );

      case "approach": return (
        <TagPicker label="咨询取向" hint="你使用哪些理论取向？（可多选）"
          options={APPROACH_OPTIONS} selected={form.approaches}
          onChange={v => set("approaches", v)} allowCustom />
      );

      case "settings": return (
        <div>
          <div className="mb-4">
            <div className="text-sm font-medium text-[#2C2420] mb-3">咨询方式 <span className="text-[#9CB48A]">*</span></div>
            <div className="flex flex-wrap gap-2">
              {SESSION_MODE_OPTIONS.map(m => {
                const sel = form.sessionModes.includes(m);
                return (
                  <button key={m} onClick={() => set("sessionModes", sel ? form.sessionModes.filter(x => x !== m) : [...form.sessionModes, m])}
                    className={["px-4 py-2 rounded-full border text-sm transition-all",
                      sel ? "bg-[#9CB48A] text-white border-[#9CB48A]" : "bg-white text-[#2C2420] border-[#DDD8D0]"
                    ].join(" ")}>
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mb-4">
            <div className="text-sm font-medium text-[#2C2420] mb-3">单次时长（分钟）</div>
            <div className="flex gap-2 mb-2">
              {DURATION_OPTIONS.map(d => (
                <button key={d} onClick={() => set("sessionDuration", d)}
                  className={["flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all",
                    form.sessionDuration === d ? "bg-[#9CB48A] text-white border-[#9CB48A]" : "bg-white text-[#2C2420] border-[#DDD8D0]"
                  ].join(" ")}>
                  {d} 分钟
                </button>
              ))}
            </div>
            <input type="number" value={form.sessionDuration} onChange={e => set("sessionDuration", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#DDD8D0] bg-[#F5F1E8] text-sm text-[#2C2420]" />
          </div>
          <Field label="每次费用（元）" required value={form.pricePerSession} placeholder="例：400" type="number" onChange={v => set("pricePerSession", v)} />
          <div className="mb-4">
            <div className="text-sm font-medium text-[#2C2420] mb-3">接待语言</div>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map(l => {
                const sel = form.languages.includes(l);
                return (
                  <button key={l} onClick={() => set("languages", sel ? form.languages.filter(x => x !== l) : [...form.languages, l])}
                    className={["px-4 py-2 rounded-full border text-sm transition-all",
                      sel ? "bg-[#9CB48A] text-white border-[#9CB48A]" : "bg-white text-[#2C2420] border-[#DDD8D0]"
                    ].join(" ")}>
                    {l}
                  </button>
                );
              })}
            </div>
          </div>
          <TextArea label="咨询设置说明" hint="频率、首次流程、是否接受滑动尺度收费等"
            value={form.sessionDescription} rows={4}
            placeholder={"例：每次50分钟，建议每周一次。首次为初始访谈……"}
            onChange={v => set("sessionDescription", v)} />
        </div>
      );

      case "background": return (
        <div>
          <ListEditor label="从业资质" placeholder="例：国家二级心理咨询师证书"
            items={form.qualifications} onChange={v => set("qualifications", v)} />
          <ListEditor label="教育背景" placeholder="例：北京大学 心理学硕士"
            items={form.education} onChange={v => set("education", v)} />
          <ListEditor label="受训经历" placeholder="例：DBT 辩证行为疗法培训（120小时）"
            items={form.trainings} onChange={v => set("trainings", v)} />
          <ListEditor label="工作经验" placeholder="例：某三甲医院心理科（3年）"
            items={form.workExperiences} onChange={v => set("workExperiences", v)} />
        </div>
      );

      case "process": return (
        <TextArea label="描述你的咨询风格和流程" hint="帮助来访了解和你工作会是什么感受（可分段书写）"
          value={form.sessionDescription} rows={8}
          placeholder={"我的咨询风格是温暖、真诚和支持性的。\n\n咨询方式：……"}
          onChange={v => set("sessionDescription", v)} />
      );

      default: return null;
    }
  };

  if (!user) return (
    <div className="min-h-svh bg-[#F5F1E8] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-lg font-semibold text-[#2C2420] mb-4">请先登录</div>
        <button onClick={() => {}} className="px-8 py-3 bg-[#9CB48A] text-white rounded-2xl text-sm font-semibold">登录</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-svh bg-[#F5F1E8]">
      {/* 顶部 */}
      <div className="sticky top-0 z-10 bg-[#F5F1E8] px-4 pt-12 md:pt-4 pb-3 border-b border-[#EBE7DF] flex items-center gap-3">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white border border-[#DDD8D0] flex items-center justify-center flex-shrink-0">
          <ArrowLeft className="w-4 h-4 text-[#2C2420]" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[#2C2420]">编辑档案</h1>
          <p className="text-xs text-[#9B8E82]">填写完整后提交，等待平台审核</p>
        </div>
        <span className={["text-xs font-semibold px-3 py-1.5 rounded-full", statusInfo.color, statusInfo.bg].join(" ")}>
          {statusInfo.label}
        </span>
      </div>

      {/* 表单内容 */}
      <div className="px-4 pt-4">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-2xl skeleton" />)}
          </div>
        ) : (
          <ProfileSections open={openSection} onToggle={toggleSection} completed={completed}>
            {renderSection}
          </ProfileSections>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 z-20 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] bg-white border-t border-[#EBE7DF] flex gap-3">
        <motion.button whileTap={{ scale: 0.97 }} disabled={saving}
          onClick={() => save("save")}
          className="flex-1 h-12 rounded-2xl border border-[#DDD8D0] bg-white flex items-center justify-center gap-2 text-sm font-medium text-[#2C2420]">
          <Save className="w-4 h-4 text-[#9B8E82]" />
          保存草稿
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} disabled={saving || !canSubmit}
          onClick={() => save("submit")}
          className={["flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all",
            canSubmit ? "bg-[#9CB48A]" : "bg-[#C2BDB7]"
          ].join(" ")}>
          <Send className="w-4 h-4" />
          提交审核
        </motion.button>
      </div>
    </div>
  );
}
