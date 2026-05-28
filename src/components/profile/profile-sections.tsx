"use client";
import { motion } from "framer-motion";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { SECTIONS, type SectionKey } from "@/lib/counselor-profile-data";

const SECTION_ICONS: Record<string, React.ReactNode> = {
  person: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="10" cy="7" r="3"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
  quote:  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4"><path d="M4 8h4v4H4V8zm8 0h4v4h-4V8z"/></svg>,
  gauge:  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4"><circle cx="10" cy="10" r="6"/><path d="M10 10L14 7"/></svg>,
  users:  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4"><circle cx="8" cy="8" r="3"/><path d="M2 17c0-2.8 2.2-5 5-5h2c2.8 0 5 2.2 5 5"/><path d="M13 5a3 3 0 110 6M18 17c0-2.8-1.8-4.8-4-5"/></svg>,
  clock:  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4"><circle cx="10" cy="10" r="7"/><path d="M10 6v4l3 2"/></svg>,
  settings:<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4"><circle cx="10" cy="10" r="3"/><path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4"/></svg>,
  file:   <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4"><rect x="4" y="2" width="12" height="16" rx="2"/><path d="M7 7h6M7 10h6M7 13h4"/></svg>,
  lines:  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-4 h-4"><path d="M3 5h14M3 10h10M3 15h7"/></svg>,
};

interface Props {
  open: SectionKey | null;
  onToggle: (key: SectionKey) => void;
  completed: Set<SectionKey>;
  children: (key: SectionKey) => React.ReactNode;
}

export function ProfileSections({ open, onToggle, completed, children }: Props) {
  return (
    <div className="space-y-3 pb-32">
      {SECTIONS.map(({ key, label, icon }) => {
        const isOpen = open === key;
        const done = completed.has(key);
        return (
          <div key={key} className="rounded-2xl border border-[#DDD8D0] bg-white overflow-hidden">
            <button
              className="w-full flex items-center gap-3 px-4 py-4"
              onClick={() => onToggle(key as SectionKey)}
            >
              <span className="text-[#9CB48A]">{SECTION_ICONS[icon]}</span>
              <span className="flex-1 text-left text-base font-semibold text-[#2C2420]">{label}</span>
              {done && <Check className="w-4 h-4 text-[#9CB48A]" strokeWidth={2.5} />}
              {isOpen ? <ChevronUp className="w-4 h-4 text-[#9B8E82]" /> : <ChevronDown className="w-4 h-4 text-[#9B8E82]" />}
            </button>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-5 pt-1 border-t border-[#F0EDE8]"
              >
                {children(key as SectionKey)}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
