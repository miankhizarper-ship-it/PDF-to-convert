import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

import { site } from "@/data";
import { absoluteUrl, personJsonLd, siteUrl, websiteJsonLd } from "@/lib/seo";
import { AppShell } from "@/components/ui/AppShell";
import { Backdrop } from "@/components/ui/Backdrop";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { Cursor } from "@/components/ui/Cursor";
import { Footer } from "@/components/ui/Footer";
import { Loader } from "@/components/ui/Loader";
import { Navigation } from "@/components/ui/Navigation";
import { PageTransition } from "@/components/ui/PageTransition";
import { ScrollProgress } from "@/components/ui/ScrollProgress";

const title = `${site.brand} — ${site.name} · ${site.role}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: `%s — ${site.brand}`,
  },
  description: site.description,
  keywords: [...site.keywords],
  authors: [{ name: site.name, url: absoluteUrl("/") }],
  creator: site.name,
  publisher: site.name,
  category: "technology",
  formatDetection: { telephone: false, address: false, email: false },
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: absoluteUrl("/"),
    siteName: site.brand,
    title,
    description: site.description,
    images: [
      {
        url: absoluteUrl("/og.png"),
        width: 1200,
        height: 630,
        alt: `${site.brand} — ${site.headline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.description,
    images: [absoluteUrl("/og.png")],
    creator: "@yourhandle",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#08090C",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const structuredData = [personJsonLd(), websiteJsonLd()];

  return (
    <html lang="en" data-calm="false" data-cursor="off" suppressHydrationWarning>
      <body className="min-h-screen bg-void font-sans text-frost antialiased">
        <AppShell />
        <Backdrop />

        {/* Global overlays */}
        <Loader />
        <ScrollProgress />
        <Cursor />
        <PageTransition />
        <CommandPalette />
        <Navigation />

        <main id="main" className="relative">
          {children}
        </main>

        <Footer />

        {structuredData.map((block, index) => (
          <script
            key={index}
            type="application/ld+json"
            // Structured data is generated from our own constants, not user input.
            dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
          />
        ))}
      </body>
    </html>
  );
}
