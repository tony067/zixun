import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { AuthInit } from "@/lib/auth";

export const metadata: Metadata = {
  title: "MindPace — 神经多样性友好咨询平台",
  description: "预约神经多样性友好咨询师，管理档期与来访。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthInit />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
