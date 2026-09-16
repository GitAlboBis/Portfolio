"use client";

/*
  ╔════════════════════════════════════════════════════════════════════════╗
  ║  TEMPORARY GATE ROUTE — WP-2 — DELETE IN WP-9                          ║
  ║  /dev/phases: six tall regions with id #phase-<id> so the band's       ║
  ║  signature interaction (stamp on region enter, counter n / 6, click →  ║
  ║  lenis.scrollTo) can be verified before WP-4 builds the real sheet.    ║
  ║  Also exercises the primitives: Field, RuleIn (rows), Perforation,     ║
  ║  Stamp variants, Button. No product copy is invented: captions come    ║
  ║  from dict.ts; the filler is the phase name only.                      ║
  ╚════════════════════════════════════════════════════════════════════════╝
*/
import { useDict } from "@/content/dict";
import { Field } from "@/components/sheet/Field";
import { Perforation } from "@/components/sheet/Perforation";
import { RuleIn } from "@/components/sheet/RuleIn";
import { Stamp } from "@/components/sheet/Stamp";
import { Button } from "@/components/ui/button";
import { PHASES, phaseAnchor } from "@/lib/phases";

export default function DevPhasesPage() {
  const t = useDict();
  return (
    <main id="main" className="sheet pb-[var(--section-gap)]">
      {PHASES.map((id, i) => {
        const p = t.phases[id];
        return (
          <section
            key={id}
            id={phaseAnchor(id)}
            aria-labelledby={`${phaseAnchor(id)}-caption`}
            className="min-h-[100vh] pt-[var(--section-gap)]"
          >
            <div className="fields grid-12">
              <Field
                caption={p.name}
                captionId={`${phaseAnchor(id)}-caption`}
                className="col-span-12 md:col-span-8"
              >
                <h2 className="f-headline pt-2">{p.name}</h2>
                <p className="f-meta mt-3 text-graphite">
                  {p.roleTag} · {i + 1} / {PHASES.length}
                </p>
              </Field>
              <Field caption={t.header.roleCaption} className="col-span-12 md:col-span-4" delay={0.09}>
                <p className="f-cell pt-2">{p.roleTag}</p>
              </Field>
            </div>

            {id === "estimate" ? (
              <RuleIn rows className="fields mt-8 border-l border-ink">
                {PHASES.map((row) => (
                  <div
                    key={row}
                    data-row
                    className="row-hover flex min-h-[var(--cell-h)] items-center justify-between rule-soft px-5 f-cell"
                  >
                    <span>{t.phases[row].name}</span>
                    <span className="f-meta text-graphite">{t.phases[row].roleTag}</span>
                  </div>
                ))}
              </RuleIn>
            ) : null}

            {id === "test" ? (
              <div className="mt-8 flex flex-wrap items-end gap-8">
                <Stamp label={t.bench.live} variant="live" active />
                <Stamp label={t.release.stamp} variant="released" active />
                <Stamp label={t.notFound.stamp} variant="void" active />
              </div>
            ) : null}

            {id === "release" ? (
              <div className="mt-8 flex flex-wrap gap-4">
                <Button>{t.band.email}</Button>
                <Button variant="ruled">{t.band.back}</Button>
              </div>
            ) : null}

            <Perforation className="mt-12" />
          </section>
        );
      })}
    </main>
  );
}
