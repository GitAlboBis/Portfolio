"use client";

import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { useHydrated } from "@/lib/use-hydrated";
import { Appear } from "@/components/motion/Appear";
import { RollLink } from "@/components/motion/RollLink";
import { FlipText } from "@/components/reveal/FlipText";

type Lenis = { scrollTo: (t: number, o?: { offset?: number }) => void };

function toTop() {
  const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
  if (lenis?.scrollTo) lenis.scrollTo(0);
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Footer — coda, continues the night band. The closing frame is a full-width
 * "Alberto Tuveri" wordmark that hinges out of the dark plank by plank
 * (FlipText — resurrected from dead code; its .flip-word CSS is load-bearing
 * again), with a single ember full-stop as the page's final jewel. It lives
 * OUTSIDE the Appear wrapper: nesting the hinge inside the stagger would
 * double-animate it into mush. Meta row (place, contact nav, rights) keeps the
 * quiet Appear entrance. Text auto-themed by the `.night` scope.
 */
export function Footer() {
  const t = useDict();
  const soundEnabled = useUI((s) => s.soundEnabled);
  const setSoundEnabled = useUI((s) => s.setSoundEnabled);
  // Persisted flag: render the OFF state until hydration so SSR HTML matches.
  const soundOn = useHydrated() && soundEnabled;
  return (
    <footer className="night bleed relative z-10">
      <div className="container-edit py-16">
        <div className="rule-node mb-12" style={{ background: "rgb(244 237 229 / 0.16)" }} />

        {/* Closing wordmark — the last thing the page says. aria-hidden ember
            period sits OUTSIDE the split target (a non-split sibling), so the
            accessible name stays the clean "Alberto Tuveri". */}
        <p className="font-display font-bold leading-[0.95] tracking-[-0.03em] text-paper [font-size:clamp(3.25rem,10.5vw,8.5rem)]">
          <FlipText as="span" className="inline-block">
            Alberto Tuveri
          </FlipText>
          <span aria-hidden className="text-ember">
            .
          </span>
        </p>

        <Appear as="div" className="mt-12" stagger={0.12} y={24}>
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <p className="t-meta">{t.footer.place}</p>

            <nav className="flex items-center gap-7">
              {/* MAREA ambient toggle — the switch the engine in lib/sound.ts
                  answers to. The click IS the WebAudio user gesture. */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundOn)}
                aria-pressed={soundOn}
                className="t-meta flex items-center gap-2 transition-colors duration-300 hover:text-amber"
              >
                <span
                  aria-hidden
                  className={`inline-block size-1.5 rounded-full transition-colors duration-300 ${
                    soundOn ? "animate-pulse bg-amber" : "bg-paper/35"
                  }`}
                />
                {t.footer.sound} · {soundOn ? t.footer.soundOn : t.footer.soundOff}
              </button>
              <RollLink
                as="a"
                href={`mailto:${t.contact.email}`}
                label={t.footer.email}
                className="t-meta transition-colors duration-300 hover:text-amber"
              />
              <RollLink
                as="button"
                onClick={toTop}
                prefix="↑"
                label={t.footer.top}
                className="t-meta transition-colors duration-300 hover:text-amber"
              />
            </nav>
          </div>

          {/* suppressHydrationWarning: SSG bakes the build-time year; a visit in a
              later year re-renders client-side without a hydration error. */}
          <p className="t-meta mt-14 opacity-70" suppressHydrationWarning>
            © {new Date().getFullYear()} Alberto Tuveri · {t.footer.rights}
          </p>
        </Appear>
      </div>
    </footer>
  );
}
