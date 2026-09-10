"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { request } from "@/lib/api/request";

type Conv = {
  conv: { id: string; lastMessageAt: string };
  otherUser: { id: string; name: string | null; email: string | null } | null;
  unreadCount?: number;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d} 天前`;
  return new Date(dateStr).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const COLORS = ["#9CB48A","#C4A882","#89B4C8","#B8A86E","#A89BC8","#C8A889"];
  const idx = name.charCodeAt(0) % COLORS.length;
  return (
    <div className="rounded-full flex items-center justify-center font-bold text-white flex-none"
      style={{ width: size, height: size, background: COLORS[idx], fontSize: size * 0.38 }}>
      {name.slice(0,1)}
    </div>
  );
}

export default function CounselorMessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // 首次加载 + 每15秒轮询，保证新会话/新未读能自动出现
    const fetchConvs = () => {
      request("/api/messages").then(r => r.json()).then(d => {
        setConvs(Array.isArray(d) ? d : []);
      }).catch(() => {}).finally(() => setLoading(false));
    };
    fetchConvs();
    const t = setInterval(fetchConvs, 15000);
    return () => clearInterval(t);
  }, [user]);

  if (!user) return (
    <div className="min-h-svh flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
      <div className="text-center px-6">
        <MessageCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "#C4BDB5" }} />
        <p className="text-sm" style={{ color: "#9B8E82" }}>登录后查看消息</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-svh pb-24" style={{ background: "var(--color-bg)" }}>
      <div className="sticky top-0 z-10 px-5 pt-12 pb-4"
        style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
        <h1 className="text-xl font-bold" style={{ color: "#2C2420" }}>消息</h1>
        <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>来访者发来的消息</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 px-5 pt-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "#EBE7DF" }} />
          ))}
        </div>
      ) : convs.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-32 px-8 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: "#F5F0EA" }}>
            <MessageCircle className="w-9 h-9" style={{ color: "#C4BDB5" }} />
          </div>
          <p className="text-base font-semibold mb-1" style={{ color: "#2C2420" }}>暂无消息</p>
          <p className="text-sm" style={{ color: "#9B8E82" }}>来访者预约后可在此与对方沟通</p>
        </div>
      ) : (
        <div className="px-4 pt-3">
          {convs.map(({ conv, otherUser, unreadCount }, i) => {
            if (!otherUser) return null;
            const name = otherUser.name ?? otherUser.email ?? "来访者";
            const unread = Number(unreadCount ?? 0);
            return (
              <motion.button key={conv.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => router.push(`/chat/${conv.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-2 text-left"
                style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                <Avatar name={name} size={46} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-semibold truncate" style={{ color: "#2C2420" }}>{name}</p>
                    <p className="text-xs flex-none ml-2" style={{ color: "#C4BDB5" }}>{timeAgo(conv.lastMessageAt)}</p>
                  </div>
                  <p className="text-xs truncate" style={{ color: unread > 0 ? "#DC2626" : "#9B8E82", fontWeight: unread > 0 ? 600 : 400 }}>
                    {unread > 0 ? `有 ${unread} 条未读消息，点击查看` : "点击查看对话"}
                  </p>
                </div>
                {unread > 0 ? (
                  <span className="flex-none min-w-[20px] h-[20px] px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                    {unread > 99 ? "99+" : unread}
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 flex-none" style={{ color: "#C4BDB5" }} />
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
