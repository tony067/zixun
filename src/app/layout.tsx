import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { EazoProvider } from "@eazo/sdk/react";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "MindPace",
  description: "神经多样性友好咨询预约平台",
  openGraph: {
    title: "MindPace",
    description: "MindPace 是一个神经多样性友好的心理咨询预约平台，连接来访者与经过认证的咨询师。来访者可以浏览咨询师、筛选擅长领域、在线预约并支付；咨询师可以管理循环档期规则、查看每周时间轴日历、确认或拒绝预约、与来访私信沟通；管理员可以审核咨询师入驻申请并监控平台预约数据。平台界面采用温暖纸质风格，对感...",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "MindPace",
    description: "MindPace 是一个神经多样性友好的心理咨询预约平台，连接来访者与经过认证的咨询师。来访者可以浏览咨询师、筛选擅长领域、在线预约并支付；咨询师可以管理循环档期规则、查看每周时间轴日历、确认或拒绝预约、与来访私信沟通；管理员可以审核咨询师入驻申请并监控平台预约数据。平台界面采用温暖纸质风格，对感...",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <EazoProvider>
          <Toaster />
          <AppShell>{children}</AppShell>
        </EazoProvider>
      </body>
    </html>
  );
}
