# PLAN — Next steps (prioritized)

> Backlog to continue the Golden Hour portfolio. See `HANDOFF.md` for current state, `CLAUDE.md` for the operational brain (rewritten Golden Hour), `WATER-WAVE-PLAN.md` for the water physics.

## ✅ Done — Golden Hour build (session 2026-06-30, branch `feat/clean-slate-rebuild`)

Each shipped as an atomic commit, build-green + visually verified (console clean):

- **`CLAUDE.md` rewritten** to Golden Hour (+ source-library links / extraction instructions / skill routing); Claude Design marked canonical. Skills installed under `.claude/skills/` (`webgpu-threejs-tsl` + curated antigravity set).
- **Hero scroll-settle** (P0 #2 ✅) — `HeroScrollSettle` writes `heroStore.explode` 0→1 over the hero; the "A" dives + fades and reforms on scroll-up. G4-safe (no solver change).
- **3D Icon Cloud re-theme** (IMPLEMENTATION-PLAN WP-4 ✅) — `tech-cloud.tsx` re-themed ocean→Golden Hour (ink marks on paper, hover ember + amber bloom, glass tooltip) + editorial `Tech` section + sr-only stack list.
- **Parallax backbone** (WP-3 ✅) — `src/lib/scroll-choreo.ts` `useParallax` + `<Parallax>`, multi-layer on About/Tech.
- **Scrubbed text reveal** (WP-7 ✅) — `ScrollText` (SplitText line mask, scrubbed) on the Tech title.
- **Interaction identity** (WP-9 ✅) — custom cursor (`Cursor.tsx`) + `<Magnetic>` on CTA & wordmark.
- **Preloader** (P1 #6 / WP-2 ✅) — SSR'd paper sheet, fonts.ready-gated wipe, CSS failsafe. (Custom cursor, the other half of #6, ✅ via WP-9.)

**Still open from below:** P0 #1 (real Works content — needs Alberto), P0 #3 (marquee + shimmer-CTA — the *text-animation* part is partly covered by ScrollText/Reveal), P1 #4/#5/#7, P2 #8/#9/#10, housekeeping. **Recommended review:** the *feel* of scroll-settle / icon cloud / parallax / reveals / cursor / preloader (gate 🔵).

## P0 — content & the requested-but-pending features

1. **Real Works content + images.** Replace the placeholder projects in `src/content/works.ts` (`Tidewatch/Saltgrid/Lumen/Current`, all `[[TBD]]`) with Alberto's real projects (title, role, year, stack). Add project stills (WebP) and set `Work.textureSrc`; then add a texture branch in `WorksGallery`'s plane material (use `useTexture`/`THREE.TextureLoader`, `colorSpace = SRGB`) so planes show the image instead of the duotone gradient. *Needs input from Alberto.*

2. **Hero scroll-settle.** ✅ **DONE** (see top). Make the water "A" react as you begin scrolling (calm → "dive"). Two viable routes: (a) DOM — a scroll-progress (0→100vh) GSAP tween scaling/fading the hero canvas wrapper; (b) sim — write a small scroll value into `heroStore` and read it in `WaterBallHero` (a gentle downward drift / churn reduction). Isolate and verify on the WebGPU hero so there's no regression. *Requested.*

3. **More components from the references (re-themed, hand-authored).** *Requested.*
   - **Marquee** skills ticker under the Tech sphere (CSS `@keyframes marquee` already in globals via `--animate-marquee`; couple `timeScale`/speed to Lenis velocity, pause on hover).
   - **Shimmer / border-beam** CTA button variant (conic-gradient sweep or `offset-path` one-shot draw-in — not a perpetual loop, per the motion rule).
   - **Text animation** on the hero tagline (word-rotate or text-shimmer), using the existing `Reveal` or a new small primitive. (CLIs `shadcn init` / `@magicuidesign/cli` are intentionally NOT used — they collide with Tailwind v4 `@theme` / depend on framer-motion; reimplement mechanisms instead.)

## P1 — gallery & hero polish

4. **Gallery depth-of-field (real).** Needs an opaque render pass for the planes (or a separate depth target) so `@react-three/postprocessing` `DepthOfField` can read plane depth; then focus the nearest plane. Today depth is faked via the mood haze.
5. **Gallery click-through** → `/work/[slug]` case-study route (dolly into the focused plane, then route). Add the route + per-project content.
6. ✅ **DONE** (see top — Golden Hour variants). **Preloader** (SSR paper sheet, fonts.ready-gated wipe + CSS failsafe) and a **custom cursor** (dot + ember ring, pointer:fine only, native hidden). *(Originally specced as rising-tide/caustic + water cursor; built re-themed to Golden Hour.)*
7. **Sunset env-map polish** (optional): gamma-correct mixing in `fluid.wgsl.ts` (verify the canvas target isn't already sRGB to avoid double-correction); optional mip-blur for softer reflections.

## P2 — physics, perf, a11y, ship

8. **Wave physics** (optional, big): apply the Splash-faithful sim changes in `WATER-WAVE-PLAN.md` (stiff linear EOS, lower viscosity, grid gravity) — but only with the "A" re-expressed as a *soft reflecting container* (see that doc §4), since energetic waves fight the letter shape.
9. **Performance / a11y pass:** Lighthouse mobile ≥80 (degrade tier: dpr ≤1.5, drop heavy FX); reduced-motion end-to-end; keyboard focus order; lazy-mount the works `<Canvas>` + dispose the hero GPU context off-screen; remove `leva` from the production bundle.
10. **SEO / meta / OG / sitemap**, then **deploy to Vercel**.

## Housekeeping

- Delete or archive the dated `docs/`, `CLAUDE.md`, `IMPLEMENTATION-PLAN.md` (ocean direction) to avoid confusion, or rewrite them for Golden Hour.
- Reconcile package manager (commit to npm or restore bun) so the lockfile is consistent.
