"use client";
import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { request } from "@/lib/api/request";
import { StepBar } from "@/components/booking/StepBar";
import { Step1Time } from "@/components/booking/Step1Time";
import { Step2Form } from "@/components/booking/Step2Form";
import { Step3Waiting } from "@/components/booking/Step3Waiting";
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

export function BookingScreen({ counselorId }: { counselorId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);

  // 流程状态
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [selectedPricing, setSelectedPricing] = useState<number>(0);
  const [step1Data, setStep1Data] = useState<{ mode: string; date: Date; slot: TimeSlot } | null>(null);
  const [bookingId, setBookingId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

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

  const sessionModes = counselor?.sessionModes?.length
    ? counselor.sessionModes
    : ["视频咨询"];

  const dateStr = step1Data
    ? `${step1Data.date.getMonth() + 1}月${step1Data.date.getDate()}日 ${WEEKDAY_LABELS[step1Data.date.getDay()]} ${step1Data.slot.start}–${step1Data.slot.end}`
    : "";

  // Step0 → Step1 (选择定价方案)
  const handleStep0 = () => {
    setStep(1);
  };

  // Step1 → Step2
  const handleStep1 = (data: { mode: string; date: Date; slot: TimeSlot }) => {
    setStep1Data(data);
    setStep(2);
  };

  // Step2 → Step3 (提交预约)
  const handleStep2 = async (form: ApplicationForm, agreed: boolean) => {
    if (!step1Data || !counselor) return;
    setSubmitting(true);
    try {
      const scheduledAt = new Date(step1Data.date);
      const [h, m] = step1Data.slot.start.split(":").map(Number);
      scheduledAt.setHours(h, m, 0, 0);

      const pricing = counselor.pricingOptions && counselor.pricingOptions.length > 0
        ? counselor.pricingOptions[selectedPricing]
        : null;

      const res = await request("/api/bookings", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({
        counselorId: counselor.id,
        scheduledAt: scheduledAt.toISOString(),
        sessionMode: step1Data.mode,
        durationMinutes: pricing?.duration ?? counselor.sessionDuration ?? 50,
        priceAmount: pricing?.price ?? counselor.pricePerSession ?? 300,
        sessionNumber: pricing?.sessions ?? 1,
        pricingOptionId: pricing?.id ?? "",
        applicationForm: form,
        agreementSigned: agreed,
      })});
      const data = await res.json();
      if (data.id) {
        setBookingId(data.id);
        setStep(3);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Step4 支付
  const handlePay = async (method: string) => {
    await new Promise(r => setTimeout(r, 1500)); // 模拟支付
    if (bookingId) {
      await request(`/api/bookings/${bookingId}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ status: "paid", paymentMethod: method }) });
    }
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
        <button onClick={() => step === 0 ? router.back() : setStep(s => (s - 1) as 0 | 1 | 2 | 3 | 4)}
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
            sessionModes={sessionModes}
            durationMinutes={(counselor.pricingOptions && counselor.pricingOptions.length > 0
              ? counselor.pricingOptions[selectedPricing].duration
              : counselor.sessionDuration) ?? 50}
            onNext={handleStep1}
          />
        )}
        {step === 2 && step1Data && (
          <Step2Form
            mode={step1Data.mode}
            date={step1Data.date}
            slot={step1Data.slot}
            durationMinutes={(counselor.pricingOptions && counselor.pricingOptions.length > 0
              ? counselor.pricingOptions[selectedPricing].duration
              : counselor.sessionDuration) ?? 50}
            priceAmount={(counselor.pricingOptions && counselor.pricingOptions.length > 0
              ? counselor.pricingOptions[selectedPricing].price
              : counselor.pricePerSession) ?? 300}
            counselorName={counselor.displayName}
            onNext={handleStep2}
            onBack={() => setStep(counselor.pricingOptions && counselor.pricingOptions.length > 0 ? 0 : 1)}
          />
        )}
        {step === 3 && (
          <Step3Waiting
            counselorName={counselor.displayName}
            dateStr={dateStr}
            bookingId={bookingId}
            onGoPayment={() => setStep(4)}
          />
        )}
        {step === 4 && step1Data && (
          <Step4Payment
            counselorName={counselor.displayName}
            dateStr={dateStr}
            durationMinutes={(counselor.pricingOptions && counselor.pricingOptions.length > 0
              ? counselor.pricingOptions[selectedPricing].duration
              : counselor.sessionDuration) ?? 50}
            priceAmount={(counselor.pricingOptions && counselor.pricingOptions.length > 0
              ? counselor.pricingOptions[selectedPricing].price
              : counselor.pricePerSession) ?? 300}
            onPay={handlePay}
            onBack={() => router.push("/")}
          />
        )}
      </div>

      {/* Step0/Step1 底部按钮 */}
      {step === 0 && counselor.pricingOptions && counselor.pricingOptions.length > 0 && (
        <div className="px-5 pb-8 pt-3 border-t" style={{ borderColor: "#EBE7DF", background: "var(--color-bg)" }}>
          <button onClick={handleStep0}
            className="w-full py-3 rounded-2xl text-white font-bold text-sm"
            style={{ background: "var(--color-primary)" }}>
            下一步
          </button>
        </div>
      )}

      {/* Step3 底部按钮 — 等待咨询师确认，只能查看预约 */}
      {step === 3 && (
        <div className="px-5 pb-8 pt-3 border-t flex gap-3" style={{ borderColor: "#EBE7DF", background: "var(--color-bg)" }}>
          <button onClick={() => router.push("/my-bookings")}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-sm"
            style={{ background: "var(--color-primary)" }}>
            查看我的预约
          </button>
        </div>
      )}
    </div>
  );
}
