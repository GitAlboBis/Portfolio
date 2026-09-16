import type { Metadata } from "next";
import { palette, type PaletteToken } from "@/content/tokens";

/*
  /styleguide — PROVISIONAL (WP-0). Proves the foundation: the ten colours with
  their hex, the Archivo type scale with its wdth/wght per class, the yellow band
  swatch, a rule + a stamp. WP-8 rewrites this page bilingual via dict.ts with
  runtime AA ratios; until then the copy here is hardcoded EN (declared deviation).
*/

export const metadata: Metadata = {
  title: "Styleguide",
  description: "The job order — foundation tokens: palette, Archivo type scale, rules and stamps.",
  robots: { index: false, follow: false },
};

const chips: { token: PaletteToken; css: string; use: string }[] = [
  { token: "paper", css: "paper", use: "Ground of every sheet" },
  { token: "paperField", css: "paper-field", use: "Field fill · alternate rows · bench backdrop" },
  { token: "paperCarbon", css: "paper-carbon", use: "Sub-form ground (carbon copy)" },
  { token: "ink", css: "ink", use: "Text · every 1px rule · text on yellow" },
  { token: "graphite", css: "graphite", use: "Meta on paper and fields" },
  { token: "graphiteDeep", css: "graphite-deep", use: "Meta on carbon copy" },
  { token: "stamp", css: "stamp", use: "Stamps on paper · links · arrows" },
  { token: "stampDeep", css: "stamp-deep", use: "Stamp lettering on the band" },
  { token: "safety", css: "safety", use: "Regions only: band · readouts · Release · focus" },
  { token: "oil", css: "oil", use: "Fluid diffuse reference (WGSL), never text" },
];

const scale: { cls: string; wdth: number; wght: number; size: string; sample: string }[] = [
  { cls: "f-name", wdth: 125, wght: 800, size: "clamp(3.25rem, 1rem + 5.6vw, 5.5rem)", sample: "Alberto Tuveri" },
  { cls: "f-headline", wdth: 112, wght: 700, size: "clamp(1.75rem, 1rem + 1.8vw, 2.5rem)", sample: "Hiring, or building something with WebGPU, motion or AI?" },
  { cls: "f-lead", wdth: 100, wght: 400, size: "clamp(1.125rem, 1rem + .6vw, 1.5rem)", sample: "I own the front-end, 3D and motion layer of everything SerSan ships." },
  { cls: "f-role", wdth: 100, wght: 500, size: "clamp(.9375rem, .8rem + .35vw, 1.125rem)", sample: "Software & AI Engineer · Creative Lead" },
  { cls: "f-body", wdth: 100, wght: 400, size: "1rem", sample: "Every value has a provenance cell; numbers are before → after pairs from the CV, set in tabular figures: 4.75 s → 1.74 s." },
  { cls: "f-cell", wdth: 100, wght: 400, size: ".9375rem", sample: "161-question eval · accuracy 52% → 68%" },
  { cls: "f-caption", wdth: 75, wght: 600, size: ".8125rem", sample: "Work performed" },
  { cls: "f-meta", wdth: 87, wght: 400, size: ".8125rem", sample: "Sersan Limited · London · Remote · May 2026 – Present" },
  { cls: "f-stamp", wdth: 75, wght: 700, size: "clamp(1rem, .9rem + .5vw, 1.25rem)", sample: "Released" },
  { cls: "f-strip", wdth: 87, wght: 500, size: ".75rem", sample: "Sersan Limited · London · Remote" },
];

function Caption({ children }: { children: React.ReactNode }) {
  return <span className="f-caption field-caption">{children}</span>;
}

export default function StyleguidePage() {
  return (
    <main className="sheet pb-24 pt-[var(--section-gap)]">
      {/* Header row — the sheet's own job-order header, at foundation size. */}
      <section className="grid-12 fields">
        <div className="field col-span-12 md:col-span-8">
          <Caption>Styleguide · foundation</Caption>
          <h1 className="f-name mt-2">Alberto Tuveri</h1>
        </div>
        <div className="field col-span-12 md:col-span-4">
          <Caption>Face</Caption>
          <p className="f-role mt-2">Archivo variable · wght 100–900 · wdth 62–125</p>
          <p className="f-meta mt-1 text-graphite">One family. Width axis separates wide headers, condensed labels and body.</p>
        </div>
      </section>

      {/* Yellow band swatch — the region, at band height. */}
      <section className="mt-[var(--section-gap)]">
        <div className="bg-safety band-h grid-12 rule-top rule-bottom on-safety">
          <div className="col-span-8 md:col-span-9 flex items-center gap-6 px-5">
            <span className="f-caption whitespace-nowrap">Safety · region</span>
            <span className="f-cell hidden md:inline">{palette.safety} · text ink 11.53:1 · stamp-deep 6.13:1</span>
            <span className="f-cell md:hidden">{palette.safety}</span>
          </div>
          <div className="col-span-4 md:col-span-3 flex items-center border-l border-ink px-5">
            <span className="f-stamp bg-stamp px-3 py-2 text-paper">Live</span>
          </div>
        </div>
      </section>

      {/* Palette — ten chips with hex. */}
      <section className="mt-[var(--section-gap)]">
        <h2 className="f-headline mb-[var(--section-gap-after)]">Palette</h2>
        <div className="grid-12 fields">
          {chips.map((c) => (
            <div key={c.token} className="field col-span-6 md:col-span-3 lg:col-span-2 xl:col-span-2">
              <div
                className="h-16 w-full rule-bottom"
                style={{ background: palette[c.token], outline: "1px solid var(--color-rule-soft)", outlineOffset: -1 }}
              />
              <p className="f-cell mt-3">{c.css}</p>
              <p className="f-meta text-graphite">{palette[c.token]}</p>
              <p className="f-meta mt-1 text-graphite">{c.use}</p>
            </div>
          ))}
          <div className="field col-span-12 md:col-span-6 lg:col-span-4">
            <Caption>rule-soft</Caption>
            <div className="rule-soft mt-3" />
            <p className="f-meta mt-3 text-graphite">rgb(20 20 20 / .22) · hairline between table rows</p>
          </div>
        </div>
      </section>

      {/* Type scale — every class with its wdth / wght. */}
      <section className="mt-[var(--section-gap)]">
        <h2 className="f-headline mb-[var(--section-gap-after)]">Type scale</h2>
        <div className="rule-top">
          {scale.map((t) => (
            <div key={t.cls} className="grid-12 rule-soft row-hover py-5">
              <div className="col-span-12 md:col-span-3 f-meta text-graphite">
                <span className="f-caption block">.{t.cls}</span>
                <span className="block">wdth {t.wdth} · wght {t.wght}</span>
                <span className="block">{t.size}</span>
              </div>
              <div className="col-span-12 md:col-span-9 mt-2 md:mt-0 md:pl-5">
                <p className={t.cls}>{t.sample}</p>
              </div>
            </div>
          ))}
          <div className="rule-bottom" />
        </div>
      </section>

      {/* Rule + stamp demo — the two verbs, at rest. */}
      <section className="mt-[var(--section-gap)]">
        <h2 className="f-headline mb-[var(--section-gap-after)]">Rule and stamp</h2>
        <div className="grid-12 fields">
          <div className="field col-span-12 md:col-span-6">
            <Caption>Rule</Caption>
            <div className="rule-top mt-4" />
            <p className="f-body mt-3">A rule is drawn before it is read: 1px ink, scaleX 0→1 in 320ms, then the type appears 90ms later.</p>
            <div className="rule-soft mt-3" />
            <p className="f-meta mt-3 text-graphite">--ease-rule cubic-bezier(.16, 1, .3, 1) · --dur-rule 320ms</p>
          </div>
          <div className="field col-span-12 md:col-span-6">
            <Caption>Stamp</Caption>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <span className="stamp f-stamp">Intake</span>
              <span className="stamp stamp--filled f-stamp">Released</span>
              <span className="f-meta text-graphite">−3.5° · 2px stamp · filled = stamp on paper</span>
            </div>
            <p className="f-meta mt-4 text-graphite">--ease-stamp cubic-bezier(.2, .9, .25, 1.03) · --dur-stamp 220ms</p>
            <p className="mt-4">
              <a className="link f-cell" href="mailto:albertotuveri@gmail.com">
                Email albertotuveri@gmail.com
              </a>
            </p>
          </div>
        </div>
      </section>

      <div className="perforation mt-[var(--section-gap)]" />
      <p className="f-strip text-graphite">© 2026 Alberto Tuveri · foundation sheet · WP-0</p>
    </main>
  );
}
