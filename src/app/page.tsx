import type { Metadata } from "next";
import { PhaseBand } from "@/components/sheet/PhaseBand";
import { JobOrderHeader } from "@/components/sections/JobOrderHeader";
import { TestBench } from "@/components/bench/TestBench";
import { WorkTable } from "@/components/work/WorkTable";
import { Intake } from "@/components/sections/Intake";
import { Diagnosis } from "@/components/sections/Diagnosis";
import { Estimate } from "@/components/sections/Estimate";
import { Measured } from "@/components/sections/Measured";
import { Release } from "@/components/sections/Release";
import { Footer } from "@/components/footer/Footer";
import { works } from "@/content/works";
import { phaseAnchor } from "@/lib/phases";
import { defaultLocale, siteMeta } from "@/lib/site";

/* The home page owns the root identity: its canonical and og:url point at "/".
   Title and description come from src/lib/site.ts (the server mirror of the
   dictionary's `meta` block) — never typed twice. */
const META = siteMeta[defaultLocale];

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/", title: META.title },
  twitter: { card: "summary_large_image", title: META.title },
};

/*
  ════════════════════════════════════════════════════════════════════════════
  THE JOB ORDER — the sheet itself (REDESIGN-SPEC §A FIRST VIEWPORT, §D, §E)
  ════════════════════════════════════════════════════════════════════════════
  The header strip and the skip link are mounted by the root layout; the band
  is mounted HERE, after the job-order header, because on "/" the identity of
  the order is printed ABOVE it (§A rows A–C; the layout instance self-hides).

  Rows of the first viewport, at 1440×900:
    A   48px   header strip (layout)            — provenance of the sheet
    B   48–200 job-order header                 — name 88px + role + degree
    C   200–256 phase band (sticky)             — six phases, counter, Email
    D   256–900 the cover: the test bench running on the left, the summary of
                the work performed and the signature cell on the right.

  Below the fold the six phases stamp themselves in order as their regions
  cross `top 60%`: Intake · Diagnosis · Estimate · Work · Test (the Measured
  ledger — the bench runs in the first viewport but TEST is stamped by the
  measurements, §D) · Release. Only the cover sits outside the phases: it is
  the front of the form, not one of its stages.

  One heavy renderer on the whole site, and it is in the first viewport
  (TestBench → CanvasHost). Everything else here is DOM, CSS and SVG.
*/
export default function Home() {
  // The sheet prints the first five line items; the other four live on /work.
  const sheetRows = works.slice(0, 5);

  return (
    <main id="main" tabIndex={-1}>
      <JobOrderHeader />
      <PhaseBand />

      {/* ── Row D — the cover, and the Intake region ──────────────────────
          `#phase-intake` starts HERE, not at the Owner fields below: the order
          is taken in the moment the sheet opens, so the band prints INTAKE
          stamped and 1 / 6 in the first viewport (§A) and still accumulates
          one phase at a time on the way down (§E.3). */}
      <section
        id={phaseAnchor("intake")}
        className="sheet scroll-mt-[var(--band-h)] pb-[var(--section-gap-after)] pt-2 md:pt-4"
      >
        <div className="flex flex-col gap-4 md:gap-8 xl:flex-row xl:items-start xl:gap-8">
          <TestBench className="min-w-0 xl:flex-1" />

          {/* The signature cell sizes to its content: `xl:flex-1` stretched it to
              the bench's 540px and `justify-between` pushed its two lines to the
              far ends, leaving ~200px of empty yellow in the first viewport
              (finish review F1). The column no longer stretches either. */}
          <div className="flex min-w-0 flex-col gap-4 md:gap-6 xl:w-[420px] xl:shrink-0">
            <WorkTable items={sheetRows} variant="summary" />
            <Release variant="box" />
          </div>
        </div>
      </section>

      <Intake />
      <Diagnosis />
      <Estimate />

      {/* ── Work performed — the line items (§E.8) ───────────────────────── */}
      <section
        id={phaseAnchor("work")}
        /* skip-link target on the sheet: focusable so Enter really moves focus
           here (tabindex="-1" keeps it out of the tab sequence). */
        tabIndex={-1}
        aria-labelledby="work-caption"
        className="sheet scroll-mt-[var(--band-h)] pt-[var(--section-gap)]"
      >
        <WorkTable items={sheetRows} moreHref="/work" captionId="work-caption" />
      </section>

      <Measured />
      <Release />
      <Footer />
    </main>
  );
}
