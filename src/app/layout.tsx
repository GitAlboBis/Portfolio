import type { Metadata } from "next";
import { cookies } from "next/headers";
import { JetBrains_Mono } from "next/font/google";
import { LanguageProvider } from "@/components/language-provider";
import { CanvasHost } from "@/webgl/CanvasHost";
import { SiteNav } from "@/components/site-nav";
import { DepthGauge } from "@/components/depth-gauge";
import { SiteFooter } from "@/components/site-footer";
import type { Lang } from "@/data/translations/types";
import "./globals.css";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://albertotuveri.dev"),
  title: {
    default: "Alberto Tuveri — Software Engineer · Full-Stack + AI",
    template: "%s · Alberto Tuveri",
  },
  description:
    "Immersive portfolio of Alberto Tuveri — full-stack & AI software engineer. From the cliffs of Pan di Zucchero to production-grade systems.",
  openGraph: {
    title: "Alberto Tuveri — Software Engineer",
    description:
      "Full-stack & AI software engineer. Immersive ocean-themed portfolio.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = ((await cookies()).get("lang")?.value as Lang) ?? "en";

  return (
    <html lang={lang} className={jetBrainsMono.variable}>
      <body>
        <LanguageProvider initialLang={lang}>
          <CanvasHost />
          <SiteNav />
          <DepthGauge />
          {children}
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
