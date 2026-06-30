import { Nav } from "@/components/nav/Nav";
import { HeroScrollSettle } from "@/components/hero/HeroScrollSettle";
import { About } from "@/components/sections/About";
import { WorksGallery } from "@/components/works/WorksGallery";
import { Tech } from "@/components/sections/Tech";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/footer/Footer";
import { NightSky } from "@/components/atmosphere/NightSky";

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

        {/* Tech-stack — editorial heading + signature 3D icon cloud. */}
        <Tech />
      </div>

      {/* Closing dark band — the one inversion + coda, over a living dusk atmosphere.
          The wrapper carries the solid `bg-night` failsafe (identical to the old flat
          band): a no-WebGL / SSR / lost-context render looks exactly as before, and
          NightSky's shader paints the afterglow + stars + embers on top when able. */}
      <div className="relative isolate bg-night">
        <NightSky />
        <Contact />
        <Footer />
      </div>
    </main>
  );
}
