"use client";

import { dict } from "@/content/dict";
import { palette, type PaletteToken } from "@/content/tokens";
import { useHydratedLocale } from "@/lib/use-hydrated";
import { useUI, type Locale } from "@/store/ui";
import { AA_LARGE, AA_NORMAL, aaVerdict, contrastRatio, formatRatio } from "@/lib/contrast";

/*
  /styleguide — the living sheet (WP-8, REDESIGN-SPEC §B "from The standards
  manual", §C.1–C.3, §C.7). Bilingual via dict.ts; every hex is read from
  tokens.ts and every AA ratio is COMPUTED at render time (src/lib/contrast.ts),
  including the two forbidden pairs, printed as FAIL for honesty. Colour comes
  from context, never from the .f-* classes. Plain markup: the sheet primitives
  (src/components/sheet/*, WP-2) did not exist when this page was written.
*/

type RoleKey = keyof typeof dict.en.styleguide.palette.roles;
type UseKey = keyof typeof dict.en.styleguide.aa.uses;

/** The eleven tokens of §C.1 in sheet order. `ruleSoft` is not a hex: printed as its rgb(). */
const PALETTE_ROWS: { token: PaletteToken | "ruleSoft"; css: string; value: string; role: RoleKey }[] = [
  { token: "paper", css: "paper", value: palette.paper, role: "paper" },
  { token: "paperField", css: "paper-field", value: palette.paperField, role: "paperField" },
  { token: "paperCarbon", css: "paper-carbon", value: palette.paperCarbon, role: "paperCarbon" },
  { token: "ink", css: "ink", value: palette.ink, role: "ink" },
  { token: "graphite", css: "graphite", value: palette.graphite, role: "graphite" },
  { token: "graphiteDeep", css: "graphite-deep", value: palette.graphiteDeep, role: "graphiteDeep" },
  { token: "stamp", css: "stamp", value: palette.stamp, role: "stamp" },
  { token: "stampDeep", css: "stamp-deep", value: palette.stampDeep, role: "stampDeep" },
  { token: "safety", css: "safety", value: palette.safety, role: "safety" },
  { token: "oil", css: "oil", value: palette.oil, role: "oil" },
  { token: "ruleSoft", css: "rule-soft", value: "rgb(20 20 20 / .22)", role: "ruleSoft" },
];

/** §C.2 — every sanctioned pair, computed. */
const AA_PAIRS: { fg: string; bg: string; use: UseKey }[] = [
  { fg: palette.ink, bg: palette.paper, use: "body" },
  { fg: palette.graphite, bg: palette.paper, use: "metaPaper" },
  { fg: palette.stamp, bg: palette.paper, use: "linkPaper" },
  { fg: palette.ink, bg: palette.safety, use: "onSafety" },
  { fg: palette.stampDeep, bg: palette.safety, use: "stampOnBand" },
  { fg: palette.paper, bg: palette.stamp, use: "paperOnStamp" },
  { fg: palette.ink, bg: palette.paperField, use: "fieldValues" },
  { fg: palette.graphite, bg: palette.paperField, use: "metaField" },
  { fg: palette.stamp, bg: palette.paperField, use: "linkField" },
  { fg: palette.ink, bg: palette.paperCarbon, use: "carbonBody" },
  { fg: palette.graphiteDeep, bg: palette.paperCarbon, use: "metaCarbon" },
  { fg: palette.stamp, bg: palette.paperCarbon, use: "linkCarbon" },
];

/** §C.2 — the two forbidden pairs. `#c8102e` is no longer a token: literal on purpose. */
const FORBIDDEN_PAIRS: { fg: string; bg: string; use: UseKey }[] = [
  { fg: palette.graphite, bg: palette.safety, use: "forbiddenGraphiteSafety" },
  { fg: "#c8102e", bg: palette.safety, use: "forbiddenRedSafety" },
];

/** §C.3 — the type scale; `sample` resolves against the active dictionary. */
const TYPE_ROWS: { cls: string; wdth: number; wght: number; size: string }[] = [
  { cls: "f-name", wdth: 125, wght: 800, size: "clamp(3.25rem, 1rem + 5.6vw, 5.5rem)" },
  { cls: "f-headline", wdth: 112, wght: 700, size: "clamp(1.75rem, 1rem + 1.8vw, 2.5rem)" },
  { cls: "f-lead", wdth: 100, wght: 400, size: "clamp(1.125rem, 1rem + .6vw, 1.5rem)" },
  { cls: "f-role", wdth: 100, wght: 500, size: "clamp(.9375rem, .8rem + .35vw, 1.125rem)" },
  { cls: "f-body", wdth: 100, wght: 400, size: "1rem" },
  { cls: "f-cell", wdth: 100, wght: 400, size: ".9375rem" },
  { cls: "f-caption", wdth: 75, wght: 600, size: ".8125rem" },
  { cls: "f-meta", wdth: 87, wght: 400, size: ".8125rem" },
  { cls: "f-stamp", wdth: 75, wght: 700, size: "clamp(1rem, .9rem + .5vw, 1.25rem)" },
  { cls: "f-strip", wdth: 87, wght: 500, size: ".75rem" },
];

function typeSample(cls: string, t: (typeof dict)[Locale]): string {
  switch (cls) {
    case "f-name":
      return t.header.name;
    case "f-headline":
      return t.release.headline;
    case "f-lead":
      return t.intake.positioning;
    case "f-role":
      return t.header.role1;
    case "f-body":
      return t.styleguide.type.samples.body;
    case "f-cell":
      return t.styleguide.type.samples.cell;
    case "f-caption":
      return t.work.caption;
    case "f-meta":
      return `${t.strip.employer} · ${t.strip.date}`;
    case "f-stamp":
      return t.release.stamp;
    default:
      return t.strip.employer;
  }
}

/** Label printed above a cell on mobile only (the header row is hidden there). */
function CellLabel({ children }: { children: React.ReactNode }) {
  return <span className="f-caption mb-1 block text-graphite md:hidden">{children}</span>;
}

function SheetCaption({ children }: { children: React.ReactNode }) {
  return <h2 className="f-caption field-caption">{children}</h2>;
}

export function StyleguideSheet() {
  const locale = useHydratedLocale();
  const setLocale = useUI((s) => s.setLocale);
  const t = dict[locale];
  const sg = t.styleguide;

  return (
    <main id="main" className="sheet pb-24 pt-[var(--section-gap)]">
      {/* ── Header: caption + lead, local EN | IT toggle ───────────────────── */}
      <section className="grid-12 fields">
        <div className="field col-span-12 md:col-span-9">
          <h1 className="f-caption field-caption">{sg.title}</h1>
          <p className="f-lead mt-2">{sg.lead}</p>
        </div>
        <div className="field col-span-12 md:col-span-3">
          <span className="f-caption field-caption">{t.a11y.langToggle}</span>
          <div className="mt-2 inline-grid grid-cols-2 border border-ink" role="group" aria-label={t.a11y.langToggle}>
            {(["en", "it"] as const).map((l) => (
              <button
                key={l}
                type="button"
                lang={l}
                aria-pressed={locale === l}
                onClick={() => setLocale(l)}
                className={`f-caption min-h-11 min-w-14 px-4 transition-colors duration-[var(--dur-swap)] ease-linear ${
                  locale === l ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-paper-field"
                } ${l === "it" ? "border-l border-ink" : ""}`}
              >
                {sg.locale[l]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Palette: token · hex · role · chip (chip prints its hex) ──────── */}
      <section className="mt-[var(--section-gap)]">
        <SheetCaption>{sg.palette.caption}</SheetCaption>
        <div className="rule-top mt-2" role="table" aria-label={sg.palette.caption}>
          <div
            role="row"
            className="hidden md:grid md:grid-cols-[9rem_10rem_1fr_11rem] rule-soft py-2 text-graphite"
          >
            <span role="columnheader" className="f-caption">{sg.palette.cols.token}</span>
            <span role="columnheader" className="f-caption">{sg.palette.cols.hex}</span>
            <span role="columnheader" className="f-caption">{sg.palette.cols.role}</span>
            <span role="columnheader" className="f-caption">{sg.palette.cols.chip}</span>
          </div>
          {PALETTE_ROWS.map((row) => {
            const isHex = row.value.startsWith("#");
            // Ink or paper on the chip, decided by the computed ratio — never a guess.
            const chipText = !isHex || contrastRatio(palette.ink, row.value) >= AA_NORMAL ? palette.ink : palette.paper;
            return (
              <div
                key={row.css}
                role="row"
                className="grid grid-cols-2 gap-y-3 md:grid-cols-[9rem_10rem_1fr_11rem] md:items-center rule-soft row-hover py-3"
              >
                <span role="cell" className="f-cell">
                  <CellLabel>{sg.palette.cols.token}</CellLabel>
                  {row.css}
                </span>
                <span role="cell" className="f-cell">
                  <CellLabel>{sg.palette.cols.hex}</CellLabel>
                  {row.value}
                </span>
                <span role="cell" className="f-meta col-span-2 text-graphite md:col-span-1 md:pr-5">
                  <CellLabel>{sg.palette.cols.role}</CellLabel>
                  {sg.palette.roles[row.role]}
                </span>
                <span role="cell" className="col-span-2 md:col-span-1">
                  <CellLabel>{sg.palette.cols.chip}</CellLabel>
                  <span
                    className="f-caption flex h-14 w-full items-end px-3 pb-2 normal-case md:w-44"
                    style={{
                      background: isHex ? row.value : `linear-gradient(${row.value}, ${row.value}) ${palette.paper}`,
                      color: chipText,
                      outline: "1px solid var(--color-rule-soft)",
                      outlineOffset: -1,
                    }}
                  >
                    {row.value}
                  </span>
                </span>
              </div>
            );
          })}
          <div className="rule-bottom" />
        </div>
      </section>

      {/* ── AA: every §C.2 pair, ratio computed at render time ────────────── */}
      <section className="mt-[var(--section-gap)]">
        <SheetCaption>{sg.aa.caption}</SheetCaption>
        <p className="f-meta mt-2 text-graphite">
          {sg.aa.normalNote.replace("{n}", AA_NORMAL.toFixed(1))} {sg.aa.largeNote.replace("{n}", AA_LARGE.toFixed(1))}
        </p>
        <AATable rows={AA_PAIRS} sg={sg} label={sg.aa.caption} />

        <h3 className="f-caption mt-[var(--section-gap-after)] text-graphite">{sg.aa.forbiddenCaption}</h3>
        <p className="f-meta mt-1 max-w-[var(--measure)] text-graphite">{sg.aa.forbiddenNote}</p>
        <AATable rows={FORBIDDEN_PAIRS} sg={sg} label={sg.aa.forbiddenCaption} />
      </section>

      {/* ── Type specimen: each .f-* on real copy ─────────────────────────── */}
      <section className="mt-[var(--section-gap)]">
        <SheetCaption>{sg.type.caption}</SheetCaption>
        <div className="rule-top mt-2" role="table" aria-label={sg.type.caption}>
          <div role="row" className="hidden md:grid md:grid-cols-[9rem_1fr_17rem_7rem] rule-soft py-2 text-graphite">
            <span role="columnheader" className="f-caption">{sg.type.cols.cls}</span>
            <span role="columnheader" className="f-caption">{sg.type.cols.sample}</span>
            <span role="columnheader" className="f-caption">{sg.type.cols.size}</span>
            <span role="columnheader" className="f-caption">{sg.type.cols.axes}</span>
          </div>
          {TYPE_ROWS.map((row) => (
            <div
              key={row.cls}
              role="row"
              className="grid grid-cols-1 gap-y-2 md:grid-cols-[9rem_1fr_17rem_7rem] md:items-baseline rule-soft row-hover py-4"
            >
              <span role="cell" className="f-cell">
                <CellLabel>{sg.type.cols.cls}</CellLabel>.{row.cls}
              </span>
              <span role="cell" className="min-w-0 md:pr-6">
                <CellLabel>{sg.type.cols.sample}</CellLabel>
                <span className={`${row.cls} block`}>{typeSample(row.cls, t)}</span>
              </span>
              <span role="cell" className="f-meta text-graphite">
                <CellLabel>{sg.type.cols.size}</CellLabel>
                {row.size}
              </span>
              <span role="cell" className="f-meta text-graphite">
                <CellLabel>{sg.type.cols.axes}</CellLabel>
                {row.wdth} / {row.wght}
              </span>
            </div>
          ))}
          <div className="rule-bottom" />
        </div>
      </section>

      {/* ── The yellow band, as a static swatch (phase stamped, counter, Email) ─ */}
      <section className="mt-[var(--section-gap)]">
        <SheetCaption>{sg.band.caption}</SheetCaption>
        <div className="on-safety mt-2 flex flex-wrap items-stretch border border-ink bg-safety band-h">
          <div className="flex items-center gap-4 px-5 py-3">
            <span className="stamp stamp--filled f-stamp">{t.phases.intake.name}</span>
            <span className="f-caption">{t.phases.intake.roleTag}</span>
          </div>
          <div className="hidden items-center border-l border-ink px-5 md:flex">
            <span className="f-meta">{sg.band.region}</span>
          </div>
          <div className="ml-auto flex items-center border-l border-ink px-5">
            <span className="f-cell">{t.band.counter.replace("{n}", "1")}</span>
          </div>
          <div className="flex items-center border-l border-ink">
            <a className="f-caption flex min-h-11 items-center px-5" href={`mailto:${t.release.email}`}>
              {t.band.email}
            </a>
          </div>
        </div>
        <p className="f-meta mt-2 text-graphite">
          {palette.safety} · {formatRatio(contrastRatio(palette.ink, palette.safety))} : 1 ·{" "}
          {formatRatio(contrastRatio(palette.stampDeep, palette.safety))} : 1
        </p>
      </section>

      {/* ── Motion: the two verbs, at rest ───────────────────────────────── */}
      <section className="mt-[var(--section-gap)]">
        <SheetCaption>{sg.motion.caption}</SheetCaption>
        <div className="grid-12 fields mt-2">
          <div className="field col-span-12 md:col-span-6">
            <span className="f-caption field-caption">{sg.motion.rule.label}</span>
            <div className="rule-top mt-4" />
            <p className="f-body mt-3">{sg.motion.rule.body}</p>
            <div className="rule-soft mt-3" />
            <p className="f-meta mt-3 text-graphite">--ease-rule cubic-bezier(.16, 1, .3, 1) · --dur-rule 320 ms</p>
          </div>
          <div className="field col-span-12 md:col-span-6">
            <span className="f-caption field-caption">{sg.motion.stamp.label}</span>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <span className="stamp f-stamp">{t.phases.intake.name}</span>
              <span className="stamp stamp--filled f-stamp">{t.release.stamp}</span>
            </div>
            <p className="f-body mt-4">{sg.motion.stamp.body}</p>
            <p className="f-meta mt-3 text-graphite">--ease-stamp cubic-bezier(.2, .9, .25, 1.03) · --dur-stamp 220 ms</p>
          </div>
        </div>
      </section>

      <div className="perforation mt-[var(--section-gap)]" />
      <p className="f-strip text-graphite">
        {t.footer.copyright} · {sg.note}
      </p>
    </main>
  );
}

function AATable({
  rows,
  sg,
  label,
}: {
  rows: { fg: string; bg: string; use: UseKey }[];
  sg: (typeof dict)[Locale]["styleguide"];
  label: string;
}) {
  return (
    <div className="rule-top mt-3" role="table" aria-label={label}>
      <div
        role="row"
        className="hidden md:grid md:grid-cols-[6rem_9rem_9rem_7rem_8rem_1fr] rule-soft py-2 text-graphite"
      >
        <span role="columnheader" className="f-caption" aria-hidden="true" />
        <span role="columnheader" className="f-caption">{sg.aa.cols.fg}</span>
        <span role="columnheader" className="f-caption">{sg.aa.cols.bg}</span>
        <span role="columnheader" className="f-caption">{sg.aa.cols.ratio}</span>
        <span role="columnheader" className="f-caption">{sg.aa.cols.verdict}</span>
        <span role="columnheader" className="f-caption">{sg.aa.cols.use}</span>
      </div>
      {rows.map((p) => {
        const ratio = contrastRatio(p.fg, p.bg);
        const v = aaVerdict(ratio);
        const verdict = v.normal ? sg.aa.pass : sg.aa.fail;
        return (
          <div
            key={`${p.fg}-${p.bg}`}
            role="row"
            className="grid grid-cols-[4.5rem_1fr_1fr] gap-x-4 gap-y-2 md:grid-cols-[6rem_9rem_9rem_7rem_8rem_1fr] md:items-center rule-soft row-hover py-3"
          >
            <span role="cell" className="row-span-2 md:row-span-1">
              <span
                aria-hidden="true"
                className="f-stamp flex h-12 w-full items-center justify-center md:w-16"
                style={{ background: p.bg, color: p.fg, outline: "1px solid var(--color-rule-soft)", outlineOffset: -1 }}
              >
                Aa
              </span>
            </span>
            <span role="cell" className="f-cell">
              <CellLabel>{sg.aa.cols.fg}</CellLabel>
              {p.fg}
            </span>
            <span role="cell" className="f-cell">
              <CellLabel>{sg.aa.cols.bg}</CellLabel>
              {p.bg}
            </span>
            <span role="cell" className="f-cell">
              <CellLabel>{sg.aa.cols.ratio}</CellLabel>
              {formatRatio(ratio)} : 1
            </span>
            <span role="cell" className="f-caption">
              <CellLabel>{sg.aa.cols.verdict}</CellLabel>
              <span className={v.normal ? "text-ink" : "text-stamp"}>{verdict}</span>
              {!v.normal && v.large ? <span className="f-meta ml-1 normal-case tracking-normal text-graphite">≥ {AA_LARGE.toFixed(1)}</span> : null}
            </span>
            <span role="cell" className="f-meta col-span-3 text-graphite md:col-span-1">
              <CellLabel>{sg.aa.cols.use}</CellLabel>
              {sg.aa.uses[p.use]}
            </span>
          </div>
        );
      })}
      <div className="rule-bottom" />
    </div>
  );
}
