import type { Metadata } from "next";
import { AboutJourney } from "@/components/about/AboutJourney";
import { identity } from "@/content/career";

/* `/about` — the Owner of the job order (REDESIGN-SPEC §D, §E.13).
   The description is the CV's own SUMMARY paragraph (src/content/career.ts),
   EN: metadata is server-rendered and has no locale. */
const TITLE = "About";
const OG_TITLE = `${TITLE} — Alberto Tuveri`;
const DESCRIPTION = identity.summary.en;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: { url: "/about", title: OG_TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: OG_TITLE, description: DESCRIPTION },
};

export default function AboutPage() {
  return <AboutJourney />;
}
