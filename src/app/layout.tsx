import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { AuthInit } from "@eazo/sdk/react";
import { UserSyncEffect } from "@/components/user-profile/user-sync-effect";

export const metadata: Metadata = {
  title: "MindPace",
  description: "神经多样性友好咨询预约平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthInit />
        <UserSyncEffect />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
