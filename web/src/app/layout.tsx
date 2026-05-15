import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClickIdCapture } from "@/components/analytics/ClickIdCapture";
import { GlobalAnalytics } from "@/components/analytics/GlobalAnalytics";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { rsBody, rsDisplay } from "@/lib/fonts";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Rocha Smart — Magazine tech & casa inteligente",
    template: "%s | Rocha Smart",
  },
  description:
    "Magazine digital de tecnologia e casa inteligente: produtos em destaque, ficha com compatibilidade e link para fechar no site oficial — conteúdo e curadoria, sem carrinho aqui.",
  applicationName: "Rocha Smart",
  authors: [{ name: "Rocha Smart" }],
  creator: "Rocha Smart",
  publisher: "Rocha Smart",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Rocha Smart",
    title: "Rocha Smart — Magazine tech & casa inteligente",
    description:
      "Magazine digital de tecnologia e casa inteligente: produtos em destaque, ficha com compatibilidade e link para fechar no site oficial — conteúdo e curadoria, sem carrinho aqui.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rocha Smart — Magazine tech & casa inteligente",
    description:
      "Magazine digital de tecnologia e casa inteligente: produtos em destaque, ficha com compatibilidade e link para fechar no site oficial — conteúdo e curadoria, sem carrinho aqui.",
  },
};

export const viewport: Viewport = {
  themeColor: "#050508",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${rsDisplay.variable} ${rsBody.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-[#050508] text-zinc-100">
        <GlobalAnalytics />
        <ClickIdCapture />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
