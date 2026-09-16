import type { Metadata } from "next";
import { WorkIndex } from "@/components/work/WorkIndex";
import { defaultLocale, siteMeta } from "@/lib/site";

/* `/work` — the full Work performed table (REDESIGN-SPEC §D, §E.8).
   The description is the site's own (src/lib/site.ts, the server mirror of the
   dictionary's `meta` block): no second wording is written here. */
const META = siteMeta[defaultLocale];
const TITLE = "Work";
const OG_TITLE = `${TITLE} — Alberto Tuveri`;

export const metadata: Metadata = {
  title: TITLE,
  description: META.description,
  alternates: { canonical: "/work" },
  openGraph: { url: "/work", title: OG_TITLE, description: META.description },
  twitter: { card: "summary_large_image", title: OG_TITLE, description: META.description },
};

export default function WorkPage() {
  return <WorkIndex />;
}
