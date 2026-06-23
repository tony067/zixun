"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight } from "lucide-react";
import { request } from "@/lib/api/request";

interface UserRow {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  bookingCount: number;
  counselorId: string | null;
  createdAt: string;
}

const ROLE_LABEL: Record<string, string> = {
  visitor: "来访者",
  counselor: "咨询师",
  admin: "管理员",
};

export default function AdminUsersScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"visitor" | "counselor">("visitor");
  const [search, setSearch] = useState("");
  const [allUsers, setAllUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    request("/api/admin/users")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAllUsers(d); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = allUsers
    .filter(u => u.role === tab)
    .filter(u => !search || u.name.includes(search) || u.email.includes(search));

  return (
    <div className="min-h-screen pb-24" style={{ background: "#FAF7F2" }}>
      {/* 顶栏 */}
      <div className="sticky top-0 z-10 px-4 pt-12 pb-3"
        style={{ background: "rgba(250,247,242,0.96)", backdropFilter: "blur(8px)", borderBottom: "1px solid #EBE7DF" }}>
        <h1 className="text-lg font-bold mb-3" style={{ color: "#2C2420" }}>用户管理</h1>
        {/* Tab */}
        <div className="flex gap-2 mb-3">
          {([["visitor","来访者"],["counselor","咨询师"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className="px-5 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: tab === k ? "#9CB48A" : "#EBE7DF",
                color: tab === k ? "white" : "#5A4E44",
              }}>
              {label}
              <span className="ml-1.5 text-xs opacity-70">
                {allUsers.filter(u => u.role === k).length}
              </span>
            </button>
          ))}
        </div>
        {/* 搜索 */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
          style={{ background: "white", border: "1px solid #EBE7DF" }}>
          <Search className="w-4 h-4 flex-none" style={{ color: "#9B8E82" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索姓名或邮箱…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "#2C2420" }} />
        </div>
      </div>

      <div className="px-4 pt-3 space-y-2">
        {loading ? (
          <div className="text-center py-12 text-sm" style={{ color: "#9B8E82" }}>加载中…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: "#9B8E82" }}>
            {search ? "没有找到匹配用户" : `暂无${ROLE_LABEL[tab]}数据`}
          </div>
        ) : filtered.map(u => (
          <button key={u.id}
            onClick={() => router.push(`/admin/users/${u.id}`)}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left"
            style={{ background: "#FDFBF7", border: "1px solid #EBE7DF" }}>
            <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold"
              style={{ background: "#EBE7DF", color: "#6B5E52" }}>
              {u.name?.[0] ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "#2C2420" }}>{u.name}</p>
              <p className="text-xs truncate mt-0.5" style={{ color: "#9B8E82" }}>{u.email}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-medium" style={{ color: "#9CB48A" }}>
                {tab === "counselor" ? `接单 ${u.bookingCount}` : `预约 ${u.bookingCount}`}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "#C4BDB5" }}>
                {u.createdAt ? new Date(u.createdAt).toLocaleDateString("zh-CN") : ""}
              </p>
            </div>
            <ChevronRight size={16} style={{ color: "#C4BDB5" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

              {label}
            </button>
          ))}
        </div>
        {/* 搜索 */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: "white", border: "1px solid #EBE7DF" }}>
          <Search className="w-4 h-4 flex-none" style={{ color: "#9B8E82" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索姓名或邮箱…" className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: "#2C2420" }} />
        </div>
      </div>

      {/* 用户列表 */}
      <div className="px-4 pt-3 space-y-2">
        {filtered.map(u => (
          <button key={u.id} onClick={() => router.push("/admin/users/"+u.id)}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left"
            style={{ background: "white", border: "1px solid #EBE7DF" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-none"
              style={{ background: u.status === "banned" ? "#D1D5DB" : "var(--color-primary)" }}>
              {u.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold" style={{ color: "#2C2420" }}>{u.name}</p>
                {u.status === "banned" && (
                  <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "#FEE2E2", color: "#DC2626" }}>已封禁</span>
                )}
              </div>
              <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{u.email}</p>
              <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>
                {u.role === "client" ? `预约 ${u.bookings} 次` : `完成 ${u.bookings} 次咨询`} · 加入 {u.joined}
              </p>
            </div>
            <span style={{ color: "#C4BDB5", fontSize: 18 }}>›</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-12 text-sm" style={{ color: "#9B8E82" }}>没有符合条件的用户</p>
        )}
      </div>

      {/* 用户详情弹窗 → 改为底部完整面板 */}
      {mounted && selected && createPortal(
        <div style={{ position:"fixed", inset:0, zIndex:99999, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}
          onClick={() => setSelected(null)}>
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)" }} />
          <div className="relative rounded-t-3xl px-5 pt-5 pb-10"
            style={{ background: "var(--color-bg)", zIndex: 1, maxHeight: "80vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            {/* 头部 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white"
                  style={{ background: selected.status === "banned" ? "#D1D5DB" : "var(--color-primary)" }}>
                  {selected.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold" style={{ color: "#2C2420" }}>{selected.name}</p>
                    {selected.status === "banned" && (
                      <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "#FEE2E2", color: "#DC2626" }}>已封禁</span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>
                    {selected.role === "client" ? "来访者" : "咨询师"}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                style={{ background: "#EBE7DF", color: "#5A4E44" }}>×</button>
            </div>

            {/* 信息列表 */}
            <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "white", border: "1px solid #EBE7DF" }}>
              {[
                ["邮箱", selected.email],
                ["手机", selected.phone],
                ["角色", selected.role === "client" ? "来访者" : "咨询师"],
                ["注册时间", selected.joined],
                [selected.role === "client" ? "预约次数" : "完成咨询", String(selected.bookings) + (selected.role === "client" ? " 次" : " 次")],
                ["账号状态", selected.status === "active" ? "正常" : "已封禁"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center px-4 py-3 border-b last:border-0"
                  style={{ borderColor: "#F5F0EA" }}>
                  <span className="text-sm" style={{ color: "#9B8E82" }}>{k}</span>
                  <span className="text-sm font-medium" style={{ color: k === "账号状态" && v === "已封禁" ? "#DC2626" : "#2C2420" }}>{v}</span>
                </div>
              ))}
            </div>

            {/* 操作按钮 */}
            <div className="space-y-2">
              {selected.role === "counselor" && (
                <button onClick={() => { setSelected(null); router.push("/admin/counselors"); }}
                  className="w-full py-3 rounded-2xl text-sm font-bold"
                  style={{ background: "#E4F0DC", color: "var(--color-primary)" }}>
                  查看咨询师档案
                </button>
              )}
              <button onClick={() => toggleBan(selected)}
                className="w-full py-3 rounded-2xl text-sm font-bold"
                style={{ background: selected.status === "active" ? "#FEE2E2" : "#DCFCE7",
                  color: selected.status === "active" ? "#DC2626" : "#16A34A" }}>
                {selected.status === "active" ? "封禁该用户" : "解除封禁"}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
