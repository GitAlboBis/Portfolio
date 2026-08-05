"use client";

import { TransitionLink as Link } from "@/components/transition/TransitionLink";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { WorkHorizontal } from "@/components/work/WorkHorizontal";
import { WorkApproach } from "@/components/work/WorkApproach";
import { FilmScrub } from "@/components/home/FilmScrub";
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
        {/* paper scrim — the chrome must stay legible over the dark outro film
            (paper-on-paper = invisible at rest; same as WorkCaseStudy/about) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{
            height: "calc(var(--nav-h) * 1.6)",
            background:
              "linear-gradient(to bottom, var(--color-paper) 38%, color-mix(in oklab, var(--color-paper) 55%, transparent) 68%, transparent)",
          }}
        />
        <nav
          className="container-edit relative flex items-center justify-between"
          style={{ height: "var(--nav-h)" }}
        >
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-[-0.02em] text-ink transition-opacity duration-300 hover:opacity-70"
          >
            Alberto&nbsp;Tuveri
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* px/py: tap target toward the 44px bar (AboutJourney's padded-
                toggle pattern); the tighter gap keeps the optical spacing */}
            <button
              onClick={toggleLocale}
              className="t-meta px-3 py-2 text-ember-ink underline-offset-4 transition-colors duration-300 hover:underline"
            >
              {locale === "en" ? "IT" : "EN"}
              <span className="sr-only"> — {t.nav.langToggle}</span>
            </button>
            <RollLink
              as={Link}
              href="/"
              prefix="←"
              label={t.journey.back}
              className="t-meta transition-colors duration-300 hover:text-ember-ink"
            />
          </div>
        </nav>
      </header>

      {/* THE APPROACH — the index used to drop you straight into the runway with
          no arrival. Now the work assembles itself into the site's own mark: six
          nested "A"s at receding depths, each cut from the photography, all
          converging into one as the projects fly past the camera. Decorative;
          the real heading lives in the runway below. */}
      <WorkApproach />

      <WorkHorizontal />

      {/* THE OUTRO — past the last slide the drone clears Pan di Zucchero's
          summit and drops over the edge into open water: the runway ends, the
          sea doesn't. Real DJI footage (G. Ghiani), scroll-scrubbed. The page
          deliberately ENDS in the film (no bottom tear back to paper). */}
      <FilmScrub
        srcDesktop="/coast/runway-1600.mp4"
        srcMobile="/coast/runway-960.mp4"
        poster="/coast/runway-poster.webp"
        eyebrow={t.works.film.eyebrow}
        title={t.works.film.title}
        meta={t.works.film.meta}
        heightVh={220}
        tearBottom={false}
      />
    </main>
  );
}
