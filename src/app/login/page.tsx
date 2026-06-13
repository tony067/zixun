"use client";
/**
 * /login — 邮箱+密码登录页
 * 风格对齐现有页面：暖纸质底色 (#F5F1E8)、绿色主色 (#9CB48A)、圆角卡片
 * 调 /api/auth/login，成功后把 token 写入 localStorage 并跳转首页
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { persistToken } from "@/contexts/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab]           = useState<"login" | "register">("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  // 已登录直接跳走
  useEffect(() => {
    const token = localStorage.getItem("mindpace_token");
    if (token) router.replace("/");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
    const body: Record<string, string> = { email, password };
    if (tab === "register" && name.trim()) body.name = name.trim();

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "操作失败，请重试");
        return;
      }
      persistToken(data.token);
      // 触发 AuthProvider 从 /api/auth/me 恢复会话，然后跳首页
      router.replace("/");
    } catch {
      setError("网络错误，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-svh flex flex-col items-center justify-center px-5"
      style={{ background: "var(--color-mp-surface)" }}
    >
      {/* Logo 区 */}
      <div className="mb-8 text-center">
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "#9CB48A" }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="12" r="5" fill="white" />
            <path d="M6 26c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "#2C2420" }}>MindPace</h1>
        <p className="text-sm mt-1" style={{ color: "#7D736A" }}>神经多样性友好咨询预约平台</p>
      </div>

      {/* 卡片 */}
      <div
        className="w-full max-w-sm rounded-3xl p-6 shadow-sm"
        style={{ background: "#FDFBF7", border: "1px solid #EBE7DF" }}
      >
        {/* Tab 切换 */}
        <div
          className="flex rounded-2xl p-1 mb-6"
          style={{ background: "#F0EDE8" }}
        >
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: tab === t ? "white" : "transparent",
                color: tab === t ? "#2C2420" : "#7D736A",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {t === "login" ? "登录" : "注册"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {tab === "register" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "#7D736A" }}>昵称（选填）</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="你的名字"
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                style={{ background: "#F5F1E8", border: "1.5px solid #EBE7DF", color: "#2C2420" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#9CB48A")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = "#EBE7DF")}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "#7D736A" }}>邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
              style={{ background: "#F5F1E8", border: "1.5px solid #EBE7DF", color: "#2C2420" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#9CB48A")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#EBE7DF")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "#7D736A" }}>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tab === "register" ? "至少 6 位" : "输入密码"}
              required
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
              style={{ background: "#F5F1E8", border: "1.5px solid #EBE7DF", color: "#2C2420" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#9CB48A")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#EBE7DF")}
            />
          </div>

          {error && (
            <p className="text-xs text-center" style={{ color: "#DC2626" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-white text-sm font-semibold mt-1 transition-opacity"
            style={{ background: loading ? "#C0B8B0" : "#9CB48A" }}
          >
            {loading ? "请稍候…" : tab === "login" ? "登录" : "注册并登录"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-center" style={{ color: "#C2BDB7" }}>
        MindPace · 心理咨询预约平台
      </p>
    </div>
  );
}
