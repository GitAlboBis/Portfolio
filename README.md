# Portfolio — Alberto Tuveri

An immersive, single-page, scroll-driven portfolio for **Alberto Tuveri** (Software Engineer — Full-Stack + AI), themed on the sea and ocean of Sardinia (Pan di Zucchero / Masua). Quality target: Awwwards-level.

The hero is a **WebGPU MLS-MPM water fluid** drawing the letter **"A"** (vendored from [`matsuoka-601/WaterBall`](https://github.com/matsuoka-601/WaterBall), Screen-Space-Fluid rendered), composited over a **scroll-scrubbed WebP frame cinematic** of Pan di Zucchero. Scroll is virtualized with Lenis driven from the GSAP ticker. Bilingual EN/IT.

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript** (strict)
- Package manager: **bun** (`bun.lock` is canonical — do not use npm/yarn)
- **Tailwind CSS v4** (CSS-first, `@theme` tokens in `src/app/globals.css`)
- **Raw WebGPU** + handwritten WGSL for the hero fluid (`navigator.gpu`-only; CSS sea-gradient fallback) · **wgpu-matrix**
- **GSAP** + **Lenis** (scroll), **Zustand** (state), **Zod** (validation, where used)
- Fonts: **Fraunces** (display) + **Hanken Grotesk** (sans) via `next/font/google`
- three / @react-three/fiber / drei are installed but **not mounted** in the active tree (no persistent R3F canvas)
- Deploy: **Vercel**

## Getting started

Requires [bun](https://bun.sh) and a **WebGPU-capable browser** (recent Chrome/Edge) for the hero.

```bash
bun install
bun dev          # http://localhost:3000  (Turbopack)
```

## Scripts

| Script | What it does |
|--------|--------------|
| `bun dev` | Dev server (Turbopack) |
| `bun run build` | Production build (`next build`) |
| `bun run start` | Serve the production build |
| `bun run typecheck` | `tsc --noEmit` |

> No ESLint/Prettier/test runner is wired yet (see `docs/01-TECHSTACK.md`). CI-equivalent quality gate is `typecheck` + `build` + visual QA.

## Project structure

```
src/
  app/            # App Router: layout, page, globals.css, sitemap.ts, robots.ts
  components/     # sections/ (hero, intro, work, skills, contact), ui/, providers
  data/           # projects.ts, skills.ts, translations/ (en, it)
  webgl/
    CanvasHost    # CSS sea gradient + VideoBackdrop (2D canvas) + WaterBallHero
    waterball/    # raw-WebGPU MLS-MPM solver (mls-mpm/) + SSF render (render/)
    store/        # zustand stores (scrollStore, heroStore active)
  lib/            # lenis-singleton, utils
public/
  frames/         # f_000..f_135.webp — the cinematic frame sequence
  cubemap/        # SSF environment reflections
```

## Documentation

The authoritative spec lives in [`docs/`](./docs/) (index: [`docs/README.md`](./docs/README.md)); start with [`CLAUDE.md`](./CLAUDE.md). Build process, gates, and QA discipline are in [`docs/11-WORKFLOW.md`](./docs/11-WORKFLOW.md). The docs are reconciled against the code by the `docs-driven-build` loop (`.claude/skills/docs-driven-build/`).

## Deploy

Deploys to Vercel. Production base URL: `https://albertotuveri.dev` (`metadataBase` in `src/app/layout.tsx`).

## Accessibility & performance

Decorative WebGL/canvas is `aria-hidden`; `prefers-reduced-motion` is respected (the hero falls back to a static frame / CSS gradient). Performance budget: 60fps on recent desktop, graceful mobile degradation, Lighthouse mobile ≥ 80.
