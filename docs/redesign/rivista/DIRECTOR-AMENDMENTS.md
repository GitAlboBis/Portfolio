# Director amendments to EFFECTS-PLAN.md (2026-09-17)

Read this together with `EFFECTS-PLAN.md`. Where they disagree, this file wins.

## 1. Authority

- The repo's `CLAUDE.md`, `DESIGN.md`, `REDESIGN-SPEC.md` and `.impeccable/design.json` describe **"The job order"** (workshop form, safety yellow, red stamps, Archivo). Alberto **rejected that world on 2026-09-17** ("stranissimo", "non mi piace il giallo", "dev'essere smooth e clean"). Do not take any colour, type, component or motion rule from those files.
- The visual authority for this prototype is `EFFECTS-PLAN.md` + `.wf-out/rivista/u2-canon.md` (the "rivista bianca" canon) + the three identity variants already in the prototype.
- What still applies from `CLAUDE.md` is process only: visual proof before "done" (1440x900 and 390x844 DPR 2, console clean), no number that is not in `PRODUCT.md` §3/§9, never publish the phone number, public email `albertotuveri@gmail.com`, `prefers-reduced-motion` gets an intentional version of every effect, animate transform / opacity / clip-path only.
- Nothing under `src/` is touched. No git commands. No `npm install`, no `npm run build`. The dev server on `http://localhost:3000` is already running: never start or stop a server.

## 2. Scaffold is serial, not raced

Plan §9 lets B or C create `fx-core.js` / `assemble.mjs` "verbatim" if they are missing. **Void.** One scaffold agent runs alone first and delivers `assemble.mjs`, every partial (seeded verbatim from the current `index.html` / `case.html`), `fx-core.css`, `fx-core.js`, seeded owner stylesheets and stub modules. After that:

- `assemble.mjs`, `parts/head.html`, `fx-core.css`, `fx-core.js` belong to WP-A. B and C never edit them; they write a request (see §4) and feature-detect.
- The old generator `.wf-out/rivista/tools/gen.mjs` is superseded by the partials. Reference only.

## 3. Isolation switches (implemented by the scaffold in `fx-core.js`)

- `?fx=core,gl,hero` initialises only the listed modules (`core` is always on). Without the parameter, all modules run. A module that is not initialised must leave all content visible.
- `?chrome=0` hides the variant switcher for captures. `?v=1|2|3` selects the variant.
- Each module's `init` and `build` run inside try/catch; a failure sets `html.fx-fail-<name>` and logs one `console.warn`.

## 4. Resumable work

Account limits can kill an agent mid-run; files on disk survive. Each package keeps `C:/Users/alber/Portfolio/.wf-out/rivista/build/<WP>.progress.md`:

```
# WP-X progress
## Done        (milestones, one line each)
## In flight   (what you were doing, which file)
## Requests    (what you need from another owner: file, hook or function, why)
## Known gaps
```

On start, read your progress file and inspect the files you own: you may be the continuation of an interrupted run. Continue, do not restart. Update the file after each milestone.

## 5. Bounded verification

Build fully, then one batched capture round (desktop and mobile together), fix everything it shows in one batch, confirm with at most one more round, stop. Prefer contact sheets over many single frames: write the frames to disk, lay them out in a small local HTML page, screenshot that page with Playwright and Read the sheet. Scratch scripts and frames go under `.wf-out/rivista/build/<WP>/`, never inside `public/`.

## 6. Machine notes

- Adreno X1-85, Windows on ARM: the display sometimes presents at 30 Hz. If rAF p50 is about 33.3 ms with p95 - p50 under 2 ms, that is vsync, not engine cost.
- Never return a GSAP object from `page.evaluate` (serialisation hangs).
- Hidden states by `gsap.set` only: a CSS `translateY(101%)` plus a `yPercent` tween leaves the element off screen because GSAP reads the computed pixel matrix.
- Full-page screenshots never above 16,384 device px: capture in tiles.
