"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";

interface Msg { id: string; senderId: string; content: string; createdAt: string; isAdmin: boolean; }

export default function SupportPage() {
  const router = useRouter();
  const { user: user } = useEazo();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const WELCOME: Msg = {
    id: "welcome", senderId: "admin", content: "你好！我是 MindPace 客服。有任何关于预约、平台使用或咨询师资质的问题，都可以在这里告诉我 😊", createdAt: new Date().toISOString(), isAdmin: true
  };

  useEffect(() => {
    loadMsgs();
    const t = setInterval(loadMsgs, 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function loadMsgs() {
    try {
      const res = await request("/api/support/messages");
      if (res.ok) {
        const data = await res.json();
        setMsgs(data.messages ?? []);
      }
    } catch {}
  }

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text.trim();
    setText("");
    try {
      await request("/api/support/messages", { method: "POST", body: JSON.stringify({ content }) });
      await loadMsgs();
    } catch {} finally { setSending(false); }
  }

  const allMsgs = msgs.length === 0 ? [WELCOME] : [WELCOME, ...msgs];

  return (
    <div className="flex flex-col h-svh" style={{ background: "var(--color-surface)" }}>
      {/* 顶部 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 z-10"
        style={{ background: "rgba(245,240,232,0.95)", backdropFilter: "blur(8px)", borderColor: "#DDD8D0" }}>
        <button onClick={() => router.back()} className="p-1.5 rounded-full" style={{ background: "#EBE7DF" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "#5A4E44" }} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: "var(--color-primary)" }}>客</div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#2C2420" }}>MindPace 客服</p>
            <p className="text-xs" style={{ color: "#9B8E82" }}>通常在1小时内回复</p>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {allMsgs.map((m) => {
          const isMe = !m.isAdmin && m.senderId === user?.id;
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2`}>
              {!isMe && (
                <div className="w-7 h-7 rounded-full flex-none flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: "var(--color-primary)" }}>客</div>
              )}
              <div className="max-w-[75%]">
                <div className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={{
                    background: isMe ? "var(--color-primary)" : "white",
                    color: isMe ? "white" : "#2C2420",
                    borderBottomRightRadius: isMe ? 4 : undefined,
                    borderBottomLeftRadius: !isMe ? 4 : undefined,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
                  }}>
                  {m.content}
                </div>
                <p className="text-[10px] mt-1 px-1" style={{ color: "#B8AEA4", textAlign: isMe ? "right" : "left" }}>
                  {new Date(m.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {isMe && (
                <div className="w-7 h-7 rounded-full flex-none flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: "#C4B5A5" }}>{user?.name?.[0] ?? "我"}</div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 输入框 */}
      <div className="px-4 py-3 border-t flex gap-2 items-end"
        style={{ background: "white", borderColor: "#EBE7DF", paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}>
        <textarea value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="输入消息…" rows={1}
          className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm outline-none"
          style={{ background: "#F5F0EA", color: "#2C2420", maxHeight: 120, border: "none" }} />
        <button onClick={send} disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-none"
          style={{ background: text.trim() ? "var(--color-primary)" : "#D4CEC8" }}>
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
