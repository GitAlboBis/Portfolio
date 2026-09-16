"use client";

import { useDict } from "@/content/dict";
import { links } from "@/content/career";
import { Perforation } from "@/components/sheet/Perforation";
import { RuleIn } from "@/components/sheet/RuleIn";

/**
 * Footer — the foot of the sheet (REDESIGN-SPEC §E.11): the copyright line and
 * the four public links, above a perforation and a 64px strip. Nothing else:
 * no coordinates, no "Ambient", no wordmark, no sound — the order is signed in
 * the Release panel, this is the tear-off edge of the form.
 *
 * Motion: RULE-IN once, like every other field.
 */
export function Footer() {
  const t = useDict();

  const row = [links.linkedin, links.github, links.sersan, links.spherenode];

  return (
    <footer className="sheet pt-[var(--section-gap)]">
      <Perforation />
      <RuleIn>
        <div className="flex h-16 flex-wrap items-center justify-between gap-x-8 gap-y-2 py-2">
          <span className="f-meta tabular-nums text-graphite">{t.footer.copyright}</span>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-1">
            {row.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="link f-meta" rel="noopener">
                  {l.display}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </RuleIn>
    </footer>
  );
}
