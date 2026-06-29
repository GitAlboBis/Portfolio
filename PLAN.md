# PLAN — Next steps (prioritized)

> Backlog to continue the Golden Hour portfolio. See `HANDOFF.md` for current state, `DESIGN-SYSTEM.md` for the system, `WATER-WAVE-PLAN.md` for the water physics.

## P0 — content & the requested-but-pending features

1. **Real Works content + images.** Replace the placeholder projects in `src/content/works.ts` (`Tidewatch/Saltgrid/Lumen/Current`, all `[[TBD]]`) with Alberto's real projects (title, role, year, stack). Add project stills (WebP) and set `Work.textureSrc`; then add a texture branch in `WorksGallery`'s plane material (use `useTexture`/`THREE.TextureLoader`, `colorSpace = SRGB`) so planes show the image instead of the duotone gradient. *Needs input from Alberto.*

2. **Hero scroll-settle.** Make the water "A" react as you begin scrolling (calm → "dive"). Two viable routes: (a) DOM — a scroll-progress (0→100vh) GSAP tween scaling/fading the hero canvas wrapper; (b) sim — write a small scroll value into `heroStore` and read it in `WaterBallHero` (a gentle downward drift / churn reduction). Isolate and verify on the WebGPU hero so there's no regression. *Requested.*

3. **More components from the references (re-themed, hand-authored).** *Requested.*
   - **Marquee** skills ticker under the Tech sphere (CSS `@keyframes marquee` already in globals via `--animate-marquee`; couple `timeScale`/speed to Lenis velocity, pause on hover).
   - **Shimmer / border-beam** CTA button variant (conic-gradient sweep or `offset-path` one-shot draw-in — not a perpetual loop, per the motion rule).
   - **Text animation** on the hero tagline (word-rotate or text-shimmer), using the existing `Reveal` or a new small primitive. (CLIs `shadcn init` / `@magicuidesign/cli` are intentionally NOT used — they collide with Tailwind v4 `@theme` / depend on framer-motion; reimplement mechanisms instead.)

## P1 — gallery & hero polish

4. **Gallery depth-of-field (real).** Needs an opaque render pass for the planes (or a separate depth target) so `@react-three/postprocessing` `DepthOfField` can read plane depth; then focus the nearest plane. Today depth is faked via the mood haze.
5. **Gallery click-through** → `/work/[slug]` case-study route (dolly into the focused plane, then route). Add the route + per-project content.
6. **Preloader** (rising-tide / caustic, gated on WebGPU `device` ready + drei `useProgress`, with a real timeout fallback) and a **custom water cursor** (desktop-pointer only; no `screen` blend over the teal water — would read as neon).
7. **Sunset env-map polish** (optional): gamma-correct mixing in `fluid.wgsl.ts` (verify the canvas target isn't already sRGB to avoid double-correction); optional mip-blur for softer reflections.

## P2 — physics, perf, a11y, ship

8. **Wave physics** (optional, big): apply the Splash-faithful sim changes in `WATER-WAVE-PLAN.md` (stiff linear EOS, lower viscosity, grid gravity) — but only with the "A" re-expressed as a *soft reflecting container* (see that doc §4), since energetic waves fight the letter shape.
9. **Performance / a11y pass:** Lighthouse mobile ≥80 (degrade tier: dpr ≤1.5, drop heavy FX); reduced-motion end-to-end; keyboard focus order; lazy-mount the works `<Canvas>` + dispose the hero GPU context off-screen; remove `leva` from the production bundle.
10. **SEO / meta / OG / sitemap**, then **deploy to Vercel**.

## Housekeeping

- Delete or archive the dated `docs/`, `CLAUDE.md`, `IMPLEMENTATION-PLAN.md` (ocean direction) to avoid confusion, or rewrite them for Golden Hour.
- Reconcile package manager (commit to npm or restore bun) so the lockfile is consistent.
