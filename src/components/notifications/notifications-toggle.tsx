"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";

export function NotificationsToggle() {
  const { user } = useEazo();
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem("mindpace_notifications") === "true";
    setSubscribed(saved);
  }, [user]);

  if (!user) return null;

  return (
    <button
      onClick={() => {
        const next = !subscribed;
        localStorage.setItem("mindpace_notifications", String(next));
        setSubscribed(next);
      }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm"
      style={{ background: "#EBE7DF", color: "#5A4E44" }}

    >
      {subscribed ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
      {subscribed ? "通知已开启" : "开启通知"}
    </button>
  );
}

