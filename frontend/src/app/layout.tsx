import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "ST Manager — Quản lý vai trò",
  description: "Ứng dụng quản lý vai trò (Next.js + Spring Boot)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${sourceSans.variable} h-full`}>
      <body
        className={`${sourceSans.className} min-h-full flex flex-col font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
