"use client";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// 多选标签
interface TagPickerProps {
  label: string;
  hint?: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  allowCustom?: boolean;
}

export function TagPicker({ label, hint, options, selected, onChange, allowCustom }: TagPickerProps) {
  const [custom, setCustom] = useState("");

  const toggle = (t: string) =>
    onChange(selected.includes(t) ? selected.filter(x => x !== t) : [...selected, t]);

  const submitCustom = () => {
    const v = custom.trim();
    if (!v) return;
    if (!selected.includes(v)) onChange([...selected, v]);
    setCustom("");
  };

  return (
    <div className="mb-2">
      {hint && <div className="text-xs text-[#9B8E82] mb-3">{hint}</div>}
      <div className="flex flex-wrap gap-2 mb-3">
        {options.map(t => (
          <button key={t} onClick={() => toggle(t)}
            className={[
              "px-3 py-1.5 rounded-full text-sm border transition-all",
              selected.includes(t)
                ? "bg-[#9CB48A] text-white border-[#9CB48A]"
                : "bg-white text-[#2C2420] border-[#DDD8D0]"
            ].join(" ")}>
            {t}
          </button>
        ))}
      </div>
      {allowCustom && (
        <div className="rounded-xl border border-dashed border-[#DDD8D0] p-3 bg-[#FAF8F5]">
          <div className="text-xs text-[#9B8E82] mb-2">没找到合适的标签？提交自定义标签，经管理员审核后加入选项</div>
          <div className="flex gap-2">
            <input value={custom} onChange={e => setCustom(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitCustom()}
              placeholder="输入标签名称"
              className="flex-1 px-3 py-1.5 rounded-lg border border-[#DDD8D0] bg-white text-sm text-[#2C2420]" />
            <button onClick={submitCustom}
              className="px-3 py-1.5 rounded-lg bg-[#F0EDE8] text-sm text-[#9B8E82] flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> 提交
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 逐条列表（从业资质、教育背景、受训经历、工作经验）
interface ListEditorProps {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (v: string[]) => void;
}

export function ListEditor({ label, placeholder, items, onChange }: ListEditorProps) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (!v) return;
    onChange([...items, v]);
    setInput("");
  };

  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="mb-4">
      <div className="text-sm font-medium text-[#2C2420] mb-2">{label}</div>
      <div className="flex gap-2 mb-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 rounded-xl border border-[#DDD8D0] bg-[#F5F1E8] text-sm text-[#2C2420] placeholder:text-[#C2BDB7]" />
        <button onClick={add}
          className="w-10 h-10 rounded-xl bg-[#9CB48A] text-white flex items-center justify-center flex-shrink-0">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {items.map((item, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 mb-2">
            <div className="flex-1 px-4 py-2.5 rounded-xl bg-[#F5F1E8] border border-[#DDD8D0] text-sm text-[#2C2420]">
              {item}
            </div>
            <button onClick={() => remove(i)} className="text-[#9B8E82] flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// 单行文本输入
interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  type?: string;
}

export function Field({ label, required, hint, value, placeholder, onChange, type }: FieldProps) {
  return (
    <div className="mb-4">
      <div className="text-sm font-medium text-[#2C2420] mb-1">
        {label}{required && <span className="text-[#9CB48A] ml-0.5"> *</span>}
      </div>
      {hint && <div className="text-xs text-[#9B8E82] mb-2">{hint}</div>}
      <input type={type ?? "text"} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-[#DDD8D0] bg-[#F5F1E8] text-sm text-[#2C2420] placeholder:text-[#C2BDB7] focus:outline-none focus:border-[#9CB48A]" />
    </div>
  );
}

// 多行文本
interface TextAreaProps {
  label: string;
  required?: boolean;
  hint?: string;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (v: string) => void;
}

export function TextArea({ label, required, hint, value, placeholder, rows = 5, onChange }: TextAreaProps) {
  return (
    <div className="mb-4">
      <div className="text-sm font-medium text-[#2C2420] mb-1">
        {label}{required && <span className="text-[#9CB48A] ml-0.5"> *</span>}
      </div>
      {hint && <div className="text-xs text-[#9B8E82] mb-2">{hint}</div>}
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        className="w-full px-4 py-3 rounded-xl border border-[#DDD8D0] bg-[#F5F1E8] text-sm text-[#2C2420] placeholder:text-[#C2BDB7] focus:outline-none focus:border-[#9CB48A] resize-none leading-relaxed" />
    </div>
  );
}
