"use client";
import { useState } from "react";
import { ApplicationForm, EMPTY_FORM, PURPOSE_OPTIONS } from "@/lib/booking-flow-data";
import { TimeSlot } from "@/lib/booking-flow-data";

interface Props {
  mode: string;
  date: Date;
  slot: TimeSlot;
  durationMinutes: number;
  priceAmount: number;
  counselorName: string;
  onNext: (form: ApplicationForm, agreed: boolean) => void;
  onBack: () => void;
}

function YesNo({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-3">
      {([false, true] as const).map(v => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all"
          style={{
            background: value === v ? "#F0F7EC" : "#F5F0EA",
            border: `2px solid ${value === v ? "var(--color-primary)" : "#E0DAD4"}`,
          }}
        >
          <div
            className="w-4 h-4 rounded border-2 flex items-center justify-center flex-none"
            style={{ borderColor: value === v ? "var(--color-primary)" : "#C4BDB5", background: value === v ? "var(--color-primary)" : "transparent" }}
          >
            {value === v && (
              <svg viewBox="0 0 10 8" className="w-2 h-2" fill="none" stroke="white" strokeWidth="2">
                <polyline points="1,4 3.5,6.5 9,1" />
              </svg>
            )}
          </div>
          <span className="text-sm font-medium" style={{ color: value === v ? "var(--color-primary)" : "#9B8E82" }}>
            {v ? "是" : "否"}
          </span>
        </button>
      ))}
    </div>
  );
}

const AGREE_TEXT = `MindPace 咨询服务协议

1. 保密原则
咨询过程中，来访者的个人信息及咨询内容受严格保密保护。以下情况除外：来访者同意公开；存在伤害自身或他人的紧迫危险；法律强制要求披露。

2. 取消政策
预约确认后，如需取消或改期，请至少提前24小时通知咨询师。24小时内取消可能收取全额费用。

3. 咨询边界
本平台提供的咨询服务不能替代精神科诊断或药物治疗。若您存在严重精神疾病，我们建议同时寻求精神科专业支持。

4. 紧急情况
如您正处于危机状态（有伤害自身或他人的意图），请立即拨打心理援助热线（北京：010-82951332；全国：400-161-9995）或前往最近医院急诊。

5. 录音录像
未经双方同意，不得对咨询过程进行录音或录像。

6. 费用与退款
确认预约后，来访者须在规定时间内完成支付。支付完成后，因来访者原因取消且不满足退款条件的，不予退款。

7. 平台责任
MindPace 平台对入驻咨询师进行资质审核，但不对咨询结果作出任何保证。`;

const CONSENT_TEXT = `知情同意书

尊重来访者的知情权是咨询工作的基础，请在预约前仔细阅读以下内容。

一、咨询的性质与目标
心理咨询是一个通过专业对话帮助来访者理解自身、解决问题、促进成长的过程。咨询师将提供支持和引导，但无法代替来访者做出决定或解决生活问题。

二、保密原则
咨询内容受严格保密保护。以下情况除外：
• 来访者明确表示同意披露
• 来访者或他人面临紧迫生命危险
• 法律法规强制要求

三、录音录像
未经双方事先书面同意，任何一方不得录音或录像。

四、紧急情况处理
如您在咨询期间或之后出现危机状态，请立即联系：
• 北京心理危机研究与干预中心：010-82951332
• 全国心理援助热线：400-161-9995
• 紧急情况请拨打 120 或前往最近医院急诊

五、取消与改期
请至少提前24小时通知咨询师如需取消或改期。未提前通知的取消，平台可能收取全额咨询费。

六、知情同意声明
我已阅读并理解上述内容，同意在知情的基础上开始咨询关系，并理解咨询并非危机干预服务。`;

export function Step2Form({ mode, date, slot, durationMinutes, priceAmount, counselorName, onNext, onBack }: Props) {
  const [form, setForm] = useState<ApplicationForm>(EMPTY_FORM);
  const [agreed, setAgreed] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  const set = <K extends keyof ApplicationForm>(k: K, v: ApplicationForm[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const canSubmit = form.name.trim() && form.phone.trim() && form.purposes.length > 0 && agreed && form.consentSigned;

  const WEEKDAY = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const dateStr = `${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAY[date.getDay()]} ${slot.start}–${slot.end}`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pb-6">
        {/* 预约摘要卡 */}
        <div className="mx-5 mt-4 mb-5 rounded-2xl p-4" style={{ background: "#E8DFCC" }}>
          <p className="text-xs text-[#9B8E82] mb-1">预约摘要</p>
          <p className="text-sm font-semibold text-[#2C2420]">{counselorName}</p>
          <p className="text-sm text-[#5A4E44] mt-0.5">{mode} · {durationMinutes} 分钟 · ¥{priceAmount}</p>
          <p className="text-sm text-[#5A4E44]">{dateStr}</p>
        </div>

        {/* 基本信息 */}
        <div className="mx-5 rounded-2xl overflow-hidden mb-4" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <div className="px-4 py-3.5 border-b" style={{ borderColor: "#F5F0EA" }}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-end">
                <span className="text-sm text-[#5A4E44] w-24 flex-none self-start">真实姓名 <span className="text-[#E07A5F] text-xs">*</span></span>
              </div>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="请填写真实姓名（非昵称）"
                className="flex-1 text-right text-sm bg-transparent outline-none placeholder-[#C4BDB5]"
                style={{ color: "#2C2420" }} />
            </div>
          </div>
          <div className="px-4 py-3.5 border-b" style={{ borderColor: "#F5F0EA" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5A4E44] w-24 flex-none">手机号 <span className="text-red-400">*</span></span>
              <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                placeholder="必填"
                className="flex-1 text-right text-sm bg-transparent outline-none placeholder-[#C4BDB5]"
                style={{ color: "#2C2420" }} />
            </div>
          </div>
          <div className="px-4 py-3.5 border-t" style={{ borderColor: "#F5F0EA" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5A4E44] w-24 flex-none">微信号 <span className="text-[#C4BDB5] text-xs">选填</span></span>
              <input value={form.wechat} onChange={e => set("wechat", e.target.value)}
                placeholder="选填"
                className="flex-1 text-right text-sm bg-transparent outline-none placeholder-[#C4BDB5]"
                style={{ color: "#2C2420" }} />
            </div>
            <p className="text-xs mt-1" style={{ color: "#C4BDB5" }}>小程序版本上线后可自动读取</p>
          </div>
          <div className="px-4 py-3.5">
            <p className="text-sm text-[#5A4E44] mb-2">咨询目的 <span className="text-red-400">*</span><span className="text-xs text-[#9B8E82] ml-1">可多选</span></p>
            <div className="flex flex-wrap gap-2">
              {PURPOSE_OPTIONS.map(opt => {
                const selected = form.purposes.includes(opt);
                return (
                  <button key={opt} onClick={() => {
                    const next = selected
                      ? form.purposes.filter(p => p !== opt)
                      : [...form.purposes, opt];
                    set("purposes", next);
                  }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: selected ? "var(--color-primary)" : "#F5F0EA",
                      color: selected ? "white" : "#5A4E44",
                    }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 紧急联系人 */}
        <div className="mx-5 rounded-2xl overflow-hidden mb-4" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs text-[#9B8E82]">紧急联系人</p>
          </div>
          <div className="px-4 py-3.5 border-t" style={{ borderColor: "#F5F0EA" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5A4E44] w-24 flex-none">联系人姓名</span>
              <input value={form.emergencyName} onChange={e => set("emergencyName", e.target.value)}
                placeholder="请填写"
                className="flex-1 text-right text-sm bg-transparent outline-none placeholder-[#C4BDB5]"
                style={{ color: "#2C2420" }} />
            </div>
          </div>
          <div className="px-4 py-3.5 border-t" style={{ borderColor: "#F5F0EA" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5A4E44] w-24 flex-none">联系人电话</span>
              <input type="tel" value={form.emergencyPhone} onChange={e => set("emergencyPhone", e.target.value)}
                placeholder="手机号码"
                className="flex-1 text-right text-sm bg-transparent outline-none placeholder-[#C4BDB5]"
                style={{ color: "#2C2420" }} />
            </div>
          </div>
        </div>

        {/* 安全评估 */}
        <div className="mx-5 rounded-2xl overflow-hidden mb-4" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <div className="px-4 pt-3.5 pb-1">
            <p className="text-xs text-[#9B8E82]">安全评估（帮助咨询师提前了解您的状况）</p>
          </div>
          {([
            ["hasMentalDisease", "是否有精神类疾病诊断"],
            ["onMedication", "是否正在服用精神类药物"],
            ["hasSelfHarm", "是否有自伤行为"],
            ["hasSuicidalThought", "是否有自杀意念"],
            ["hasSuicidalBehavior", "是否有自杀行为"],
          ] as const).map(([key, label]) => (
            <div key={key} className="px-4 py-3 flex items-center justify-between border-t" style={{ borderColor: "#F5F0EA" }}>
              <span className="text-sm text-[#5A4E44]">{label}</span>
              <YesNo value={form[key] as boolean} onChange={v => set(key, v)} />
            </div>
          ))}
        </div>

        {/* 补充说明 */}
        <div className="mx-5 rounded-2xl p-4 mb-4" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <p className="text-sm text-[#5A4E44] mb-2">补充说明 <span className="text-[#C4BDB5]">（选填）</span></p>
          <textarea value={form.additionalNote} onChange={e => set("additionalNote", e.target.value)}
            placeholder="可简单描述您目前的困扰或对本次咨询的期望…"
            rows={4}
            className="w-full text-sm bg-[#FAF8F5] rounded-xl p-3 outline-none resize-none placeholder-[#C4BDB5]"
            style={{ color: "#2C2420" }} />
        </div>

                {/* 服务协议 */}
        <div className="mx-5 flex items-start gap-2.5">
          <button onClick={() => setAgreed(!agreed)}
            className="w-5 h-5 rounded flex items-center justify-center flex-none mt-0.5 transition-colors"
            style={{
              background: agreed ? "var(--color-primary)" : "white",
              border: `2px solid ${agreed ? "var(--color-primary)" : "#C4BDB5"}`
            }}>
            {agreed && <svg viewBox="0 0 12 10" className="w-3 h-3 fill-none stroke-white stroke-2"><polyline points="1,5 4.5,8.5 11,1" /></svg>}
          </button>
          <p className="text-sm text-[#5A4E44]">
            阅读并同意{" "}
            <button onClick={() => setShowAgreement(true)} className="font-semibold underline"
              style={{ color: "var(--color-primary)" }}>
              《MindPace 咨询服务协议》
            </button>
          </p>
        </div>
      </div>

      {/* 底部 */}
      <div className="px-5 pb-8 pt-3 border-t" style={{ borderColor: "#EBE7DF", background: "var(--color-bg)" }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm font-semibold px-5 py-3 rounded-2xl border"
            style={{ borderColor: "#E8E2D8", color: "#9B8E82" }}>
            上一步
          </button>
          <button disabled={!canSubmit} onClick={() => canSubmit && onNext(form, agreed)}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-base transition-opacity"
            style={{ background: canSubmit ? "var(--color-primary)" : "#C4BDB5" }}>
            提交预约 · ¥{priceAmount}
          </button>
        </div>
      </div>

      {/* 知情同意书弹窗 */}
      
      {/* 服务协议弹窗 */}
      {showAgreement && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowAgreement(false)}>
          <div className="mt-auto rounded-t-3xl overflow-hidden flex flex-col max-h-[80vh]"
            style={{ background: "white" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F0EBE3" }}>
              <h3 className="text-base font-bold text-[#2C2420]">MindPace 咨询服务协议</h3>
              <button onClick={() => setShowAgreement(false)} className="text-[#9B8E82] text-xl">✕</button>
            </div>
            <div className="overflow-y-auto px-5 py-4 flex-1">
              <pre className="text-sm text-[#5A4E44] whitespace-pre-wrap leading-relaxed font-sans">{AGREE_TEXT}</pre>
            </div>
            <div className="px-5 pb-8 pt-3 border-t" style={{ borderColor: "#F0EBE3" }}>
              <button onClick={() => { setAgreed(true); setShowAgreement(false); }}
                className="w-full py-3.5 rounded-2xl text-white font-bold"
                style={{ background: "var(--color-primary)" }}>
                同意并继续
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
