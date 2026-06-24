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
            {v ? "\u662f" : "\u5426"}
          </span>
        </button>
      ))}
    </div>
  );
}

const AGREE_LINES = [
  "MindPace \u7528\u6237\u670d\u52a1\u534f\u8bae",
  "",
  "\u6b22\u8fce\u4f7f\u7528 MindPace \u5fc3\u7406\u548b\u8be2\u5e73\u53f0\u3002\u5728\u60a8\u63d0\u4ea4\u9884\u7ea6\u524d\uff0c\u8bf7\u4ed4\u7ec6\u9605\u8bfb\u4ee5\u4e0b\u6761\u6b3e\u3002\u63d0\u4ea4\u9884\u7ea6\u5373\u8868\u793a\u60a8\u5df2\u9605\u8bfb\u3001\u7406\u89e3\u5e76\u540c\u610f\u672c\u534f\u8bae\u7684\u5168\u90e8\u5185\u5bb9\u3002",
  "",
  "\u4e00\u3001\u5e73\u53f0\u670d\u52a1\u8bf4\u660e",
  "MindPace \u4f5c\u4e3a\u7b2c\u4e09\u65b9\u5fc3\u7406\u548b\u8be2\u9884\u7ea6\u5e73\u53f0\uff0c\u8d1f\u8d23\u4e3a\u7528\u6237\u63d0\u4f9b\u548b\u8be2\u5e08\u5339\u914d\u3001\u9884\u7ea6\u7ba1\u7406\u53ca\u8ba2\u5355\u5904\u7406\u670d\u52a1\u3002\u5e73\u53f0\u5bf9\u5165\u9a7b\u548b\u8be2\u5e08\u8fdb\u884c\u8d44\u8d28\u5ba1\u6838\uff0c\u4f46\u548b\u8be2\u670d\u52a1\u7531\u548b\u8be2\u5e08\u672c\u4eba\u72ec\u7acb\u63d0\u4f9b\uff0c\u5e73\u53f0\u4e0d\u5bf9\u5177\u4f53\u548b\u8be2\u8fc7\u7a0b\u53ca\u6548\u679c\u4f5c\u51fa\u4fdd\u8bc1\u3002",
  "",
  "\u4e8c\u3001\u7528\u6237\u4fe1\u606f\u4fdd\u62a4",
  "\u60a8\u586b\u5199\u7684\u4e2a\u4eba\u4fe1\u606f\uff08\u5305\u62ec\u59d3\u540d\u3001\u624b\u673a\u53f7\u3001\u548b\u8be2\u76ee\u7684\u7b49\uff09\u4ec5\u7528\u4e8e\u672c\u6b21\u9884\u7ea6\u53ca\u76f8\u5173\u670d\u52a1\uff0c\u5e73\u53f0\u5c06\u4f9d\u636e\u9002\u7528\u6cd5\u5f8b\u6cd5\u89c4\u59a5\u5584\u4fdd\u7ba1\uff0c\u672a\u7ecf\u60a8\u540c\u610f\u4e0d\u4f1a\u5411\u7b2c\u4e09\u65b9\u62ab\u9732\u3002\u4ee5\u4e0b\u60c5\u51b5\u9664\u5916\uff1a\u60a8\u4e3b\u52a8\u540c\u610f\u516c\u5f00\uff1b\u5b58\u5728\u4f24\u5bb3\u81ea\u8eab\u6216\u4ed6\u4eba\u7684\u7d27\u8feb\u5371\u9669\uff1b\u6cd5\u5f8b\u6cd5\u89c4\u8981\u6c42\u5f3a\u5236\u62ab\u9732\u3002",
  "",
  "\u4e09\u3001\u9884\u7ea6\u4e0e\u53d6\u6d88\u653f\u7b56",
  "\u9884\u7ea6\u63d0\u4ea4\u540e\u987b\u5728\u548b\u8be2\u5e08\u786e\u8ba4\u524d\u5b8c\u6210\u53d6\u6d88\u64cd\u4f5c\uff0c\u5426\u5219\u89c6\u4e3a\u6709\u6548\u9884\u7ea6\u3002\u786e\u8ba4\u540e\u5982\u9700\u53d6\u6d88\u6216\u6539\u671f\uff0c\u8bf7\u81f3\u5c11\u63d0\u524d 24 \u5c0f\u65f6\u901a\u77e5\uff0c24 \u5c0f\u65f6\u5185\u53d6\u6d88\u53ef\u80fd\u4e0d\u4e88\u9000\u6b3e\u3002\u5177\u4f53\u9000\u6b3e\u89c4\u5219\u4ee5\u5e73\u53f0\u5f53\u65f6\u516c\u793a\u7684\u653f\u7b56\u4e3a\u51c6\u3002",
  "",
  "\u56db\u3001\u8d39\u7528\u4e0e\u652f\u4ed8",
  "\u548b\u8be2\u8d39\u7528\u4ee5\u9884\u7ea6\u65f6\u9875\u9762\u5c55\u793a\u4e3a\u51c6\u3002\u5e73\u53f0\u8d1f\u8d23\u6536\u6b3e\uff0c\u548b\u8be2\u5b8c\u6210\u540e\u6309\u7ea6\u5b9a\u6bd4\u4f8b\u7ed3\u7b97\u7ed9\u548b\u8be2\u5e08\u3002",
  "",
  "\u4e94\u3001\u7d27\u6025\u60c5\u51b5\u58f0\u660e",
  "\u672c\u5e73\u53f0\u63d0\u4f9b\u7684\u5fc3\u7406\u548b\u8be2\u670d\u52a1\u4e0d\u5c5e\u4e8e\u5371\u673a\u5e72\u9884\u6216\u7d27\u6025\u533b\u7597\u670d\u52a1\u3002\u82e5\u60a8\u6216\u4ed6\u4eba\u5904\u4e8e\u7d27\u6025\u5371\u9669\u4e2d\uff0c\u8bf7\u7acb\u5373\u62e8\u6253 110\u3001120 \u6216\u5fc3\u7406\u63f4\u52a9\u70ed\u7ebf 400-161-9995\u3002",
  "",
  "\u516d\u3001\u514d\u8d23\u58f0\u660e",
  "\u56e0\u4e0d\u53ef\u6297\u529b\u3001\u548b\u8be2\u5e08\u4e2a\u4eba\u539f\u56e0\u6216\u7528\u6237\u81ea\u8eab\u539f\u56e0\u5bfc\u81f4\u7684\u548b\u8be2\u4e2d\u65ad\u6216\u6548\u679c\u4e0d\u8fbe\u9884\u671f\uff0c\u5e73\u53f0\u4e0d\u627f\u62c5\u8fde\u5e26\u8d23\u4efb\uff0c\u4f46\u5c06\u534f\u52a9\u7528\u6237\u8fdb\u884c\u5408\u7406\u7ef4\u6743\u3002",
  "",
  "\u4e03\u3001\u534f\u8bae\u4fee\u6539",
  "\u5e73\u53f0\u4fdd\u7559\u5728\u6cd5\u5f8b\u5141\u8bb8\u8303\u56f4\u5185\u4fee\u6539\u672c\u534f\u8bae\u7684\u6743\u5229\uff0c\u4fee\u6539\u540e\u5c06\u5728\u5e73\u53f0\u663e\u8457\u4f4d\u7f6e\u516c\u793a\u3002\u7ee7\u7eed\u4f7f\u7528\u5e73\u53f0\u670d\u52a1\u89c6\u4e3a\u63a5\u53d7\u4fee\u6539\u540e\u7684\u534f\u8bae\u3002",
];

function AgreementAccordion() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden mb-1" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full px-4 py-3.5 flex items-center justify-between text-left">
        <span className="text-sm text-[#5A4E44] font-medium">MindPace \u7528\u6237\u670d\u52a1\u534f\u8bae</span>
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
      setErrorMsg("\u8bf7\u586b\u5199\u771f\u5b9e\u59d3\u540d");
      document.getElementById("field-name")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!form.phone.trim()) {
      setErrorMsg("\u8bf7\u586b\u5199\u624b\u673a\u53f7");
      document.getElementById("field-phone")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (form.purposes.length === 0) {
      setErrorMsg("\u8bf7\u81f3\u5c11\u9009\u62e9\u4e00\u9879\u548b\u8be2\u76ee\u7684");
      document.getElementById("field-purposes")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!agreed) {
      setErrorMsg("\u8bf7\u9605\u8bfb\u5e76\u52fe\u9009\u300aMindPace \u7528\u6237\u670d\u52a1\u534f\u8bae\u300b");
      document.getElementById("field-agreement")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onNext(form, agreed);
  }

  const WEEKDAY = ["\u5468\u65e5", "\u5468\u4e00", "\u5468\u4e8c", "\u5468\u4e09", "\u5468\u56db", "\u5468\u4e94", "\u5468\u516d"];
  const dateStr = date.getMonth() + 1 + "\u6708" + date.getDate() + "\u65e5 " + WEEKDAY[date.getDay()] + " " + slot.start + "\u2013" + slot.end;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pb-6">

        <div className="mx-5 mt-4 mb-5 rounded-2xl p-4" style={{ background: "#E8DFCC" }}>
          <p className="text-xs text-[#9B8E82] mb-1">\u9884\u7ea6\u6458\u8981</p>
          <p className="text-sm font-semibold text-[#2C2420]">{counselorName}</p>
          <p className="text-sm text-[#5A4E44] mt-0.5">{mode} · {durationMinutes} \u5206\u949f · \uffe5{priceAmount}</p>
          <p className="text-sm text-[#5A4E44]">{dateStr}</p>
        </div>

        <div id="field-name" className="mx-5 rounded-2xl overflow-hidden mb-4" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <div className="px-4 py-3.5 border-b" style={{ borderColor: "#F5F0EA" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5A4E44] w-24 flex-none">\u771f\u5b9e\u59d3\u540d <span className="text-[#E07A5F] text-xs">*</span></span>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="\u8bf7\u586b\u5199\u771f\u5b9e\u59d3\u540d\uff08\u975e\u6635\u79f0\uff09"
                className="flex-1 text-right text-sm bg-transparent outline-none placeholder-[#C4BDB5]"
                style={{ color: "#2C2420" }} />
            </div>
          </div>
          <div id="field-phone" className="px-4 py-3.5 border-b" style={{ borderColor: "#F5F0EA" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5A4E44] w-24 flex-none">\u624b\u673a\u53f7 <span className="text-red-400 text-xs">*</span></span>
              <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                placeholder="\u5fc5\u586b"
                className="flex-1 text-right text-sm bg-transparent outline-none placeholder-[#C4BDB5]"
                style={{ color: "#2C2420" }} />
            </div>
          </div>
          <div className="px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5A4E44] w-24 flex-none">\u5fae\u4fe1\u53f7 <span className="text-xs text-[#C4BDB5]">\u9009\u586b</span></span>
              <input value={form.wechat ?? ""} onChange={e => set("wechat", e.target.value)}
                placeholder="\u9009\u586b"
                className="flex-1 text-right text-sm bg-transparent outline-none placeholder-[#C4BDB5]"
                style={{ color: "#2C2420" }} />
            </div>
            <p className="text-xs mt-1 text-right" style={{ color: "#C4BDB5" }}>\u5c0f\u7a0b\u5e8f\u7248\u672c\u4e0a\u7ebf\u540e\u53ef\u81ea\u52a8\u8bfb\u53d6</p>
          </div>
        </div>

        <div id="field-purposes" className="mx-5 rounded-2xl overflow-hidden mb-4" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <div className="px-4 py-3.5">
            <p className="text-sm text-[#5A4E44] mb-2">\u548b\u8be2\u76ee\u7684 <span className="text-red-400">*</span><span className="text-xs text-[#9B8E82] ml-1">\u53ef\u591a\u9009</span></p>
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
            {form.purposes.includes("\u5176\u4ed6") && (
              <input value={form.purposeOther ?? ""} onChange={e => set("purposeOther", e.target.value)}
                placeholder="\u8bf7\u7b80\u5355\u63cf\u8ff0\uff08\u9009\u586b\uff09"
                className="mt-2 w-full text-sm bg-[#FAF8F5] rounded-xl px-3 py-2 outline-none placeholder-[#C4BDB5]"
                style={{ color: "#2C2420", border: "1px solid #EBE7DF" }} />
            )}
          </div>
        </div>

        <div className="mx-5 rounded-2xl overflow-hidden mb-4" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs text-[#9B8E82]">\u7d27\u6025\u8054\u7cfb\u4eba</p>
          </div>
          <div className="px-4 py-3.5 border-t" style={{ borderColor: "#F5F0EA" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5A4E44] w-24 flex-none">\u59d3\u540d</span>
              <input value={form.emergencyName ?? ""} onChange={e => set("emergencyName", e.target.value)}
                placeholder="\u7d27\u6025\u8054\u7cfb\u4eba\u59d3\u540d"
                className="flex-1 text-right text-sm bg-transparent outline-none placeholder-[#C4BDB5]"
                style={{ color: "#2C2420" }} />
            </div>
          </div>
          <div className="px-4 py-3.5 border-t" style={{ borderColor: "#F5F0EA" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5A4E44] w-24 flex-none">\u7535\u8bdd</span>
              <input type="tel" value={form.emergencyPhone ?? ""} onChange={e => set("emergencyPhone", e.target.value)}
                placeholder="\u624b\u673a\u53f7\u7801"
                className="flex-1 text-right text-sm bg-transparent outline-none placeholder-[#C4BDB5]"
                style={{ color: "#2C2420" }} />
            </div>
          </div>
        </div>

        <div className="mx-5 rounded-2xl overflow-hidden mb-4" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <div className="px-4 pt-3.5 pb-1">
            <p className="text-xs text-[#9B8E82]">\u5b89\u5168\u8bc4\u4f30\uff08\u5e2e\u52a9\u548b\u8be2\u5e08\u63d0\u524d\u4e86\u89e3\u60a8\u7684\u72b6\u51b5\uff09</p>
          </div>
          {([
            ["hasMentalDisease", "\u662f\u5426\u6709\u7cbe\u795e\u7c7b\u75be\u75c5\u8bca\u65ad"],
            ["onMedication", "\u662f\u5426\u6b63\u5728\u670d\u7528\u7cbe\u795e\u7c7b\u836f\u7269"],
            ["hasSelfHarm", "\u8fd1\u671f\u662f\u5426\u6709\u81ea\u4f24\u884c\u4e3a"],
            ["hasSuicidalThought", "\u8fd1\u671f\u662f\u5426\u6709\u81ea\u6740\u60f3\u6cd5"],
            ["hasSuicidalBehavior", "\u8fd1\u671f\u662f\u5426\u6709\u81ea\u6740\u884c\u4e3a\uff08\u5982\u5236\u5b9a\u8ba1\u5212\u7b49\uff09"],
          ] as [keyof ApplicationForm, string][]).map(([key, label]) => (
            <div key={key} className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: "#F5F0EA" }}>
              <span className="text-sm text-[#5A4E44]">{label}</span>
              <YesNo value={form[key] as boolean} onChange={v => set(key, v)} />
            </div>
          ))}
        </div>

        <div className="mx-5 rounded-2xl overflow-hidden mb-4" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <textarea value={form.additionalNote ?? ""} onChange={e => set("additionalNote", e.target.value)}
            placeholder="\u8865\u5145\u8bf4\u660e\uff08\u9009\u586b\uff09\u2014\u2014\u60a8\u53ef\u4ee5\u7b80\u8981\u63cf\u8ff0\u60a8\u76ee\u524d\u7684\u56f0\u6270\u6216\u5bf9\u672c\u6b21\u548b\u8be2\u7684\u671f\u671b"
            rows={3}
            className="w-full px-4 py-3.5 text-sm bg-transparent outline-none resize-none placeholder-[#C4BDB5]"
            style={{ color: "#2C2420" }} />
        </div>

        <div id="field-agreement" className="mx-5 mb-4">
          <AgreementAccordion />
          <button type="button" onClick={() => setAgreed(!agreed)}
            className="flex items-start gap-3 w-full text-left mt-3">
            <div className="mt-0.5 w-5 h-5 rounded-md flex-none flex items-center justify-center border-2 transition-colors"
              style={{ borderColor: agreed ? "var(--color-primary)" : "#C4BDB5", background: agreed ? "var(--color-primary)" : "white" }}>
              {agreed && <svg viewBox="0 0 12 10" className="w-3 h-3 fill-none stroke-white stroke-2"><polyline points="1,5 4.5,8.5 11,1" /></svg>}
            </div>
            <span className="text-sm text-[#5A4E44]">\u6211\u5df2\u9605\u8bfb\u5e76\u540c\u610f\u4e0a\u8ff0\u300aMindPace \u7528\u6237\u670d\u52a1\u534f\u8bae\u300b</span>
          </button>
          {errorMsg && <p className="text-xs text-red-400 mt-2 pl-8">{errorMsg}</p>}
        </div>

      </div>

      <div className="px-5 pb-8 pt-3 border-t" style={{ borderColor: "#EBE7DF", background: "var(--color-bg)" }}>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="text-sm font-semibold px-5 py-3 rounded-2xl border"
            style={{ borderColor: "#E8E2D8", color: "#9B8E82" }}>
            \u4e0a\u4e00\u6b65
          </button>
          <button type="button" onClick={handleSubmitClick}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-base"
            style={{ background: "var(--color-primary)" }}>
            \u63d0\u4ea4\u9884\u7ea6 · \uffe5{priceAmount}
          </button>
        </div>
      </div>
    </div>
  );
}
