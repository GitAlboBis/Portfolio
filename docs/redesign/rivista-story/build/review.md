# REVIEW lane — finish review of the rivista story round

- Lane: REVIEW (port 5193, stopped). Changed no file except this one. Headless only; captures under `.shots/review/`.
- State: DONE.
- Tree reviewed: HEAD `ac7e83f` plus the uncommitted LOOK and SWEEP work (252 paths in `git status`; the task said
  "tree clean", it is not: the two polish lanes' changes are not committed yet).
- Method: impeccable `finish-reviewer` run inline (this harness gives the lane no reviewer subagent) + `craft-floor`.
  Code-led build: no approved comp, no `.impeccable/build/state.json`, no diff reports; TYPE / MATERIAL / GROUND are
  judged against the contract's OWN-WORLD. No detector or hook findings were in the packet.

## Gates (run by this lane, before capturing)

- `node public/proto/rivista/assemble.mjs`: exit 0, every file "up to date" (2 editions, 9 cases, 192 strings).
- `node public/proto/rivista/assemble.mjs --check`: exit 0.
- `node scripts/check-claims-proto.mjs`: OK, 32 pages, numbers in scope, 16 Italian pages match.
- visual-gate `review/en` (cover, work, about, consulting, obla, contact, case-sersan-io, 404; 1440 and 390; stage on;
  `GATE_MAX_STEPS=30`): CLEAN, 0 errors, 0 warnings.
- visual-gate `review/it` (it/index, it/consulting): CLEAN. `review/rm` (`--reduce`, cover + Consulting): CLEAN.
  `review/ng` (`--nogpu`, cover + Consulting): CLEAN.
- Cuts (one-off scratch script, `.shots/review/cuts/`): cover -> Work, cover -> Consulting, Consulting -> Obla at 1440,
  cover (dusk row) -> Consulting at 390: every landing on the right URL, console empty.

## Evidence check (check 0)

All required captures exist and are valid: no blank or half-loaded frames, document top visible on every `-00`, the
dimensions match 1440x900 and 390x844@2. Caveat: the visual gate jumps and waits 900 ms, so the night figures were often
caught mid-migration (Consulting step 4, Obla step 3); `.shots/review/steps/` re-captures them after a reader-like glide
and 1.2 s / 3.7 s of stillness, and those are the frames judged.

---

disposition: fix

## persistence

- PRODUCT.md: present (§10 Consulting, §11 Obla are the new sources the claims gate reads). Pass.
- DESIGN.md, CLAUDE.md, `.impeccable/design.json`, HANDOFF.md, PLAN.md: **fail, expected**. They predate the round and
  still describe the water A, one long home, `fx-water.js`, `water/**`, the plates and `probes/water/lib.mjs`. Spec 10
  FINISH puts DESIGN.md after this review; it must be rewritten from the code before the round counts as finished.
- Comp round: none, by the user's pin (spec 10 §1 FORM: "User-pinned direction (AskUserQuestion, 2026-11-09): no
  concept roll"). No seed key, no state file; disclosed, not a finding.
- Raster provenance: the one new shipping raster source (`/captures/sersan-brand-end-1600.webp`, read by `gen`/`cut`)
  has its sidecar per integrate2. The cover share cards were regenerated without the A.

## fidelity

No approved comp: the matrix is against the direction contract (spec 10 §1 as amended by 20 and 30) and Alberto's words.

| element | state | evidence |
|---|---|---|
| TYPE (Cormorant caps staircase, Figtree, Fig. NN captions) | match | every page, both languages |
| GROUND day / night | match | sampled: paper 246,243,236 = `#f6f3ec`; night 12,14,20 = `#0c0e14` (cover, Consulting, Obla) |
| MATERIAL: glass body over the name (Fig. 01) | match, with one defect | real refraction of the lockup with a spectral rim, curved studio reflections, footprint shadow and crescent (`sheets/crop-body-d.png`). Defect: the crown carries a pale grey-white fill that erases letters (fix 1) |
| MATERIAL: day ink | contradicted in three places | THESIS "by day it is ink: it darkens the paper". The Work `current` is a full-width pale grey-violet haze band (`sheets/crop-current.png`); the About margins and the phone cover above the dusk strip carry pale whitish vertical streaks on paper (`sheets/crop-about-m.png`, `en/..index_html-mobile-03.png`). They read as smudges, not ink filaments |
| MATERIAL: night light (gen, cut, code, agents, obla) | match once settled | `sheets/steps.png`: the SerSan mark condensing in a frame, strip with playhead, code rows, hub + six agents with links, Obla holding a card of light |
| Separate pages, a word opens a page (spec 20 §1) | match | header links cut to their page, current page carries the dash |
| Sharp passage day/night (S5 cut, dusk strip) | match | `sheets/cut-d-cover-consult.png`, `cut-m.png`: straight night edge rising, name on the sheet, landing in night |
| Night -> night cut (Consulting -> Obla) | acceptable | the band's paper sliver shows the move at t≈400 ms (`sheets/cut-d-consult-obla.png`) |
| Old water parts gone (spec 30 §1) | match | no plate, no preloader pour, no Fig. 03 passes, no A as figure; colophon and alt text rewritten |
| Cover on scroll: drop -> row lens -> dusk (spec 30 §3) | match | drop in Now's margin, pill lens on WORK / LAVORI, pool beside "Write to me." |
| Work rail lens | match | lens over the SphereNode capture, no giant letters |
| About beads on the rules | contradicted (legibility) | beads hang into the cap tops and their crescent leaves a cream halo over the letters (fix 2) |
| Fig. 02 ring | contradicted (weak) | reads as a smudged band clipped flat under the header line, not a turning ring (`sheets/crop-ring.png`) |
| Consulting, Obla content and copy (spec 10 §6) | match | EN and IT strings as specified; no prices, clients, status |
| Printed states (reduced, no WebGPU) | adaptation with two defects | stills and "Live figure" fields present as specified; "Read" printed twice under reduced motion (fix 4); no-GPU Consulting keeps the scrub spacing (fix 7) |
| Legibility law (mist over text under ~10 %) | match | body copy holds contrast in both worlds on every capture |
| Browser surfaces | match, one defect | `::selection`, focus ring, scrollbar themed in both worlds; gutter turns night beside paper (fix 6) |

## ceiling

- The camera inside a figure box never orbits (spec 30 §2 "inside a figure box, by a camera that may orbit"): every
  night figure is a flat front view. Agents and Obla are the two that would gain most.
- The Contact page is the least immersive page of the issue: one drop beside "Write to me." on an otherwise empty
  first viewport (`en/..contact_html-desktop-00.png`, `-mobile-00.png`). The ink "settling around it" (§3) is not
  visible.
- Work's `current` is the weakest formation of the issue (see fidelity); the rail lens carries Work alone.
- No glass on night pages: allowed by spec 30 ("unless highlights alone prove cheap and beautiful"), not tried.
- Focus pulls between depths at a chapter change are not readable on stills; not judged.

## material_fixes

1. **Cover, first viewport, 390 (and 1440):** the body's pale crown erases the R of ALBERTO and the V of TUVERI; on the
   phone the H1 reads "ALBE TO / TU ERI" (`en/proto_rivista_index_html-mobile-00.png`). Bend the name, never delete a
   letter: thin the crown's grey fill so refracted ink stays dark, or seat the body on the counter between letters,
   smaller at 390. (THESIS/FIRST VIEWPORT; `stage/glass/**`, `stage/day/rest.js`)
2. **About, 1440 and 390:** beads hang into the display lines' cap tops (C of CORE, O of FRONT-END and CLOUD, the path's
   "SOFTWARE & AI ENGINEER") and the shared caustic leaves a cream halo washing "T-" of FRONT-END
   (`sheets/crop-beads-d3.png`). One or two beads per row, sitting on the rule clear of cap height, no crescent for
   beads. (spec 30 §3 legibility; `stage/day/beads.js`, glass shadow/caustic)
3. **Day ink reads as pale smear, not ink:** Work's `current` band between lead and rail at 1440 and 390, the pale
   vertical streaks down About's margins (both sizes) and on the phone cover's paper above the dusk strip. By day the
   particles must darken the paper as cobalt filaments; whitish haze on paper contradicts THESIS. (`stage/day/current.js`,
   `mist`, `fall`/`plume` in the paper zone)
4. **Reduced motion: "Read ->" printed twice** on every row of In this issue and the dusk strip, EN and IT, both sizes
   (`sheets/crop-rm-read.png`). Cause: `.ix-row .nv-ix-v .sc-roll-b { display: flex; }` (fx.css 1772, from
   fx-scroll.css) wins over the reduced-motion rule that turns `.sc-roll-b` into an inline " · " suffix (fx.css
   1506-1510); for these rows a and b say the same word. Hide `.sc-roll-b` in `.ix-row` under reduced motion. (States)
5. **Fig. 02 ring, cover 1440:** a faint smudge above the plate, cut straight by the header line, and a pale column in
   the gutter; nothing reads as a ring turning (`sheets/crop-ring.png`). Give it a visible thin cobalt line or remove it.
   (spec 10 §3.5 `ring`; `stage/day/ring.js`)
6. **Gutter on the cover:** `html:has(.hdr.is-night) { background-color: var(--night) }` (fx.css 1690) turns the
   scrollbar track night beside the paper band while the header sits over the dusk strip (`en/..index_html-desktop-03.png`,
   `it/..index_html-desktop-03.png`, right edge), and any overscroll shows night under paper. Scope the ground to full
   night pages and let the cover's gutter stay paper. (Browser surfaces)
7. **No WebGPU, Consulting 1440:** the printed page keeps the sticky-scrub spacing, so each entry sits alone in a
   screen of night beside an empty ruled box (`sheets/ng-cons.png`); the reduced-motion version is compact. Use the
   reduced layout whenever the stage is off (`html.gl-off`). (spec 20 §7 "no WebGPU complete on every page")
8. **Floor, kickers that carry nothing:** "BY NIGHT" / "DI NOTTE" above the dusk rows (the night ground already says it)
   and "SOFTWARE & AI ENGINEER · CREATIVE LEAD" above the cover statement. Delete the first; fold the role into the
   statement's line or the caption block. The numbered chapter eyebrows (01-08) stay: spec 20 §2 makes the sequence
   information the reader uses across pages.

Lesser, not material (for the fix lane if time allows):
- Phone night pages: the copy scrolls under the sticky figure caption and the line at the seam is cut through its
  letters (`en/..consulting_html-mobile-02.png`, `it/..consulting_html-mobile-04.png`).
- Night figures need about 2-3 s after a step change to resolve; in between they streak. Obla "It asks" at 1.2 s is
  streaks, at 3.7 s a clean card of light (`steps/obla-asks-a.png` / `-b.png`): the LOOK lane's open item is the
  migration, not a stuck state. A faster spring on step change would help readers who scroll on.
- Obla "It works": the streams rise from the head like smoke; the "sessions" rectangles of spec 10 §5 do not read.
- Italian dusk row: "e ogni mattina alle 08:00 riferisce" is stiff; "e ogni mattina alle 08:00 fa rapporto" reads
  better (Alberto, as native speaker, to confirm).
- The glass pool beside "Write to me." reads as a white plastic ring at 1440 (no ink around it).

## keep

The cover body bending the name with real refraction, the S5 cut into night with its straight edge, the night figures
once settled (the SerSan mark in noise, the strip with the playhead, hub and six agents, Obla and its card of light),
the exact paper and night grounds, and the type: do not dilute any of these while fixing.

## Genuinely excellent (short list, so it is not lost)

- The cut from the cover into Consulting: the night sheet rises with a straight edge, carries "CONSULTING · 06 · In
  this issue", and lands on the night page. It is the «passaggio netto» as Alberto asked.
- The glass body over TUVERI at 1440: bent R/T/V/E, spectral rim, curved studio boxes, one soft footprint.
- Consulting step 4: the hub and six agents with lines of light, printable as a figure (`steps/cons-agents-b.png`).
- Obla: the character drawn from its product's numbers, its five states, the morning report's happy eyes.
- The issue as pages: header with the current-page dash, In this issue + dusk strip as contents, 404 with the full
  list, both languages at parity, console clean everywhere.

## Captures looked at (one line each)

- `.shots/review/en/proto_rivista_index_html-desktop-00.png` cover 1440: body over the name, caption, statement, button.
- `.shots/review/sheets/crop-body-d.png` the body at 2x: refraction good, crown fill pale, R erased.
- `.shots/review/en/proto_rivista_index_html-desktop-01.png` Now: drop in the left margin, Fig. 02, ring smudge.
- `.shots/review/sheets/crop-ring.png` the ring: a smudge clipped by the header line.
- `.shots/review/sheets/cover-d.png` In this issue with the pill lens on WORK, dusk strip, band, footer.
- `.shots/review/sheets/cover-m.png`, `cover-m2.png` the phone cover: H1 letters lost; dusk strip; band; footer.
- `.shots/review/en/proto_rivista_index_html-mobile-03.png` phone: pale streaks on paper above the dusk strip, "BY NIGHT".
- `.shots/review/en/proto_rivista_work_html-desktop-00.png`, `sheets/crop-current.png` Work: the current as a haze band.
- `.shots/review/sheets/work-d.png`, `work-m.png` Work: rail lens, tiles, Evidence ledgers, band.
- `.shots/review/sheets/about-d.png`, `about-m.png`, `crop-beads-d3.png`, `crop-about-m.png` About: beads into cap tops, halo, margin streaks.
- `.shots/review/sheets/cons-d.png`, `en/proto_rivista_consulting_html-desktop-03.png` Consulting (gate frames, mid-migration).
- `.shots/review/sheets/steps.png` Consulting gen / agents and Obla "It asks" after settling: clean.
- `.shots/review/sheets/obla-d.png` Obla: five states, the band.
- `.shots/review/sheets/night-m.png` Consulting and Obla at 390: sticky figure, copy cut at the caption seam.
- `.shots/review/sheets/rest-d.png`, `rest-m.png` Contact page, 404, sersan.io case at both sizes.
- `.shots/review/sheets/it-d.png`, `it-m.png` Italian cover and Consulting: parity, LAVORI lens, Di notte.
- `.shots/review/sheets/rmng-d.png`, `rmng-m.png`, `crop-rm-read.png` reduced and no-GPU: stills present, "Read" twice under reduce.
- `.shots/review/sheets/ng-cons.png` no-GPU Consulting: empty ruled boxes, scrub spacing kept.
- `.shots/review/sheets/cut-d-cover-work.png`, `cut-d-cover-consult.png`, `cut-d-consult-obla.png`, `cut-m.png` the cuts, before / during / landed.
