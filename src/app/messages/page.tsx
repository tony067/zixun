"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Plus } from "lucide-react";
import Link from "next/link";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";

type Conv = {
  conv: { id: string; lastMessageAt: string };
  otherUser: { id: string; name: string | null; email: string | null };
};

export default function MessagesPage() {
  const user = useEazo((s) => s.auth.user);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    request("/api/messages").then(r => r.json()).then(d => {
      setConvs(Array.isArray(d) ? d : []);
    }).finally(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div className="min-h-svh flex items-center justify-center bg-[var(--color-mp-surface)]">
      <div className="text-center px-6">
        <MessageCircle className="w-12 h-12 text-[var(--color-mp-faint)] mx-auto mb-3" />
        <p className="text-sm text-[var(--color-mp-muted)]">登录后查看消息</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-svh bg-[var(--color-mp-surface)] pb-24">
      <div className="sticky top-0 z-10 bg-[var(--color-mp-surface)] px-5 pt-12 pb-4 border-b border-[var(--color-mp-border)]">
        <h1 className="text-xl font-semibold text-[var(--color-mp-text)]">消息</h1>
      </div>
      <div className="px-4 py-4 space-y-2">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-2xl" />)
        ) : convs.length === 0 ? (
          <div className="text-center py-20">
            <MessageCircle className="w-10 h-10 text-[var(--color-mp-faint)] mx-auto mb-3" />
            <p className="text-sm text-[var(--color-mp-muted)]">暂无消息</p>
          </div>
        ) : convs.map(({ conv, otherUser }) => (
          <Link key={conv.id} href={`/chat/${conv.id}`}>
            <motion.div whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--color-mp-card)] border border-[var(--color-mp-border)]">
              <div className="w-10 h-10 rounded-full bg-[var(--color-mp-secondary)] flex items-center justify-center text-sm font-semibold text-[var(--color-mp-muted)]">
                {(otherUser.name ?? otherUser.email ?? "?")[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-mp-text)] truncate">
                  {otherUser.name ?? otherUser.email}
                </p>
                <p className="text-xs text-[var(--color-mp-faint)]">
                  {new Date(conv.lastMessageAt).toLocaleDateString("zh-CN")}
                </p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
