"use client";
import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { request } from "@/lib/api/request";
import { StepBar } from "@/components/booking/StepBar";
import { Step1Time, Step1Result } from "@/components/booking/Step1Time";
import { Step2Form } from "@/components/booking/Step2Form";
import { Step4Payment } from "@/components/booking/Step4Payment";
import { TimeSlot, ApplicationForm, WEEKDAY_LABELS } from "@/lib/booking-flow-data";

type Counselor = {
  id: string;
  displayName: string;
  sessionDuration: number;
  pricePerSession: number;
  sessionModes: string[];
  counselorTypes?: string[];
  pricingOptions?: { id: string; name: string; customName?: string; duration: number; price: number; sessions: number }[];
};

type PkgInfo = {
  id: string; counselorId: string; planName: string | null;
  totalSessions: number; usedSessions: number; status: string;
};

export function BookingScreen({ counselorId }: { counselorId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);

  // 套餐核销模式：/booking/<counselorId>?package=<pkgId>，跳过定价与支付，直接扣减套餐次数
  const [pkg, setPkg] = useState<PkgInfo | null>(null);
  // 购买套餐时填写的申请单（核销子预约复用，无需再次填写）
  const [pkgSourceForm, setPkgSourceForm] = useState<{ form: ApplicationForm; agreed: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 流程状态：0 选方案 → 1 选时间/调剂申请 → 2 填表单 → 3 支付（提交订单）
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [selectedPricing, setSelectedPricing] = useState<number>(0);
  const [step1Data, setStep1Data] = useState<Step1Result | null>(null);
  const [bookingId, setBookingId] = useState<string>("");

  useEffect(() => {
    request(`/api/counselors/${counselorId}`)
      .then(r => r.json())
      .then(d => {
        const c = d.counselor ?? d;
        setCounselor(c);
        // 没有定价方案时直接跳到 step 1
        if (!c.pricingOptions || c.pricingOptions.length === 0) {
          setStep(1);
        }
      })
      .finally(() => setLoading(false));
  }, [counselorId]);

  // 套餐信息加载（校验归属/余次/状态）+ 复用购买单的申请表单
  useEffect(() => {
    const packageId = searchParams.get("package");
    if (!packageId || !user) return;
    request("/api/user/packages").then(r => r.json())
      .then(async d => {
        const found = (d.packages ?? []).find((p: any) => p.id === packageId);
        if (found && found.status === "active" && (found.usedSessions ?? 0) < found.totalSessions) {
          // 购买套餐时已填过申请单：拉取购买单详情，核销时直接复用
          let source: { form: ApplicationForm; agreed: boolean } | null = null;
          try {
            const bd = await request(`/api/bookings/${found.orderId}`).then(r => r.json());
            const b = bd?.booking ?? bd;
            if (b?.applicationForm) source = { form: b.applicationForm, agreed: !!b.agreementSigned };
          } catch {}
          setPkgSourceForm(source);
          setPkg(found);
          setStep(1); // 套餐模式跳过定价选择
        }
      })
      .catch(() => {});
  }, [searchParams, user]);

  const sessionModes = counselor?.sessionModes?.length
    ? counselor.sessionModes
    : ["视频咨询"];

  const isAdjust = !!step1Data && !step1Data.slot;

  const duration = (counselor?.pricingOptions && counselor.pricingOptions.length > 0
    ? counselor.pricingOptions[selectedPricing].duration
    : counselor?.sessionDuration) ?? 50;
  const price = (counselor?.pricingOptions && counselor.pricingOptions.length > 0
    ? counselor.pricingOptions[selectedPricing].price
    : counselor?.pricePerSession) ?? 0;
  // 当前选中的是多次套餐（非套餐核销模式）→ 购买时无需选时间，直接下单支付
  const isPackagePurchase = !pkg && !!(counselor?.pricingOptions && counselor.pricingOptions.length > 0
    && counselor.pricingOptions[selectedPricing].sessions > 1);

  const dateStr = step1Data
    ? (step1Data.slot
        ? `${step1Data.date.getMonth() + 1}月${step1Data.date.getDate()}日 ${WEEKDAY_LABELS[step1Data.date.getDay()]} ${step1Data.slot.start}–${step1Data.slot.end}`
        : isPackagePurchase
          ? `${counselor?.pricingOptions?.[selectedPricing]?.sessions ?? 0}次套餐 · 购买后逐次预约`
          : "时间调剂申请 · 由咨询师协调后确认时间")
    : "";

  // Step0 → Step1 (选择定价方案)；套餐方案直接进表单步骤（购买时不选时间）
  const handleStep0 = () => {
    if (isPackagePurchase) {
      setStep1Data({ mode: "视频咨询", date: new Date(), slot: null });
      setStep(2);
      return;
    }
    setStep(1);
  };

  // Step1 → Step2（选时段 或 时间调剂申请）；套餐核销：跳过表单直接提交（复用购买时填写的申请单）
  const handleStep1 = (data: Step1Result) => {
    setStep1Data(data);
    if (pkg) {
      setSubmitting(true);
      const source = pkgSourceForm ?? { form: {} as ApplicationForm, agreed: false };
      handlePayWithData(source.form, source.agreed, data)
        .then(newId => router.push(newId ? `/my-bookings/${newId}` : "/my-bookings"))
        .catch(e => window.alert(e instanceof Error ? e.message : "提交失败，请稍后重试"))
        .finally(() => setSubmitting(false));
      return;
    }
    setStep(2);
  };

  // Step3 支付（网页端为模拟支付）：支付成功即创建订单（状态=待确认·已支付）
  // method === "offline"：线下转账给客服，订单以「待支付」提交，由客服确认收款
  // method === "package"：套餐核销，0元提交子预约，次数在咨询师确认时锁定
  const handlePay = async (method: string) => {
    if (method !== "offline" && method !== "package") await new Promise(r => setTimeout(r, 1200)); // 模拟支付等待
    if (!step1Data || !pendingForm || !counselor) throw new Error("missing booking data");

    const pricing = counselor.pricingOptions && counselor.pricingOptions.length > 0
      ? counselor.pricingOptions[selectedPricing]
      : null;

    // 有具体时段：计算开始时间；调剂申请：不传 scheduledAt，由服务端落占位时间
    let scheduledAt: string | undefined;
    if (step1Data.slot) {
      const scheduled = new Date(step1Data.date);
      const [h, m] = step1Data.slot.start.split(":").map(Number);
      scheduled.setHours(h, m, 0, 0);
      scheduledAt = scheduled.toISOString();
    }

    const res = await request("/api/bookings", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({
      counselorId: counselor.id,
      scheduledAt,
      sessionMode: step1Data.mode,
      durationMinutes: pricing?.duration ?? counselor.sessionDuration ?? 50,
      priceAmount: method === "package" ? 0 : (pricing?.price ?? counselor.pricePerSession ?? 0),
      sessionNumber: pricing?.sessions ?? 1,
      pricingOptionId: pricing?.id ?? "",
      applicationForm: pendingForm.form,
      agreementSigned: pendingForm.agreed,
      paymentMethod: method === "package" ? "package" : method,
      offline: method === "offline",
      packageId: method === "package" ? pkg?.id : undefined,
      adjustRequest: step1Data.adjustRequest ?? null,
    })});
    if (!res.ok) {
      const d = await res.json().catch(() => ({} as any));
      throw new Error(d.message ?? "提交失败，请稍后重试");
    }
    const data = await res.json();
    if (data.id) setBookingId(data.id);
  };

  // Step2 → Step3 支付（表单暂存，支付成功时随订单一起提交）
  const [pendingForm, setPendingForm] = useState<{ form: ApplicationForm; agreed: boolean } | null>(null);
  const handleStep2 = async (form: ApplicationForm, agreed: boolean) => {
    // 套餐核销：无支付步骤，直接以「package」方式提交并跳转订单详情
    if (pkg) {
      setPendingForm({ form, agreed });
      setSubmitting(true);
      try {
        const newId = await handlePayWithData(form, agreed);
        router.push(newId ? `/my-bookings/${newId}` : "/my-bookings");
      } catch (e) {
        window.alert(e instanceof Error ? e.message : "提交失败，请稍后重试");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setPendingForm({ form, agreed });
    setStep(3);
  };

  // 套餐模式直接提交（不依赖 setState 后的 pendingForm），返回新订单 id
  // s1：显式传入时间数据（核销跳过表单时 setState 尚未生效）
  const handlePayWithData = async (form: ApplicationForm, agreed: boolean, s1?: Step1Result): Promise<string> => {
    const stepData = s1 ?? step1Data;
    if (!stepData || !counselor || !pkg) throw new Error("missing booking data");
    const pricing = counselor.pricingOptions && counselor.pricingOptions.length > 0
      ? counselor.pricingOptions[selectedPricing]
      : null;
    let scheduledAt: string | undefined;
    if (stepData.slot) {
      const scheduled = new Date(stepData.date);
      const [h, m] = stepData.slot.start.split(":").map(Number);
      scheduled.setHours(h, m, 0, 0);
      scheduledAt = scheduled.toISOString();
    }
    const res = await request("/api/bookings", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({
      counselorId: counselor.id,
      scheduledAt,
      sessionMode: stepData.mode,
      durationMinutes: pricing?.duration ?? counselor.sessionDuration ?? 50,
      priceAmount: 0,
      sessionNumber: 1,
      pricingOptionId: pricing?.id ?? "",
      applicationForm: form,
      agreementSigned: agreed,
      paymentMethod: "package",
      packageId: pkg.id,
      adjustRequest: stepData.adjustRequest ?? null,
    })});
    if (!res.ok) {
      const d = await res.json().catch(() => ({} as any));
      throw new Error(d.message ?? "提交失败，请稍后重试");
    }
    const data = await res.json();
    if (data.id) setBookingId(data.id);
    return data.id ?? "";
  };

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--color-primary)" }} />
      </div>
    );
  }

  if (!counselor) {
    return (
      <div className="min-h-svh flex items-center justify-center p-8 text-center" style={{ background: "var(--color-bg)" }}>
        <p className="text-[#9B8E82]">未找到咨询师信息</p>
      </div>
    );
  }

  return (
    <div className="min-h-svh flex flex-col" style={{ background: "var(--color-bg)" }}>
      {/* 顶部导航 */}
      <div className="flex items-center px-4 pt-4 pb-2">
        <button onClick={() => {
          if (step === 0) { router.back(); return; }
          // 套餐购买跳过了选时间步骤，表单页返回应回到方案选择
          if (step === 2 && isPackagePurchase) { setStep(0); return; }
          setStep(s => (s - 1) as 0 | 1 | 2);
        }}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "#F5F0EA" }}>
          <ChevronLeft className="w-5 h-5 text-[#5A4E44]" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-[#2C2420]">
          预约 {counselor.displayName}
        </h1>
        <div className="w-9" />
      </div>

      {/* 进度条 — step 0（选择方案）时不显示 */}
      {step > 0 && <StepBar current={step} />}

      {/* 套餐核销提示条 */}
      {pkg && step > 0 && step < 3 && (
        <div className="mx-4 mt-2 rounded-2xl px-4 py-2.5 flex items-center justify-between"
          style={{ background: "#F0F7EC", border: "1px solid #D8E5CD" }}>
          <div className="text-sm font-semibold" style={{ color: "#3A6228" }}>
            套餐核销模式 · 剩余 {pkg.totalSessions - (pkg.usedSessions ?? 0)} 次
          </div>
          <div className="text-xs" style={{ color: "#7D9A66" }}>提交后由咨询师确认时扣除</div>
        </div>
      )}

      {/* 提交中遮罩 */}
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(44,36,32,0.45)" }}>
          <div className="rounded-2xl px-6 py-5 flex flex-col items-center gap-3" style={{ background: "white" }}>
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--color-primary)" }} />
            <span className="text-sm font-medium" style={{ color: "#5A4E44" }}>正在提交套餐预约…</span>
          </div>
        </div>
      )}

      {/* 各步骤内容 */}
      <div className="flex-1 flex flex-col">
        {step === 0 && counselor.pricingOptions && counselor.pricingOptions.length > 0 && (
          <div className="flex-1 px-5 py-4 flex flex-col">
            <h2 className="text-lg font-bold mb-2" style={{ color: "#2C2420" }}>选择咨询方案</h2>
            <p className="text-sm mb-4" style={{ color: "#9B8E82" }}>请选择您想要预约的咨询类型</p>
            <div className="flex-1 space-y-3">
              {counselor.pricingOptions.map((opt, idx) => {
                const displayName = opt.name === "__custom__" ? (opt.customName || `方案 ${idx + 1}`) : (opt.name || `方案 ${idx + 1}`);
                return (
                  <button key={opt.id} onClick={() => setSelectedPricing(idx)}
                    className="w-full rounded-2xl p-4 text-left border-2 transition-all"
                    style={{
                      background: selectedPricing === idx ? "#F0F7EC" : "white",
                      borderColor: selectedPricing === idx ? "#9CB48A" : "#DDD8D0",
                    }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base font-semibold" style={{ color: "#2C2420" }}>{displayName}</span>
                      <span className="text-xl font-bold" style={{ color: "#9CB48A" }}>¥{opt.price}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm" style={{ color: "#7D736A" }}>
                      <span>{opt.duration} 分钟</span>
                      <span>× {opt.sessions} 次</span>
                      {opt.sessions > 1 && <span style={{ color: "#9CB48A", fontWeight: "500" }}>约 ¥{Math.round(opt.price / opt.sessions)}/次</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {step === 1 && (
          <Step1Time
            counselorId={counselorId}
            sessionModes={sessionModes}
            durationMinutes={duration}
            onNext={handleStep1}
          />
        )}
        {step === 2 && step1Data && (
          <Step2Form
            mode={step1Data.mode}
            date={step1Data.date}
            slot={step1Data.slot}
            adjustRequest={step1Data.adjustRequest}
            durationMinutes={duration}
            priceAmount={price}
            counselorName={counselor.displayName}
            onNext={handleStep2}
            onBack={() => setStep(counselor.pricingOptions && counselor.pricingOptions.length > 0 ? 0 : 1)}
          />
        )}
        {step === 3 && (
          <Step4Payment
            counselorName={counselor.displayName}
            dateStr={dateStr}
            durationMinutes={duration}
            priceAmount={price}
            isPackagePurchase={isPackagePurchase}
            packageSessions={counselor.pricingOptions?.[selectedPricing]?.sessions}
            onPay={handlePay}
            onBack={() => router.push("/")}
          />
        )}
      </div>

      {/* Step0 底部按钮 */}
      {step === 0 && counselor.pricingOptions && counselor.pricingOptions.length > 0 && (
        <div className="px-5 pb-8 pt-3 border-t" style={{ borderColor: "#EBE7DF", background: "var(--color-bg)" }}>
          <button onClick={handleStep0}
            className="w-full py-3 rounded-2xl text-white font-bold text-sm"
            style={{ background: "var(--color-primary)" }}>
            下一步
          </button>
        </div>
      )}
    </div>
  );
}
