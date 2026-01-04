import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "2026 Fitness Challenge",
  description: "100 Days Fitness Challenge Tracker",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // 让内容延伸到状态栏下方
    title: "Fitness2026",
  },
};

// 关键配置：设置状态栏颜色和视口覆盖
export const viewport: Viewport = {
  themeColor: "#0f172a", // 与背景色一致的深蓝色，防止出现杂色条
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 禁止缩放，模拟原生 App 体验
  viewportFit: "cover", // 让内容铺满刘海屏和底部横条区域
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
