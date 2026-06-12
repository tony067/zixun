import { useState, useEffect, useRef } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Input, ScrollView, Image, Swiper, SwiperItem, Textarea } from '@tarojs/components'
import { request } from '../../api/request'
import { useAuthStore } from '../../store/authStore'

import { useState, useEffect } from "react";

type Counselor = {
  id: string;
  displayName: string;
  sessionDuration: number;
  pricePerSession: number;
  sessionModes: string[];
  counselorTypes?: string[];
};

export default function BookingScreen({ counselorId }: { counselorId: string }) {
  const router = useRouter();
  const { user } = useAuthStore() => s.auth.user);
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);

  // 流程状态
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [step1Data, setStep1Data] = useState<{ mode: string; date: Date; slot: TimeSlot } | null>(null);
  const [bookingId, setBookingId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    request(`/api/counselors/${counselorId}`)
      
      .then(d => setCounselor(d.counselor ?? d))
      .finally(() => setLoading(false));
  }, [counselorId]);

  const sessionModes = counselor?.sessionModes?.length
    ? counselor.sessionModes
    : ["视频咨询"];

  const dateStr = step1Data
    ? `${step1Data.date.getMonth() + 1}月${step1Data.date.getDate()}日 ${WEEKDAY_LABELS[step1Data.date.getDay()]} ${step1Data.slot.start}–${step1Data.slot.end}`
    : "";

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

      const res = await request("/api/bookings", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({
        counselorId: counselor.id,
        scheduledAt: scheduledAt.toISOString(),
        sessionMode: step1Data.mode,
        durationMinutes: counselor.sessionDuration ?? 50,
        priceAmount: counselor.pricePerSession ?? 300,
        applicationForm: form,
        agreementSigned: agreed,
        sessionNumber: 1,
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
      <View className="min-h-svh flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <View className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--color-primary)" }} />
      </View>
    );
  }

  if (!counselor) {
    return (
      <View className="min-h-svh flex items-center justify-center p-8 text-center" style={{ background: "var(--color-bg)" }}>
        <Text className="text-[#9B8E82]">未找到咨询师信息</Text>
      </View>
    );
  }

  return (
    <View className="min-h-svh flex flex-col" style={{ background: "var(--color-bg)" }}>
      {/* 顶部导航 */}
      <View className="flex items-center px-4 pt-4 pb-2">
        <View onClick={() => step === 1 ? Taro.navigateBack() : setStep(s => (s - 1) as 1 | 2 | 3 | 4)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "#F5F0EA" }}>
          <Text>‹</Text>
        </View>
        <Text className="flex-1 text-center text-base font-bold text-[#2C2420]">
          预约 {counselor.displayName}
        </Text>
        <View className="w-9" />
      </View>

      {/* 进度条 */}
      <StepBar current={step} />

      {/* 各步骤内容 */}
      <View className="flex-1 flex flex-col">
        {step === 1 && (
          <Step1Time
            sessionModes={sessionModes}
            durationMinutes={counselor.sessionDuration ?? 50}
            onNext={handleStep1}
          />
        )}
        {step === 2 && step1Data && (
          <Step2Form
            mode={step1Data.mode}
            date={step1Data.date}
            slot={step1Data.slot}
            durationMinutes={counselor.sessionDuration ?? 50}
            priceAmount={counselor.pricePerSession ?? 300}
            counselorName={counselor.displayName}
            onNext={handleStep2}
            onBack={() => setStep(1)}
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
            durationMinutes={counselor.sessionDuration ?? 50}
            priceAmount={counselor.pricePerSession ?? 300}
            onPay={handlePay}
            onBack={() => Taro.navigateTo({url: '/pages//index'})}
          />
        )}
      </View>

      {/* Step3 底部按钮 */}
      {step === 3 && (
        <View className="px-5 pb-8 pt-3 border-t flex gap-3" style={{ borderColor: "#EBE7DF", background: "var(--color-bg)" }}>
          <View onClick={() => Taro.navigateTo({url: '/pages/profile/index'})}
            className="flex-1 py-3 rounded-2xl border text-sm font-semibold"
            style={{ borderColor: "#E8E2D8", color: "#9B8E82" }}>
            查看我的预约
          </View>
          <View onClick={() => setStep(4)}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-sm"
            style={{ background: "var(--color-primary)" }}>
            去支付
          </View>
        </View>
      )}
    </View>
  );
}
