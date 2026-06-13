"use client";
// This file is no longer used. All auth is handled via @eazo/sdk
export {};

const AuthContext = createContext<AuthState>({

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "登录失败");
    }
    const data = await res.json();
    localStorage.setItem("mindpace_token", data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "注册失败");
    }
    const data = await res.json();
    localStorage.setItem("mindpace_token", data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("mindpace_token");
    setToken(null);
    setUser(null);
  }, []);

  const getSessionHeader = useCallback((): Record<string, string> => {
    const t = localStorage.getItem("mindpace_token");
    return t ? { "x-session-token": t } : {};
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, getSessionHeader }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useStandaloneAuth() {
  return useContext(AuthContext);
}
