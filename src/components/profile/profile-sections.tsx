"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import type { ProfileForm, SectionKey, ListItem } from "@/lib/counselor-profile-data";
import {
  SPECIALTY_OPTIONS, WORKING_GROUP_OPTIONS, APPROACH_OPTIONS,
  LANGUAGE_OPTIONS, SESSION_MODE_OPTIONS, SECTION_META,
} from "@/lib/counselor-profile-data";

/* ── Icon helper ── */
function SectionIcon({ name }: { name: string }) {
  const cls = "w-4 h-4";
  const props = { viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: cls };
  switch (name) {
    case "quote":   return <svg {...props}><path d="M5 9h4V5H5v4zm0 0v3m6-7h4v4h-4V5zm0 4v3"/></svg>;
    case "sparkle": return <svg {...props}><path d="M10 2v2m0 12v2M2 10h2m12 0h2m-3.2-4.8-1.4 1.4M6.6 13.4l-1.4 1.4m0-9.6 1.4 1.4m6.8 6.8 1.4 1.4"/><circle cx="10" cy="10" r="3"/></svg>;
    case "users":   return <svg {...props}><path d="M13 14c0-2.2-1.3-4-3-4s-3 1.8-3 4"/><circle cx="10" cy="7" r="2.5"/><path d="M17 14c0-1.7-1-3-2.5-3"/><circle cx="15" cy="7" r="2"/></svg>;
    case "brain":   return <svg {...props}><path d="M10 4C7.8 4 6 5.8 6 8c0 1 .4 2 1 2.7-.5.4-1 1.1-1 2.3 0 1.7 1.3 3 3 3"/><path d="M10 4c2.2 0 4 1.8 4 4 0 1-.4 2-1 2.7.5.4 1 1.1 1 2.3 0 1.7-1.3 3-3 3"/><path d="M10 8v8"/></svg>;
    case "gear":    return <svg {...props}><circle cx="10" cy="10" r="2.5"/><path d="M10 3v2M10 15v2M3 10h2m10 0h2m-2.9-4.9-1.4 1.4M6.3 13.5l-1.4 1.4m0-9.8 1.4 1.4m6.8 6.8 1.4 1.4"/></svg>;
    case "file":    return <svg {...props}><path d="M5 3h7l3 3v11H5V3z"/><path d="M12 3v3h3"/><path d="M8 9h5M8 12h5M8 15h3"/></svg>;
    case "chat":    return <svg {...props}><path d="M4 4h12v9H4z" strokeLinejoin="round"/><path d="M8 17l2-4h1l2 4"/></svg>;
    default:        return <svg {...props}><circle cx="10" cy="10" r="7"/></svg>;
  }
}

/* ── Tags multi-select ── */
function TagSelect({ options, selected, onChange, custom, onCustomChange }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void;
  custom?: string[]; onCustomChange?: (v: string[]) => void;
}) {
  const [customInput, setCustomInput] = useState("");
  const toggle = (t: string) =>
    onChange(selected.includes(t) ? selected.filter(x => x !== t) : [...selected, t]);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map(t => (
          <button key={t} onClick={() => toggle(t)}
            className="px-3 py-1.5 rounded-full text-sm border transition-all"
            style={{
              background: selected.includes(t) ? "#9CB48A" : "white",
              color: selected.includes(t) ? "white" : "#6B5E52",
              borderColor: selected.includes(t) ? "#9CB48A" : "#DDD8D0",
            }}>{t}</button>
        ))}
        {custom?.map(t => (
          <span key={t} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-amber-100 text-amber-700 border border-amber-200">
            {t}
            <button onClick={() => onCustomChange?.(custom.filter(x => x !== t))}><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      {onCustomChange && (
        <div className="mt-3 p-3 rounded-2xl border border-dashed border-[#DDD8D0] bg-[#FAFAF8]">
          <p className="text-xs text-[#9B8E82] mb-2">没找到合适的标签？提交自定义标签，经管理员审核后加入选项</p>
          <div className="flex gap-2">
            <input value={customInput} onChange={e => setCustomInput(e.target.value)}
              placeholder="输入标签名称"
              className="flex-1 px-3 py-2 rounded-xl text-sm border border-[#DDD8D0] bg-white outline-none" />
            <button onClick={() => { if (customInput.trim()) { onCustomChange([...(custom || []), customInput.trim()]); setCustomInput(""); } }}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-[#DDD8D0] bg-white text-[#6B5E52] flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> 添加
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── List items (资质/教育/受训/经验) ── */
function ListItems({ items, onChange, placeholder, example }: {
  items: ListItem[]; onChange: (v: ListItem[]) => void;
  placeholder: string; example: string;
}) {
  const [input, setInput] = useState("");
  const add = () => {
    if (!input.trim()) return;
    onChange([...items, { id: `li_${Date.now()}`, value: input.trim() }]);
    setInput("");
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder={`例：${example}`}
          className="flex-1 px-4 py-2.5 rounded-2xl text-sm border border-[#DDD8D0] bg-[#FAFAF8] outline-none" />
        <button onClick={add}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
          style={{ background: "#9CB48A" }}>
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <AnimatePresence>
        {items.map(item => (
          <motion.div key={item.id}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FAFAF8] border border-[#DDD8D0]">
            <span className="flex-1 text-sm text-[#2C2420]">{item.value}</span>
            <button onClick={() => onChange(items.filter(x => x.id !== item.id))}>
              <X className="w-4 h-4 text-[#9B8E82]" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ── Check if section is complete ── */
function sectionDone(k: SectionKey, f: ProfileForm): boolean {
  switch (k) {
    case "basic": return !!(f.displayName && f.counselorTypes.length > 0);
    case "tagline": return !!f.tagline;
    case "specialties": return f.specialties.length > 0;
    case "workingGroups": return f.workingGroups.length > 0;
    case "approaches": return f.approaches.length > 0;
    case "settings": return !!(f.pricePerSession && f.sessionModes.length > 0);
    case "background": return f.qualifications.length > 0 || f.education.length > 0;
    case "process": return !!f.sessionDescription;
    default: return false;
  }
}

/* ── SectionContent: renders content for a given section key ── */
export function SectionContent({ skey, form, setForm }: {
  skey: SectionKey; form: ProfileForm; setForm: React.Dispatch<React.SetStateAction<ProfileForm>>;
}) {
  const set = <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  switch (skey) {
    case "tagline": return (
      <div>
        <p className="text-xs text-[#9B8E82] mb-2">咨询师寄语：一段真诚的话，会在主页以大字引语形式呈现（50-200字）</p>
        <textarea value={form.tagline} onChange={e => set("tagline", e.target.value)}
          rows={5} placeholder="你想对来访说的话……"
          className="w-full px-4 py-3 rounded-2xl text-sm border border-[#DDD8D0] bg-[#FAFAF8] outline-none resize-none leading-relaxed" />
      </div>
    );
    case "specialties": return (
      <div>
        <p className="text-xs text-[#9B8E82] mb-3">选择你擅长的方向（可多选）</p>
        <TagSelect options={SPECIALTY_OPTIONS} selected={form.specialties}
          onChange={v => set("specialties", v)}
          custom={form.customSpecialties} onCustomChange={v => set("customSpecialties", v)} />
      </div>
    );
    case "workingGroups": return (
      <div>
        <p className="text-xs text-[#9B8E82] mb-3">你主要服务哪些群体？（可多选）</p>
        <TagSelect options={WORKING_GROUP_OPTIONS} selected={form.workingGroups}
          onChange={v => set("workingGroups", v)}
          custom={form.customWorkingGroups} onCustomChange={v => set("customWorkingGroups", v)} />
      </div>
    );
    case "approaches": return (
      <div>
        <p className="text-xs text-[#9B8E82] mb-3">你使用哪些理论取向？（可多选）</p>
        <TagSelect options={APPROACH_OPTIONS} selected={form.approaches}
          onChange={v => set("approaches", v)}
          custom={form.customApproaches} onCustomChange={v => set("customApproaches", v)} />
      </div>
    );
    case "settings": return (
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium text-[#2C2420] mb-2">咨询方式 *</p>
          <div className="flex flex-wrap gap-2">
            {SESSION_MODE_OPTIONS.map(m => {
              const on = form.sessionModes.includes(m);
              return (
                <button key={m} onClick={() => set("sessionModes", on ? form.sessionModes.filter(x => x !== m) : [...form.sessionModes, m])}
                  className="px-4 py-2 rounded-full text-sm border transition-all"
                  style={{ background: on ? "#9CB48A" : "white", color: on ? "white" : "#6B5E52", borderColor: on ? "#9CB48A" : "#DDD8D0" }}>
                  {m}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-[#2C2420] mb-2">单次时长（分钟）</p>
          <div className="flex gap-2 flex-wrap">
            {[50, 60, 90].map(d => (
              <button key={d} onClick={() => set("sessionDuration", d)}
                className="px-5 py-2 rounded-full text-sm border transition-all"
                style={{ background: form.sessionDuration === d ? "#9CB48A" : "white", color: form.sessionDuration === d ? "white" : "#6B5E52", borderColor: form.sessionDuration === d ? "#9CB48A" : "#DDD8D0" }}>
                {d} 分钟
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-[#2C2420] mb-1.5">每次费用（元）*</p>
          <input value={form.pricePerSession} onChange={e => set("pricePerSession", e.target.value)}
            type="number" placeholder="例：400"
            className="w-full px-4 py-2.5 rounded-2xl text-sm border border-[#DDD8D0] bg-[#FAFAF8] outline-none" />
        </div>
        <div>
          <p className="text-xs font-medium text-[#2C2420] mb-2">接待语言</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map(l => {
              const on = form.languages.includes(l);
              return (
                <button key={l} onClick={() => set("languages", on ? form.languages.filter(x => x !== l) : [...form.languages, l])}
                  className="px-4 py-2 rounded-full text-sm border transition-all"
                  style={{ background: on ? "#9CB48A" : "white", color: on ? "white" : "#6B5E52", borderColor: on ? "#9CB48A" : "#DDD8D0" }}>
                  {l}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-[#2C2420] mb-1">咨询设置说明</p>
          <p className="text-xs text-[#9B8E82] mb-1.5">频率、首次流程、是否接受滑动尺度收费等</p>
          <textarea value={form.sessionSettings} onChange={e => set("sessionSettings", e.target.value)}
            rows={3} placeholder="例：每次50分钟，建议每周一次。首次为初始访谈……"
            className="w-full px-4 py-3 rounded-2xl text-sm border border-[#DDD8D0] bg-[#FAFAF8] outline-none resize-none leading-relaxed" />
        </div>
      </div>
    );
    case "background": return (
      <div className="space-y-5">
        <div>
          <p className="text-xs font-medium text-[#2C2420] mb-2">从业资质</p>
          <ListItems items={form.qualifications} onChange={v => set("qualifications", v)}
            placeholder="国家二级心理咨询师证书" example="国家二级心理咨询师证书" />
        </div>
        <div>
          <p className="text-xs font-medium text-[#2C2420] mb-2">教育背景</p>
          <ListItems items={form.education} onChange={v => set("education", v)}
            placeholder="北京大学 心理学硕士" example="北京大学 心理学硕士" />
        </div>
        <div>
          <p className="text-xs font-medium text-[#2C2420] mb-2">受训经历</p>
          <ListItems items={form.trainings} onChange={v => set("trainings", v)}
            placeholder="DBT 辩证行为疗法培训（120小时）" example="DBT 辩证行为疗法培训（120小时）" />
        </div>
        <div>
          <p className="text-xs font-medium text-[#2C2420] mb-2">工作经验</p>
          <ListItems items={form.workExperiences} onChange={v => set("workExperiences", v)}
            placeholder="某三甲医院心理科（3年）" example="某三甲医院心理科（3年）" />
        </div>
      </div>
    );
    case "process": return (
      <div>
        <p className="text-xs text-[#9B8E82] mb-1.5">描述你的咨询风格和流程（帮助来访了解和你工作会是什么感受，可分段书写）</p>
        <textarea value={form.sessionDescription} onChange={e => set("sessionDescription", e.target.value)}
          rows={7} placeholder="我的咨询风格是……"
          className="w-full px-4 py-3 rounded-2xl text-sm border border-[#DDD8D0] bg-[#FAFAF8] outline-none resize-none leading-relaxed" />
      </div>
    );
    default: return null;
  }
}

/* ── BasicSection (独立出来，方便 page.tsx 直接引用) ── */
export function BasicSection({ form, setForm, open, onToggle, AvatarUploader }: {
  form: ProfileForm; setForm: React.Dispatch<React.SetStateAction<ProfileForm>>;
  open: boolean; onToggle: () => void;
  AvatarUploader: React.ComponentType<{ url: string; name: string; onChange: (v: string) => void }>;
}) {
  const done = !!(form.displayName && form.counselorTypes.length > 0);
  const set = <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));
  return (
    <div className="rounded-2xl bg-white border border-[#DDD8D0] overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-4">
        <span className="text-[#9CB48A]"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="10" cy="7" r="3"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg></span>
        <span className="flex-1 text-left text-sm font-semibold text-[#2C2420]">基本信息</span>
        {done && <svg viewBox="0 0 16 16" className="w-4 h-4 text-[#9CB48A]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8l4 4 8-8"/></svg>}
        <svg viewBox="0 0 16 16" className="w-4 h-4 text-[#9B8E82]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={open ? "M3 10l5-5 5 5" : "M3 6l5 5 5-5"}/></svg>
      </button>
      {open && (
        <div className="px-4 pb-5 pt-1 border-t border-[#F0EDE8] space-y-4">
          <AvatarUploader url={form.avatarUrl} name={form.displayName} onChange={v => set("avatarUrl", v)} />
          <div>
            <p className="text-xs font-medium text-[#2C2420] mb-1.5">姓名 *</p>
            <input value={form.displayName} onChange={e => set("displayName", e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl text-sm border border-[#DDD8D0] bg-[#FAFAF8] outline-none" placeholder="你的全名" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#2C2420] mb-0.5">咨询师类别 * 决定首页角色标签</p>
            <p className="text-xs text-[#9B8E82] mb-2">可多选，选择你的主要工作类型</p>
            <div className="space-y-2">
              {[
                { id: "心理咨询师", desc: "持有心理咨询师资质，提供心理咨询服务" },
                { id: "ADHD教练",   desc: "专业 ADHD 教练，侧重执行功能与行为策略" },
                { id: "特教老师",   desc: "特殊教育背景，专注儿童/青少年评估与干预" },
              ].map(opt => {
                const on = form.counselorTypes.includes(opt.id);
                return (
                  <button key={opt.id} onClick={() => set("counselorTypes", on ? form.counselorTypes.filter(x => x !== opt.id) : [...form.counselorTypes, opt.id])}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left border transition-all"
                    style={{ background: on ? "#F0F7EC" : "white", borderColor: on ? "#9CB48A" : "#DDD8D0" }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center border-2 flex-shrink-0"
                      style={{ background: on ? "#9CB48A" : "transparent", borderColor: on ? "#9CB48A" : "#C0B8B0" }}>
                      {on && <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 6l3 3 5-5"/></svg>}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: on ? "#3a6228" : "#2C2420" }}>{opt.id}</p>
                      <p className="text-xs text-[#9B8E82]">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-[#2C2420] mb-0.5">是否为督导</p>
            <p className="text-xs text-[#9B8E82] mb-2">督导标签会显示在你的咨询师卡片上，并可被来访通过「预约督导」筛选找到</p>
            <div className="flex gap-2">
              {[{ v: true, label: "是，我是督导" }, { v: false, label: "否" }].map(opt => (
                <button key={String(opt.v)} onClick={() => set("isSupervisor", opt.v)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium border transition-all"
                  style={{ background: form.isSupervisor === opt.v ? "#9CB48A" : "white", color: form.isSupervisor === opt.v ? "white" : "#6B5E52", borderColor: form.isSupervisor === opt.v ? "#9CB48A" : "#DDD8D0" }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-[#2C2420] mb-0.5">所在地</p>
            <p className="text-xs text-[#9B8E82] mb-1.5">填写城市名，平台会自动按省份归类（例：上海、广州）</p>
            <input value={form.location} onChange={e => set("location", e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl text-sm border border-[#DDD8D0] bg-[#FAFAF8] outline-none" placeholder="例：北京" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#2C2420] mb-1.5">累计咨询小时数</p>
            <input value={form.totalHours} onChange={e => set("totalHours", e.target.value)}
              type="number"
              className="w-full px-4 py-2.5 rounded-2xl text-sm border border-[#DDD8D0] bg-[#FAFAF8] outline-none" placeholder="" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#2C2420] mb-0.5">简介 *</p>
            <p className="text-xs text-[#9B8E82] mb-1.5">在首页咨询师列表卡片上显示（100-300字），也会在你的主页单独展示</p>
            <textarea value={form.bio} onChange={e => set("bio", e.target.value)}
              rows={5} placeholder="介绍你自己和你的工作方式……"
              className="w-full px-4 py-3 rounded-2xl text-sm border border-[#DDD8D0] bg-[#FAFAF8] outline-none resize-none leading-relaxed" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── SectionAccordion: renders non-basic sections ── */
export function SectionAccordion({ form, open, onToggle, children }: {
  form: ProfileForm; open: SectionKey | null;
  onToggle: (k: SectionKey) => void;
  children: (k: SectionKey) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {SECTION_META.map(({ key, label, icon }) => {
        const done = sectionDone(key, form);
        const isOpen = open === key;
        return (
          <div key={key} className="rounded-2xl bg-white border border-[#DDD8D0] overflow-hidden">
            <button onClick={() => onToggle(key)} className="w-full flex items-center gap-3 px-4 py-4">
              <span className="text-[#9CB48A]"><SectionIcon name={icon} /></span>
              <span className="flex-1 text-left text-sm font-semibold text-[#2C2420]">{label}</span>
              {done && <svg viewBox="0 0 16 16" className="w-4 h-4 text-[#9CB48A]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8l4 4 8-8"/></svg>}
              <svg viewBox="0 0 16 16" className="w-4 h-4 text-[#9B8E82]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={isOpen ? "M3 10l5-5 5 5" : "M3 6l5 5 5-5"}/></svg>
            </button>
            {isOpen && (
              <div className="px-4 pb-5 pt-1 border-t border-[#F0EDE8]">
                {children(key)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
