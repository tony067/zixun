"use client";

import { useEffect } from "react";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";

/**
 * 独立版本：登录后同步用户 profile 到数据库
 */
export function UserSyncEffect() {
  const user = useEazo((s) => s.auth.user);

  useEffect(() => {
    if (!user) return;
    request("/api/user/profile").catch(() => {});
  }, [user?.id]);

  return null;
}


