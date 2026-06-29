"use client";

import { useDict } from "@/content/dict";
import { Reveal } from "@/components/reveal/Reveal";
import { buttonVariants } from "@/components/ui/button";
import { palette } from "@/content/tokens";

/**
 * Contact — the one dark inversion (night band). Warm plum ground, paper text,
 * amber eyebrow (auto-themed by the `.night` scope in globals). Oversized closing
 * statement reveals on scroll; the CTA is a real mailto.
 */
export function Contact() {
  const t = useDict();
  return (
    <section
      id="contact"
      className="night scroll-anchor bleed"
      style={{ background: palette.night }}
    >
      <div className="container-edit">
        <p className="t-eyebrow eyebrow-tick">{t.contact.eyebrow}</p>
        <Reveal as="h2" className="t-display mt-6 max-w-[20ch]">
          {t.contact.headline}
        </Reveal>
        <div className="mt-12">
          <a
            href={`mailto:${t.contact.email}`}
            className={buttonVariants({ variant: "night", size: "lg" })}
          >
            {t.contact.cta}
            <span aria-hidden className="opacity-70">
              — {t.contact.email}
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
