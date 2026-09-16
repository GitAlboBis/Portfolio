import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { Smooth } from "@/app/_providers/Smooth";
import { Preloader } from "@/components/Preloader";
import { CoverOverlay } from "@/components/transition/CoverOverlay";
import { HeaderStrip, SkipLink } from "@/components/sheet/HeaderStrip";
import { PhaseBand } from "@/components/sheet/PhaseBand";
import { SITE, defaultLocale, siteMeta, siteName, titleTemplate } from "@/lib/site";
import "./globals.css";

/*
  ROOT SHELL — THE JOB ORDER (redesign 2026-09)
  ─────────────────────────────────────────────
  Il guscio globale montato una volta per tutta l'app:
    - font: Archivo variabile (wght 100–900 + asse wdth 62–125) via next/font,
      esposto come --font-archivo e mappato in globals.css (@theme inline
      --font-sans). Una sola famiglia: intestazioni larghe, etichette
      condensate e corpo sono lo stesso materiale.
    - Preloader: "il modulo che si stampa" — strip + banda che si rigano
      dall'alto, poi il foglio si solleva (WP-6).
    - Smooth: Lenis sul gsap.ticker condiviso + sync di <html lang> e
      <html data-motion>.
    - CoverOverlay: la metà EXIT della copertura di route — deve vivere QUI,
      non in template.tsx, per sopravvivere allo swap di rotta che copre.
    - SkipLink → #phase-work, HeaderStrip (provenienza, tutte le route) e la
      banda fasi PhaseBand (WP-2). Contratto: l'istanza di layout della banda
      si nasconde su "/" (la home monta <PhaseBand/> DOPO il job-order-header,
      §A FIRST VIEWPORT righe A–C); ogni altra route la riceve da qui.
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

/* ── Metadata (REDESIGN-SPEC §G, §H `meta.*`) ────────────────────────────────
   Title e description vengono da `src/lib/site.ts` (`siteMeta`), il mirror
   server-side del dizionario: il layout è un componente server e non può
   importare `src/content/dict.ts` ("use client"). Locale di default EN; la
   pagina cambia `<html lang>` a runtime (Smooth.tsx), non i metadati. */
const META = siteMeta[defaultLocale];

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: META.title,
    template: titleTemplate,
  },
  description: META.description,
  applicationName: siteName,
  authors: [{ name: "Alberto Tuveri", url: SITE }],
  creator: "Alberto Tuveri",
  keywords: [
    "Alberto Tuveri",
    "software engineer",
    "AI engineer",
    "creative lead",
    "full-stack developer",
    "WebGPU",
    "three.js",
    "GSAP",
    "Next.js",
    "React",
    "TypeScript",
    "RAG evaluation",
    "motion design",
    "SerSan",
    "portfolio",
  ],
  // NB: no root-level `alternates.canonical` or `openGraph.url`/`title` here —
  // those inherit into every child route and would make /about, /work and every
  // case study canonicalize + share AS the homepage. Each route sets its own
  // canonical + og:url/title (see app/page.tsx, about, work, work/[slug]).
  openGraph: {
    type: "website",
    locale: META.ogLocale,
    alternateLocale: siteMeta.it.ogLocale,
    siteName,
    description: META.description,
  },
  twitter: {
    card: "summary_large_image",
    description: META.description,
  },
  robots: { index: true, follow: true },
};

/* Person structured data — solo fatti confermati dal CV (PRODUCT.md §3):
   nessun indirizzo, nessun telefono, nessuna email. */
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Alberto Tuveri",
  jobTitle: "Software & AI Engineer · Creative Lead",
  url: SITE,
  worksFor: {
    "@type": "Organization",
    name: "Sersan Limited",
    url: "https://sersan.io",
  },
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "University of Camerino",
  },
  affiliation: {
    "@type": "CollegeOrUniversity",
    name: "University of Trento",
  },
  knowsAbout: [
    "WebGPU",
    "Real-time 3D",
    "Front-end engineering",
    "Retrieval-augmented generation",
    "Full-stack development",
  ],
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
        <SkipLink />
        <HeaderStrip />
        <PhaseBand layoutMount />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </body>
    </html>
  );
}
