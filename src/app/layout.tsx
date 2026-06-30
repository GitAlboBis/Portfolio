import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { CanvasHost } from "@/webgl/CanvasHost";
import { Smooth } from "@/app/_providers/Smooth";
import { Cursor } from "@/components/Cursor";
import "./globals.css";

/*
  ROOT SHELL (Golden Hour)
  ────────────────────────
  Global chrome mounted once for the whole app:
    - fonts: Bricolage Grotesque (display) + DM Sans (text) via next/font, exposed
      as --font-bricolage / --font-dmsans and wired into globals.css @theme.
    - Smooth:     the Lenis <-> GSAP scroll backbone.
    - CanvasHost: the fixed WebGPU water "A" (home route only).
    - Cursor:     the custom pointer (pointer:fine + motion-allowed only).
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
