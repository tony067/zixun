"use client";
import { useState } from "react";
import React from "react";
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
    <div className="flex items-center gap-4">
      {([false, true] as const).map(v => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className="flex items-center gap-1.5"
        >
          {/* 圆形单选点 */}
          <div
            className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-none transition-all"
            style={{
              borderColor: value === v ? "var(--color-primary)" : "#C4BDB5",
              background: "transparent",
            }}
          >
            {value === v && (
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: "var(--color-primary)" }}
              />
            )}
          </div>
          <span className="text-sm" style={{ color: value === v ? "var(--color-primary)" : "#9B8E82" }}>
            {v ? "是" : "否"}
          </span>
        </button>
      ))}
    </div>
  );
}

const AGREE_TEXT = `MindPace 用户服务协议

欢迎使用 MindPace 心理咨询平台。在您提交预约前，请仔细阅读以下条款。提交预约即表示您已阅读、理解并同意本协议的全部内容。

一、平台服务说明
MindPace 作为第三方心理咨询预约平台，负责为用户提供咨询师匹配、预约管理及订单处理服务。平台对入驻咨询师进行资质审核，但咨询服务由咨询师本人独立提供，平台不对具体咨询过程及效果作出保证。

二、用户信息保护
您填写的个人信息（包括姓名、手机号、咨询目的等）仅用于本次预约及相关服务，平台将依据适用法律法规妥善保管，未经您同意不会向第三方披露。以下情况除外：您主动同意公开；存在伤害自身或他人的紧迫危险；法律法规要求强制披露。

三、预约与取消政策
预约提交后，须在咨询师确认前完成取消操作，否则视为有效预约。确认后如需取消或改期，请至少提前 24 小时通知，24 小时内取消可能不予退款。具体退款规则以平台当时公示的政策为准。

四、费用与支付
咨询费用以预约时页面展示为准。平台负责收款，咨询完成后按约定比例结算给咨询师。

五、紧急情况声明
本平台提供的心理咨询服务不属于危机干预或精神科诊疗服务。若您正处于危机状态（有伤害自身或他人的意图），请立即拨打心理援助热线（全国：400-161-9995；北京：010-82951332）或前往最近医院急诊。

六、免责声明
MindPace 平台不对因用户提供虚假信息、擅自中断咨询或违反平台规则所产生的任何后果承担责任。

七、协议修改
平台有权在必要时更新本协议，更新后的协议将在平台公告后生效。您继续使用平台服务即视为接受更新后的协议。`;

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

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [errorMsg, setErrorMsg] = useState("");

  function handleSubmitClick() {
    setErrorMsg("");
    if (!form.name.trim()) {
      setErrorMsg("请填写真实姓名");
      document.getElementById("field-name")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!form.phone.trim()) {
      setErrorMsg("请填写手机号");
      document.getElementById("field-phone")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (form.purposes.length === 0) {
      setErrorMsg("请至少选择一项咨询目的");
      document.getElementById("field-purposes")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!agreed) {
      setErrorMsg("请阅读并勾选服务协议");
      document.getElementById("field-agreement")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!form.consentSigned) {
      setErrorMsg("请点击《MindPace 咨询服务协议》阅读并同意");
      document.getElementById("field-agreement")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onNext(form, agreed);
  }

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
        <div id="field-name" className="mx-5 rounded-2xl overflow-hidden mb-4" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <div className="px-4 py-3.5 border-b" style={{ borderColor: "#F5F0EA" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5A4E44] w-24 flex-none">真实姓名 <span className="text-[#E07A5F] text-xs">*</span></span>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="请填写真实姓名（非昵称）"
                className="flex-1 text-right text-sm bg-transparent outline-none placeholder-[#C4BDB5]"
                style={{ color: "#2C2420" }} />
            </div>
          </div>
          <div id="field-phone" className="px-4 py-3.5 border-b" style={{ borderColor: "#F5F0EA" }}>
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
          <div id="field-purposes" className="px-4 py-3.5">
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
            {form.purposes.includes("其他") && (
              <input
                value={form.purposeOther ?? ""}
                onChange={e => setForm(prev => ({ ...prev, purposeOther: e.target.value }))}
                placeholder="请简单描述（选填）"
                className="mt-2 w-full text-sm bg-[#FAF8F5] rounded-xl px-3 py-2 outline-none placeholder-[#C4BDB5]"
                style={{ color: "#2C2420", border: "1px solid #EBE7DF" }}
              />
            )}
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
        <div id="field-agreement" className="mx-5 mb-4">
          <div className="rounded-2xl p-4 mb-3" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            <p className="text-xs text-[#9B8E82] mb-2 font-medium">MindPace 用户服务协议</p>
            <div className="text-xs text-[#9B8E82] leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap pr-1">
              {AGREE_TEXT}
            </div>
          </div>
          <button onClick={() => { setAgreed(!agreed); set("consentSigned", !agreed); }}
            className="flex items-start gap-3 w-full text-left">
            <div className="mt-0.5 w-5 h-5 rounded-md flex-none flex items-center justify-center border-2 transition-colors"
              style={{
                borderColor: agreed ? "var(--color-primary)" : "#C4BDB5",
                background: agreed ? "var(--color-primary)" : "white"
              }}>
              {agreed && <svg viewBox="0 0 12 10" className="w-3 h-3 fill-none stroke-white stroke-2"><polyline points="1,5 4.5,8.5 11,1" /></svg>}
            </div>
            <span className="text-sm text-[#5A4E44]">我已阅读并同意上述《MindPace 用户服务协议》</span>
          </button>
          {errorMsg && (
            <p className="text-xs text-red-400 mt-2 pl-8">{errorMsg}</p>
          )}
        </div>
      </div>

      {/* 底部 */}
      <div className="px-5 pb-8 pt-3 border-t" style={{ borderColor: "#EBE7DF", background: "var(--color-bg)" }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm font-semibold px-5 py-3 rounded-2xl border"
            style={{ borderColor: "#E8E2D8", color: "#9B8E82" }}>
            上一步
          </button>
          <button onClick={handleSubmitClick}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-base"
            style={{ background: "var(--color-primary)" }}>
            提交预约 · ¥{priceAmount}
          </button>
        </div>
      </div>
    </div>
  );
}
 </div>

      {/* 服务协议弹窗（已移除，协议内容内嵌在页面中） */}
      {false && showAgreement && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowAgreement(false)}>
          <div className="mt-auto rounded-t-3xl overflow-hidden flex flex-col max-h-[80vh]"
            style={{ background: "white" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F0EBE3" }}>
              <h3 className="text-base font-bold text-[#2C2420]">MindPace 用户服务协议</h3>
              <button onClick={() => setShowAgreement(false)} className="text-[#9B8E82] text-xl">✕</button>
            </div>
            <div className="overflow-y-auto px-5 py-4 flex-1">
              <pre className="text-sm text-[#5A4E44] whitespace-pre-wrap leading-relaxed font-sans">{AGREE_TEXT}</pre>
            </div>
            <div className="px-5 pb-8 pt-3 border-t" style={{ borderColor: "#F0EBE3" }}>
              <button onClick={() => { setAgreed(true); set("consentSigned", true); setShowAgreement(false); }}
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
