import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GreenLab",
  description: "植物测量记录与环境数据可视化"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
