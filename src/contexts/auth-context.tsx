"use client";
/**
 * 自建 AuthContext — 替换 @eazo/sdk/react 的 EazoProvider + useEazo
 *
 * - token 存在 localStorage key: "mindpace_token"
 * - 页面刷新时自动从 /api/auth/me 恢复会话
 * - 提供 useAuth() hook，接口与原 useEazo((s) => s.auth) 对齐
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  token: null,
  login: () => {},
  logout: () => {},
});

const TOKEN_KEY = "mindpace_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const initialized = useRef(false);

  /** 从 localStorage 读 token，调 /api/auth/me 恢复会话 */
  const restore = useCallback(async () => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (!saved) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${saved}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(saved);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    restore();
  }, [restore]);

  const login = useCallback((nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth() — 直接返回 { user, loading, token, logout }
 *
 * 原来 useEazo((s) => s.auth.user) 换成 useAuth().user
 * 原来 useEazo((s) => s.auth.loading) 换成 useAuth().loading
 */
export function useAuth(): AuthState {
  return useContext(AuthContext);
}

/** 供 request.ts 同步读取 token（不触发 React 渲染） */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** 登录成功后把 token 写入 localStorage（由登录页调用） */
export function persistToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}
