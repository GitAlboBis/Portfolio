import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { CanvasHost } from "@/webgl/CanvasHost";
import { Smooth } from "@/app/_providers/Smooth";
import { ScrollProgress } from "@/components/nav/ScrollProgress";
import { Preloader } from "@/components/Preloader";
import { CoverOverlay } from "@/components/transition/CoverOverlay";
import { Cursor } from "@/components/cursor/Cursor";
import { SoundScape } from "@/components/sound/SoundScape";
import { TideEgg } from "@/components/motion/TideEgg";
import { SITE } from "@/lib/site";
import "./globals.css";

/*
  ROOT SHELL (Golden Hour)
  ────────────────────────
  Global chrome mounted once for the whole app:
    - fonts: Bricolage Grotesque (display) + DM Sans (text) via next/font, exposed
      as --font-bricolage / --font-dmsans and wired into globals.css @theme.
    - Smooth:     the Lenis <-> GSAP scroll backbone.
    - CanvasHost: the fixed WebGPU water "A" (home route only).
  The page chrome (nav, sections, footer) composes in src/app/page.tsx.
*/

// Golden Hour type: Bricolage Grotesque (display, characterful) + DM Sans
// (body/labels). Both variable; weight driven by font-weight in globals.css.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-bricolage",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-dmsans",
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
  // canonical + og:url/title (see app/page.tsx, about, work, work/[slug]). The
  // homepage's own canonical/OG live in app/page.tsx.
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

// Person structured data — confirmed facts only (docs/07-PROJECTS.md); no email.
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
  themeColor: "#fbf6ef",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${dmSans.variable}`}>
      <body>
        <Preloader />
        <Smooth />
        <ScrollProgress />
        <CanvasHost />
        {/* EXIT curtain (Continuous Curtain) — must live HERE, not in
            template.tsx: it has to survive the route swap it covers. */}
        <CoverOverlay />
        {/* Interaction identity: the drop-of-light cursor + the MAREA ambient
            engine (bodies for WP-9 and the footer's sound toggle). */}
        <Cursor />
        <SoundScape />
        <TideEgg />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </body>
    </html>
  );
}
