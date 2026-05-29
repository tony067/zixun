"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, MessageSquare, Phone, Book, Star } from "lucide-react";

const FAQ = [
  { q: "如何预约咨询师？", a: "在首页浏览咨询师列表，点击「预约咨询」按钮，选择时间后提交预约申请，等待咨询师确认即可。" },
  { q: "预约后多久会得到确认？", a: "咨询师通常在24小时内回复确认。确认后你需要在规定时间内完成支付。" },
  { q: "如何取消预约？", a: "在「我的预约」中找到对应预约，点击「取消预约」。已支付的预约取消政策请参考平台退款规则。" },
  { q: "如何申请改期？", a: "在已确认的预约详情页中点击「申请改期」，填写希望更改的时间，等待咨询师确认。" },
  { q: "咨询内容是否保密？", a: "我们严格遵守心理咨询保密原则，除法律规定的情形外，你的咨询内容不会被泄露给任何第三方。" },
];

export default function HelpPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-svh pb-24" style={{ background: "var(--color-surface)" }}>
      <div className="sticky top-0 z-10 px-5 pt-12 pb-4 flex items-center gap-3" style={{ background: "var(--color-surface)" }}>
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "white" }}>
          <ChevronLeft className="w-5 h-5 text-[#2C2420]" />
        </button>
        <h1 className="text-lg font-bold text-[#2C2420]">帮助与反馈</h1>
      </div>
      <div className="px-5 space-y-5">
        {/* 联系方式 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: MessageSquare, label: "在线客服", color: "#9CB48A" },
            { icon: Phone,         label: "电话支持", color: "#6366F1" },
            { icon: Book,          label: "使用指南", color: "#F59E0B" },
          ].map(item => (
            <button key={item.label} className="rounded-2xl p-4 flex flex-col items-center gap-2"
              style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: item.color + "20" }}>
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <span className="text-xs font-medium text-[#2C2420]">{item.label}</span>
            </button>
          ))}
        </div>

        {/* 常见问题 */}
        <div>
          <h2 className="text-base font-bold text-[#2C2420] mb-3">常见问题</h2>
          <div className="rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            {FAQ.map((faq, i) => (
              <div key={i} className={i < FAQ.length - 1 ? "border-b border-[#F0EBE3]" : ""}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left">
                  <span className="text-sm font-semibold text-[#2C2420] flex-1 pr-2">{faq.q}</span>
                  <ChevronRight className={`w-4 h-4 text-[#C4BDB5] flex-shrink-0 transition-transform ${openFaq === i ? "rotate-90" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-3.5">
                    <p className="text-sm text-[#9B8E82] leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 意见反馈 */}
        <div>
          <h2 className="text-base font-bold text-[#2C2420] mb-3">意见反馈</h2>
          <div className="rounded-2xl p-4" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            {/* 评分 */}
            <p className="text-sm text-[#9B8E82] mb-3">你对平台的整体满意度</p>
            <div className="flex gap-2 mb-4">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className="w-8 h-8" style={{ color: "#F59E0B", fill: "#F59E0B" }} />
              ))}
            </div>
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
              placeholder="告诉我们你的想法或遇到的问题…"
              className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none"
              style={{ background: "#F5F0E8", color: "#2C2420", minHeight: 100 }} />
            <button onClick={() => { setSubmitted(true); setFeedback(""); }}
              className="w-full mt-3 py-3 rounded-xl text-white text-sm font-semibold"
              style={{ background: submitted ? "#6B9070" : "#9CB48A" }}>
              {submitted ? "已提交，感谢反馈 ✓" : "提交反馈"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
