import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jane App",
  description: "Nest API console & GitHub profile viewer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
