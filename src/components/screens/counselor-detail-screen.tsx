"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, Clock, Video, Phone, Users, MessageCircle, CalendarCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";

type Counselor = {
  id: string; displayName: string; title: string; bio: string; tagline: string;
  specialties: string[]; approaches: string[]; workingGroups: string[];
  sessionModes: string[]; sessionDuration: number; pricePerSession: number;
  languages: string[]; location: string; avatarUrl: string | null;
  isAccepting: boolean; counselorTypes: string[]; isSupervisor: boolean;
  totalHours: number; totalSessions: number; rating: number;
};

const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };

function Tag({ label, color = "bg-[var(--color-mp-secondary)] text-[var(--color-mp-muted)]" }: { label: string; color?: string }) {
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${color}`}>{label}</span>;
}

export function CounselorDetailScreen({ counselorId }: { counselorId: string }) {
  const router = useRouter();
  const user = useEazo((s) => s.auth.user);
  const [c, setC] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/counselors/${counselorId}`)
      .then(r => r.json()).then(setC).finally(() => setLoading(false));
  }, [counselorId]);

  if (loading) return (
    <div className="min-h-svh bg-[var(--color-mp-surface)] p-5 space-y-4">
      <div className="h-8 w-32 skeleton" />
      <div className="h-28 w-28 rounded-3xl skeleton mx-auto" />
      <div className="h-6 w-40 skeleton mx-auto" />
      {[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
    </div>
  );

  if (!c) return (
    <div className="min-h-svh flex items-center justify-center bg-[var(--color-mp-surface)]">
      <p className="text-[var(--color-mp-muted)]">未找到该咨询师</p>
    </div>
  );

  const rating = (c.rating / 10).toFixed(1);

  return (
    <div className="min-h-svh bg-[var(--color-mp-surface)] pb-28">
      {/* header */}
      <div className="sticky top-0 z-10 bg-[var(--color-mp-surface)]/95 backdrop-blur px-4 pt-12 pb-3 flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-[var(--color-mp-card)] border border-[var(--color-mp-border)] flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-[var(--color-mp-muted)]" />
        </motion.button>
        <span className="text-sm font-medium text-[var(--color-mp-muted)]">咨询师详情</span>
      </div>

      <div className="px-5 space-y-5">
        {/* hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}
          className="bg-[var(--color-mp-card)] rounded-3xl p-6 border border-[var(--color-mp-border)] text-center">
          <div className="w-20 h-20 rounded-2xl bg-[var(--color-mp-secondary)] flex items-center justify-center text-3xl font-bold text-[var(--color-mp-muted)] mx-auto mb-3">
            {c.displayName[0]}
          </div>
          <h1 className="text-xl font-semibold text-[var(--color-mp-text)] mb-1">{c.displayName}</h1>
          <p className="text-sm text-[var(--color-mp-muted)] mb-3">{c.title}</p>
          <div className="flex items-center justify-center gap-4 text-xs text-[var(--color-mp-muted)]">
            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />{rating}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{c.sessionDuration} 分钟</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{c.totalSessions} 次</span>
          </div>
          {c.tagline && (
            <p className="mt-4 text-sm text-[var(--color-mp-text)] italic leading-relaxed border-l-2 border-[var(--color-mp-primary)] pl-3 text-left">
              「{c.tagline}」
            </p>
          )}
        </motion.div>

        {/* bio */}
        {c.bio && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.05 }}
            className="bg-[var(--color-mp-card)] rounded-3xl p-5 border border-[var(--color-mp-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-mp-text)] mb-2">关于我</h3>
            <p className="text-sm text-[var(--color-mp-muted)] leading-relaxed">{c.bio}</p>
          </motion.div>
        )}

        {/* specialties */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.1 }}
          className="bg-[var(--color-mp-card)] rounded-3xl p-5 border border-[var(--color-mp-border)]">
          <h3 className="text-sm font-semibold text-[var(--color-mp-text)] mb-3">擅长领域</h3>
          <div className="flex flex-wrap gap-2">
            {c.specialties.map(s => <Tag key={s} label={s} color="bg-[#EDF5E9] text-[#4a7a4a]" />)}
          </div>
        </motion.div>

        {/* session info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.15 }}
          className="bg-[var(--color-mp-card)] rounded-3xl p-5 border border-[var(--color-mp-border)]">
          <h3 className="text-sm font-semibold text-[var(--color-mp-text)] mb-3">咨询设置</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-2xl bg-[var(--color-mp-surface)]">
              <p className="text-lg font-semibold text-[var(--color-mp-text)]">{c.sessionDuration}</p>
              <p className="text-[10px] text-[var(--color-mp-faint)]">分钟/次</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-[var(--color-mp-surface)]">
              <p className="text-lg font-semibold text-[var(--color-mp-text)]">¥{c.pricePerSession}</p>
              <p className="text-[10px] text-[var(--color-mp-faint)]">每次</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-[var(--color-mp-surface)]">
              <p className="text-xs font-medium text-[var(--color-mp-text)]">{c.sessionModes.join(" / ")}</p>
              <p className="text-[10px] text-[var(--color-mp-faint)]">咨询方式</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* bottom CTA */}
      <div className="fixed bottom-0 inset-x-0 px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)] bg-gradient-to-t from-[var(--color-mp-surface)] via-[var(--color-mp-surface)]/90 to-transparent z-20">
        <div className="flex gap-3">
          <Link href={`/messages`} className="flex-none">
            <motion.button whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-2xl border border-[var(--color-mp-border)] bg-[var(--color-mp-card)] flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[var(--color-mp-muted)]" />
            </motion.button>
          </Link>
          {c.isAccepting ? (
            <Link href={`/booking/${c.id}`} className="flex-1">
              <motion.button whileTap={{ scale: 0.97 }}
                className="w-full h-12 rounded-2xl bg-[var(--color-mp-primary)] text-white font-semibold text-sm shadow-md">
                预约咨询
              </motion.button>
            </Link>
          ) : (
            <div className="flex-1 h-12 rounded-2xl bg-[var(--color-mp-border)] flex items-center justify-center text-sm text-[var(--color-mp-faint)]">
              暂停接诊
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
