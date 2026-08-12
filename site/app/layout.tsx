import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { DemoModal } from "@/components/marketing/DemoModal";
import { AppProviders } from "@/components/providers/AppProviders";
import { PageTransition } from "@/components/shared/PageTransition";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://surum-site.pages.dev"),
  title: {
    default: "SÜRÜM | Akıllı Çiftlik Yönetim Sistemi",
    template: "%s | SÜRÜM",
  },
  description:
    "Sürü, tarla, mahsul, stok ve kamera yönetimini tek platformda buluşturan akıllı çiftlik yönetim sistemi.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    locale: "tr_TR",
    type: "website",
    siteName: "SÜRÜM",
    title: "SÜRÜM | Akıllı Çiftlik Yönetim Sistemi",
    description:
      "Çiftliğinizin tüm süreçlerini akıllı tasma, kamera ve bulut teknolojileriyle tek platformdan yönetin.",
    images: [
      {
        url: "/og-surum.png",
        width: 1200,
        height: 630,
        alt: "SÜRÜM Akıllı Çiftlik Yönetim Sistemi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SÜRÜM | Akıllı Çiftlik Yönetim Sistemi",
    description: "Çiftliğinizin geleceği, verinizde.",
    images: ["/og-surum.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" data-theme="light" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppProviders>
          <SiteHeader />
          <PageTransition>{children}</PageTransition>
          <SiteFooter />
          <DemoModal />
        </AppProviders>
      </body>
    </html>
  );
}
