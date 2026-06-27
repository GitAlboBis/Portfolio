import type { MetadataRoute } from "next";

// Single-page portfolio: the canonical entry is the root document. Sections are
// in-page anchors (#about/#work/#skills/#contact), not separate routes, so they
// are intentionally not listed as distinct URLs.
const BASE_URL = "https://albertotuveri.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
