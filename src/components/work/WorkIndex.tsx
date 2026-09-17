"use client";

import { useDict } from "@/content/dict";
import { works } from "@/content/works";
import { WorkTable } from "@/components/work/WorkTable";
import { Release } from "@/components/sections/Release";
import { Footer } from "@/components/footer/Footer";
import { phaseAnchor } from "@/lib/phases";

/**
 * WorkIndex — the `/work` sheet (REDESIGN-SPEC §D, §E.8): the SAME table the
 * job order prints, with all nine line items instead of the first five. One
 * source, one component, no second gallery anywhere on the site — the old
 * horizontal runway and its canvas are gone.
 *
 * The page carries `#phase-work`, so the band's WORK cell (pre-stamped on
 * every `/work*` route) matches the region, and the global skip link
 * ("Skip to work performed") lands on the table on this route too.
 *
 * Below the table, the compact Release (§E.10: the full yellow panel is the
 * sheet's own signature; sub-routes get the signature cell) and the footer. No
 * renderer is mounted here: `/work` is DOM, CSS and one capture per public
 * site.
 */
export function WorkIndex() {
  const t = useDict();

  return (
    <main id="main" tabIndex={-1}>
      <section
        id={phaseAnchor("work")}
        aria-labelledby="work-index-title"
        className="sheet scroll-mt-[var(--band-h)] pt-8 md:pt-12"
      >
        <h1 id="work-index-title" className="f-headline text-ink">
          {t.work.indexTitle}
        </h1>
        <div className="mt-6 md:mt-10">
          <WorkTable items={works} />
        </div>
      </section>

      {/* the signature cell, not the full panel: the yellow region that closes
          the order belongs to the sheet itself (§E.10) */}
      <div className="sheet pt-[var(--section-gap)]">
        <Release variant="box" />
      </div>

      <Footer />
    </main>
  );
}
