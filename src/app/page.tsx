import { Hero } from "@/components/sections/hero";
import { Intro } from "@/components/sections/intro";
import { WorkSection } from "@/components/sections/work";
import { SkillsSection } from "@/components/sections/skills";
import { Contact } from "@/components/sections/contact";

export default function Home() {
  return (
    <main id="main" tabIndex={-1} className="relative outline-none">
      {/* Hero is transparent so the fixed WebGL canvas reads through it. */}
      <Hero />

      {/* Everything below sits on an opaque abyss layer above the fixed canvases. */}
      <div className="relative z-10 bg-abyss">
        <Intro />
        <WorkSection />
        <SkillsSection />
        <Contact />
      </div>
    </main>
  );
}
