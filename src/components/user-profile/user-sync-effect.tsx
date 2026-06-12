"use client";

import { useEffect } from "react";
import { useStandaloneAuth } from "@/components/providers/standalone-auth-provider";
import { request } from "@/lib/api/request";

/**
 * 独立版本：登录后同步用户 profile 到数据库
 */
export function UserSyncEffect() {
  const { user } = useStandaloneAuth();

  useEffect(() => {
    if (!user) return;
    request("/api/user/profile").catch(() => {});
  }, [user?.id]);

  return null;
}


