import Lenis from "lenis";

/*
  Single Lenis instance for the whole app. autoRaf is DISABLED: the FrameDriver
  drives lenis.raf() from R3F's useFrame so scroll + render share ONE rAF loop.
  See docs/03-ARCHITECTURE.md (sync Lenis <-> R3F).
*/
let instance: Lenis | null = null;

export function getLenis(): Lenis | null {
  if (typeof window === "undefined") return null;
  if (!instance) {
    instance = new Lenis({
      autoRaf: false,
      lerp: 0.1,
      smoothWheel: true,
    });
  }
  return instance;
}

export function destroyLenis() {
  instance?.destroy();
  instance = null;
}
