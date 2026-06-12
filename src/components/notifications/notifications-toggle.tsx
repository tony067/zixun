"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { useStandaloneAuth } from "@/components/providers/standalone-auth-provider";

/** 独立版本：通知开关（不依赖 Eazo 平台推送）*/
export function NotificationsToggle() {
  const { user } = useStandaloneAuth();
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem("mindpace_notifications") === "true";
    setSubscribed(saved);
  }, [user]);

  const toggle = () => {
    const next = !subscribed;
    localStorage.setItem("mindpace_notifications", String(next));
    setSubscribed(next);
  };

  if (!user) return null;

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm"
      style={{ background: "#EBE7DF", color: "#5A4E44" }}
    >
      {subscribed ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
      {subscribed ? "通知已开启" : "开启通知"}
    </button>
  );
}

/** 独立版本：通知开关（不依赖 Eazo 平台推送）*/
export function NotificationsToggle() {
  const { user } = useStandaloneAuth();
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem("mindpace_notifications") === "true";
    setSubscribed(saved);
  }, [user]);

  const toggle = () => {
    const next = !subscribed;
    localStorage.setItem("mindpace_notifications", String(next));
    setSubscribed(next);
  };

  if (!user) return null;

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm"
      style={{ background: "#EBE7DF", color: "#5A4E44" }}
    >
      {subscribed ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
      {subscribed ? "通知已开启" : "开启通知"}
    </button>
  );
}


order-white/70 bg-white/72 text-slate-950/60 shadow-[0_2px_8px_rgba(15,23,42,0.06)] hover:bg-white/86"
          } disabled:opacity-50`}
        >
          {toggling ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : subscribed ? (
            "On"
          ) : (
            "Off"
          )}
        </button>
      </div>
      <button
        onClick={handleSendTest}
        disabled={sending}
        className="self-end h-7 rounded-[8px] border border-white/70 bg-white/72 px-3 text-[11px] font-semibold text-slate-950/55 shadow-[0_2px_6px_rgba(15,23,42,0.05)] transition-colors hover:bg-white/86 hover:text-[#EE5C2A] disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send test notification"}
      </button>
    </div>
  );
}
