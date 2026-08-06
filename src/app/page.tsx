import type { Metadata } from "next";
import { Nav } from "@/components/nav/Nav";
import { HeroScrollSettle } from "@/components/hero/HeroScrollSettle";
import { HeroCopy } from "@/components/hero/HeroCopy";
import { About } from "@/components/sections/About";
import { WorksGallery } from "@/components/works/WorksGallery";
import { CoastInterlude } from "@/components/home/CoastInterlude";
import { AscentSurface } from "@/components/home/AscentSurface";
import { Tech } from "@/components/sections/Tech";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/footer/Footer";
import { NightSkyLazy as NightSky } from "@/components/atmosphere/NightSkyLazy";
import { Nightfall } from "@/components/home/Nightfall";
import { LazyOnView } from "@/components/motion/LazyOnView";

// Homepage owns the root identity: its canonical + og:url/title point at "/".
// (Removed from the root layout so subpages no longer inherit the homepage's.)
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/", title: "Alberto Tuveri — Software Engineer" },
  twitter: { title: "Alberto Tuveri — Software Engineer" },
};

/*
  HOME (Golden Hour)
  ──────────────────
  • #hero — full viewport band; the fixed WebGPU water "A" (CanvasHost) + the
    sunset sky gradient read through it.
  • Content below sits on an opaque `bg-paper` layer so it covers the fixed
    sunset gradient once you scroll past the hero (the gradient is hero-only).
    Order: About → Works (depth gallery) → Nightfall(Tech) → night: Contact → Footer.
*/
export default function Home() {
  return (
    <main id="main" className="relative">
      <Nav />

      {/* Scroll WRITER for the hero "A" dive (writes heroStore.explode; read by
          WaterBallHero). Renders null; no-op under reduced-motion / no-WebGPU. */}
      <HeroScrollSettle />

      {/* Hero viewport — the fixed fluid "A" + sunset sky show through this band.
          HeroCopy carries the page's real h1 (name/role/tagline + scroll cue), so
          the section is NOT aria-hidden — only the canvas layers are decorative. */}
      <section id="hero" className="relative h-dvh">
        <HeroCopy />
      </section>

      {/* Editorial content on paper. */}
      <div className="relative z-10 bg-paper">
        <About />

        {/* Selected Works — depth-fade gallery (home). The horizontal index lives at /work. */}
        <WorksGallery />

        {/* LA COSTA — scroll-scrubbed drone film of Pan di Zucchero at golden
            hour: the real place behind the site's water + sunset language.
            The film ends UNDERWATER — LA RISALITA below completes the dive. */}
        <CoastInterlude />

        {/* LA RISALITA — you hang in the real underwater light (loop cut from
            the same footage), bubbles rise, and scroll performs the ascent:
            the page descends as a living waterline and you break the surface
            back onto paper (surface-break → the escort scatters, MAREA
            un-muffles). */}
        <AscentSurface />

        {/* Tech-stack — editorial heading + signature 3D icon cloud. Nightfall pins
            it in its final reading position while the night band slides over it:
            the day literally sinks under the night (the one stacking moment). */}
        <Nightfall>
          <Tech />
        </Nightfall>
      </div>

      {/* Closing dark band — the one inversion + coda, over a living dusk atmosphere.
          The wrapper carries the solid `bg-night` failsafe (identical to the old flat
          band): a no-WebGL / SSR / lost-context render looks exactly as before, and
          NightSky's shader paints the afterglow + stars + embers on top when able.
          `nightfall-cover` + z-20 ride it over the pinned Tech card (see Nightfall).
          min-h-screen (= the 100vh cover travel, exactly): the band must be at least
          as tall as the overlap or the runway's tail would poke out past the footer —
          and the closing beat earns a full viewport of night anyway. */}
      <div
        id="nightfall"
        className="nightfall-cover relative isolate z-20 flex min-h-screen flex-col bg-night"
      >
        {/* Deferred: the night-sky WebGL context is created only as the band nears,
            not at page load. Absolute-fill scene → wrapper stays a zero-box (no CLS);
            the solid bg-night failsafe shows until it ignites. */}
        <LazyOnView>
          <NightSky />
        </LazyOnView>
        {/* The REAL night — Pan di Zucchero under the Milky Way, screen-blended
            OVER the NightSky shader: its stars/embers/constellation keep living,
            the photograph adds the rock's silhouette and the galaxy's dust.
            Non-destructive: kill this div and the shader scene is intact. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/coast/night-sea.webp"
            alt=""
            className="h-full w-full object-cover"
            style={{ mixBlendMode: "screen", opacity: 0.55 }}
          />
        </div>
        <Contact />
        <Footer />
      </div>
    </main>
  );
}
