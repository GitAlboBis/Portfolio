# docs-driven-build — Human Gates & Budget

> A loop without human gates can act in ways no one intended.
> A loop without a budget can run forever. Both sections are required and present.

State file: `loops/docs-driven-build/STATE.md`. Approver: **Alberto** (loop owner).

---

## Human gates

The loop halts at each gate and waits for an explicit "go" before continuing.
It never self-approves.

| # | Gate | Trigger condition | Who approves |
|---|------|-------------------|--------------|
| G1 | Pre-run sign-off | Before the very first live run | Alberto |
| G2 | Verifier anomaly | Verifier (`verifier.sh` or `verify-visual.mjs`) returns exit 1 **2× consecutively** on the same unit | Alberto |
| G3 | Merge-to-main / production deploy | Before merging the integration branch into `main` or triggering a **production** Vercel deploy. (Auto-merge to the integration/feature branch on green is allowed.) | Alberto |
| G4 | Aesthetic sign-off | Before closing GATE 4 (hero "excellent"), GATE 2/3 art-direction, GATE 5 (cinematic feel), GATE 6 (copy EN/IT). A script cannot certify these — `claude-in-chrome` QA + Alberto's judgment required. | Alberto |
| G5 | External spend / generate | Before any Higgsfield video generation, Blender/Hyper3D asset generation, or other action that incurs external cost or quota | Alberto |
| G6 | Delete / overwrite | Before deleting files or overwriting irrecoverable data (e.g. removing `package-lock.json`, rewriting an existing doc's intent vs. a factual sync) | Alberto |

The two project-specific gates the docs add on top of the unconditional G1/G2:
**aesthetic sign-off (G4)** and **external generation spend (G5)** — these come straight
from `docs/11-WORKFLOW.md` STOP points and the "don't install/spend without need" rule.

### How to clear a gate

1. The loop writes a gate-request row to `loops/docs-driven-build/STATE.md` (gate ID,
   reason, proposed action) and stops.
2. Alberto reviews and replies with an explicit approval (chat "go", a PR approval, or a
   commit).
3. The loop records the approval in STATE.md, then continues. Never self-approve.

---

## Budget / stop (HARD limits)

When **any** limit is reached the loop halts immediately, writes `status: budget-exceeded`
to STATE.md, and waits for Alberto to raise the budget or mark it done.

| Dimension | Limit | Action on breach |
|-----------|-------|------------------|
| Max iterations / run | **12** | Halt + write budget-exceeded |
| Wall-clock / run | **4 hours** | Halt + write budget-exceeded |
| Token target | If a `+Nk` turn target is set, honor it as a hard ceiling | Halt + write budget-exceeded |
| Consecutive verifier fails | **2** on one unit → G2 | Halt for human review |

An unset limit is the same as no limit — these values are concrete on purpose.
The persistent counter lives in STATE.md (the only brake that survives cold starts).
