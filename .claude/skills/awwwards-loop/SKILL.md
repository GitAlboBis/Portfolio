---
name: awwwards-loop
description: >
  Autonomous evaluator-optimizer loop that drives the portfolio toward Awwwards Site-of-the-Day
  quality. Each cycle: an 8-critic jury scores the site and finds concrete issues → a synthesizer
  ranks them into a backlog → optimizer agents implement the top safe items in worktrees → a
  deterministic verifier + visual QA gate each fix → re-evaluate. Logic only; quality state lives
  in loops/awwwards-loop/STATE.md.
---

# awwwards-loop

A `prompt → task → feedback → test → fix → repeat` loop (evaluator–optimizer pattern) that pushes
the Alberto Tuveri portfolio to world-class quality. It does NOT re-tune the hero fluid (Alberto's
hand-tuned domain) — it improves everything around it: art direction, motion, typography, narrative,
performance, accessibility, craft, and responsive.

## The cycle

```
① EVALUATE → ② PLAN → ③ FIX → ④ TEST → ⑤ RE-EVALUATE → (repeat)
```

1. **EVALUATE (feedback).** An 8-member Awwwards jury scores the site 0–10 per dimension and
   produces specific findings (severity, where, exact fix, impact, safe?, effort). Critics:
   - `art-direction` — composition, ocean palette, mood, hierarchy, the "wow" vs lusion.co
   - `motion` — scroll choreography, easing, liquid-text reveal, micro-interactions, smoothness
   - `typography` — Fraunces/Hanken pairing, scale, rhythm, measure, grid, responsive type
   - `narrative-ux` — story arc, flow, navigation, EN/IT copy quality (no AI-slop, parity)
   - `performance` — 136-frame weight, loading/tier strategy, WebGPU cost, Lighthouse mobile ≥80
   - `accessibility` — WCAG AA, keyboard, focus, aria, contrast, reduced-motion
   - `craft-detail` — the last 10%: states, consistency, edge cases, favicon/OG/404, selection
   - `responsive-mobile` — hero/cinematic on mobile, touch, reflow, WebGPU-absent path
2. **PLAN (prompt→task).** A synthesizer dedupes findings into an impact-ranked backlog; each task
   has impact, effort, `safe` (no hero-fluid changes & verifiable), `parallelizable`, and a concrete
   `doneWhen`. Emits `quickWins` and `bigBets`.
3. **FIX (task).** Optimizer agents implement the top SAFE items. Parallel tasks run in isolated
   git worktrees (file-conflict-free). Each respects the constraints below.
4. **TEST (test).** Deterministic gate per fix: `bash .claude/skills/docs-driven-build/verifier.sh`
   (typecheck + build) + `node .claude/skills/docs-driven-build/verify-visual.mjs` (Playwright,
   0 console errors + screenshots) + `claude-in-chrome` for human/agent visual judgement.
   Adversarial check: a reviewer confirms the fix improved its dimension without regressing others.
5. **RE-EVALUATE (feedback→fix).** Re-run the relevant critics on changed areas; regressions or
   misses go back to ③. Commit passing fixes (small & atomic). Update STATE scores.

## How to run

Re-author/run the cycle workflow (the concrete sub-agent prompts) via the `Workflow` tool. The
canonical cycle-1 script (8 critics + synthesizer) was saved under the session's workflow scripts
dir; subsequent cycles add FIX + TEST phases. Each run reads `loops/awwwards-loop/STATE.md` for the
current scores + open backlog and writes them back.

## Hard constraints (every critic and every fix obeys these)

- **Hero fluid is OFF-LIMITS**: never change `src/webgl/waterball/mls-mpm/*`, `render/*`, or the
  WaterBallHero leva params/shaders (Alberto is hand-tuning the feel — G4). The hero's *integration*
  (a11y, perf/loading, fallback, scroll choreography in `hero.tsx`, title/copy) IS fair game.
- **Bilingual**: visible copy only via `src/data/translations` (en/it); never hardcode.
- **Context7 before code** on versioned libs (Next 16 / GSAP / Lenis / Tailwind v4 / etc.).
- **Use existing `@theme` tokens** (no ad-hoc colors); honor the Cinematic Ocean art direction.
- **Budgets**: 60fps desktop, graceful mobile degradation, Lighthouse mobile ≥ 80; WCAG AA.
- **Commits**: small, atomic, on a feature branch; verifier green before commit.

## Human gates & budget

- **G4** hero feel sign-off, **G5** external spend (Higgsfield/Blender generation — e.g. the
  backflip clip), **G3** production deploy / merge to `main` — stay human.
- **Budget per run: 12 cycles OR 4h OR a token target** (hard stop). Stop also on a quality
  plateau (no dimension gains ≥ 0.3 for 2 cycles). Record in `loops/awwwards-loop/STATE.md`.
