"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronDown, MessageSquare, Phone, Book, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQ = [
  {
    q: "如何预约咨询师？",
    a: "在首页浏览咨询师列表，点击咨询师卡片上的「预约咨询」按钮，选择咨询方式和时间，填写预约信息后提交申请，等待咨询师在24小时内确认。"
  },
  {
    q: "预约后多久会得到确认？",
    a: "咨询师通常在24小时内回复确认。确认后你会收到通知，需在规定时间内完成支付，超时订单将自动取消。"
  },
  {
    q: "如何取消预约？",
    a: "在「我的」→「全部预约」中找到对应预约，点击「取消预约」。咨询前24小时内取消将收取一定手续费，请提前与咨询师沟通。"
  },
  {
    q: "如何申请改期？",
    a: "建议先通过私信与咨询师沟通好新时间，再在预约详情页点击「修改时间」提交改期申请，等待咨询师确认后生效。"
  },
  {
    q: "咨询内容是否保密？",
    a: "我们严格遵守心理咨询保密原则，你的咨询内容绝对保密。除法律规定的危机情形（如自伤危险）外，不会透露给任何第三方。"
  },
  {
    q: "如何成为平台咨询师？",
    a: "切换到「咨询师」端口，填写完整的咨询师档案并提交审核。管理员将在3个工作日内完成资质审核，通过后即可在平台接受预约。"
  },
  {
    q: "支付方式有哪些？",
    a: "目前支持微信支付、支付宝和银行卡支付。所有支付通过加密渠道处理，平台不保存你的支付信息。"
  },
];

const CONTACTS = [
  { icon: MessageSquare, label: "在线客服", sub: "工作日 9:00-18:00", action: "chat" },
  { icon: Mail,          label: "邮件联系", sub: "support@mindpace.app", action: "mail" },
  { icon: Phone,         label: "服务热线", sub: "400-xxx-xxxx（工作日）", action: "phone" },
  { icon: Book,          label: "使用指南", sub: "新手必读·功能说明", action: "guide" },
];

export default function HelpPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [category, setCategory] = useState<string>("建议");
  const [submitted, setSubmitted] = useState(false);

  function handleContact(action: string) {
    if (action === "chat") router.push("/support");
    else if (action === "guide") router.push("/guide");
    else if (action === "mail") window.open("mailto:support@mindpace.app");
  }

  return (
    <div className="min-h-svh pb-24" style={{ background: "var(--color-bg)" }}>
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-5 pt-12 pb-3"
        style={{ background: "rgba(245,240,232,0.97)", backdropFilter: "blur(8px)", borderBottom: "1px solid #EBE7DF" }}>
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "white", border: "1px solid #EBE7DF" }}>
          <ChevronLeft className="w-5 h-5" style={{ color: "#2C2420" }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: "#2C2420" }}>帮助与反馈</h1>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* 联系方式 */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #EBE7DF" }}>
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-semibold" style={{ color: "#2C2420" }}>联系我们</h2>
          </div>
          {CONTACTS.map((c, i) => (
            <button key={c.action} onClick={() => handleContact(c.action)}
              className="w-full flex items-center justify-between px-4 py-3.5 border-t active:bg-gray-50"
              style={{ borderColor: i === 0 ? "transparent" : "#F5F0EA" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "#E8F5E0" }}>
                  <c.icon className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium" style={{ color: "#2C2420" }}>{c.label}</p>
                  <p className="text-xs" style={{ color: "#9B8E82" }}>{c.sub}</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 -rotate-90" style={{ color: "#C4B8AC" }} />
            </button>
          ))}
        </div>

        {/* 常见问题 */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #EBE7DF" }}>
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-semibold" style={{ color: "#2C2420" }}>常见问题</h2>
          </div>
          {FAQ.map((item, i) => (
            <div key={i} className="border-t" style={{ borderColor: "#F5F0EA" }}>
              <button className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span className="text-sm font-medium flex-1 mr-3" style={{ color: "#2C2420" }}>{item.q}</span>
                <ChevronDown className="w-4 h-4 flex-none transition-transform"
                  style={{ color: "#9B8E82", transform: openFaq === i ? "rotate(180deg)" : "none" }} />
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                    className="overflow-hidden">
                    <p className="px-4 pb-4 text-sm leading-relaxed" style={{ color: "#6B5E52" }}>{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* 意见反馈 */}
        <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #EBE7DF" }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "#2C2420" }}>意见反馈</h2>
          {/* 类型选择 */}
          <div className="flex gap-2 mb-3">
            {["建议", "问题", "投诉", "其他"].map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: category === cat ? "var(--color-primary)" : "#F5F0EA",
                  color: category === cat ? "white" : "#6B5E52"
                }}>
                {cat}
              </button>
            ))}
          </div>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="请描述你遇到的问题或建议，我们会认真阅读每一条反馈…"
            rows={4}
            className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none"
            style={{ background: "#F5F0E8", color: "#2C2420", border: "1px solid #EBE7DF" }} />
          <button
            disabled={!feedback.trim() || submitted}
            onClick={() => { setSubmitted(true); setFeedback(""); setTimeout(() => setSubmitted(false), 3000); }}
            className="w-full mt-3 py-3 rounded-xl text-white text-sm font-semibold transition-opacity"
            style={{
              background: submitted ? "#6B9070" : "var(--color-primary)",
              opacity: !feedback.trim() && !submitted ? 0.5 : 1
            }}>
            {submitted ? "已提交，感谢你的反馈 ✓" : "提交反馈"}
          </button>
        </div>
      </div>
    </div>
  );
}
