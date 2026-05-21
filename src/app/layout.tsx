import type { Metadata, Viewport } from "next";
import "./globals.css";
import { EazoProvider } from "@eazo/sdk/react";
import { cn } from "@/utils/utils";
import { Toaster } from "@/components/ui/sonner";
import { UserSyncEffect } from "@/components/user-profile/user-sync-effect";
import AppShell from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "MindPace — 神经多样性友好咨询预约",
  description: "连接神经多样性来访者与专业认证咨询师的预约平台",
  icons: { icon: "https://eazo.ai/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={cn("h-full antialiased")}>
      <body className="min-h-full flex flex-col">
        <EazoProvider>
          <UserSyncEffect />
          <AppShell>{children}</AppShell>
          <Toaster />
        </EazoProvider>
      </body>
    </html>
  );
}
