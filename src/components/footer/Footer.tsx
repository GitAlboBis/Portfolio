"use client";

import { useDict } from "@/content/dict";
import { palette } from "@/content/tokens";
import { Appear } from "@/components/motion/Appear";
import { ShimmerText } from "@/components/reveal/ShimmerText";

type Lenis = { scrollTo: (t: number, o?: { offset?: number }) => void };

function toTop() {
  const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
  if (lenis?.scrollTo) lenis.scrollTo(0);
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Footer — coda, continues the night band. Name + Sardinia coordinates, contact
 * + back-to-top, copyright. Text auto-themed by the `.night` scope.
 */
export function Footer() {
  const t = useDict();
  return (
    <footer className="night bleed" style={{ background: palette.night }}>
      <Appear as="div" className="container-edit py-16" stagger={0.12} y={24}>
        <div className="rule-node mb-12" style={{ background: "rgb(244 237 229 / 0.16)" }} />

        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <ShimmerText
              as="p"
              className="font-display text-2xl font-semibold"
              base="var(--color-paper)"
              sheen="var(--color-amber)"
            >
              Alberto&nbsp;Tuveri
            </ShimmerText>
            <p className="t-meta mt-2">{t.footer.place}</p>
          </div>

          <nav className="flex gap-7">
            <a
              href={`mailto:${t.contact.email}`}
              className="t-meta transition-colors duration-300 hover:text-amber"
            >
              Email
            </a>
            <button
              onClick={toTop}
              className="t-meta transition-colors duration-300 hover:text-amber"
            >
              ↑ Top
            </button>
          </nav>
        </div>

        <p className="t-meta mt-14 opacity-70">© 2026 Alberto Tuveri · {t.footer.rights}</p>
      </Appear>
    </footer>
  );
}
