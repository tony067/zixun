"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, ArrowLeft, X } from "lucide-react";
import { request } from "@/lib/api/request";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  status?: string;
  bookingCount: number;
  counselorId: string | null;
  createdAt: string;
}

interface BookingRow {
  id: string;
  scheduledAt: string;
  status: string;
  priceAmount: number;
  counterpartName: string;
}

interface UserDetail extends UserRow {
  bookings: BookingRow[];
}

const STATUS_LABEL: Record<string, string> = {
  pending_confirmation: "待确认",
  confirmed: "已确认",
  completed: "已完成",
  cancelled: "已取消",
  pending_payment: "待支付",
};

function fmtDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
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
  const [selected, setSelected] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setLoading(true);
    request("/api/admin/users")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAllUsers(d); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = allUsers
    .filter(u => u.role === tab)
    .filter(u => !search || (u.name ?? "").includes(search) || u.email.includes(search));

  async function openDetail(u: UserRow) {
    setDetailLoading(true);
    setSelected({ ...u, bookings: [] });
    try {
      const r = await request(`/api/admin/users/${u.id}`);
      const d = await r.json();
      if (d && !d.error) setSelected(d as UserDetail);
    } finally {
      setDetailLoading(false);
    }
  }

  async function toggleBan() {
    if (!selected) return;
    const newStatus = selected.status === "banned" ? "active" : "banned";
    await request(`/api/admin/users/${selected.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });
    setSelected(prev => prev ? { ...prev, status: newStatus } : prev);
    setAllUsers(prev => prev.map(u => u.id === selected.id ? { ...u, status: newStatus } : u));
  }

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
            onClick={() => openDetail(u)}
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

      {/* 详情弹窗 */}
      {mounted && selected && createPortal(
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setSelected(null)}>
          <div className="w-full rounded-t-3xl px-5 pt-5 pb-10 overflow-y-auto"
            style={{ background: "var(--color-bg)", maxHeight: "82vh" }}
            onClick={e => e.stopPropagation()}>

            {/* 头部 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white"
                  style={{ background: selected.status === "banned" ? "#D1D5DB" : "var(--color-primary)" }}>
                  {((selected.name ?? selected.email ?? "?")[0]).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold" style={{ color: "#2C2420" }}>{selected.name ?? "未设置昵称"}</p>
                    {selected.status === "banned" && (
                      <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "#FEE2E2", color: "#DC2626" }}>已封禁</span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{ROLE_LABEL[selected.role] ?? selected.role}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                style={{ background: "#EBE7DF", color: "#5A4E44" }}>×</button>
            </div>

            {/* 基本信息 */}
            <div className="rounded-2xl p-4 mb-4 space-y-2.5" style={{ background: "white", border: "1px solid #EBE7DF" }}>
              {[
                ["邮箱", selected.email],
                ["角色", ROLE_LABEL[selected.role] ?? selected.role],
                ["注册时间", selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("zh-CN") : "-"],
                ["订单总数", `${selected.bookingCount} 单`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span style={{ color: "#9B8E82" }}>{k}</span>
                  <span className="font-medium" style={{ color: "#2C2420" }}>{v}</span>
                </div>
              ))}
              {selected.role === "counselor" && selected.counselorId && (
                <button onClick={() => { setSelected(null); router.push(`/admin/billing?counselorId=${selected.counselorId}`); }}
                  className="w-full mt-1 py-2 rounded-xl text-sm font-medium text-left px-3"
                  style={{ background: "#F0F7EC", color: "#3A6228" }}>
                  查看该咨询师账单 →
                </button>
              )}
            </div>

            {/* 订单列表 */}
            <p className="text-sm font-bold mb-2" style={{ color: "#2C2420" }}>历史订单</p>
            {detailLoading ? (
              <p className="text-center py-6 text-sm" style={{ color: "#9B8E82" }}>加载中…</p>
            ) : !selected.bookings || selected.bookings.length === 0 ? (
              <p className="text-center py-6 text-sm" style={{ color: "#9B8E82" }}>暂无订单</p>
            ) : (
              <div className="space-y-2 mb-4">
                {selected.bookings.map(b => (
                  <div key={b.id} className="rounded-2xl px-4 py-3" style={{ background: "white", border: "1px solid #EBE7DF" }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "#2C2420" }}>
                          {b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString("zh-CN") : "-"}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{b.counterpartName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: "#9CB48A" }}>¥{b.priceAmount}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block"
                          style={{ background: b.status === "completed" ? "#DCFCE7" : "#F3F4F6",
                            color: b.status === "completed" ? "#16A34A" : "#6B7280" }}>
                          {STATUS_LABEL[b.status] ?? b.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 封禁按钮 */}
            <div className="mt-2">
              <button onClick={toggleBan}
                className="w-full py-3 rounded-2xl text-sm font-bold"
                style={{ background: selected.status === "banned" ? "#DCFCE7" : "#FEE2E2",
                  color: selected.status === "banned" ? "#16A34A" : "#DC2626" }}>
                {selected.status === "banned" ? "解除封禁" : "封禁该用户"}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
