import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * robots.txt — everything is public and indexable except `/styleguide`, which
 * is the build's working document (it is also absent from the sitemap).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/styleguide" },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
