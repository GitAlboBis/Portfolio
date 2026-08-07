# Ocean — Design System (v1) — ⚠ STORICO, NON AUTOREVOLE

> **ARCHIVIATO 2026-08-07 (housekeeping D1).** Questo è lo snapshot della
> direzione "Ocean" abbandonata (palette abyss/teal, Fraunces/Hanken) —
> scavalcato dal sistema **Golden Hour**. Le fonti di verità reali sono:
> **Claude Design** ("Alberto Tuveri — Golden Hour Portfolio", vedi
> `CLAUDE.md §0`) → mirrorato in `src/app/globals.css` (`@theme`) +
> `src/content/tokens.ts`, contratto vivo su **`/styleguide`**.
> Non seguire nulla di ciò che segue.

> ~~Authoritative source of truth for the visual system.~~ **Supersedes the dated `docs/02-DESIGN.md`.**

---

## 1. Concept

**One sentence:** a dark, cinematic *descent* through the sea off Masua (Pan di Zucchero) — calm and almost still on the surface, visibly *alive* the deeper you scroll, until the work itself rises back toward the light.

**Three binding adjectives** (every decision must satisfy all three):

- **Submerged** — DOM sits *inside* water, lit and tinted by it. Translucency over shadow; never a flat page with effects bolted on.
- **Editorial** — Fraunces at heroic sizes, generous measure, restrained palette, print-grade label/eyebrow grammar. The 3D leads; type is quiet and enormous.
- **Tidal** — motion is slow, weighted, eased like water displacing. Everything decelerates as if through resistance. Never SaaS-bouncy.

**The through-line (why it can reach SOTD):** *depth IS the design system.* Color, light, blur and depth-of-field are one coherent signal mapped to scroll position, so the site feels like a single vertical dive rather than a stack of sections. The raw‑WebGPU MLS‑MPM fluid as a masthead + a disciplined two-direction palette (teal + limestone, zero neon, zero gold) is the executed risk.

**Scroll arc:** Hero *(surface)* → About *(the descent — darkest)* → Selected Works *(the dive-through, ascending toward light)* → Tech *(light shaft)* → Contact *(breaking the surface — the one light section)* → Footer *(coda, back to deep)*.

---

## 2. Color

Tokens live in **one `@theme` block** in `globals.css` (`--color-*` → auto `bg-* / text-* / border-* / ring-*`), mirrored in `src/content/tokens.ts` for shaders/Three. The palette is a literal **depth ramp**.

| Token | Hex | Use |
|---|---|---|
| `abyss-deep` | `#04161e` | Seabed floor · footer · deepest gallery plane |
| `abyss` | `#07222e` | Page ground · dark sections · preloader |
| `deep` | `#0b2c3a` | Cards · nav pill · panels |
| `shallow` | `#2f93ab` | Mid-water mood · hovered hairline · ramp step |
| `tide` | `#5aa7be` | Primary teal (matches the water "A") · links |
| `sky` | `#8fc1e2` | Upper-water mood · near surface |
| `celeste` | `#9bd3ee` | **The accent — always paired with foam** |
| `celeste-soft` | `#c7e6f4` | Soft fills · cursor ring at rest · glass edge |
| `caustic` | `#bfe6f2` | **Shader light only** — low alpha, never text/border/UI |
| `foam` | `#f4fafb` | Primary text on dark · full-strength hairline |
| `mist` | `#9fbac6` | Muted text on dark |
| `limestone` | `#e3dac6` | Light-section ground (Contact) |
| `limestone-deep` | `#d6c9ad` | Light **surfaces / hairlines only** (fails as a text bg) |
| `ink` | `#0b2731` | Text on light |
| `ink-mute` | `#3f5862` | Muted text on light — **corrected** (was `#5c7884`, failed AA at 3.38:1) |
| `light-accent` | `#1f6e83` | Eyebrow / links on light (celeste & shallow go muddy / fail on cream) |

**Bans:** no electric/neon cyan · no gold · no purple/violet · no SaaS gradients (gradients are vertical *depth ramps* between adjacent tokens only) · no emoji icons · no blanket drop-shadows.

### 2.1 Verified contrast (WCAG 2.x, recomputed)

| Foreground | Background | Ratio | Verdict |
|---|---|---|---|
| foam | abyss | 15.6:1 | AAA |
| foam | deep | 13.4:1 | AAA |
| mist | abyss | 8.6:1 | AAA |
| celeste | abyss | 9.8:1 | AAA (accent ≥18px, links) |
| tide | abyss | 6.0:1 | AA |
| ink | limestone | 11.2:1 | AAA |
| **ink-mute `#3f5862`** | limestone | **5.2:1** | AA ✅ (corrected) |
| light-accent `#1f6e83` | limestone | 4.6:1 | AA |

**Do-not-use (fails AA):** `ink-mute`/`shallow`/`tide`/`celeste` as text on `limestone` or `limestone-deep`; `mist` as small text on any light surface. Body copy is always `foam` on dark or `ink` on light.

### 2.2 Light/dark rhythm

The **single light section is load-bearing** — the payoff of the dive metaphor. Use it exactly once (Contact). Everything else is dark; the footer returns to `abyss-deep` as a coda.

---

## 3. Typography

- **Fraunces** (variable: `opsz` 9–144 · `SOFT` 0–100 · `WONK` 0–1 · `wght`) — display + serif reading. Larger sizes ride higher `opsz` (crisp, high-contrast serifs); reading sizes sit lower.
- **Hanken Grotesk** — uppercase small-caps labels, meta, nav, buttons, body, tabular data.

> **Critical rule:** `font-variation-settings` is a low-level override — it **must always list `wght`**, or weight silently falls back to 400. `WONK` is a **0–1** axis (the spec draft's `WONK 4` was invalid → corrected to `1`).

Ready-to-use classes (in `globals.css @layer components`): `.t-hero`, `.t-display`, `.t-title`, `.t-lead` (italic voice line), `.t-body` / `.t-body--mute`, `.t-eyebrow`, `.t-meta`, `.t-index`. See `/styleguide` for live samples + specs.

---

## 4. Layout

`.container-edit` (max `1440px`, fluid gutter `clamp(1.25rem,5vw,6rem)`) · `.grid-edit` (12 cols) with the editorial signature **left-rail meta (`.col-meta`) + offset reading column (`.col-read` ~62ch)** — text never sits dead-center. `.bleed` for full-viewport water. Vertical rhythm via `--section-y` / `--block-y`; lay out with flex/grid `gap`, never per-element margins. Breakpoints: Tailwind v4 defaults (`sm 40 · md 48 · lg 64 · xl 80 · 2xl 96 rem`).

---

## 5. Motion

**The rule:** every animation maps to the dive metaphor or a state change. No decorative loops, no idle float.

- **Backbone:** Lenis 1.3 drives `gsap.ticker` (one loop); the same `lenis.scroll` / `lenis.velocity` feed the R3F gallery — **never a second scroll loop**. Under `prefers-reduced-motion`: destroy Lenis (native scroll), kill scrub/pin, fades only.
- **Easings** (also exposed as `ease-tide` / `ease-dive` / `ease-drift` utilities): `tide` `cubic-bezier(.16,1,.3,1)` (primary), `dive` `cubic-bezier(.65,0,.35,1)` (transitions), `drift` `cubic-bezier(.33,0,.67,1)` (ambient).
- **Durations:** micro `0.3–0.45s` · reveal `0.8–1.1s` · section transition `1.0–1.4s` · ambient `≥6s`. All slower than default.
- **Split-text reveal:** GSAP `SplitText` masked lines, `yPercent 115→0`, `stagger .08`, `ease tide`, `once`. Gate on `document.fonts.ready` (Fraunces is a webfont → avoid FOUT re-split). **Blur reveal only in About, ≤6px, dropped on `md` and below** (paint cost).

---

## 6. Components

Depth from **layered translucency + the live water**, never blanket shadows.

- **`.glass`** — translucent `deep` + celeste edge. `backdrop-filter` is **progressive**: solid fill by default (it janks over the live WebGPU canvas), real blur only under `@supports` AND `prefers-reduced-transparency: no-preference`.
- **Button (`src/components/ui/button.tsx`, CVA):** `primary` (deep fill, celeste hairline → shallow on hover), `secondary` (outline → celeste), `ghost`, `light` (ink-on-limestone for the Contact section). Celeste **sheen fires on hover only** (a state change), hidden under reduced motion — never a perpetual loop.
- **Cursor:** celeste-soft ring + dot, `gsap.quickTo` follow. **No `mix-blend-mode: screen`** over the teal water (it glows toward banned neon cyan) → use `difference` / no-blend low-alpha. Off on `pointer:coarse` + reduced-motion.
- **Marks:** `.eyebrow-tick` (tide rule + celeste small-caps), `.hairline` (caustic light-band), `.rule-node` (coda with celeste node). Focus: `2px celeste` outline, offset 3px.

---

## 7. WebGL / WebGPU effects catalog

> **Renderer boundary:** the hero is **raw WebGPU** on its own canvas — it cannot share a context or pmndrs postprocessing with the R3F/WebGL stack (gallery, sphere, footer). **One heavy renderer per scroll region**; IntersectionObserver gates rAF and *disposes* (not just pauses) on handoff, with `device.lost` / `webglcontextlost` → poster fallback.

| Effect | Section | Tech | Mobile / reduced-motion |
|---|---|---|---|
| Water letter "A" *(exists)* | Hero | raw WebGPU MLS-MPM, translucent teal | `navigator.gpu` gate → static poster |
| **Depth gallery** *(centerpiece)* | Works | R3F + drei: N planes at `z=-i·gap`, `MeshBasicMaterial{map,transparent,depthWrite:false}`, opacity cross-fade, camera.z from Lenis, pointer parallax + breath, **mood ramp abyss-deep→sky** | `xSpread 0.25`, dpr ≤1.5, no DoF/trail; reduced-motion → semantic `<ol>` of project links |
| Ocean mood background | Works | R3F `shaderMaterial`: 2 drifting blobs + cheap caustics + depth gradient + low grain; colors lerp on plane hand-off; `uVel` lifts brightness | freeze `uTime` |
| Liquid-wipe transition | dark→light seams | R3F shader + GSAP scrub | crossfade only |
| Cursor ripple | global (desktop) | ping-pong buffer, monochrome tide/celeste | off |
| Preloader tide + caustic | Preloader | GSAP `clip-path` rise + GLSL noise; gated on real readiness **with timeout** | plain fade |
| Film grain | global overlay | inline SVG `feTurbulence`, opacity .04 | static |

**Depth-gallery correction (from research of `houmahani/codrops-depth-gallery`, MIT):** it is an *"Atmospheric Depth Gallery"* — a Z-stacked plane carousel with atmospheric color blobs + pointer/scroll parallax, **NOT** a grayscale depth-map effect (no depth maps exist in the repo). We reimplement the *mechanism* in R3F (already in stack — no OGL/second engine), re-themed to ocean, reusing the existing Lenis. **Re-theme is mandatory:** all colors from tokens, textures `colorSpace = SRGB`, the repo's bright emissive trail dropped or reduced to faint celeste+white.

**Mobile budget (honest):** Lighthouse mobile ≥80 is achievable **only** on the degraded tier (one canvas, dpr ≤1.5, DoF/CA/Bloom/ripple/plankton OFF, grain static). The full desktop experience scores lower — an accepted trade.

**SOTD differentiators (do at least one flawlessly):** make the gallery *react to the work* (each project's color bleeds into the mood shader; DoF focus pulled by the nearest project); carry one continuous light signal across the hero↔gallery↔contact cut (capture the hero's final teal luminance to seed the gallery's first mood); one genuinely novel interaction (cursor ripple displaces the project plane UVs — "touch the water, the work ripples") rather than a catalog of borrowed effects (cut the velocity marquee + coordinate labels if they read as familiar).

---

## 8. Section blueprint

Copy lives in an EN/IT dictionary (`src/content/dict.ts`) — never hardcoded. Tone: spare, confident, maritime; an engineer who builds things that move.

| Section | Ground | Type | Effect | Copy (EN / IT) |
|---|---|---|---|---|
| **Hero** | dark (over WebGPU) | `.t-hero` name, `.t-eyebrow`, `.t-meta` | water "A" + scroll-settle | "I build interfaces that move like water." / "Costruisco interfacce che si muovono come l'acqua." |
| **About** | abyss → abyss-deep | `.t-display` + `.t-lead` italic + `.t-body` | split-text reveal (blur) | "Calm on the surface. Alive underneath." / "Calmo in superficie. Vivo sotto." |
| **Selected Works** | shader ramp | `.t-index` 01–0N, `.t-title`, `.t-meta` | depth gallery + mood ramp | "SELECTED WORK · 2021—2026" / "LAVORI SCELTI · 2021—2026" |
| **Tech** | deep | `.t-display`, `.t-meta` | sphere *(exists)* + restrained bloom | "The current I work in." / "La corrente in cui lavoro." |
| **Contact** | **limestone (LIGHT)** | `.t-display` ink, eyebrow `light-accent` | surface wipe + light CTA | "Let's make something that moves." / "Facciamo qualcosa che si muove." |
| **Footer** | abyss-deep | `.t-meta` mist | seabed caustic | coordinates · Sardinia clock · sound toggle |

---

## 9. Delivery & build order

**Dependencies:** none new — `class-variance-authority`, `clsx`, `tailwind-merge` already in `package.json`; GSAP 3.15 bundles ScrollTrigger/SplitText/Observer/Flip/CustomEase (free); Lenis/R3F/drei/postprocessing present. (Do **not** run `npx shadcn init` — it assumes an hsl `:root` convention that collides with our CSS-first `@theme` — and `@magicuidesign/cli install claude` only wires an MCP, installing zero components. We borrow mechanisms and hand-author on the existing stack.)

**Done so far (this phase — the design system):**
`src/app/globals.css` (token + type + motion + primitives rewrite) · `src/content/tokens.ts` · `src/lib/cn.ts` (clsx+twMerge) · `src/components/ui/button.tsx` (CVA) · `src/app/styleguide/page.tsx` (the live contract) · `CanvasHost` gated to home. Verified: typecheck clean (new files), `/styleguide` serves HTTP 200, Tailwind v4 compiles the tokens.

**Next (build phase):** (1) Lenis+GSAP `Smooth` provider + reduced-motion guard. (2) Nav + preloader + cursor. (3) EN/IT dictionary + zustand UI store. (4) **Selected Works depth gallery** (centerpiece) + `MoodBackground` + caption. (5) About + Contact (light) + Footer. (6) Wire hero scroll-settle. (7) Perf/a11y pass + visual QA (desktop + mobile screenshots, clean console).
