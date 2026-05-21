import type { Metadata } from "next";
import "./globals.css";
import { AuthInit } from "@/components/auth-init";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "MindPace",
  description: "神经多样性友好咨询预约平台",
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
