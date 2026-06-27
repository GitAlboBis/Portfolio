<!-- changing state — read & written every run; never moved into SKILL.md. -->

# docs-driven-build — State Ledger

> The loop's memory. Read at start, written before stopping. External on purpose.

## Active gate

```
gate     : 6  (hero + cinematic, fused — IN PROGRESS)
branch   : feat/hero-scroll-narrative
baseline : typecheck green (tsc --noEmit exit 0 on current WIP tree)
```

Gate map (docs/11 numbering): 0–5 done · **6 in-progress** · 7 (content) done · **8 not-started** (perf/a11y/SEO/README/deploy).

## Backlog (from iteration-1 reconciliation)

P0 = blocks active gate · P1 = next · P2 = later · ⚠ = touches uncommitted hero WIP.

| id | gate | item | prio | status |
|----|------|------|------|--------|
| commit-hero-wip ⚠ | 6 | Commit the hero/cinematic WIP (9 M + 1 D + 5 untracked) — do FIRST before any WIP edit. Needs frames-as-LFS? decision. | P0 | gate (G3/large-binary) |
| lock-hero-feel-signoff ⚠ | 6 | Alberto GATE-6 STOP sign-off on hero water feel (leva tuning open; 'A' morph future). | P0 | gate (G4) |
| qa-visual-hero-cinematic | 6 | QA-visual: desktop+mobile screenshots, clean console, reduced-motion + WebGPU-absent fallback. | P0 | pending |
| resolve-cinematic-scope | 6 | Decide: keep fused WebP frame-scrub as final, or build zoom-into-clip/backflip beat. Reconcile unused scrollStore 'cinematic' band + t.cinematic. | P0 | pending |
| gate-leva-panels ⚠ | 6 | Gate leva dev panels behind a dev flag so GUI doesn't render over live/QA site. | P0 | pending |
| remove-package-lock | 3 | Delete stray package-lock.json (gitignored already); bun.lock canonical. | P1 | gate (G6) |
| decide-dead-r3f | 5 | Keep vs delete orphaned R3F infra (FrameDriver, createRenderer, SceneErrorBoundary, pointerStore, fxStore, heroDragStore) — nothing imports them. | P1 | gate |
| clean-orphan-homebuffer ⚠ | 6 | homeBuffer created/uploaded in mls-mpm.ts but NOT bound in g2p (orphaned); stale "g2p binding 6/7" comments. Remove or rewire. | P1 | pending |
| decide-orphan-glbs | 6 | a-mark.glb / a-liquid.glb not loaded at runtime — remove or keep as offline shape ref. | P1 | gate (G6) |
| commit-frame-source | 6 | Canonicalize/track public/frames/*.webp (136) + hf_*.mp4 source (LFS?). | P1 | gate (large-binary) |
| finalize-sersan-projects | 7 | Real SerSan data or keep approved-provisional ([[TBD]]). | P1 | gate (needs Alberto data) |
| verify-contact-email | 7 | Confirm mailto is public address, not alberto.t@sersan.dev. | P2 | pending |
| perf-tier-scaling ⚠ | 8 | Mobile tier scaling for MLS-MPM hero (NUM_PARTICLES=40000 fixed; detectTier() unused). | P2 | pending |
| lazy-load-hero ⚠ | 8 | Dynamic-import the heavy hero/cinematic. | P2 | pending |
| seo-infra | 8 | sitemap.ts / robots.ts / opengraph-image / JSON-LD Person. | P2 | pending |
| a11y-pass | 8 | AA contrast, keyboard nav, focus, aria-hidden on decorative canvas/frames. | P2 | pending |
| lint-test-scripts | 8 | Add ESLint/Prettier/test or document intentional absence (reconcile docs/01). | P2 | pending |
| lighthouse-audit | 8 | Lighthouse mobile ≥80 + reduced-motion/WebGPU-absent verification. | P2 | pending |
| readme | 8 | Project README (setup/run/deploy/structure). | P2 | pending |
| webgpu-fallback ⚠ | 8 | Real degraded hero (poster/static A) or formally accept CSS gradient as only fallback. | P2 | gate |
| deploy-merge | 8 | Final Vercel production deploy + merge to main. | P2 | gate (G3) |
| physics-polish ⚠ | 6 | Optional: s_corr surface tension, vorticity, diffuse/foam, sleeping (docs/12 backlog). | P2 | pending |

## Last run

```
timestamp : 2026-06-27
iteration : 1
action    : docs<->code reconciliation
outcome   : 16 docs reconciled (CLAUDE.md + docs/00-12 + README); package-lock.json gitignored;
            fixed docs/04 homeBuffer contradiction vs docs/12; seeded this backlog
verify    : git scope = docs-only (no code touched); typecheck exit 0
exit code : 0
status    : iteration-1 complete — HALTED at gate (next P0 work is touchesWIP / G3 / G4)
```

## Gate requests / approvals (awaiting Alberto)

| gate | reason | proposed action |
|------|--------|-----------------|
| pre-WIP / G3 | Entire hero is uncommitted; editing it risks clobber. + 136 WebP frames are large. | Commit hero WIP to the branch; decide raw-git vs git-LFS for public/frames + public/video. |
| G4 | Hero feel not signed off (leva tuning open with you). | Your STOP sign-off, OR direction on what to tune, before I touch fluid params. |
| G6 | Stray package-lock.json (gitignored); orphan GLBs; orphan homeBuffer. | Approve deletions/cleanup. |
| scope | Cinematic = flat WebP scrub vs the originally-planned zoom-into-backflip. | Confirm final cinematic scope. |

## Notes

- Source of truth = repo (`CLAUDE.md` + `docs/`), now reconciled to reality. Read fresh each run.
- Budget: 12 iterations OR 4h per run (hard stop). Iteration 1 used.
- Do not delete completed ledger rows — audit trail (git is the journal too).
