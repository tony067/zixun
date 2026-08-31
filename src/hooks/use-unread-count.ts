"use client";
/**
 * 全局未读消息数 hook — 每 15 秒轮询一次
 * 供 app-shell 底部导航红点使用
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { request } from "@/lib/api/request";

export function useUnreadCount(intervalMs = 15000) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) { setCount(0); return; }
    let aborted = false;
    const fetchOnce = async () => {
      try {
        const r = await request("/api/messages/unread");
        if (!r.ok) return;
        const d = await r.json();
        if (!aborted) setCount(Number(d?.count ?? 0));
      } catch {}
    };
    fetchOnce();
    const t = setInterval(fetchOnce, intervalMs);
    return () => { aborted = true; clearInterval(t); };
  }, [user, intervalMs]);

  return count;
}

/** 主动刷新一次（用于：进入聊天页 mark-read 后、发送消息后等） */
export function useUnreadBump() {
  const [tick, setTick] = useState(0);
  const bump = () => setTick(t => t + 1);
  return { tick, bump };
}
