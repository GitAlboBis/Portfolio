import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { LanguageProvider } from "@/components/language-provider";
import { CanvasHost } from "@/webgl/CanvasHost";
import { ScrollProvider } from "@/components/scroll-provider";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { CausticsLayer } from "@/components/caustics-layer";
import { WaterCursor } from "@/components/water-cursor";
import { DepthGauge } from "@/components/depth-gauge";
import type { Lang } from "@/data/translations/types";
import { en } from "@/data/translations/en";
import { it } from "@/data/translations/it";
import "./globals.css";

// Fraunces shipped as a TRUE variable font so its signature axes actually fire:
//   wght (full range, via weight:"variable"), opsz (optical size, 9–144),
//   SOFT (terminal softening), WONK (the playful "wonky" glyph swaps).
// We drive opsz/SOFT/WONK per type class in globals.css via font-variation-settings.
// next/font self-hosts the variable file(s); `axes` lists every non-wght axis
// (wght is implied by weight:"variable"). italic kept — Fraunces has a full
// variable italic. (next/font/google variable-axes syntax verified via Context7.)
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
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
  applicationName: "Alberto Tuveri",
  // Web App Manifest (src/app/manifest.ts is served at /manifest.webmanifest).
  manifest: "/manifest.webmanifest",
  // Icons: src/app/icon.svg and src/app/apple-icon.tsx are also auto-detected by
  // the file conventions; declared here explicitly so the manifest, OG, and head
  // links stay an intentional, single source of truth.
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Alberto Tuveri — Software Engineer",
    description:
      "Full-stack & AI software engineer. A cinematic, ocean-themed portfolio.",
    type: "website",
    siteName: "Alberto Tuveri",
    locale: "en_US",
    alternateLocale: "it_IT",
    url: "/",
    // src/app/opengraph-image.tsx is served at /opengraph-image and is also
    // auto-detected; referenced here so the share card is explicit and stable.
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Alberto Tuveri — Software Engineer, Full-Stack & AI.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alberto Tuveri — Software Engineer",
    description:
      "Full-stack & AI software engineer. A cinematic, ocean-themed portfolio.",
    images: ["/opengraph-image"],
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
      <head>
        {/*
          LCP boost: the hero's largest paint is the first cinematic frame drawn
          by VideoBackdrop. Preload it during HTML parse so the byte stream is in
          flight before the 2D canvas component mounts. Two media-scoped links
          ensure phones fetch only the lightweight 960px tier and large screens
          fetch the 1920px tier — never both. fetchpriority="high" on the mobile
          link nudges it ahead of other discoverable resources on metered links.
        */}
        <link
          rel="preload"
          as="image"
          href="/frames/m/f_000.webp"
          type="image/webp"
          media="(max-width: 820px)"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="/frames/f_000.webp"
          type="image/webp"
          media="(min-width: 821px)"
        />
      </head>
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
          {/* Ambient signature layers — decorative, aria-hidden, perf-gated (rAF
              idles offscreen / under reduced-motion). Paint above the canvases,
              below nav + content. */}
          <CausticsLayer />
          <WaterCursor />
          <ScrollProvider />
          <SiteNav />
          <DepthGauge />
          {children}
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
