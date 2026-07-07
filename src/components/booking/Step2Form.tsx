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
        <button key={String(v)} type="button" onClick={() => onChange(v)} className="flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-none transition-all"
            style={{ borderColor: value === v ? "var(--color-primary)" : "#C4BDB5", background: "transparent" }}
          >
            {value === v && <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-primary)" }} />}
          </div>
          <span className="text-sm" style={{ color: value === v ? "var(--color-primary)" : "#9B8E82" }}>
            {v ? "是" : "否"}
          </span>
        </button>
      ))}
    </div>
  );
}

const AGREE_LINES = [
  "MindPace 用户服务协议",
  "",
  "欢迎使用 MindPace 心理咋询平台。在您提交预约前，请仔细阅读以下条款。提交预约即表示您已阅读、理解并同意本协议的全部内容。",
  "",
  "一、平台服务说明",
  "MindPace 作为第三方心理咋询预约平台，负责为用户提供咋询师匹配、预约管理及订单处理服务。平台对入驻咋询师进行资质审核，但咋询服务由咋询师本人独立提供，平台不对具体咋询过程及效果作出保证。",
  "",
  "二、用户信息保护",
  "您填写的个人信息（包括姓名、手机号、咋询目的等）仅用于本次预约及相关服务，平台将依据适用法律法规妥善保管，未经您同意不会向第三方披露。以下情况除外：您主动同意公开；存在伤害自身或他人的紧迫危险；法律法规要求强制披露。",
  "",
  "三、预约与取消政策",
  "预约提交后须在咋询师确认前完成取消操作，否则视为有效预约。确认后如需取消或改期，请至少提前 24 小时通知，24 小时内取消可能不予退款。具体退款规则以平台当时公示的政策为准。",
  "",
  "四、费用与支付",
  "咋询费用以预约时页面展示为准。平台负责收款，咋询完成后按约定比例结算给咋询师。",
  "",
  "五、紧急情况声明",
  "本平台提供的心理咋询服务不属于危机干预或紧急医疗服务。若您或他人处于紧急危险中，请立即拨打 110、120 或心理援助热线 400-161-9995。",
  "",
  "六、免责声明",
  "因不可抗力、咋询师个人原因或用户自身原因导致的咋询中断或效果不达预期，平台不承担连带责任，但将协助用户进行合理维权。",
  "",
  "七、协议修改",
  "平台保留在法律允许范围内修改本协议的权利，修改后将在平台显著位置公示。继续使用平台服务视为接受修改后的协议。",
];

function AgreementAccordion() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden mb-1" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full px-4 py-3.5 flex items-center justify-between text-left">
        <span className="text-sm text-[#5A4E44] font-medium">MindPace 用户服务协议</span>
        <svg className="w-4 h-4 transition-transform" style={{ color: "#9B8E82", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="px-4 py-4 text-xs text-[#9B8E82] leading-relaxed max-h-48 overflow-y-auto border-t" style={{ borderColor: "#F5F0EA" }}>
          {AGREE_LINES.map((line, i) => line === "" ? <br key={i} /> : (
            <p key={i} className={i === 0 || line.match(/^[一二三四五六七]/) ? "font-semibold mt-2" : ""}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export function Step2Form({ mode, date, slot, durationMinutes, priceAmount, counselorName, onNext, onBack }: Props) {
  const [form, setForm] = useState<ApplicationForm>(EMPTY_FORM);
  const [agreed, setAgreed] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const set = <K extends keyof ApplicationForm>(k: K, v: ApplicationForm[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

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
      setErrorMsg("请至少选择一项咋询目的");
      document.getElementById("field-purposes")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!agreed) {
      setErrorMsg("请阅读并勾选《MindPace 用户服务协议》");
      document.getElementById("field-agreement")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onNext(form, agreed);
  }

  const WEEKDAY = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const dateStr = date.getMonth() + 1 + "月" + date.getDate() + "日 " + WEEKDAY[date.getDay()] + " " + slot.start + "–" + slot.end;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pb-6">

        <div className="mx-5 mt-4 mb-5 rounded-2xl p-4" style={{ background: "#E8DFCC" }}>
          <p className="text-xs text-[#9B8E82] mb-1">预约摘要</p>
          <p className="text-sm font-semibold text-[#2C2420]">{counselorName}</p>
          <p className="text-sm text-[#5A4E44] mt-0.5">{mode} · {durationMinutes} 分钟 · ￥{priceAmount}</p>
          <p className="text-sm text-[#5A4E44]">{dateStr}</p>
        </div>

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
              <span className="text-sm text-[#5A4E44] w-24 flex-none">手机号 <span className="text-red-400 text-xs">*</span></span>
              <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                placeholder="必填"
                className="flex-1 text-right text-sm bg-transparent outline-none placeholder-[#C4BDB5]"
                style={{ color: "#2C2420" }} />
            </div>
          </div>
          <div className="px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5A4E44] w-24 flex-none">微信号 <span className="text-xs text-[#C4BDB5]">选填</span></span>
              <input value={form.wechat ?? ""} onChange={e => set("wechat", e.target.value)}
                placeholder="选填"
                className="flex-1 text-right text-sm bg-transparent outline-none placeholder-[#C4BDB5]"
                style={{ color: "#2C2420" }} />
            </div>
            <p className="text-xs mt-1 text-right" style={{ color: "#C4BDB5" }}>小程序版本上线后可自动读取</p>
          </div>
        </div>

        <div id="field-purposes" className="mx-5 rounded-2xl overflow-hidden mb-4" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <div className="px-4 py-3.5">
            <p className="text-sm text-[#5A4E44] mb-2">咋询目的 <span className="text-red-400">*</span><span className="text-xs text-[#9B8E82] ml-1">可多选</span></p>
            <div className="flex flex-wrap gap-2">
              {PURPOSE_OPTIONS.map(opt => {
                const selected = form.purposes.includes(opt);
                return (
                  <button key={opt} type="button" onClick={() => {
                    const next = selected ? form.purposes.filter(p => p !== opt) : [...form.purposes, opt];
                    set("purposes", next);
                  }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{ background: selected ? "var(--color-primary)" : "#F5F0EA", color: selected ? "white" : "#5A4E44" }}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {form.purposes.includes("其他") && (
              <input value={form.purposeOther ?? ""} onChange={e => set("purposeOther", e.target.value)}
                placeholder="请简单描述（选填）"
                className="mt-2 w-full text-sm bg-[#FAF8F5] rounded-xl px-3 py-2 outline-none placeholder-[#C4BDB5]"
                style={{ color: "#2C2420", border: "1px solid #EBE7DF" }} />
            )}
          </div>
        </div>

        <div className="mx-5 rounded-2xl overflow-hidden mb-4" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs text-[#9B8E82]">紧急联系人</p>
          </div>
          <div className="px-4 py-3.5 border-t" style={{ borderColor: "#F5F0EA" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5A4E44] w-24 flex-none">姓名</span>
              <input value={form.emergencyName ?? ""} onChange={e => set("emergencyName", e.target.value)}
                placeholder="紧急联系人姓名"
                className="flex-1 text-right text-sm bg-transparent outline-none placeholder-[#C4BDB5]"
                style={{ color: "#2C2420" }} />
            </div>
          </div>
          <div className="px-4 py-3.5 border-t" style={{ borderColor: "#F5F0EA" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5A4E44] w-24 flex-none">电话</span>
              <input type="tel" value={form.emergencyPhone ?? ""} onChange={e => set("emergencyPhone", e.target.value)}
                placeholder="手机号码"
                className="flex-1 text-right text-sm bg-transparent outline-none placeholder-[#C4BDB5]"
                style={{ color: "#2C2420" }} />
            </div>
          </div>
        </div>

        <div className="mx-5 rounded-2xl overflow-hidden mb-4" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <div className="px-4 pt-3.5 pb-1">
            <p className="text-xs text-[#9B8E82]">安全评估（帮助咋询师提前了解您的状况）</p>
          </div>
          {([
            ["hasMentalDisease", "是否有精神类疾病诊断"],
            ["onMedication", "是否正在服用精神类药物"],
            ["hasSelfHarm", "三个月内是否有自伤行为"],
            ["hasSuicidalThought", "三个月内是否有自杀想法"],
            ["hasSuicidalBehavior", "三个月内是否有自杀行为（如制定计划等）"],
          ] as [keyof ApplicationForm, string][]).map(([key, label]) => (
            <div key={key} className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: "#F5F0EA" }}>
              <span className="text-sm text-[#5A4E44]">{label}</span>
              <YesNo value={form[key] as boolean} onChange={v => set(key, v)} />
            </div>
          ))}
        </div>

        <div className="mx-5 rounded-2xl overflow-hidden mb-4" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <textarea value={form.additionalNote ?? ""} onChange={e => set("additionalNote", e.target.value)}
            placeholder="补充说明（选填）——您可以简要描述您目前的困扰或对本次咋询的期望"
            rows={3}
            className="w-full px-4 py-3.5 text-sm bg-transparent outline-none resize-none placeholder-[#C4BDB5]"
            style={{ color: "#2C2420" }} />
        </div>

        <div id="field-agreement" className="mx-5 mb-4">
          <AgreementAccordion />
          <button type="button" onClick={() => { setAgreed(!agreed); set("consentSigned", !agreed); }}
            className="flex items-start gap-3 w-full text-left mt-3">
            <div className="mt-0.5 w-5 h-5 rounded-md flex-none flex items-center justify-center border-2 transition-colors"
              style={{ borderColor: agreed ? "var(--color-primary)" : "#C4BDB5", background: agreed ? "var(--color-primary)" : "white" }}>
              {agreed && <svg viewBox="0 0 12 10" className="w-3 h-3 fill-none stroke-white stroke-2"><polyline points="1,5 4.5,8.5 11,1" /></svg>}
            </div>
            <span className="text-sm text-[#5A4E44]">我已阅读并同意上述《MindPace 用户服务协议》</span>
          </button>
          {errorMsg && <p className="text-xs text-red-400 mt-2 pl-8">{errorMsg}</p>}
        </div>

      </div>

      <div className="px-5 pb-8 pt-3 border-t" style={{ borderColor: "#EBE7DF", background: "var(--color-bg)" }}>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="text-sm font-semibold px-5 py-3 rounded-2xl border"
            style={{ borderColor: "#E8E2D8", color: "#9B8E82" }}>
            上一步
          </button>
          <button type="button" onClick={handleSubmitClick}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-base"
            style={{ background: "var(--color-primary)" }}>
            提交预约 · ￥{priceAmount}
          </button>
        </div>
      </div>
    </div>
  );
}
