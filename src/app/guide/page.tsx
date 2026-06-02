"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SECTIONS = [
  {
    emoji: "🧠", title: "什么是心理咨询？",
    short: "一个安全、保密的空间，帮助你了解自己。",
    content: `心理咨询是一个安全、保密的空间，由经过专业训练的咨询师陪伴你探索内心、处理困扰。

它不是「聊天」，也不是「被教导」，而是帮助你更了解自己、找到属于自己的方式。

咨询关系是平等的——你始终是自己生命的专家，咨询师的作用是陪伴和引导，而不是替你做决定。`,
  },
  {
    emoji: "🌈", title: "神经多样性是什么？",
    short: "ADHD、ASD 等不是「病」，而是不同的大脑方式。",
    content: `神经多样性（Neurodiversity）指的是人类大脑和神经系统的自然多样性，包括 ADHD、ASD（自闭症谱系）、读写障碍等。

这些不是「病」，而是不同的认知和感知方式。神经多样性人群往往有独特的优势——专注力、创造力、模式识别能力——同时在某些环境中也面临额外的挑战。

MindPace 专注于为神经多样性人群提供真正「懂你大脑」的支持。`,
  },
  {
    emoji: "🔍", title: "如何选择适合的咨询师？",
    short: "关注擅长领域、咨询方式和「合不合得来」。",
    content: `选择咨询师时，你可以关注这几点：

① 擅长领域：咨询师的专长是否和你的困扰匹配？比如 ADHD、ASD、焦虑、亲密关系等。

② 咨询方式：视频、语音还是面对面？哪种让你感觉更舒适？

③ 价格：是否在你的预算范围内？有些咨询师提供浮动收费，可以直接沟通。

④ 「感觉对了」：第一次咨询结束后，你有没有感觉被听见、被理解？这很重要。

不用第一次就「找到最完美的」，可以先试试，再慢慢找到适合自己的人。`,
  },
  {
    emoji: "💬", title: "第一次咨询会发生什么？",
    short: "初始访谈，不需要准备太多，放松就好。",
    content: `第一次通常是「初始访谈」——咨询师会了解你来访的原因、背景和期望。

你不需要准备很多，也不需要「想好怎么说」。放松地说说自己的情况就好——哪怕只是「我也不知道从哪里说起」，这本身就是一个很好的开始。

第一次也是你评估咨询师是否适合自己的机会。你可以问咨询师任何关于咨询方式、保密原则、费用等问题。`,
  },
  {
    emoji: "📅", title: "咨询的频率和周期？",
    short: "通常每1-2周一次，没有固定标准。",
    content: `大多数咨询每 1-2 周一次，每次 50 分钟左右。

一般建议先做 3-6 次，再决定是否继续。有的人咨询几次就有很大收获，有的人会长期咨询陪伴自己成长——没有固定标准，跟随自己的节奏就好。

如果需要调整频率，可以直接和咨询师沟通。`,
  },
  {
    emoji: "🔒", title: "关于保密原则",
    short: "咨询内容严格保密，只有三种例外情况。",
    content: `咨询内容严格保密——咨询师不会向任何人透露你分享的内容。

以下三种情况是法律规定的例外：
① 你有伤害自己或他人的具体计划
② 涉及儿童虐待
③ 法院命令

在开始咨询前，咨询师会和你详细说明保密协议的内容。`,
  },
  {
    emoji: "💡", title: "关于督导咨询",
    short: "督导是咨询师的「咨询师」，对来访者也有帮助。",
    content: `督导（Supervision）是咨询师定期接受的专业支持——由更有经验的督导师帮助咨询师处理工作中的盲点、提升专业能力。

对来访者来说，你的咨询师接受督导是一件好事：这意味着你的案例会受到更多专业眼光的关注（匿名），咨询师也会持续成长。

如果你有兴趣，也可以直接预约平台的督导师进行「督导式咨询」。`,
  },
  {
    emoji: "❓", title: "咨询适合我吗？",
    short: "不确定？来了解一下，这本身就是一个好的开始。",
    content: `你不需要「足够严重」才值得咨询。

如果你：
• 感到持续的压力、焦虑或情绪低落
• 在某些关系或情境中反复卡住
• 想更了解自己的行为模式
• 只是想有一个安全的地方说说话

……那么咨询可能对你有帮助。

最好的方式是预约一次初始访谈，看看感觉如何。`,
  },
];

export default function GuidePage() {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-bg)" }}>
      {/* 顶栏 */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 sticky top-0 z-10"
        style={{ background: "rgba(245,240,232,0.96)", backdropFilter: "blur(8px)", borderBottom: "1px solid #EBE7DF" }}>
        <button onClick={() => router.back()} className="p-1.5 rounded-full" style={{ background: "#EBE7DF" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "#5A4E44" }} />
        </button>
        <div>
          <h1 className="text-base font-bold" style={{ color: "#2C2420" }}>新手必读</h1>
          <p className="text-xs" style={{ color: "#9B8E82" }}>了解心理咨询与神经多样性</p>
        </div>
      </div>

      {/* Banner */}
      <div className="mx-4 mt-5 mb-4 rounded-2xl px-5 py-5"
        style={{ background: "linear-gradient(145deg, #8BAE80 0%, #9BBC90 50%, #C9DAB8 100%)" }}>
        <p className="text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.85)" }}>MindPace 指南</p>
        <h2 className="text-xl font-bold text-white mb-2">开始之前，你需要知道的事</h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.9)" }}>
          8 个问题，帮助你从零开始了解心理咨询。
        </p>
      </div>

      {/* 折叠卡片 */}
      <div className="px-4 space-y-2.5">
        {SECTIONS.map((s, i) => (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #EBE7DF" }}>
            <button onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
              <span className="text-xl flex-none">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "#2C2420" }}>{s.title}</p>
                {open !== i && <p className="text-xs mt-0.5 truncate" style={{ color: "#9B8E82" }}>{s.short}</p>}
              </div>
              <ChevronDown className="w-4 h-4 flex-none transition-transform duration-200"
                style={{ color: "#9B8E82", transform: open === i ? "rotate(180deg)" : "none" }} />
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                  transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="px-5 pb-5 border-t" style={{ borderColor: "#F0EBE4" }}>
                    <p className="text-sm leading-relaxed pt-4 whitespace-pre-line" style={{ color: "#5C5552" }}>
                      {s.content}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* 底部 CTA */}
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
