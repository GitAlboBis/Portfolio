<!-- changing state — read & written every run; never moved into SKILL.md. -->

# docs-driven-build — State Ledger

> The loop's memory. Read at start, written before stopping. External on purpose.

## Active gate

```
gate     : 8  (productionization) — gate 6 hero stays Alberto's hand-tuned domain (G4)
branch   : feat/hero-scroll-narrative
baseline : typecheck + build green (next build OK; 3 static pages)
site URL : https://albertotuveri.dev (metadataBase in layout.tsx)
```

Gate map: 0–5 done · 6 in-progress (hero hand-tuning, feel G4 unsigned) · 7 done · **8 active**.

## Backlog

P0 = active-gate blocker · P1 = next · P2 = later · ⚠ = touches hero WIP.

| id | gate | item | prio | status |
|----|------|------|------|--------|
| seo-infra | 8 | sitemap.ts / robots.ts / JSON-LD Person / web manifest. | P0 | in-progress |
| readme | 8 | Project README (setup/run/deploy/structure). | P0 | pending |
| a11y-pass | 8 | AA contrast, keyboard nav, focus, aria-hidden on decorative canvas/frames. | P1 | pending |
| lint-test-scripts | 8 | ESLint+Prettier config (ignore vendored waterball) + scripts; reconcile docs/01. | P1 | pending |
| verify-contact-email | 7 | Confirm mailto is public address, not alberto.t@sersan.dev. | P2 | pending |
| perf-tier-scaling ⚠ | 8 | Mobile tier scaling for MLS-MPM hero (NUM_PARTICLES fixed; detectTier() unused). | P2 | deferred (WIP/feel) |
| lazy-load-hero ⚠ | 8 | Dynamic-import the heavy hero/cinematic. | P2 | deferred (WIP/feel) |
| webgpu-fallback ⚠ | 8 | Real degraded hero or formally accept CSS gradient as only fallback. | P2 | gate |
| lighthouse-audit | 8 | Lighthouse mobile ≥80 + reduced-motion/WebGPU-absent verification. | P2 | pending (after deploy) |
| decide-dead-r3f | 5 | Keep vs delete orphaned R3F infra (FrameDriver, createRenderer, SceneErrorBoundary, pointerStore, fxStore, heroDragStore). | P1 | gate (awaiting Alberto) |
| finalize-sersan-projects | 7 | Real SerSan data or keep approved-provisional ([[TBD]]). | P1 | gate (needs Alberto data) |
| resolve-cinematic-scope | 6 | Keep fused WebP scrub as final vs build zoom-into-backflip beat. | P1 | gate (awaiting Alberto) |
| lock-hero-feel-signoff ⚠ | 6 | Alberto GATE-6 STOP sign-off on hero feel. | — | gate (G4) |
| qa-visual-hero-cinematic | 6 | QA-visual once hero feel signed off. | — | gate (after G4) |
| physics-polish ⚠ | 6 | Optional fluid polish (s_corr, vorticity, foam, sleeping). | P2 | deferred |

## Done this session

| iter | what | commit |
|------|------|--------|
| — | scaffold docs-driven-build loop | 92ba4d7 |
| 1 | reconcile all 16 docs to shipped reality | 5b215f6 |
| 2a | commit hero/cinematic WIP + 136 frames | 9445c18 |
| 2b | cleanups: rm package-lock.json + orphan GLBs + dead homeBuffer machinery | (pending commit) |

## Last run

```
timestamp : 2026-06-27
iteration : 2
action    : housekeeping — commit hero WIP + approved G6 cleanups
outcome   : WIP+frames committed (9445c18); deleted stray package-lock.json + orphan GLBs
            (a-mark/a-liquid) + dead homeBuffer/homes machinery in mls-mpm.ts
verify    : typecheck + BUILD green (first build; compiled 1.9s, 3 static pages)
exit code : 0
status    : iteration-2 complete — proceeding to GATE 8 (seo-infra, readme)
```

## Gate requests / approvals (awaiting Alberto)

| gate | reason | proposed action |
|------|--------|-----------------|
| G4 | Hero feel not signed off (leva tuning open). | Your STOP sign-off before any fluid-param / perf-tier / lazy-load work on the hero. |
| decision | Orphaned R3F infra (FrameDriver/createRenderer/SceneErrorBoundary/pointerStore/fxStore/heroDragStore) — keep or delete? | Approve removal as dead code, or say keep for future R3F cinematic. |
| decision | Cinematic scope: fused WebP scrub final, or build zoom-into-backflip beat? | Confirm final scope. |
| data | SerSan projects still [[TBD]]. | Provide real data, or confirm keep-provisional. |

## Notes

- Source of truth = repo (`CLAUDE.md` + `docs/`), reconciled 2026-06-27. Read fresh each run.
- Budget: 12 iterations OR 4h per run (hard stop). Iterations used: 2.
- Context7 BEFORE touching versioned libs (Next 16 sitemap/robots APIs etc.).
- Do not delete completed ledger rows — audit trail (git is the journal too).
