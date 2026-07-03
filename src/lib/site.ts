/**
 * Single source of the site's absolute origin — used by metadata (canonical / OG),
 * the sitemap and robots. Resolution order, most-specific first:
 *   1. NEXT_PUBLIC_SITE_URL          — explicit, set on deploy (the intended prod value)
 *   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel's stable production domain (always present on Vercel)
 *   3. VERCEL_URL                    — the per-deployment URL (preview builds)
 *   4. http://localhost:3000         — local dev only
 *
 * Because Vercel always provides (2)/(3) at build & runtime, a production deploy can
 * never silently fall back to localhost even if NEXT_PUBLIC_SITE_URL is forgotten —
 * which was the previous risk (the localhost fallback was duplicated across three files
 * and would have poisoned every canonical/OG/sitemap URL). We warn rather than throw so
 * the local `next build` gate (which runs with NODE_ENV=production and no Vercel env)
 * still succeeds.
 */
function resolveSite(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];
  for (const c of candidates) {
    if (c && c.trim()) {
      const withProtocol = c.startsWith("http") ? c : `https://${c}`;
      return withProtocol.replace(/\/+$/, "");
    }
  }
  if (process.env.NODE_ENV === "production") {
    // Not fatal (keeps the local build gate green), but flag it loudly.
    console.warn(
      "[site] No site-URL env resolved (NEXT_PUBLIC_SITE_URL / VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL); " +
        "absolute URLs will fall back to http://localhost:3000.",
    );
  }
  return "http://localhost:3000";
}

/** Absolute site origin, without a trailing slash (e.g. "https://example.com"). */
export const SITE = resolveSite();
