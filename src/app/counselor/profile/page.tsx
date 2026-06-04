"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookmarkCheck, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";
import { EMPTY_PROFILE, ProfileForm } from "@/lib/counselor-profile-data";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { SectionAccordion, SectionContent, BasicSection } from "@/components/profile/profile-sections";
import type { SectionKey } from "@/lib/counselor-profile-data";

const STATUS_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  draft:     { text: "草稿",   color: "#9B8E82", bg: "#F0EDE8" },
  submitted: { text: "审核中", color: "#D97706", bg: "#FEF3C7" },
  approved:  { text: "已通过", color: "#16A34A", bg: "#DCFCE7" },
  rejected:  { text: "已退回", color: "#DC2626", bg: "#FEE2E2" },
};

export default function CounselorProfilePage() {
  const router = useRouter();
  const user = useEazo((s) => s.auth.user);
  const [form, setForm] = useState<ProfileForm>({ ...EMPTY_PROFILE });
  const [openSection, setOpenSection] = useState<SectionKey | null>("basic");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!user) return;
    request("/api/counselor/profile").then(r => r.json()).then(data => {
      if (data && !data.error) setForm({ ...EMPTY_PROFILE, ...data });
    });
  }, [user]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const save = async (submit = false) => {
    if (submit) setSubmitting(true); else setSaving(true);
    try {
      const res = await request("/api/counselor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, action: submit ? "submit" : "save", reviewStatus: submit ? "submitted" : "draft" }),
      });
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({ ...prev, reviewStatus: data.reviewStatus ?? prev.reviewStatus }));
        showToast(submit ? "已提交审核！" : "草稿已保存");
      }
    } finally { setSaving(false); setSubmitting(false); }
  };

  const toggleSection = (k: SectionKey) =>
    setOpenSection(prev => prev === k ? null : k);

  const status = STATUS_LABEL[form.reviewStatus] ?? STATUS_LABEL.draft;
  const canSubmit = !!(form.displayName && form.counselorTypes.length > 0);
  const missingPrice = canSubmit && !form.pricePerSession;

  return (
    <div className="min-h-svh pb-36" style={{ background: "#F5F0E8" }}>
      {toast && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-sm font-medium text-white shadow-lg"
          style={{ background: "#9CB48A", zIndex: 60 }}>
          {toast}
        </motion.div>
      )}
      {form.reviewStatus === "rejected" && form.reviewNote && (
        <div className="mx-4 mt-16 p-4 rounded-2xl text-sm bg-red-50 border border-red-200 text-red-700">
          <p className="font-medium mb-1">审核反馈：</p><p>{form.reviewNote}</p>
        </div>
      )}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 pt-12 pb-3 bg-[#F5F0E8]">
        <button onClick={() => router.push("/counselor/bookings")}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-[#DDD8D0]">
          <ArrowLeft className="w-4 h-4 text-[#6B5E52]" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[#2C2420]">编辑档案</h1>
          <p className="text-xs text-[#9B8E82]">填写完整后提交，等待平台审核</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full"
          style={{ color: status.color, background: status.bg }}>{status.text}</span>
      </div>

      <div className="px-4 space-y-3">
        <BasicSection form={form} setForm={setForm}
          open={openSection === "basic"} onToggle={() => toggleSection("basic")}
          AvatarUploader={AvatarUploader} />
        <SectionAccordion form={form}
          open={openSection === "basic" ? null : openSection}
          onToggle={toggleSection}>
          {(k) => <SectionContent skey={k} form={form} setForm={setForm} />}
        </SectionAccordion>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-[#F5F0E8] border-t border-[#DDD8D0]">
        <div className="flex gap-3">
          <button onClick={() => save(false)} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium border border-[#DDD8D0] bg-white text-[#6B5E52]">
            <BookmarkCheck className="w-4 h-4" />
            {saving ? "保存中…" : "保存草稿"}
          </button>
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => {
                if (missingPrice) { setToast("请先在「咨询设置」中填写收费金额"); setTimeout(() => setToast(""), 3000); return; }
                save(true);
              }}
            disabled={!canSubmit || submitting}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white"
            style={{ background: canSubmit ? "#9CB48A" : "#C0B8B0" }}>
            <Send className="w-4 h-4" />
            {submitting ? "提交中…" : form.reviewStatus === "submitted" ? "修改档案" : "提交审核"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
