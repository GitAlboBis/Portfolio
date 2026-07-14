/*
  SunRays — crepuscular rays for the hero sky.

  The sunset cubemap's sun sits BEHIND the water "A" (low on the horizon,
  azimuth slightly right of center — scripts/gen_sunset_cubemap.py). These are
  its god-rays on the page layer: two counter-rotating conic fans, radially
  masked and screen-blended over the sea gradient, so the letter reads as
  standing IN the light instead of on a flat wash. Pure CSS (see .hero-rays in
  globals.css): transform-only animation, zero JS per frame, static under
  prefers-reduced-motion. Server component — no client JS shipped.

  Layering: mounted by CanvasHost BETWEEN #sea-backdrop and the WebGPU water
  canvas (all fixed z-0 — DOM order stacks them), so the rays glow through the
  translucent letter but never sit over content.
*/
export function SunRays() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* drifting warm cloud masses — the sky moves even before the water does */}
      <div className="hero-cloud hero-cloud--a" />
      <div className="hero-cloud hero-cloud--b" />
      <div className="hero-rays" />
      <div className="hero-rays hero-rays--b" />
    </div>
  );
}
