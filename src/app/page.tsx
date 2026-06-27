import { Hero } from "@/components/sections/hero";
import { Intro } from "@/components/sections/intro";
import { WorkSection } from "@/components/sections/work";
import { SkillsSection } from "@/components/sections/skills";
import { Contact } from "@/components/sections/contact";
import { DescendingWorld } from "@/components/descending-world";

export default function Home() {
  return (
    <main id="main" tabIndex={-1} className="relative outline-none">
      {/* Hero is transparent so the fixed WebGL canvas reads through it. */}
      <Hero />

      {/* The ocean world keeps living past the fold: a fixed, scroll-linked
          backdrop that DEEPENS from deep teal to abyss as we descend. It sits
          behind the section text (z-0) and above the hero canvases once the hero
          has scrolled away. */}
      <DescendingWorld />

      {/* Below-fold content rides ABOVE the descending backdrop (z-10). The
          wrapper is deliberately transparent — the descending layer supplies the
          background — so the world no longer dies at the fold. Sections keep
          their own copy; text stays AA over the (always-dark) descent. */}
      <div className="relative z-10">
        <Intro />
        <WorkSection />
        <SkillsSection />
        <Contact />
      </div>
    </main>
  );
}
