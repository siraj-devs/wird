import type { Metadata } from "next";
// import { Analytics } from "@vercel/analytics/react";
import { Amiri, Kufam, Tajawal } from "next/font/google";
import "./globals.css";

const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic"],
  variable: "--font-amiri",
  display: "swap",
});

const kufam = Kufam({
  weight: ["400", "600", "500", "700", "800", "900"],
  subsets: ["arabic"],
  variable: "--font-kufam",
  display: "swap",
});

const tajawal = Tajawal({
  weight: ["200", "300", "400", "500", "700"],
  subsets: ["arabic"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL!),
  title: "ورد",
  description: "The fastest way to build apps with Next.js and Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`font-tajawal ${kufam.variable} ${amiri.variable} ${tajawal.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
