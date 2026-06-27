<!-- changing state — read & written every run; never moved into SKILL.md. -->

# docs-driven-build — State Ledger

> The loop's memory. Read at start, written before stopping. External on purpose:
> a skill reloads from disk each cold start, so state here would silently reset.

## Active gate

```
gate     : (to be determined by iteration 1 reconciliation)
branch   : feat/hero-scroll-narrative
```

## Backlog

<!-- Seeded by iteration 1 (docs↔code reconciliation). One row per unit of work. -->

| id | gate | item | status | notes |
|----|------|------|--------|-------|
| (initial) | — | scaffold — no backlog yet | pending | seeded after recon |

Valid status: `pending · in-progress · done · failed · skipped`

## Last run

```
timestamp : 2026-06-27 (scaffold)
iteration : 0
outcome   : scaffolded — awaiting iteration 1
exit code : —
status    : ready
```

## Gate requests / approvals

<!-- The loop appends a row here when it needs a human gate cleared (see HUMAN-GATES.md). -->

| when | gate | reason | resolution |
|------|------|--------|------------|
| — | — | — | — |

## Notes

- Goal predicate: see `.claude/skills/docs-driven-build/TRIGGER.md`.
- Do not delete completed rows — they are the audit trail (git is the journal too).
- A `failed` row → loop halts; clear the matching gate in `HUMAN-GATES.md` before next run.
- Budget: 12 iterations OR 4h per run (hard stop).
