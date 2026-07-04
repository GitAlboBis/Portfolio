import type { Metadata } from "next";
import { Nav } from "@/components/nav/Nav";
import { HeroScrollSettle } from "@/components/hero/HeroScrollSettle";
import { About } from "@/components/sections/About";
import { WorksGallery } from "@/components/works/WorksGallery";
import { Tech } from "@/components/sections/Tech";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/footer/Footer";
import { NightSky } from "@/components/atmosphere/NightSky";
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
    Order: About → Tech sphere → (Works / Contact / Footer to come).
*/
export default function Home() {
  return (
    <main id="main" className="relative">
      {/* Accessible page title — the visual "title" is the WebGPU water "A" (decorative,
          aria-hidden), so the document's single h1 is provided here for AT + SEO. */}
      <h1 className="sr-only">Alberto Tuveri — Software Engineer</h1>
      <Nav />

      {/* Scroll WRITER for the hero "A" dive (writes heroStore.explode; read by
          WaterBallHero). Renders null; no-op under reduced-motion / no-WebGPU. */}
      <HeroScrollSettle />

      {/* Hero viewport — the fixed fluid "A" + sunset sky show through this band. */}
      <section id="hero" aria-hidden className="relative h-dvh" />

      {/* Editorial content on paper. */}
      <div className="relative z-10 bg-paper">
        <About />

        {/* Selected Works — depth-fade gallery (home). The 3D carousel index lives at /work. */}
        <WorksGallery />

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
        <Contact />
        <Footer />
      </div>
    </main>
  );
}
