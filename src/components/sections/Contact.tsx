"use client";

import { useDict } from "@/content/dict";
import { TideSurge } from "@/components/reveal/TideSurge";
import { buttonVariants } from "@/components/ui/button";
import { Magnetic } from "@/components/motion/Magnetic";
import { Appear } from "@/components/motion/Appear";
import { BorderBeam } from "@/components/motion/BorderBeam";

/**
 * Contact — the one dark inversion (night band). Warm plum ground, paper text,
 * amber eyebrow (auto-themed by the `.night` scope in globals). Oversized closing
 * statement reveals on scroll; the CTA is a real mailto.
 */
export function Contact() {
  const t = useDict();
  return (
    // flex-1: inside the home's min-h-screen night band (flex-col), Contact takes
    // the slack so the Footer stays anchored to the very bottom edge.
    <section id="contact" className="night scroll-anchor bleed relative z-10 flex-1">
      <div className="container-edit">
        <Appear as="p" className="t-eyebrow eyebrow-tick">
          {t.contact.eyebrow}
        </Appear>
        {/* The signature line rises like the tide and settles — scrubbed, so it
            plays (and reverses) with the scroll itself. */}
        <TideSurge as="h2" className="t-display mt-6 max-w-[20ch]">
          {t.contact.headline}
        </TideSurge>
        <Magnetic className="mt-12" strength={0.45}>
          <a
            href={`mailto:${t.contact.email}`}
            className={buttonVariants({ variant: "night", size: "lg" })}
          >
            <BorderBeam from="var(--color-amber)" via="var(--color-ember)" width={1.5} size={64} />
            {t.contact.cta}
            <span aria-hidden className="opacity-70">
              — {t.contact.email}
            </span>
          </a>
        </Magnetic>
      </div>
    </section>
  );
}
