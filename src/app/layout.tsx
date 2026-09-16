import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { Smooth } from "@/app/_providers/Smooth";
import { Preloader } from "@/components/Preloader";
import { CoverOverlay } from "@/components/transition/CoverOverlay";
import { SITE } from "@/lib/site";
import "./globals.css";

/*
  ROOT SHELL — THE JOB ORDER (redesign 2026-09)
  ─────────────────────────────────────────────
  Il guscio globale montato una volta per tutta l'app:
    - font: Archivo variabile (wght 100–900 + asse wdth 62–125) via next/font,
      esposto come --font-archivo e mappato in globals.css (@theme inline
      --font-sans). Una sola famiglia: intestazioni larghe, etichette
      condensate e corpo sono lo stesso materiale.
    - Preloader: "il modulo che si stampa" (WP-6 lo ridisegna; il guscio resta).
    - Smooth: Lenis sul gsap.ticker condiviso + sync di <html lang> e
      <html data-motion>.
    - CoverOverlay: la metà EXIT della copertura di route — deve vivere QUI,
      non in template.tsx, per sopravvivere allo swap di rotta che copre.
    - la banda fasi (PhaseBand, WP-2) verrà montata qui sotto il Preloader.
  Niente cursore, suono, uova, warm-up o canvas fissa nel layout: il banco
  prova (CanvasHost) vive dentro TestBench sulla home (WP-3).
*/

const archivo = Archivo({
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const DESCRIPTION =
  "Full-stack engineer building systems with AI at the edge — interfaces that move like water. Shaped by the sea of Sardinia.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Alberto Tuveri — Software Engineer",
    template: "%s — Alberto Tuveri",
  },
  description: DESCRIPTION,
  applicationName: "Alberto Tuveri",
  authors: [{ name: "Alberto Tuveri", url: SITE }],
  creator: "Alberto Tuveri",
  keywords: [
    "Alberto Tuveri",
    "software engineer",
    "full-stack developer",
    "AI integration",
    "Next.js",
    "React",
    "TypeScript",
    "WebGL",
    "portfolio",
    "Sardinia",
    "Camerino",
  ],
  // NB: no root-level `alternates.canonical` or `openGraph.url`/`title` here —
  // those inherit into every child route and would make /about, /work and every
  // case study canonicalize + share AS the homepage. Each route sets its own
  // canonical + og:url/title (see app/page.tsx, about, work, work/[slug]).
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Alberto Tuveri",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

// Person structured data — confirmed facts only; no email. (WP-6 updates strings.)
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Alberto Tuveri",
  jobTitle: "Software Engineer",
  url: SITE,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Camerino",
    addressRegion: "Marche",
    addressCountry: "IT",
  },
  sameAs: ["https://www.linkedin.com/in/albertotuveri", "https://github.com/GitAlboBis"],
};

export const viewport: Viewport = {
  themeColor: "#f5f4ef",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={archivo.variable}>
      <body>
        <Preloader />
        <Smooth />
        {/* EXIT cover (route transition) — lives here to survive the route swap. */}
        <CoverOverlay />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </body>
    </html>
  );
}
