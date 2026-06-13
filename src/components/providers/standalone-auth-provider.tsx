"use client";
// This file is kept for backwards compatibility but no longer used.
// All auth is handled via @eazo/sdk
export {};

export interface StandaloneUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: StandaloneUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  getSessionHeader: () => Record<string, string>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  getSessionHeader: () => ({}),
});

export function StandaloneAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StandaloneUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("mindpace_token");
    if (stored) {
      setToken(stored);
      // 解析 JWT payload
      try {
        const payload = JSON.parse(atob(stored.split(".")[1]));
        setUser({
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          avatarUrl: payload.avatarUrl,
        });
      } catch {
        localStorage.removeItem("mindpace_token");
      }
    }
    setLoading(false);
  }, []);

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
