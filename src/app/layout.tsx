import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { CanvasHost } from "@/webgl/CanvasHost";
import "./globals.css";

/*
  CLEAN-SLATE SHELL (2026-06-29)
  ──────────────────────────────
  The site was reset to a blank canvas. Everything was deleted EXCEPT the two
  3D engines we are keeping and rebuilding around:
    1. the WebGPU water "A" fluid   — src/webgl/waterball/** (mounted via CanvasHost)
    2. the tech-stack sphere        — src/components/tech-cloud.tsx (mounted in page.tsx)
  Plus all docs (*.md) and assets (public/**). The ocean design tokens in
  globals.css are kept as the working base; the new design is built on top.

  This layout is intentionally minimal: fonts (the tokens reference --font-fraunces
  / --font-hanken), globals.css, and the hero canvas host. No nav, footer, i18n,
  providers, or SEO chrome — those get rebuilt from the design directives.
*/

// Fraunces shipped as a TRUE variable font so its opsz/SOFT/WONK axes fire; the
// type classes in globals.css drive font-variation-settings per size.
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
  title: "Alberto Tuveri — rebuild",
  description: "Clean-slate rebuild — water-A fluid + tech sphere only.",
};

export const viewport: Viewport = {
  themeColor: "#07222e",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable}`}>
      <body>
        <CanvasHost />
        {children}
      </body>
    </html>
  );
}
