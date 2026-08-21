import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";

import { AppProviders } from "@/components/providers/AppProviders";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  const description =
    "Sürü, tarla, stok, finans, kamera ve alarm yönetimini tek platformda birleştiren akıllı çiftlik operasyon paneli.";

  return {
    metadataBase,
    title: {
      default: "Basaranciftligim | Yenilikçi Çiftlik Yönetim Sistemi",
      template: "%s | Basaranciftligim",
    },
    description,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      title: "Entegre Sürü | Çiftliğiniz Parmaklarınızın Ucunda",
      description,
      images: [{ url: "/og.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Entegre Sürü | Çiftliğiniz Parmaklarınızın Ucunda",
      description,
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem("entegre-theme");
                  if (saved === "dark" || saved === "light") {
                    document.documentElement.setAttribute("data-theme", saved);
                  } else {
                    var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                    document.documentElement.setAttribute("data-theme", systemDark ? "dark" : "light");
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
