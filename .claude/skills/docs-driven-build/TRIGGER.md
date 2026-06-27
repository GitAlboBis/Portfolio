# docs-driven-build — Trigger Definition

> Host-agnostic launch contract. What the loop achieves, where its state lives,
> and exactly how to start a run.

## Verifiable goal

The loop stops when this holds:

> **docs ↔ code reconciled (no stale specs) AND `docs/11` GATE-8 done-when met
> (S1–S6 built & bilingual; `bun run typecheck` && `bun run build` exit 0;
> Playwright 0 console errors desktop+mobile; Lighthouse mobile ≥ 80) AND aesthetic
> gates signed off by Alberto.**

Check after the verifier passes each iteration.

## State file

```
loops/docs-driven-build/STATE.md
```

Read at startup, written before stopping. Missing/empty ⇒ first run ⇒ initialize first.

## Chosen trigger: session loop, self-paced

Per the owner decision, this loop is **self-paced within a working session** — no cron, no
external scheduler. The agent drives iterations back-to-back, pausing only at a GATE STOP or
the budget. On Claude Code this maps to **`ScheduleWakeup`** (dynamic re-fire) when the agent
needs to yield/wait, with `HUMAN-GATES.md` budget as the hard ceiling. (Host mechanics:
`references/host-adapters.md` in the loop-maker skill. **Verify slash-command/scheduler syntax
against current Claude Code docs** — these surfaces change between versions.)

### Claude Code launch

```
/docs-driven-build
```

(Project skill; invocable once the harness indexes `.claude/skills/`.) If the slash command
is unavailable in your version, use the fallback prompt below. **Verify against current docs.**

### Host-agnostic fallback (works anywhere)

```
Read loops/docs-driven-build/STATE.md and .claude/skills/docs-driven-build/SKILL.md,
then run the docs-driven-build loop.
```

## Trigger notes

- Budget in `HUMAN-GATES.md` (12 iters OR 4h) takes precedence over any interval.
- Before any *automated* re-fire, confirm G1 (pre-run) and G2 (anomaly) are in place and
  Alberto is reachable.
- The loop never deploys to production or merges to `main` without G3.
