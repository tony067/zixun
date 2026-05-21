import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { EazoProvider } from "@eazo/sdk/react";

export const metadata: Metadata = {
  title: "MindPace",
  description: "神经多样性友好咨询预约平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <EazoProvider>
          <AppShell>{children}</AppShell>
        </EazoProvider>
      </body>
    </html>
  );
}
