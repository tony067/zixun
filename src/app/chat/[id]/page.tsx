"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";

type Msg = { msg: { id: string; content: string; senderId: string; createdAt: string }; sender: { id: string; name: string | null; email: string | null } };

export default function ChatPage() {
  const params = useParams();
  const convId = params.id as string;
  const user = useEazo((s) => s.auth.user);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [otherName, setOtherName] = useState("对话");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    request(`/api/messages/${convId}`).then(r => r.json()).then((d: Msg[]) => {
      if (Array.isArray(d)) {
        setMsgs(d);
        const other = d.find(m => m.sender.id !== user.id)?.sender;
        if (other) setOtherName(other.name ?? other.email ?? "对方");
      }
    });
  }, [convId, user]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!input.trim() || sending || !user) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    const opt: Msg = { msg: { id: `tmp_${Date.now()}`, content, senderId: user.id, createdAt: new Date().toISOString() }, sender: { id: user.id, name: user.name, email: user.email } };
    setMsgs(p => [...p, opt]);
    try {
      const res = await request(`/api/messages/${convId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
      const data = await res.json();
      setMsgs(p => p.map(m => m.msg.id === opt.msg.id ? { msg: data.msg, sender: data.sender } : m));
    } catch { setMsgs(p => p.filter(m => m.msg.id !== opt.msg.id)); }
    finally { setSending(false); }
  };

  return (
    <div className="flex flex-col h-svh bg-[var(--color-mp-surface)]">
      <div className="flex-shrink-0 bg-[var(--color-mp-card)] border-b border-[var(--color-mp-border)] px-4 pt-12 md:pt-4 pb-3 flex items-center gap-3">
        <Link href="/messages" className="w-9 h-9 rounded-full bg-[var(--color-mp-surface)] flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-[var(--color-mp-muted)]" />
        </Link>
        <div className="w-8 h-8 rounded-full bg-[var(--color-mp-secondary)] flex items-center justify-center text-xs font-semibold text-[var(--color-mp-muted)]">{otherName[0]}</div>
        <span className="text-sm font-semibold text-[var(--color-mp-text)]">{otherName}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {msgs.map(({ msg, sender }) => {
            const mine = sender.id === user?.id;
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${mine ? "bg-[var(--color-mp-primary)] text-white rounded-br-sm" : "bg-[var(--color-mp-card)] text-[var(--color-mp-text)] border border-[var(--color-mp-border)] rounded-bl-sm"}`}>
                  {msg.content}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
      <div className="flex-shrink-0 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] bg-[var(--color-mp-card)] border-t border-[var(--color-mp-border)] flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder="输入消息…" className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--color-mp-surface)] border border-[var(--color-mp-border)] text-sm text-[var(--color-mp-text)] placeholder:text-[var(--color-mp-faint)] focus:outline-none focus:border-[var(--color-mp-primary)]" />
        <motion.button whileTap={{ scale: 0.9 }} onClick={send} disabled={!input.trim() || sending}
          className={`w-10 h-10 rounded-full flex items-center justify-center ${input.trim() ? "bg-[var(--color-mp-primary)]" : "bg-[var(--color-mp-border)]"}`}>
          <Send className="w-4 h-4 text-white" />
        </motion.button>
      </div>
    </div>
  );
}
