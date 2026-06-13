"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { request } from "@/lib/api/request";

/**
 * 登录后同步用户 profile 到数据库
 */
export function UserSyncEffect() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    request("/api/user/profile").catch(() => {});
  }, [user?.id]);

  return null;
}


