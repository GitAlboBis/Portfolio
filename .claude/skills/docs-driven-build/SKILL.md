---
name: docs-driven-build
description: >
  Self-running ReAct loop that builds the Alberto Tuveri portfolio from docs/. Each
  run reconciles stale docs against the codebase, then implements the next gate task,
  verifying with typecheck + build + console-clean before advancing. Read-only logic;
  all changing state lives in loops/docs-driven-build/STATE.md.
---

# docs-driven-build

A ReAct + deterministic-verifier loop that **executes the project's own gate system**
(`docs/11-WORKFLOW.md`, GATE 0–8) instead of re-inventing one. It reads the `docs/`
suite fresh every run, fixes specs that reality has overtaken, then advances the build
one verified unit at a time.

## Goal (exit predicate)

The loop runs until **all** hold:

- `docs/` ↔ code are reconciled — no spec describes something the codebase no longer does.
- `docs/11-WORKFLOW.md` **GATE 8 "Done-when"** is satisfied: S1–S6 built & bilingual EN/IT;
  `bun run typecheck` && `bun run build` exit 0; Playwright reports **0 console errors** on
  desktop + mobile; Lighthouse mobile performance ≥ 80.
- The human-judged gates (hero "excellent", art-direction, cinematic, copy, go-live) are
  **signed off by Alberto** (see `HUMAN-GATES.md` G4).

A program cannot certify the aesthetic gates — those are human STOPs by design. The loop
self-terminates on the mechanical predicate and **halts at human gates** for the rest.

## Conventions (durable only — never write state here)

This file is **read-only at runtime.** It carries logic, not progress.

- Never write counters, cursors, timestamps, or results here. They live in
  `loops/docs-driven-build/STATE.md`. A skill is reloaded from disk every cold start;
  anything written here silently resets.
- The **source of truth is the repo**: `CLAUDE.md` (golden rules) + `docs/` suite (specs).
  Read them fresh each run. If a value changes between runs → STATE.md. If it never
  changes → it already lives in `docs/`.

## Pattern: ReAct + deterministic verifier

Each iteration, in order:

1. **Read state** — load `loops/docs-driven-build/STATE.md`: active gate, backlog, cursor,
   iteration count, status. If missing/empty → first run; initialize before acting.
2. **Discover** — read `CLAUDE.md` and the relevant `docs/` for the active gate; check
   `git status` / `git log` and the actual code. Determine the next unit of work.
3. **Reconcile** — if any doc describes something the code no longer does (e.g. the hero
   pivoted from GPGPU particles to a liquid/MLS-MPM mesh → `docs/04` stale), **update the
   doc** to match reality. This is a first-class action, not a side note.
4. **Act** — implement the next unit on a feature branch (never `main`). Honor the golden
   rules: **Context7 before touching versioned libs** (`docs/08`); **never invent content**
   (`docs/07` only; Sersan = provisional placeholders); bilingual via `src/data/translations`.
   Parallelizable sub-tasks inside a gate → fan out with the `Workflow` tool (per `docs/11`
   orchestration rules; never two agents on the same file/store).
5. **Verify** — run the verifier (separate program, binary exit code):
   - `bash .claude/skills/docs-driven-build/verifier.sh` → typecheck + build (exit 0/1).
   - For gates with visual output: `node .claude/skills/docs-driven-build/verify-visual.mjs`
     → Playwright asserts 0 console errors desktop+mobile + captures screenshots.
   - **Exit 0** → passed; advance. **Exit 1** → halt, do NOT retry silently (G2).
6. **Write state** — update STATE.md (cursor, iteration++, ledger row, timestamp, status)
   **after** the verifier passes, never before.
7. **Check exit + budget** — if the goal predicate holds → stop, write `status: done`.
   Else if the budget in `HUMAN-GATES.md` is reached (12 iterations OR 4h, or any token
   target) → halt, write `status: budget-exceeded`. Else loop.

## Autonomy policy (per owner decision)

- Work on a feature branch; **small atomic commits** per unit (English, imperative).
- **Auto-commit + auto-PR**; **auto-merge to the integration/feature branch when green**
  (verifier exit 0 + console-clean).
- **Human gates that never auto-clear:** merge to `main` / production deploy (G3), aesthetic
  sign-off (G4), external spend (G5: Higgsfield/Blender), delete/overwrite of irrecoverable
  data (G6). See `HUMAN-GATES.md`. Visual QA at gates uses `claude-in-chrome` (the judged
  pass), Playwright is the deterministic console-clean check.

## How to run

Host-agnostic launch (any session): *"Read `loops/docs-driven-build/STATE.md` and this
`SKILL.md`, then run the docs-driven-build loop."* See `TRIGGER.md` for the Claude Code
one-liner and the self-paced wiring.

Before the first live run: confirm STATE.md exists & initialized; review `HUMAN-GATES.md`;
confirm `verifier.sh` returns 0 on a known-good tree.

## What "done" means

Exit predicate verifiably true · last verifier exit 0 · STATE.md has a final ledger row +
timestamp · no human gate open. Then write `status: done` and exit cleanly.
