import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import env from "@/env";
import { Amiri, Handjet, Kufam, Tajawal } from "next/font/google";
import "./globals.css";

const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic"],
  variable: "--font-amiri",
  display: "swap",
});

const handjet = Handjet({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["arabic"],
  variable: "--font-handjet",
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
  metadataBase: new URL(env.APP_URL!),
  title: "ورد",
  description: "ورد هو أداة تتبع. قم بتتبع وقتك بسهولة، احصل على رؤى حول إنتاجيتك، وشارك تقدمك مع فريقك.",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`font-tajawal ${handjet.variable} ${kufam.variable} ${amiri.variable} ${tajawal.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
