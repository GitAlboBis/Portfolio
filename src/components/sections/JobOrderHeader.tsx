"use client";

import { useDict } from "@/content/dict";
import { Field } from "@/components/sheet/Field";

/**
 * JobOrderHeader — row B of the first viewport (REDESIGN-SPEC §A, §E.2): the
 * identity of the sheet, printed as two ruled fields sharing one line.
 *
 *   • "Job order" (8 of 12 columns) — the caption inside the box, top left,
 *     and the name in `.f-name` (88px wide-axis at 1440, the page's only h1).
 *   • "Role" (4 columns) — the two role lines from the CV and the degree line.
 *
 * Motion: RULE-IN only — each field's top rule draws itself and the type
 * appears 90ms later (the Role field a beat after the name). **No SplitText:**
 * the name is printed, not assembled (§E.2).
 *
 * The block is pulled up 1px so its top rule lands ON the header strip's
 * bottom rule, and down 1px at the end so the phase band's top rule lands on
 * its own: fields share their rules, they never double them (§C.4).
 */
export function JobOrderHeader() {
  const t = useDict();

  return (
    <header className="sheet -mt-px -mb-px">
      <div className="fields grid-12">
        <Field caption={t.header.caption} className="col-span-12 md:col-span-8">
          <h1 className="f-name mt-1 text-ink">{t.header.name}</h1>
        </Field>

        <Field
          caption={t.header.roleCaption}
          delay={0.06}
          className="col-span-12 border-l-0 md:col-span-4 md:border-l"
        >
          <p className="f-role mt-1 text-ink">{t.header.role1}</p>
          <p className="f-role text-ink">{t.header.role2}</p>
          {/* The degree line is three lines of 13px at 390px — 66px of the 844
              the mobile first viewport has to spend (finish review F4). On a
              phone it is printed once, in the Owner field of the Intake block
              below the fold, where it belongs to the same identity; here it is
              a desktop row-B field, exactly as §A specifies. */}
          <p className="f-meta mt-3 hidden text-graphite md:block">{t.header.degree}</p>
        </Field>
      </div>
    </header>
  );
}
