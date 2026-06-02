"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";

const MOCK_USERS = [
  { id: "u001", name: "张婧", email: "zhang@example.com", role: "client", bookings: 3, joined: "2026-03-12", status: "active" },
  { id: "u002", name: "王明浩", email: "wang@example.com", role: "client", bookings: 1, joined: "2026-04-05", status: "active" },
  { id: "u003", name: "李晓月", email: "li@example.com", role: "client", bookings: 7, joined: "2026-01-20", status: "active" },
  { id: "u004", name: "陈晓雯", email: "chen@example.com", role: "counselor", bookings: 42, joined: "2026-02-01", status: "active" },
  { id: "u005", name: "林诗涵", email: "lin@example.com", role: "counselor", bookings: 31, joined: "2026-02-15", status: "active" },
  { id: "u006", name: "刘海涛", email: "liu@example.com", role: "client", bookings: 0, joined: "2026-05-28", status: "banned" },
];

export default function AdminUsersScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"client"|"counselor">("client");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof MOCK_USERS[0] | null>(null);

  const filtered = MOCK_USERS
    .filter(u => u.role === tab)
    .filter(u => !search || u.name.includes(search) || u.email.includes(search));

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => router.push("/admin")} className="p-1.5 rounded-full" style={{ background: "#EBE7DF" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "#5A4E44" }} />
        </button>
        <h1 className="text-base font-bold" style={{ color: "#2C2420" }}>用户管理</h1>
      </div>

      {/* Tab */}
      <div className="flex px-4 gap-2 mb-3">
        {(["client","counselor"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-5 py-1.5 rounded-full text-sm font-medium"
            style={{ background: tab === t ? "var(--color-primary)" : "#EBE7DF",
              color: tab === t ? "white" : "#5A4E44" }}>
            {t === "client" ? "来访者" : "咨询师"}
          </button>
        ))}
      </div>

      {/* 搜索 */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "white", border: "1px solid #EBE7DF" }}>
          <Search className="w-4 h-4 flex-none" style={{ color: "#C4BDB5" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索姓名或邮箱…" className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: "#2C2420" }} />
        </div>
      </div>

      {/* 列表 */}
      <div className="px-4 space-y-3 pb-10">
        {filtered.length === 0 && <p className="text-center text-sm py-10" style={{ color: "#9B8E82" }}>暂无用户</p>}
        {filtered.map(u => (
          <div key={u.id} onClick={() => setSelected(u)}
            className="rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
            style={{ background: "white", border: "1px solid #EBE7DF" }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold text-white flex-none"
              style={{ background: u.status === "banned" ? "#C4BDB5" : "var(--color-primary)" }}>
              {u.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold" style={{ color: "#2C2420" }}>{u.name}</p>
                {u.status === "banned" && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>已封禁</span>
                )}
              </div>
              <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{u.email}</p>
              <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>
                {tab === "client" ? `预约 ${u.bookings} 次` : `已完成 ${u.bookings} 节`} · 加入 {u.joined}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 用户详情弹窗 */}
      {selected && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSelected(null)}>
          <div className="rounded-t-3xl px-5 pt-6 pb-10" style={{ background: "var(--color-bg)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: "#2C2420" }}>{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#EBE7DF", color: "#5A4E44", fontSize: 18 }}>×</button>
            </div>
            <div className="space-y-2 mb-6">
              {[
                ["邮箱", selected.email],
                ["角色", selected.role === "client" ? "来访者" : "咨询师"],
                ["注册时间", selected.joined],
                [selected.role === "client" ? "预约次数" : "完成节数", String(selected.bookings)],
                ["账号状态", selected.status === "active" ? "正常" : "已封禁"],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between py-2 border-b" style={{ borderColor: "#F5F0EA" }}>
                  <span className="text-sm" style={{ color: "#9B8E82" }}>{k}</span>
                  <span className="text-sm font-medium" style={{ color: "#2C2420" }}>{v}</span>
                </div>
              ))}
            </div>
            <button
              className="w-full py-3 rounded-2xl text-sm font-bold"
              style={{ background: selected.status === "active" ? "#FEE2E2" : "#DCFCE7",
                color: selected.status === "active" ? "#DC2626" : "#16A34A" }}
              onClick={() => setSelected(s => s ? {...s, status: s.status === "active" ? "banned" : "active"} : null)}>
              {selected.status === "active" ? "封禁该用户" : "解除封禁"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
