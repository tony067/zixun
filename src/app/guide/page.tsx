"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, BookOpen, Brain, Users, CalendarCheck, Shield, Clock, FileText, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SECTIONS = [
  { icon: BookOpen, title: "什么是心理咨询？", short: "一个安全、保密的空间，帮助你了解自己。", content: `心理咨询是一个安全、保密的空间，由经过专业训练的咨询师陪伴你探索内心、处理困扰。\n\n它不是「聊天」，也不是「被教导」，而是帮助你更了解自己、找到属于自己的方式。\n\n咨询关系是平等的——你始终是自己生命的专家，咨询师的作用是陪伴和引导，而不是替你做决定。` },
  { icon: Brain, title: "神经多样性是什么？", short: "ADHD、ASD 等不是「病」，而是不同的大脑方式。", content: `神经多样性（Neurodiversity）指的是人类大脑和神经系统的自然多样性，包括 ADHD、ASD（自闭症谱系）、读写障碍等。\n\n这些不是「病」，而是不同的认知和感知方式。神经多样性人群往往有独特的优势——专注力、创造力、模式识别能力——同时在某些环境中也面临额外的挑战。\n\nMindPace 专注于为神经多样性人群提供真正「懂你大脑」的支持。` },
  { icon: Users, title: "如何选择适合的咨询师？", short: "关注擅长领域、咨询方式和「合不合得来」。", content: `选择咨询师时，你可以关注这几点：\n\n① 擅长领域：咨询师的专长是否和你的困扰匹配？\n② 咨询方式：视频还是面对面？哪种让你感觉更舒适？\n③ 价格：是否在你的预算范围内？\n④ 「感觉对了」：第一次咨询结束后，你有没有感觉被听见？` },
  { icon: CalendarCheck, title: "第一次咨询会发生什么？", short: "初始访谈，不需要准备太多，放松就好。", content: `第一次通常是「初始访谈」——咨询师会了解你来访的原因、背景和期望。\n\n你不需要准备很多，放松地说说自己的情况就好——哪怕只是「我也不知道从哪里说起」，这本身就是一个很好的开始。` },
  { icon: Shield, title: "咨询的频率和周期？", short: "通常每1-2周一次，没有固定标准。", content: `大多数咨询每 1-2 周进行一次，每次 50-60 分钟。\n\n短期目标性咨询通常 6-12 次；长期深度工作可能持续一年以上。没有「应该做多久」的标准——完全由你和咨询师共同决定。` },
  { icon: Clock, title: "关于保密原则", short: "咨询内容受保密保护，有限例外请了解。", content: `咨询内容受严格保密保护。除以下有限情形外，咨询师不会向任何第三方透露：\n\n• 你有伤害自己或他人的紧迫风险\n• 涉及未成年人保护的法定报告义务\n• 法院要求披露` },
  { icon: FileText, title: "预约和取消政策", short: "请提前 24 小时取消，避免产生费用。", content: `请至少提前 24 小时取消或改期，否则可能按全额或部分收费。\n\n具体政策以各咨询师的说明为准，可在其主页「咨询设置」板块查看。` },
];

export default function GuidePage() {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--color-bg)" }}>
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: "rgba(245,240,232,0.95)", backdropFilter: "blur(8px)", borderColor: "#DDD8D0" }}>
        <button onClick={() => router.back()} className="p-1.5 rounded-full" style={{ background: "#EBE7DF" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "#5A4E44" }} />
        </button>
        <h1 className="text-base font-bold" style={{ color: "#2C2420" }}>新手必读</h1>
      </div>

      <div className="mx-4 mt-4 mb-5 rounded-2xl px-5 py-6 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #8BAE80 0%, #9BBC90 35%, #B8D0AA 65%, #C9DAB8 100%)" }}>
        <p className="text-white text-lg font-bold leading-snug mb-1">在这里，你的节奏就是对的节奏</p>
        <p className="text-white text-sm" style={{ opacity: 0.85 }}>了解咨询流程，找到适合自己的支持。</p>
      </div>

      <div className="px-4 space-y-2">
        {SECTIONS.map((s, i) => (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #EBE7DF" }}>
            <button onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left">
              <div className="flex-1 pr-3 flex items-center gap-2.5">
                {s.icon && <s.icon className="w-4 h-4 flex-none" style={{ color: "var(--color-primary)" }} />}
                <p className="text-sm font-semibold" style={{ color: "#2C2420" }}>{s.title}</p>
                {open !== i && <p className="text-xs mt-0.5" style={{ color: "#9B8E82" }}>{s.short}</p>}
              </div>
              <ChevronDown className="w-4 h-4 flex-none transition-transform"
                style={{ color: "#9B8E82", transform: open === i ? "rotate(180deg)" : "none" }} />
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                  <p className="px-4 pb-4 pt-3 text-sm leading-relaxed whitespace-pre-line border-t"
                    style={{ color: "#5A4E44", borderColor: "#F0EBE4" }}>
                    {s.content}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="px-4 mt-6">
        <button onClick={() => router.push("/")}
          className="w-full py-3.5 rounded-2xl text-white font-bold"
          style={{ background: "var(--color-primary)" }}>
          浏览咨询师
        </button>
        <p className="text-xs text-center mt-3" style={{ color: "#9B8E82" }}>
          有更多问题？可以在预约时直接向咨询师提问。
        </p>
      </div>
    </div>
  );
}
