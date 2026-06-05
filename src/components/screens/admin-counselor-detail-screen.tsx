"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, User, BookOpen, Briefcase, GraduationCap, Award, Clock, MessageSquare, ChevronDown } from "lucide-react";
import { request } from "@/lib/api/request";

type ListItem = { id: string; value: string };
type Counselor = {
  id: string; displayName: string; title: string; bio: string; tagline: string;
  counselorTypes: string[]; specialties: string[]; approaches: string[]; workingGroups: string[];
  sessionModes: string[]; sessionDuration: number; pricePerSession: number;
  location: string; isAccepting: boolean; isSupervisor: boolean;
  qualifications: ListItem[]; education: ListItem[]; trainings: ListItem[]; workExperiences: ListItem[];
  sessionDescription: string; sessionSettings: string;
  reviewStatus: string; email: string; userName: string; avatarUrl: string;
};

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "white", border: "1px solid #EBE7DF" }}>
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b" style={{ borderColor: "#F0EBE4", background: "#FAFAF8" }}>
        <Icon className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
        <h3 className="text-sm font-bold" style={{ color: "#2C2420" }}>{title}</h3>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

function Tags({ items }: { items: string[] }) {
  if (!items?.length) return <p className="text-sm" style={{ color: "#9B8E82" }}>未填写</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(t => (
        <span key={t} className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ background: "#E8DFCC", color: "#5A7A3A", border: "1px solid #D4C8B0" }}>{t}</span>
      ))}
    </div>
  );
}

function ListItems({ items }: { items: ListItem[] | string[] }) {
  if (!items?.length) return <p className="text-sm" style={{ color: "#9B8E82" }}>未填写</p>;
  const arr = typeof items[0] === "string" ? (items as string[]).map((v, i) => ({ id: String(i), value: v })) : items as ListItem[];
  return (
    <ul className="space-y-2">
      {arr.map((item, i) => (
        <li key={item.id ?? i} className="flex items-start gap-2.5 text-sm" style={{ color: "#2C2420" }}>
          <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-none text-white"
            style={{ background: "var(--color-primary)", minWidth: 20 }}>{i + 1}</span>
          <span>{item.value}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AdminCounselorDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const [c, setC] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    const res = await request(`/api/admin/counselors/${id}`);
    if (res.ok) { const d = await res.json(); setC(d.counselor); }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function act(action: "approve" | "reject") {
    setActing(true);
    await request(`/api/admin/counselors/${id}`, { method: "PATCH", body: JSON.stringify({ action, reason: rejectReason }) });
    await load();
    setActing(false);
    setShowReject(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--color-primary)" }} />
    </div>
  );
  if (!c) return <div className="flex items-center justify-center h-screen text-sm" style={{ color: "#9B8E82" }}>未找到咨询师信息</div>;

  const STATUS: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "待审核", color: "#B45309", bg: "#FEF3C7" },
    approved: { label: "已通过", color: "#166534", bg: "#DCFCE7" },
    rejected: { label: "已拒绝", color: "#991B1B", bg: "#FEE2E2" },
    draft: { label: "草稿", color: "#6B7280", bg: "#F3F4F6" },
  };
  const st = STATUS[c.reviewStatus] ?? STATUS.draft;

  return (
    <div className="min-h-screen pb-48" style={{ background: "var(--color-bg)" }}>
      {/* 顶部导航 */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3 border-b"
        style={{ background: "rgba(245,240,232,0.97)", backdropFilter: "blur(8px)", borderColor: "#DDD8D0" }}>
        <button onClick={() => router.back()} className="p-1.5 rounded-full" style={{ background: "#EBE7DF" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "#5A4E44" }} />
        </button>
        <h1 className="flex-1 text-base font-bold" style={{ color: "#2C2420" }}>咨询师审核</h1>
        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span>
      </div>

      <div className="px-4 pt-5">
        {/* 基本信息卡 */}
        <div className="rounded-2xl p-4 mb-4 flex items-center gap-4" style={{ background: "white", border: "1px solid #EBE7DF" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-none overflow-hidden"
            style={{ background: "var(--color-primary)" }}>
            {c.avatarUrl ? <img src={c.avatarUrl} alt="" className="w-full h-full object-cover" /> : c.displayName?.[0] ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold" style={{ color: "#2C2420" }}>{c.displayName}</h2>
            <p className="text-sm" style={{ color: "#9B8E82" }}>{c.title}</p>
            <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{c.email}</p>
          </div>
        </div>

        {/* 基础资料 */}
        <Section icon={User} title="基础资料">
          <div className="space-y-3 text-sm">
            {[
              ["咨询师类别", (c.counselorTypes ?? []).join("、")],
              ["所在地区", c.location || "未填写"],
              ["每次时长", `${c.sessionDuration} 分钟`],
              ["收费金额", c.pricePerSession ? `¥${c.pricePerSession} / 次` : "未填写"],
              ["接受来访", c.isAccepting ? "是" : "否"],
              ["督导身份", c.isSupervisor ? "是" : "否"],
            ].map(([label, val]) => (
              <div key={label} className="flex items-start gap-2">
                <span className="flex-none text-xs pt-0.5 w-20" style={{ color: "#9B8E82" }}>{label}</span>
                <span className="flex-1" style={{ color: "#2C2420" }}>{val}</span>
              </div>
            ))}
            <div className="flex items-start gap-2">
              <span className="flex-none text-xs pt-0.5 w-20" style={{ color: "#9B8E82" }}>咨询方式</span>
              <div className="flex flex-wrap gap-1.5">
                {(c.sessionModes ?? []).map(m => (
                  <span key={m} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#E8DFCC", color: "#5A7A3A" }}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* 个人简介 */}
        <Section icon={MessageSquare} title="个人简介">
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#2C2420" }}>{c.bio || "未填写"}</p>
        </Section>

        {/* 一句话标语 */}
        {c.tagline && (
          <Section icon={MessageSquare} title="一句话标语">
            <p className="text-sm italic" style={{ color: "#5A4E44" }}>「{c.tagline}」</p>
          </Section>
        )}

        {/* 擅长领域 / 工作人群 / 咨询取向 */}
        <Section icon={BookOpen} title="擅长领域">
          <Tags items={c.specialties ?? []} />
        </Section>
        <Section icon={User} title="工作人群">
          <Tags items={c.workingGroups ?? []} />
        </Section>
        <Section icon={BookOpen} title="咨询取向">
          <Tags items={c.approaches ?? []} />
        </Section>

        {/* 从业背景 */}
        <Section icon={Award} title="执业资质">
          <ListItems items={c.qualifications ?? []} />
        </Section>
        <Section icon={GraduationCap} title="教育背景">
          <ListItems items={c.education ?? []} />
        </Section>
        <Section icon={BookOpen} title="受训经历">
          <ListItems items={c.trainings ?? []} />
        </Section>
        <Section icon={Briefcase} title="工作经历">
          <ListItems items={c.workExperiences ?? []} />
        </Section>

        {/* 咨询设置 */}
        {c.sessionSettings && (
          <Section icon={Clock} title="咨询设置说明">
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#2C2420" }}>{c.sessionSettings}</p>
          </Section>
        )}

        {/* 咨询过程与方式 */}
        {c.sessionDescription && (
          <Section icon={MessageSquare} title="咨询过程与方式">
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#2C2420" }}>{c.sessionDescription}</p>
          </Section>
        )}
      </div>

      {/* 底部操作栏（只在待审核时显示） */}
      {c.reviewStatus === "pending" && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 border-t"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 72px)", background: "rgba(245,240,232,0.97)", backdropFilter: "blur(8px)", borderColor: "#DDD8D0" }}
          style={{ background: "rgba(245,240,232,0.97)", backdropFilter: "blur(8px)", borderColor: "#DDD8D0" }}>
          {showReject && (
            <div className="mb-3">
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="请填写驳回原因（将发送给咨询师）"
                rows={3}
                className="w-full rounded-xl px-3 py-2.5 text-sm resize-none outline-none border"
                style={{ background: "#FAF8F3", borderColor: "#DDD8D0", color: "#2C2420" }}
              />
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => showReject ? act("reject") : setShowReject(true)}
              disabled={acting || (showReject && !rejectReason.trim())}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: "#FEE2E2", color: "#991B1B" }}>
              <XCircle className="w-4 h-4" />
              {showReject ? "确认驳回" : "驳回"}
            </button>
            {showReject && (
              <button onClick={() => setShowReject(false)} className="px-4 py-3 rounded-2xl text-sm" style={{ background: "#EBE7DF", color: "#5A4E44" }}>取消</button>
            )}
            <button onClick={() => act("approve")} disabled={acting}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 text-white"
              style={{ background: "var(--color-primary)" }}>
              <CheckCircle className="w-4 h-4" />
              通过审核
            </button>
          </div>
        </div>
      )}

      {/* 已审核状态提示 */}
      {c.reviewStatus !== "pending" && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 border-t"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 72px)", background: "rgba(245,240,232,0.97)", backdropFilter: "blur(8px)", borderColor: "#DDD8D0" }}
          style={{ background: "rgba(245,240,232,0.97)", backdropFilter: "blur(8px)", borderColor: "#DDD8D0" }}>
          <div className="text-center text-sm py-2 rounded-2xl font-medium"
            style={{ background: st.bg, color: st.color }}>
            该申请已{st.label}
          </div>
        </div>
      )}
    </div>
  );
}
