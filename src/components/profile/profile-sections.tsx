"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import {
  ProfileForm, SectionKey, SECTIONS,
  SPECIALTY_OPTIONS, WORKING_GROUP_OPTIONS, APPROACH_OPTIONS,
  MODE_OPTIONS, DURATION_OPTIONS, LANGUAGE_OPTIONS,
  isSectionDone,
} from "@/lib/counselor-profile-data";

// ── 通用：多选标签组 ──────────────────────────────────────
function TagPicker({
  options, selected, onChange, color = "#9CB48A",
}: { options: string[]; selected: string[]; onChange: (v: string[]) => void; color?: string }) {
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const on = selected.includes(opt);
        return (
          <button key={opt} onClick={() => toggle(opt)}
            className="px-3 py-1.5 rounded-full text-sm border transition-all"
            style={{
              background: on ? color : "white",
              color: on ? "white" : "#6B5E52",
              borderColor: on ? color : "#DDD8D0",
            }}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── 通用：自定义标签提交框 ────────────────────────────────
function CustomTagInput({ onSubmit }: { onSubmit: (v: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="mt-3 rounded-2xl border border-dashed border-[#DDD8D0] p-3">
      <p className="text-xs text-[#9B8E82] mb-2">没找到合适的标签？提交自定义标签，经管理员审核后加入选项</p>
      <div className="flex gap-2">
        <input value={val} onChange={e => setVal(e.target.value)}
          placeholder="输入标签名称"
          className="flex-1 px-3 py-2 rounded-xl text-sm border border-[#DDD8D0] bg-[#FAFAF8] outline-none" />
        <button onClick={() => { if (val.trim()) { onSubmit(val.trim()); setVal(""); } }}
          className="px-3 py-2 rounded-xl text-sm font-medium text-[#9B8E82] border border-[#DDD8D0] bg-white flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> 提交
        </button>
      </div>
    </div>
  );
}

// ── 通用：逐条添加列表 ────────────────────────────────────
function ListInput({
  items, onChange, placeholder,
}: { items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [val, setVal] = useState("");
  const add = () => { if (val.trim()) { onChange([...items, val.trim()]); setVal(""); } };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 rounded-2xl text-sm border border-[#DDD8D0] bg-[#FAFAF8] outline-none" />
        <button onClick={add}
          className="w-10 h-10 rounded-full bg-[#9CB48A] text-white flex items-center justify-center shadow-sm">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#DDD8D0] text-sm text-[#2C2420]">
          <span className="flex-1">{item}</span>
          <button onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-[#C0B8B0] hover:text-[#9B8E82]">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── 图标 ─────────────────────────────────────────────────
const ICONS: Record<string, React.ReactNode> = {
  person:   <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="10" cy="7" r="3"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
  quote:    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4"><path d="M5 9h3v4H5V9zm7 0h3v4h-3V9z" strokeLinejoin="round"/><path d="M5 9c0-2.2 1.8-4 4-4M12 9c0-2.2 1.8-4 4-4" /></svg>,
  gauge:    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4"><path d="M10 18a8 8 0 100-16 8 8 0 000 16z"/><path d="M10 10l3.5-3"/></svg>,
  users:    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4"><circle cx="8" cy="7" r="3"/><path d="M2 17c0-2.8 2.2-5 5-5h2c2.8 0 5 2.2 5 5"/><path d="M14 5a2.5 2.5 0 010 5M18 17c0-2.2-1.6-4-3.5-4.5"/></svg>,
  clock:    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4"><circle cx="10" cy="10" r="7"/><path d="M10 6v4l2.5 2"/></svg>,
  settings: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4"><circle cx="10" cy="10" r="2.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"/></svg>,
  file:     <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M4 3h8l4 4v11a1 1 0 01-1 1H5a1 1 0 01-1-1V3z"/><path d="M12 3v5h4M7 10h6M7 13h4"/></svg>,
  lines:    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4"><path d="M3 5h14M3 10h10M3 15h7"/></svg>,
};

// ── 板块折叠容器 ─────────────────────────────────────────
export function SectionAccordion({
  form, open, onToggle, children,
}: {
  form: ProfileForm;
  open: SectionKey | null;
  onToggle: (k: SectionKey) => void;
  children: (key: SectionKey) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {SECTIONS.map(s => {
        const key = s.key as SectionKey;
        const isOpen = open === key;
        const done = isSectionDone(key, form);
        return (
          <div key={key} className="rounded-2xl bg-white border border-[#DDD8D0] overflow-hidden">
            <button
              onClick={() => onToggle(key)}
              className="w-full flex items-center gap-3 px-4 py-4"
            >
              <span className="text-[#9CB48A]">{ICONS[s.icon]}</span>
              <span className="flex-1 text-left text-sm font-semibold text-[#2C2420]">{s.label}</span>
              {done && <Check className="w-4 h-4 text-[#9CB48A]" />}
              {isOpen ? <ChevronUp className="w-4 h-4 text-[#9B8E82]" /> : <ChevronDown className="w-4 h-4 text-[#9B8E82]" />}
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-5 pt-1 border-t border-[#F0EDE8] space-y-4">
                    {children(key)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ── 板块内容渲染 ──────────────────────────────────────────
export function SectionContent({
  skey, form, setForm,
}: { skey: SectionKey; form: ProfileForm; setForm: (f: ProfileForm) => void }) {
  const set = <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) =>
    setForm({ ...form, [k]: v });

  if (skey === "basic") return null; // 基本信息在主文件里渲染

  if (skey === "quote") return (
    <>
      <p className="text-xs font-medium text-[#2C2420]">咨询师寄语</p>
      <p className="text-xs text-[#9B8E82] -mt-2">一段真诚的话，会在主页以大字引语形式呈现（50-200字）</p>
      <textarea
        value={form.tagline} onChange={e => set("tagline", e.target.value)}
        rows={5} placeholder="例：我相信每个大脑的运作方式都值得被理解……"
        className="w-full px-4 py-3 rounded-2xl text-sm border border-[#DDD8D0] bg-[#FAFAF8] outline-none resize-none leading-relaxed"
      />
    </>
  );

  if (skey === "specialty") return (
    <>
      <p className="text-xs text-[#6B5E52]">选择你擅长的方向（可多选）</p>
      <TagPicker options={SPECIALTY_OPTIONS} selected={form.specialties}
        onChange={v => set("specialties", v)} />
      <CustomTagInput onSubmit={() => {}} />
    </>
  );

  if (skey === "working") return (
    <>
      <p className="text-xs text-[#6B5E52]">你主要服务哪些群体？（可多选）</p>
      <TagPicker options={WORKING_GROUP_OPTIONS} selected={form.workingGroups}
        onChange={v => set("workingGroups", v)} />
      <CustomTagInput onSubmit={() => {}} />
    </>
  );

  if (skey === "approach") return (
    <>
      <p className="text-xs text-[#6B5E52]">你使用哪些理论取向？（可多选）</p>
      <TagPicker options={APPROACH_OPTIONS} selected={form.approaches}
        onChange={v => set("approaches", v)} />
      <CustomTagInput onSubmit={() => {}} />
    </>
  );

  if (skey === "settings") return (
    <>
      <div>
        <p className="text-xs font-medium text-[#2C2420] mb-2">咨询方式 *</p>
        <div className="flex flex-wrap gap-2">
          {MODE_OPTIONS.map(m => {
            const on = form.sessionModes.includes(m);
            return (
              <button key={m} onClick={() => set("sessionModes",
                on ? form.sessionModes.filter(x => x !== m) : [...form.sessionModes, m])}
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
        <div className="flex gap-2 mb-2">
          {DURATION_OPTIONS.map(d => (
            <button key={d} onClick={() => set("sessionDuration", d)}
              className="px-4 py-2 rounded-full text-sm border transition-all"
              style={{ background: form.sessionDuration === d ? "#9CB48A" : "white", color: form.sessionDuration === d ? "white" : "#6B5E52", borderColor: form.sessionDuration === d ? "#9CB48A" : "#DDD8D0" }}>
              {d} 分钟
            </button>
          ))}
        </div>
        <input value={form.customDuration || form.sessionDuration}
          onChange={e => set("sessionDuration", e.target.value)}
          className="w-full px-4 py-2.5 rounded-2xl text-sm border border-[#DDD8D0] bg-[#FAFAF8] outline-none"
          placeholder="或手动输入分钟数" />
      </div>
      <div>
        <p className="text-xs font-medium text-[#2C2420] mb-2">每次费用（元）*</p>
        <input value={form.pricePerSession} onChange={e => set("pricePerSession", e.target.value)}
          type="number" placeholder="400"
          className="w-full px-4 py-2.5 rounded-2xl text-sm border border-[#DDD8D0] bg-[#FAFAF8] outline-none" />
      </div>
      <div>
        <p className="text-xs font-medium text-[#2C2420] mb-2">接待语言</p>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map(l => {
            const on = form.languages.includes(l);
            return (
              <button key={l} onClick={() => set("languages",
                on ? form.languages.filter(x => x !== l) : [...form.languages, l])}
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
        <p className="text-xs text-[#9B8E82] mb-2">频率、首次流程、是否接受滑动尺度收费等</p>
        <textarea value={form.sessionDescription}
          onChange={e => set("sessionDescription", e.target.value)}
          rows={4} placeholder="例：每次50分钟，建议每周一次。首次为初始访谈……"
          className="w-full px-4 py-3 rounded-2xl text-sm border border-[#DDD8D0] bg-[#FAFAF8] outline-none resize-none" />
      </div>
    </>
  );

  if (skey === "background") return (
    <>
      <div>
        <p className="text-xs font-medium text-[#2C2420] mb-2">从业资质</p>
        <ListInput items={form.qualifications}
          onChange={v => set("qualifications", v)}
          placeholder="例：国家二级心理咨询师证书" />
      </div>
      <div>
        <p className="text-xs font-medium text-[#2C2420] mb-2">教育背景</p>
        <ListInput items={form.education}
          onChange={v => set("education", v)}
          placeholder="例：北京大学 心理学硕士" />
      </div>
      <div>
        <p className="text-xs font-medium text-[#2C2420] mb-2">受训经历</p>
        <ListInput items={form.trainings}
          onChange={v => set("trainings", v)}
          placeholder="例：DBT 辩证行为疗法培训（120小时）" />
      </div>
      <div>
        <p className="text-xs font-medium text-[#2C2420] mb-2">工作经验</p>
        <ListInput items={form.workExperiences}
          onChange={v => set("workExperiences", v)}
          placeholder="例：某三甲医院心理科（3年）" />
      </div>
    </>
  );

  if (skey === "process") return (
    <>
      <p className="text-xs font-medium text-[#2C2420]">描述你的咨询风格和流程</p>
      <p className="text-xs text-[#9B8E82] -mt-2">帮助来访了解和你工作会是什么感受（可分段书写）</p>
      <textarea value={form.processDescription}
        onChange={e => set("processDescription", e.target.value)}
        rows={8} placeholder="我的咨询风格是温暖、真诚和支持性的……"
        className="w-full px-4 py-3 rounded-2xl text-sm border border-[#DDD8D0] bg-[#FAFAF8] outline-none resize-none leading-relaxed" />
    </>
  );

  return null;
}
