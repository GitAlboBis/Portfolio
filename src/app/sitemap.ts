import type { MetadataRoute } from "next";
import { worksConfirmed } from "@/content/works";
import { SITE } from "@/lib/site";

/**
 * Sitemap (REDESIGN-SPEC §G): 12 URLs — `/`, `/work`, the nine line items and
 * `/about`. The sheet has no other addresses (`/styleguide` is a working
 * document, not a page of the site, and is left out deliberately).
 *
 * `lastModified` is the build time: the site is fully static, so every page is
 * as fresh as the deploy that produced it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const entries: { url: string; priority: number }[] = [
    { url: `${SITE}/`, priority: 1 },
    { url: `${SITE}/work`, priority: 0.9 },
    ...worksConfirmed.map((w) => ({ url: `${SITE}/work/${w.slug}`, priority: 0.7 })),
    { url: `${SITE}/about`, priority: 0.8 },
  ];

  return entries.map((e) => ({ ...e, lastModified, changeFrequency: "monthly" as const }));
}
