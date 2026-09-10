"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { request } from "@/lib/api/request";

/**
 * 联系客服：创建/复用与官方管理员账号的私信会话，然后跳转到统一聊天页
 * （消息走统一的 conversations/messages 体系，管理员端消息tab可收发）
 */
export default function SupportPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    let cancelled = false;
    request("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toAdmin: true }),
    }).then(r => r.json()).then(d => {
      const convId = d?.conversationId ?? d?.id;
      if (!cancelled && convId) router.replace(`/chat/${convId}`);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user, router]);

  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-3" style={{ background: "var(--color-bg)" }}>
      <MessageCircle className="w-8 h-8 animate-pulse" style={{ color: "#9CB48A" }} />
      <p className="text-sm" style={{ color: "#9B8E82" }}>正在为你接入在线客服…</p>
    </div>
  );
}
