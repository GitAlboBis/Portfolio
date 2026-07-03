import type { Metadata } from "next";
import { AboutJourney } from "@/components/about/AboutJourney";

const DESCRIPTION =
  "Software engineer — full-stack & AI integration. The long version: education, experience and thesis, from the Sulcis coast of Sardinia to Camerino.";

export const metadata: Metadata = {
  title: "About",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: { url: "/about", title: "About — Alberto Tuveri", description: DESCRIPTION },
  twitter: { title: "About — Alberto Tuveri", description: DESCRIPTION },
};

export default function AboutPage() {
  return <AboutJourney />;
}
