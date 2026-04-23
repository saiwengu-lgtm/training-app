import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "企业培训系统",
  description: "在线培训与考试平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
