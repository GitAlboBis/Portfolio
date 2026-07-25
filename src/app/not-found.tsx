"use client";

/*
  ALLA DERIVA — the 404 as a becalmed moment at sea. Real DJI footage
  (clip 0345): the drone chases a small boat's wake toward the cliffs,
  passes it, and is left alone facing Pan di Zucchero.

  The trick that keeps it honest:
  • the poster IS the film's FINAL frame. The page opens on the becalmed
    still, dissolves into the chase (video fades in on `playing`), and the
    film ENDS back on the exact pixels it started from — a closed circle
    of time with no visible cut anywhere.
  • the video plays ONCE and lasts 4.8s — under the 5s line of WCAG 2.2.2,
    so the auto-motion is exempt by construction (no pause chrome needed).
  • reduced-motion / no-JS-yet: the still alone. Video bytes are mobile-
    variant picked at mount; nothing loops, nothing keeps a decoder alive.
*/

import { useEffect, useState } from "react";
import { TransitionLink as Link } from "@/components/transition/TransitionLink";
import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";
import { useHydrated } from "@/lib/use-hydrated";

export default function NotFound() {
  const t = useDict();
  const locale = useUI((s) => s.locale);
  const toggleLocale = useUI((s) => s.toggleLocale);
  const reduced = useUI((s) => s.reducedMotion);
  // render-time reduced branch must wait for hydration (store resolves from
  // matchMedia at module load — SSR html must match the first client render)
  const hydrated = useHydrated();
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (reduced) return;
    setSrc(window.innerWidth < 768 ? "/coast/adrift-960.mp4" : "/coast/adrift-1600.mp4");
  }, [reduced]);

  return (
    <main id="main" className="night relative h-dvh overflow-hidden bg-night">
      {/* the becalmed still — also the film's final frame (see header note) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/coast/adrift-poster.webp"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      {src && hydrated && !reduced && (
        <video
          src={src}
          aria-hidden
          muted
          playsInline
          autoPlay
          preload="auto"
          disablePictureInPicture
          onPlaying={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500"
        />
      )}

      {/* top scrim — wordmark and EN/IT toggle stay AA over the bright sky */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0"
        style={{
          height: "calc(var(--nav-h) * 2.2)",
          background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--color-night) 62%, transparent), transparent)",
        }}
      />
      {/* dusk scrim — paper copy stays AA over the bright sea */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[52vh]"
        style={{
          background:
            "linear-gradient(to top, color-mix(in oklab, var(--color-night) 82%, var(--color-dusk)) 0%, color-mix(in srgb, color-mix(in oklab, var(--color-night) 82%, var(--color-dusk)) 62%, transparent) 52%, transparent 100%)",
          opacity: 0.78,
        }}
      />

      {/* chrome: wordmark home + EN/IT — the castaway still gets a compass */}
      <header className="absolute inset-x-0 top-0 z-10">
        <nav
          className="container-edit flex items-center justify-between"
          style={{ height: "var(--nav-h)" }}
        >
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-[-0.02em] text-paper transition-opacity duration-300 hover:opacity-70"
          >
            Alberto&nbsp;Tuveri
          </Link>
          <button
            onClick={toggleLocale}
            className="t-meta px-3 py-2 text-amber underline-offset-4 transition-colors duration-300 hover:underline"
          >
            {locale === "en" ? "IT" : "EN"}
            <span className="sr-only"> — {t.nav.langToggle}</span>
          </button>
        </nav>
      </header>

      <div className="container-edit absolute inset-x-0 bottom-0 z-10 pb-[clamp(2.5rem,8vh,5.5rem)]">
        <p className="t-eyebrow eyebrow-tick text-paper/85">{t.notFound.eyebrow}</p>
        <h1 className="t-display mt-4 max-w-[16ch] text-paper">{t.notFound.title}</h1>
        <p className="t-meta mt-5 text-paper/75">{t.notFound.body}</p>
        <Link
          href="/"
          className="link t-meta mt-8 inline-block text-amber transition-colors duration-300 hover:text-paper"
        >
          {t.notFound.cta} →
        </Link>
      </div>
    </main>
  );
}
