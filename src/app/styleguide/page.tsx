import type { Metadata } from "next";
import { palette } from "@/content/tokens";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Golden Hour — Design System",
  description: "The visual contract: sunset tokens, AA pairs, type scale, components, motion.",
};

/* ── data ──────────────────────────────────────────────────────────────── */

const ramp: { name: string; hex: string; use: string }[] = [
  { name: "amber", hex: palette.amber, use: "Golden hour · fills, large accents" },
  { name: "coral", hex: palette.coral, use: "Peach · fills, gradient mid" },
  { name: "ember", hex: palette.ember, use: "PRIMARY accent · CTAs, display" },
  { name: "ember-ink", hex: palette.emberInk, use: "Orange TEXT (AA on paper)" },
  { name: "rose", hex: palette.rose, use: "Sunset rose · accent, gradient" },
  { name: "dusk", hex: palette.dusk, use: "Cool twilight counterpoint" },
];

const neutrals: { name: string; hex: string; use: string }[] = [
  { name: "paper", hex: palette.paper, use: "Page ground (warm white)" },
  { name: "paper-deep", hex: palette.paperDeep, use: "Surfaces, cards, hairlines" },
  { name: "ink-mute", hex: palette.inkMute, use: "Muted text on paper" },
  { name: "ink", hex: palette.ink, use: "Primary text (warm espresso)" },
  { name: "night", hex: palette.night, use: "The one dark band · footer" },
];

const aaPairs: { fg: string; bg: string; fgHex: string; bgHex: string; ratio: string; grade: string }[] = [
  { fg: "ink", bg: "paper", fgHex: palette.ink, bgHex: palette.paper, ratio: "15.5:1", grade: "AAA" },
  { fg: "ink-mute", bg: "paper", fgHex: palette.inkMute, bgHex: palette.paper, ratio: "6.5:1", grade: "AA" },
  { fg: "ember-ink", bg: "paper", fgHex: palette.emberInk, bgHex: palette.paper, ratio: "5.0:1", grade: "AA" },
  { fg: "ink", bg: "ember", fgHex: palette.ink, bgHex: palette.ember, ratio: "5.6:1", grade: "AA" },
  { fg: "ink", bg: "amber", fgHex: palette.ink, bgHex: palette.amber, ratio: "8.0:1", grade: "AAA" },
  { fg: "ink", bg: "coral", fgHex: palette.ink, bgHex: palette.coral, ratio: "7.2:1", grade: "AAA" },
  { fg: "paper", bg: "night", fgHex: palette.paper, bgHex: palette.night, ratio: "15.6:1", grade: "AAA" },
  { fg: "amber", bg: "night", fgHex: palette.amber, bgHex: palette.night, ratio: "8.1:1", grade: "AAA" },
];

const typeSamples: { cls: string; label: string; sample: string; specs: string }[] = [
  { cls: "t-hero", label: ".t-hero", sample: "Alberto Tuveri", specs: "Bricolage 700 · clamp 3.5–12rem · −.035em" },
  { cls: "t-display", label: ".t-display", sample: "Selected Work", specs: "Bricolage 640 · clamp 2.5–6rem" },
  { cls: "t-title", label: ".t-title", sample: "Tidewatch", specs: "Bricolage 600 · clamp 2–4rem" },
  { cls: "t-lead", label: ".t-lead", sample: "Warm on the surface. Restless underneath.", specs: "DM Sans 400 · 1.3–2rem · ink-mute" },
  { cls: "t-body", label: ".t-body", sample: "I build interfaces that move like light on water — full-stack systems, AI pipelines, and the occasional shader.", specs: "DM Sans 400 · 1–1.06rem · max 62ch" },
  { cls: "t-index", label: ".t-index", sample: "01 — 06", specs: "Bricolage tabular" },
];

/* ── primitives ────────────────────────────────────────────────────────── */

function SectionHead({ index, title, sub }: { index: string; title: string; sub: string }) {
  return (
    <header className="mb-12">
      <p className="t-eyebrow eyebrow-tick mb-5">
        <span className="text-ink-mute">{index} —</span> Golden Hour Design System
      </p>
      <h2 className="t-display">{title}</h2>
      <p className="t-body t-body--mute mt-4">{sub}</p>
    </header>
  );
}

function Swatch({ name, hex, use }: { name: string; hex: string; use: string }) {
  return (
    <div className="glass overflow-hidden">
      <div className="h-24 w-full" style={{ background: hex, borderBottom: "1px solid rgba(42,26,20,0.06)" }} />
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-sans text-sm font-semibold text-ink">{name}</span>
          <span className="t-meta lowercase tracking-normal">{hex}</span>
        </div>
        <p className="mt-1 font-sans text-xs leading-relaxed text-ink-mute">{use}</p>
      </div>
    </div>
  );
}

/* ── page ──────────────────────────────────────────────────────────────── */

export default function StyleguidePage() {
  return (
    <main className="relative min-h-dvh pb-40 pt-28">
      {/* Intro */}
      <section className="container-edit">
        <p className="t-eyebrow eyebrow-tick mb-6">Design System · v1 · also on claude.ai/design</p>
        <h1 className="t-hero">Golden Hour.</h1>
        <p className="t-lead mt-6 max-w-3xl">
          A warm, light descent into the last hour of sun — the sea reflecting fire, type at full
          volume, motion that settles like the tide going out.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {["Warm", "Editorial", "Tidal"].map((a) => (
            <span
              key={a}
              className="rounded-full border border-[var(--color-rule)] px-4 py-2 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-ember-ink"
            >
              {a}
            </span>
          ))}
        </div>
        {/* the one sanctioned gradient */}
        <div
          className="mt-10 h-16 rounded-xl border border-[var(--color-rule)]"
          style={{ background: "var(--gradient-sunset)" }}
        />
        <hr className="hairline mt-16" />
      </section>

      {/* 01 — Color */}
      <section className="container-edit mt-28">
        <SectionHead
          index="01"
          title="Color is the light"
          sub="A literal sunset ramp over warm white. Ember leads; dark text is warm ink. No cold neon, no generic gradient — the band above is the only gradient, and it's a real sunset."
        />
        <p className="t-meta mb-4">Sunset ramp · golden → dusk</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {ramp.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </div>
        <p className="t-meta mb-4 mt-12">Neutrals · the one dark band</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {neutrals.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </div>
      </section>

      {/* 02 — Contrast */}
      <section className="container-edit mt-28">
        <SectionHead
          index="02"
          title="Verified contrast"
          sub="Every text/background pair is WCAG-checked (real ratios). CTAs use ink on ember — white on ember is only large-text AA."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {aaPairs.map((p) => (
            <div
              key={`${p.fg}-${p.bg}`}
              className="flex flex-col justify-between rounded-[14px] p-5"
              style={{ background: p.bgHex, color: p.fgHex, border: "1px solid rgba(42,26,20,0.08)" }}
            >
              <p className="font-sans text-2xl font-semibold leading-tight">Aa</p>
              <div className="mt-6">
                <p className="font-sans text-xs font-semibold uppercase tracking-wider">
                  {p.fg} / {p.bg}
                </p>
                <p className="font-sans text-xs opacity-80">
                  {p.ratio} · {p.grade}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 03 — Typography */}
      <section className="container-edit mt-28">
        <SectionHead
          index="03"
          title="Type that carries warmth"
          sub="Bricolage Grotesque for display & headlines; DM Sans for labels and body. Weight via font-weight — no axis micro-management."
        />
        <div className="flex flex-col gap-12">
          {typeSamples.map((t) => (
            <div
              key={t.cls}
              className="grid gap-3 border-l border-[var(--color-rule)] pl-6 lg:grid-cols-[1fr_auto] lg:items-end"
            >
              <div className={t.cls}>{t.sample}</div>
              <div className="shrink-0 lg:text-right">
                <p className="font-sans text-sm font-semibold text-ink">{t.label}</p>
                <p className="font-sans text-xs text-ink-mute">{t.specs}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 04 — Components */}
      <section className="container-edit mt-28">
        <SectionHead
          index="04"
          title="Components"
          sub="Depth from warm light and layered surfaces, never heavy shadows. The sheen sweeps on hover only."
        />
        <p className="t-meta mb-5">Buttons</p>
        <div className="mb-12 flex flex-wrap items-center gap-4">
          <Button variant="primary">Write to me</Button>
          <Button variant="secondary">View work</Button>
          <Button variant="ghost">Read more</Button>
          <Button variant="primary" size="lg">
            Large CTA
          </Button>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="glass p-7">
            <p className="t-eyebrow mb-3">Warm surface</p>
            <p className="t-title mb-2">A pocket of paper</p>
            <p className="t-body t-body--mute">
              Surfaces are warm white over a faint paper-deep wash with a hairline edge — depth from
              light and warmth, not heavy shadows.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-8 rounded-[14px] border border-[var(--color-rule)] p-7">
            <div>
              <p className="t-eyebrow eyebrow-tick mb-4">Eyebrow with ember tick</p>
              <hr className="hairline" />
              <p className="mt-3 font-sans text-xs text-ink-mute">.hairline — warm coral light-band</p>
            </div>
            <div>
              <div className="rule-node" />
              <p className="mt-3 font-sans text-xs text-ink-mute">.rule-node — section coda with ember node</p>
            </div>
          </div>
        </div>
      </section>

      {/* 05 — Motion */}
      <section className="container-edit mt-28">
        <SectionHead
          index="05"
          title="Tidal motion"
          sub="Everything decelerates as if through warm water — slower than default. Hover a bar to feel the easing."
        />
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { name: "tide", cls: "ease-[var(--ease-tide)]", note: "primary — heavy out, settling" },
            { name: "dive", cls: "ease-[var(--ease-dive)]", note: "symmetric — transitions" },
            { name: "drift", cls: "ease-[var(--ease-drift)]", note: "gentle — ambient / marquee" },
          ].map((e) => (
            <div key={e.name} className="group glass overflow-hidden p-5">
              <p className="font-sans text-sm font-semibold text-ink">--ease-{e.name}</p>
              <p className="font-sans text-xs text-ink-mute">{e.note}</p>
              <div className="mt-5 h-10 overflow-hidden rounded-full bg-paper-deep">
                <div
                  className={`h-full w-10 rounded-full bg-ember transition-transform duration-700 group-hover:translate-x-[calc(100%*5)] ${e.cls}`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 06 — The one inversion: night band */}
      <section className="night bleed mt-28 scroll-anchor" style={{ background: palette.night }}>
        <div className="container-edit py-24" style={{ color: palette.paper }}>
          <p
            className="font-sans text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: palette.amber }}
          >
            06 — Night falls
          </p>
          <h2 className="t-display mt-5" style={{ color: palette.paper }}>
            Let&apos;s make something that moves.
          </h2>
          <p className="t-body mt-5" style={{ color: "#d9c8bf", maxWidth: "52ch" }}>
            The single dark band — deep warm night — closes the page after the golden peak. Used
            exactly once, it reads as dusk settling over Masua.
          </p>
          <div className="mt-8">
            <Button variant="night" size="lg">
              Get in touch
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
