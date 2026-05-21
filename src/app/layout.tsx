import type { Metadata } from "next";
import "./globals.css";
import { AuthInit } from "@/components/user-profile/auth-init";

export const metadata: Metadata = {
  title: "MindPace",
  description: "神经多样性友好咨询师预约平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthInit />
        {children}
      </body>
    </html>
  );
}
