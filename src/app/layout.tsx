import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
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
    description: "Full-stack & AI software engineer. Immersive ocean-themed portfolio.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jetBrainsMono.variable}>
      <body>{children}</body>
    </html>
  );
}
