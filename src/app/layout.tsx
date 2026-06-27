import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { LanguageProvider } from "@/components/language-provider";
import { CanvasHost } from "@/webgl/CanvasHost";
import { ScrollProvider } from "@/components/scroll-provider";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import type { Lang } from "@/data/translations/types";
import { en } from "@/data/translations/en";
import { it } from "@/data/translations/it";
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

export const viewport: Viewport = {
  themeColor: "#07222e",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = ((await cookies()).get("lang")?.value as Lang) ?? "en";
  const dict = lang === "it" ? it : en;

  // Person structured data (schema.org) — real links only (no invented profiles).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Alberto Tuveri",
    jobTitle: "Software Engineer (Full-Stack + AI)",
    url: "https://albertotuveri.dev",
    email: "mailto:albertotuveri@gmail.com",
    sameAs: [
      "https://github.com/GitAlboBis",
      "https://linkedin.com/in/albertotuveri",
    ],
  };

  return (
    <html lang={lang} className={`${fraunces.variable} ${hanken.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-foam focus:px-4 focus:py-2 focus:text-abyss focus:shadow-lg"
        >
          {dict.a11y.skipToContent}
        </a>
        <script
          type="application/ld+json"
          // sanitized per Next.js JSON-LD guidance (escape `<` to prevent injection)
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <LanguageProvider initialLang={lang}>
          <CanvasHost />
          <ScrollProvider />
          <SiteNav />
          {children}
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
