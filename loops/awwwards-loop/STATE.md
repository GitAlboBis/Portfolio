<!-- changing state — read & written every cycle; never moved into SKILL.md. -->

# awwwards-loop — Quality Ledger

> Scores + backlog across cycles. Read at cycle start, written before stopping.

## Scores (0–10 per dimension)

| cycle | art-dir | motion | type | narrative | perf | a11y | craft | responsive | overall |
|-------|---------|--------|------|-----------|------|------|-------|------------|---------|
| 1 | 6.0 | 6.2 | 6.5 | 6.5 | **4.5** | 6.0 | 5.5 | **4.5** | **5.7** |
| 3 (after FIX 1+2b) | 6.5 | 6.5 | 6.5 | 6.5 | **4.5** | 7.5 | 7.4 | **4.5** | 5.8 |
| 5 (after FIX 4) | 6.5 | 7.0 | 6.5 | 7.2 | **6.0** | 7.0 | 7.5 | **6.5** | **6.6** |

**Cycle-5 read:** cycle-4 BROKE THE GATE — Performance +1.5 (→6.0), Responsive +2.0 (→6.5),
narrative +0.7, motion +0.5; overall 5.8→**6.6**. BUT a11y regressed 7.5→7.0: the new hero thesis
copy fails WCAG 1.4.3 (~1.2:1 over bright frames) — fix FIRST next cycle. New ceiling themes:
(1) WORLD COLLAPSE after the fold (5 critics: ocean world only in hero) → descending-world bg +
scroll-linked section motion. (2) MISSING CINEMATIC CLIMAX (24–56% near-static) → synthetic dive
climax (Ken Burns push-in on existing frames + non-linear remap + exposure ramp) = the safe
realization of the "zoom-into-backflip" ask without footage. (3) warm/cool palette + no true accent.
(4) Fraunces static (opsz/WONK dead). (5) 9.7MB unused JPEG ships in public/ (strip it).

Target: every dimension ≥ 9, overall ≥ 9 (SOTD). Top themes holding it back (cycle 1):
unfinished-correctness gaps · mobile is second-class · perf hygiene at integration layer ·
art direction fractures after the hero · motion/type/a11y competent-but-conservative.

## Cycle 2 — FIX in progress

**Batch 1 (a11y + responsive + perf — weakest dims), implemented, verifying:**
- hero-sr-h1 — sr-only `<h1>` (real heading) ✓ · skip-link + `<main id>` landmark ✓
- hero-dvh-pin (h-dvh) ✓ · viewport+themeColor+viewport-fit ✓ · safe-area nav ✓ · touch-targets ≥44px ✓
- defer-frame-preload (idle, not first paint; reduced-motion = 1 still) ✓

**Rejected (integrator override):**
- `fix-contact-email` — jury had it BACKWARDS (wanted sersan.dev). gmail is the intended public
  address (golden rule: don't expose work email). → QUESTION for Alberto, not a fix.

**Deferred — gated / need decision or your eye:**
- `gate-leva-prod` (touches the fluid file you're tuning → after G4 sign-off)
- aesthetic/content: `liquid-title-warm-grade`, `warm-token-bridge`, `drop-tbd-cards` (your call)
- `responsive-frame-sets` / `hero-mobile-fallback` (need generated assets)
- cinematic zoom-into-backflip beat → needs a dive clip (G5 Higgsfield spend) or real footage

## Backlog (next batches, impact-ranked — full detail in cycle-1 workflow output)

| batch | items | dims |
|-------|-------|------|
| 2b craft/meta | add-favicon-og-manifest, not-found+error-pages, themed-scrollbar, scroll-behavior-fix | craft |
| 3 perf | tier-gate-fluid-mount, defer-webgpu-init, preload-lcp-frame, liquidtext-render-earlyout, responsive-frame-sets | perf |
| 4 motion | reveal-variants, hero-custom-ease, pointer-craft, frame-crossfade-smooth, tune-lenis, animate-scroll-cue | motion |
| 5 typography | fraunces-variable (opsz/WONK), body-token-sans, heading-3-tabular, editorial-type-spread | type |
| 6 narrative+a11y | wire-cinematic-caption, hero-title-tagline (from i18n), focus-trap-mobile-menu, nav-active-section, lang-toggle-a11y, it-copy-nits | narrative, a11y |
| big bets | continuous warm→abyss color grade down-page; captioned descent climax; video-codec scrub vs 25MB frames; pointer-alive identity | art, perf, motion |

## Done

| cycle | item | commit |
|-------|------|--------|
| — | scaffold awwwards-loop | dce700e |
| 1 | jury evaluate + plan (8 critics, overall 5.7) | (wf_cef2eb6a-aa8) |
| 2a | FIX: a11y (sr-h1/skip-link/main) + mobile (dvh/viewport/themeColor/safe-area/touch≥44) + perf (defer 136-frame preload) | 889a748 |
| 2b | FIX: craft/meta (favicon/OG/manifest/404) + motion (hero CustomEases+held beat, Reveal variants, Lenis) + type tokens + a11y (scroll-spy/focus-trap/lang) — 6 optimizers | 2ed091d |
| 3 | RE-EVALUATE: 8-critic re-score → overall 5.8 (a11y 7.5, craft 7.4); perf+responsive pinned 4.5 | (wf_ef1d1396-58f) |
| 4 | FIX perf/responsive: 960px mobile tier (25→4.2MB) + leva prod-gate + WebGPU static-A fallback + hero tagline/caption + cue pill + IT calque + nav order | 79ba2d9 |
| 5 | RE-EVALUATE: GATE BROKEN → overall 6.6 (perf 4.5→6.0, responsive 4.5→6.5, narrative 7.2, motion 7.0); a11y regressed 7.5→7.0 (hero thesis contrast) | (wf_95ddef16-c99) |

## Last run

```
cycle     : 5 (RE-EVALUATE) complete — GATE BROKEN: overall 5.8 -> 6.6 (perf 6.0, responsive 6.5)
status    : checkpoint. a11y regression (hero thesis contrast) caught by the loop.
next-6    : P0 FIX a11y regression (hero-thesis-veil + caption-pill abyss/70 + localize aria) +
            strip 9.7MB unused JPEG; THEN big bets: synthetic-dive-climax (Ken Burns push-in on
            existing frames = the "zoom-into-backflip" payoff w/o footage) + descending-world bg +
            scroll-linked section motion + Fraunces variable axes. Targets art/type/motion + the
            "world collapses after the fold" ceiling.
```

## Notes

- Constraints: hero fluid OFF-LIMITS (G4); bilingual; Context7; @theme tokens; perf+a11y budgets.
- Budget: 12 cycles OR 4h OR token target per run. Stop on quality plateau.
- See [[docs-driven-build]] loop.
