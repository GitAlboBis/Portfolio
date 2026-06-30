import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { CanvasHost } from "@/webgl/CanvasHost";
import { Smooth } from "@/app/_providers/Smooth";
import { Cursor } from "@/components/Cursor";
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

export const metadata: Metadata = {
  title: "Alberto Tuveri — Software Engineer",
  description:
    "Full-stack engineer building systems with AI at the edge — interfaces that move like water. Shaped by the sea of Sardinia.",
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
        <Smooth />
        <CanvasHost />
        {children}
        <Cursor />
      </body>
    </html>
  );
}
