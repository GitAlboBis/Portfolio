"use client";

import { useDict } from "@/content/dict";
import { Field } from "@/components/sheet/Field";
import { Perforation } from "@/components/sheet/Perforation";
import { Stamp } from "@/components/sheet/Stamp";
import { TransitionLink } from "@/components/transition/TransitionLink";

/*
  404 — an empty job order stamped VOID (REDESIGN-SPEC §E.14 / §G).
  The header strip and the band come from layout.tsx (nothing pre-stamped on
  an unknown route: the band shows "0 / 6" and the "Job order ↖" cell). Here:
  an empty "Job order" field with the VOID stamp, the one sentence, and a
  ruled "Job order ↖" cell back to the sheet. Client component: the copy is
  bilingual through dict.ts.
*/
export default function NotFound() {
  const t = useDict();
  return (
    <main id="main" tabIndex={-1} className="sheet min-h-[calc(100dvh-var(--band-h)-3rem)] py-[var(--section-gap)]">
      <div className="fields grid-12">
        <Field caption={t.header.caption} className="col-span-12 md:col-span-8 min-h-[16rem] md:min-h-[22rem]">
          <div className="flex h-full flex-col justify-between gap-8">
            <h1 className="f-headline max-w-[24ch] pt-2">{t.notFound.title}</h1>
            <div className="flex justify-end pr-2 pb-2">
              <Stamp label={t.notFound.stamp} variant="void" active />
            </div>
          </div>
        </Field>
        <Field caption={t.header.roleCaption} className="col-span-12 md:col-span-4" delay={0.09}>
          <p className="f-meta text-graphite">—</p>
        </Field>
      </div>
      <Perforation />
      <div className="fields inline-grid">
        <TransitionLink
          href="/"
          className="field-link flex min-h-[var(--cell-h)] items-center border-l border-t border-ink px-5 f-caption text-ink transition-[background-color] duration-[var(--dur-hover)] ease-linear hover:bg-paper-field"
        >
          {t.band.back}
        </TransitionLink>
      </div>
    </main>
  );
}
