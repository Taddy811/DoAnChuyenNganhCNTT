import type { Metadata } from "next";
// 1. Đổi sang import font Inter
import { Inter } from "next/font/google";


import "./globals.css";

// 2. Khai báo font Inter với subset "vietnamese"
const inter = Inter({
  subsets: ["latin", "vietnamese"], // ĐÂY LÀ CHÌA KHÓA SỬA LỖI FONT
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "E-LEARNING LMS",
  description: "Hệ thống quản lý học tập trực tuyến",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('theme');
                if (!theme) {
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.classList.toggle('dark', theme === 'dark');
                document.documentElement.dataset.theme = theme;
                document.documentElement.style.colorScheme = theme;
                document.body?.classList.toggle('dark', theme === 'dark');
                if (document.body) document.body.dataset.theme = theme;
              } catch (e) {}
            `,
          }}
        />
      </head>
      {/* 3. Áp dụng font Inter vào thẻ body */}
      <body className={`${inter.className} ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
