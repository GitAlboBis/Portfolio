"use client";

import Link from "next/link";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { WorkHorizontal } from "@/components/work/WorkHorizontal";
import { RollLink } from "@/components/motion/RollLink";

/**
 * WorkIndex — the /work index page: a minimal header + the scroll-driven
 * horizontal gallery of all projects (each slide opens its /work/[slug] case
 * study). The home keeps the depth-fade gallery; this is the dedicated
 * "all work" explorer.
 */
export function WorkIndex() {
  const t = useDict();
  const locale = useUI((s) => s.locale);
  const toggleLocale = useUI((s) => s.toggleLocale);

  return (
    <main id="main" className="relative min-h-dvh bg-paper">
      <header className="fixed inset-x-0 top-0 z-50">
        <nav
          className="container-edit flex items-center justify-between"
          style={{ height: "var(--nav-h)" }}
        >
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-[-0.02em] text-ink transition-opacity duration-300 hover:opacity-70"
          >
            Alberto&nbsp;Tuveri
          </Link>
          <div className="flex items-center gap-5 sm:gap-7">
            <button
              onClick={toggleLocale}
              aria-label="Toggle language"
              className="t-meta text-ember-ink underline-offset-4 transition-colors duration-300 hover:underline"
            >
              {locale === "en" ? "IT" : "EN"}
            </button>
            <RollLink
              as={Link}
              href="/"
              prefix="←"
              label={t.journey.back}
              className="t-meta"
            />
          </div>
        </nav>
      </header>

      <WorkHorizontal />
    </main>
  );
}
