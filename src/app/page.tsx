import { TechCloud } from "@/components/tech-cloud";
import { Nav } from "@/components/nav/Nav";
import { HeroScrollSettle } from "@/components/hero/HeroScrollSettle";
import { About } from "@/components/sections/About";
import { WorksGallery } from "@/components/works/WorksGallery";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/footer/Footer";

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

        {/* Selected Works — depth gallery (centerpiece). */}
        <WorksGallery />

        {/* Tech-stack sphere (kept engine). */}
        <section className="container-edit flex flex-col items-center">
          <TechCloud className="w-full max-w-5xl" />
        </section>
      </div>

      {/* Closing dark band — the one inversion + coda. */}
      <Contact />
      <Footer />
    </main>
  );
}
