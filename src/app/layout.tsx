import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { LanguageProvider } from "@/components/language-provider";
import { CanvasHost } from "@/webgl/CanvasHost";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import type { Lang } from "@/data/translations/types";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://albertotuveri.dev"),
  title: {
    default: "Alberto Tuveri — Software Engineer · Full-Stack + AI",
    template: "%s · Alberto Tuveri",
  },
  description:
    "Portfolio of Alberto Tuveri — full-stack & AI software engineer. From the cliffs of Pan di Zucchero to production-grade systems.",
  openGraph: {
    title: "Alberto Tuveri — Software Engineer",
    description:
      "Full-stack & AI software engineer. A cinematic, ocean-themed portfolio.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = ((await cookies()).get("lang")?.value as Lang) ?? "en";

  return (
    <html lang={lang} className={`${fraunces.variable} ${hanken.variable}`}>
      <body>
        <LanguageProvider initialLang={lang}>
          <CanvasHost />
          <SiteNav />
          {children}
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
