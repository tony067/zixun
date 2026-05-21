"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Star, Clock, X } from "lucide-react";
import Link from "next/link";

type Counselor = {
  id: string; displayName: string; title: string; bio: string;
  specialties: string[]; sessionModes: string[]; sessionDuration: number;
  pricePerSession: number; isAccepting: boolean; counselorTypes: string[];
  isSupervisor: boolean; totalHours: number; rating: number;
};

const ROLE_TAGS = [
  { id: "all", label: "全部" },
  { id: "心理咨询师", label: "心理咨询师" },
  { id: "ADHD教练", label: "ADHD 教练" },
  { id: "特教老师", label: "特教老师" },
  { id: "督导", label: "预约督导" },
];

const CARD_COLS = ["#E5F0DF","#EDE6D4","#DFF0E9","#F0E8D4","#E2EFE0","#F0EAD4"];

export default function ExploreScreen({
  counselors, loading, search, onSearch,
  role, onRole, avail, onAvail, onClear, filtered,
}: {
  counselors: Counselor[]; loading: boolean; search: string; onSearch: (v: string) => void;
  role: string; onRole: (v: string) => void; avail: string[]; onAvail: (v: string) => void;
  onClear: () => void; filtered: Counselor[];
}) {
  return (
    <div className="min-h-svh" style={{ background: "var(--color-mp-surface)" }}>
      <div className="px-5 pt-14 pb-5" style={{
        background: "linear-gradient(135deg,#9CB48A 0%,#b5c9a4 60%,#E5DCC5 100%)"
      }}>
        <div className="mb-1">
          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: "rgba(255,255,255,0.3)", color: "#fff" }}>联盟认证平台</span>
        </div>
        <h1 className="text-xl font-bold mb-0.5 text-white">神经多样性友好咨询师联盟</h1>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.85)" }}>ADHD · ASD · 高敏感 · 执行功能支持</p>
      </div>

      <div className="px-5">
        <div className="relative mt-4 mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--color-mp-faint)" }} />
          <input value={search} onChange={e => onSearch(e.target.value)}
            placeholder="搜索咨询师、专长方向..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-sm outline-none border"
            style={{ background: "var(--color-mp-card)", borderColor: "var(--color-mp-border)", color: "var(--color-mp-text)" }} />
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {ROLE_TAGS.map(t => (
            <motion.button key={t.id} whileTap={{ scale: 0.94 }} onClick={() => onRole(t.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              style={{
                background: role === t.id ? "var(--color-mp-primary)" : "var(--color-mp-card)",
                borderColor: role === t.id ? "var(--color-mp-primary)" : "var(--color-mp-border)",
                color: role === t.id ? "#fff" : "var(--color-mp-muted)",
              }}>
              {t.label}
            </motion.button>
          ))}
        </div>

        <div className="flex gap-1.5 mb-3">
          {["线上可约","接受预约"].map(t => {
            const k = t === "线上可约" ? "online" : "accepting";
            const active = avail.includes(k);
            return (
              <motion.button key={k} whileTap={{ scale: 0.94 }} onClick={() => onAvail(k)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border"
                style={{
                  background: active ? "#DCFCE7" : "var(--color-mp-card)",
                  borderColor: active ? "#86EFAC" : "var(--color-mp-border)",
                  color: active ? "#166534" : "var(--color-mp-muted)",
                }}>
                {active && <X className="w-3 h-3" />}{t}
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mb-3 pb-3 border-b"
          style={{ borderColor: "var(--color-mp-border)" }}>
          <span className="text-xs" style={{ color: "var(--color-mp-muted)" }}>
            {loading ? "加载中…" : `${filtered.length} 位支持者`}
          </span>
          {(search || role !== "all" || avail.length > 0) && (
            <button onClick={onClear} className="ml-auto text-xs" style={{ color: "var(--color-mp-primary)" }}>清除筛选</button>
          )}
        </div>

        <div className="pb-28">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 py-4 border-b" style={{ borderColor: "var(--color-mp-border)" }}>
                <div className="w-16 h-16 rounded-2xl skeleton flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 skeleton" /> <div className="h-3 w-full skeleton" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-sm" style={{ color: "var(--color-mp-muted)" }}>暂无匹配的咨询师</div>
          ) : (
            <AnimatePresence>
              {filtered.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 260, damping: 30 }}
                  whileTap={{ scale: 0.98 }}>
                  <Link href={`/counselors/${c.id}`}>
                    <div className="py-4 border-b" style={{ borderColor: "var(--color-mp-border)" }}>
                      <div className="flex gap-3 items-start">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                          style={{ background: CARD_COLS[i % CARD_COLS.length], color: "#3B332C" }}>
                          {c.displayName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-base font-semibold" style={{ color: "var(--color-mp-text)" }}>
                              {c.displayName}
                              {c.isSupervisor && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                                style={{ background: "#FEF3C7", color: "#92400E" }}>督导</span>}
                            </span>
                            {c.isAccepting && <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
                              style={{ background: "var(--color-mp-primary)", color: "#fff" }}>接受预约</span>}
                          </div>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {c.counselorTypes.map(t => (
                              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                                style={{ borderColor: "var(--color-mp-border)", color: "var(--color-mp-muted)", background: "var(--color-mp-secondary)" }}>{t}</span>
                            ))}
                          </div>
                          <p className="text-xs leading-relaxed line-clamp-2 mb-1.5"
                            style={{ color: "var(--color-mp-muted)" }}>{c.bio}</p>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {c.specialties.slice(0, 3).map(s => (
                              <span key={s} className="text-[10px] px-2 py-0.5 rounded-full"
                                style={{ background: "var(--color-mp-surface)", border: "1px solid var(--color-mp-border)", color: "var(--color-mp-muted)" }}>{s}</span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-mp-muted)" }}>
                              <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{(c.rating / 10).toFixed(1)}</span>
                              <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{c.sessionDuration}分钟</span>
                            </div>
                            <span className="text-sm font-semibold" style={{ color: "var(--color-mp-text)" }}>
                              ¥{c.pricePerSession}<span className="text-xs font-normal" style={{ color: "var(--color-mp-muted)" }}>/次</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
