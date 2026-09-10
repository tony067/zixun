"use client";
/**
 * 全局未读消息数 hook — 15秒兜底轮询 + 事件驱动立即刷新
 * 供 app-shell 底部导航红点使用
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { request } from "@/lib/api/request";

/** 未读数立即刷新事件名（标记已读后 dispatch，红点即刻更新，不等轮询） */
export const UNREAD_REFRESH_EVENT = "mindpace:unread-refresh";

/** 标记已读后调用：让所有底部导航红点立即刷新 */
export function notifyUnreadRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(UNREAD_REFRESH_EVENT));
  }
}

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
    // 标记已读/发消息等动作触发立即刷新
    window.addEventListener(UNREAD_REFRESH_EVENT, fetchOnce);
    return () => {
      aborted = true;
      clearInterval(t);
      window.removeEventListener(UNREAD_REFRESH_EVENT, fetchOnce);
    };
  }, [user, intervalMs]);

  return count;
}

/** 主动刷新一次（用于：进入聊天页 mark-read 后、发送消息后等） */
export function useUnreadBump() {
  const [tick, setTick] = useState(0);
  const bump = () => setTick(t => t + 1);
  return { tick, bump };
}
