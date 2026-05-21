import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { AuthInit } from "@eazo/sdk/react";

export const metadata: Metadata = {
  title: "MindPace — 神经多样性友好咨询预约",
  description: "找到适合你节奏的咨询师",
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
