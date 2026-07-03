import type { MetadataRoute } from "next";
import { worksConfirmed } from "@/content/works";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { url: `${SITE}/`, priority: 1 },
    { url: `${SITE}/about`, priority: 0.8 },
  ];
  const work = worksConfirmed.map((w) => ({ url: `${SITE}/work/${w.slug}`, priority: 0.6 }));
  return [...pages, ...work].map((e) => ({ ...e, changeFrequency: "monthly" as const }));
}
