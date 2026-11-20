# n-fix-cases: the critic's findings on the cases, answered

Lane FIXCASES, wave 5 (port 5342, captures `.shots/n-fix-cases/`). First run 02:21 to 02:34 on 13 Nov (cut by the
usage credits; digest `.shots/_director/n-fix-cases-first-run.md`), second run from 04:00. Nothing is committed: the
director commits.

## State (kept current: read this first if cut again)
- **Done in the first run:** sphere-ai fast passes on a quiet machine: 0 halvings in 6 + 6 passes (`logs/trace2-a.log`,
  `trace3`), top median 2.55 ms. `stage/scenes/case.js` lines 173 to 183 and 236 to 243: the flown arrival (FLIGHT's
  ask): reads `c.arrival.under` instead of `data-arrive`; `S.flown` (a cut with no sheet) starts the plate inside the
  frame (phone z -900, 2 % up instead of 50 %). Strips recorded: `strip/m-g2case-1`, `strip/d-g2case-1`.
- **Second run, 04:00:** read the digest, n-cases.md, n-critic.md, every file I own; the patch in case.js is whole
  (checked by reading it). Figures not touched yet.
- **Next, in order (second run's list, all DONE in the third run):** the strips and the opener on the final engine;
  sphere-ai halving; 7; 12; 8; 11 a, b, c; gates and proof.
- **Third run, from 04:10 (Opus 5.5, alone on the machine):** read everything again, looked at the critic's frames
  (spherenode teaser and facts, sphere-ai measured, schematic and list end, supply-chain what, the phone sheets).
  Cause of 11 b found by reading: the lit list plate shifted LEFT by 0.12 of its width and its padded box touched the
  text column, so `clearOf` hid the very plate being read; and the record's rows span the full width, so near the
  chapter's end the stack met the record's text too.
- **Done in the third run (04:20-04:45), uncommitted:** `case/figures.js`: `countOf()`, `tallySet()` (the count),
  `rowsFor()` replaces `barsFor()` (bars for measured AND teaser, the count for facts; one formation, switch only when
  the old light is out; CAP 12000), facts / teaser branch without plate, facts' own list -> the stack (`inList`), the
  record as a chapter (`kind "rec"`, the plate far, turned the other way), "what" plate 1.5x and deep, cropped by the
  frame, schematic plates wider and deeper, line ink 0.4 / 0.2, list: no left shift, whole stack, phone item from
  `reading()`. The number's line read from its glyphs (a grid item's box is the whole row: the first try hung the
  units 65-130 px low). `css/case.css`: record gets the free third in scene mode, phone band only for what /
  schematic / list, teaser's printed bars hidden like measured. Gates green after the CSS (assemble, --check, claims,
  Astro build + parity + asserts + claims on `.shots/n-fix-cases/dist`).
- **Looked at (r1-d):** the count reads (5 units; 21 = 10+10+1; 21/49 = 21 bright + 28 dim; 17 = 10+7); teaser bars
  on the row; what plate a big glass screen cropped by the frame; the record's plate far and soft. Wrong and fixed
  next: the mass (48,000 / 80,000) drew vertical columns (pitch squeezed: rain / barcode) -> square pitch, one dot per
  200 (phone 1000); the two 10x10 boards read as lit panels -> 2 strands for counts over 40.
- **Then (04:45-05:20):** the mass on a square pitch (one dot per 200, phone 1000) reads as a fine field; a board of
  more than 50 units (the two Lighthouse hundreds) becomes a compact 10x10 square of small marks; a block of more than
  ten units hangs from the number's top, one line sits on its middle. Looked at: r2-d, r3-d, r4/r5 (hundreds), r2-m
  (phone: counts under the numbers, band items = the row being read: maintech's flow shows CUSTOMERS, domus's stack 01).
- **Measured on the final code, alone on the machine (logs in `.shots/n-fix-cases/logs/`):**
  - GPU 1440x900 DPR 2 tier A, a reader's scroll (`gpu-d-1.log`): opener 2.43-2.45 peak / 1.76-1.91 median, chapters
    1.42 / 1.50 / 2.09 / 2.52 peak (supply-chain's six-plate stack) / 0.85-1.34 median; 1920 DPR 1 (`gpu-d1-1.log`):
    opener 2.06-2.09, chapters 1.26-1.99; phone tier B (`gpu-m-1.log`): 0.87-0.88 / 0.56-0.72. No long task, halvings
    0, the swarm whole, ASLEEP on all eight runs (0 frames in 3 s after 19 s of quiet).
  - sphere-ai fast passes (`trace2-b.log`, `trace2-c.log`): 12 of 12 passes with 0 halvings and no sample over 2.5 ms
    past the opener (24 of 24 with the first run's): the build lane's halvings were the other lanes' load.
  - Text (`text-d2.log`, `text-m2.log`): 22 desktop positions on 4 cases, max 9/255; 27 phone positions on 4 cases,
    max 10/255; no pixel over 24 anywhere.
  - Flown arrival (`strip/m-g2case-2`, `strip/d-g2case-2`): the plate is in the frame from the first frame after the
    door (phone 550 ms, desktop 650 ms), small and lit, and comes nearer; no dark empty frames, no slide from above.
- **Then (05:20-05:40):** printed states against HEAD (`printed2.log`: `?stage=0`, `?gl=0`, reduced motion, desktop and
  phone, spherenode and sersan-io: same words, pictures, chapter and record columns, paddings; every printed bar
  visible; no canvas; `?failfield=1` keeps scene mode). Italian (`r6-it`): "48.000" / "80.000" parse, counts as in
  English. Routed (`nav/`): maintech -> sersan-io by "Next", one canvas, the counts on the new page. 1920 (`r8-d1`).
  Phone schematic line down to a thread (ink 0.1, size 0.5: `r7-m/schem.jpg`). A reader's scroll as a strip
  (`strip/d-teaser2facts`) showed the counts arriving late (rows counted one after another, the teaser's fade awaited):
  fixed (`strip/d-teaser2facts-2`, `strip/m-facts`): the switch happens as soon as the old light is off the frame and
  the rows before a counted row are counted at once. First frame against HEAD (`first-frame.log`, assembled pages,
  case-sersan-io, three cold loads each): 734 / 714 / 682 ms against 725 / 705 / 670 (+9 to +12 ms; the tree holds the
  whole wave, HEAD none of it). Gates at 05:18: assemble --check 0, claims OK, Astro build + parity + asserts + claims 0.
- **Final (05:45):** GPU again on the final code (`gpu-d-2.log`): sersan-io opener 2.56 / chapters 1.50, spherenode
  2.41 / 1.44, asleep, no long task, no halving. Servers 5342 and 5343 stopped by pid; 5178 and 5180 untouched; no
  headless browser left. RETURNED.

## Answers to the critic (7, 8, 11, 12, the phone half of 10) and to FLIGHT
- 7 FIXED: no plate for facts or teaser. Teaser = bars on its row. Facts = the count in light on each row.
- 8 FIXED: the phone band's item is the row being read (`reading()`); the facts carry their counts under their numbers
  and the teaser its bars in its strip (no band for them). STAYS: a long list or flow on a phone still has whole
  screens of text after its band (no free space beside text on a 390 px screen; text is sacred).
- 11 a FIXED (the facts' own list takes the stack), b FIXED (the lit plate moved toward the text and hid itself; the
  stack is whole), c PARTLY: the record has the work's plate far in the room on a wide screen; More work spans the
  full width and has none; the phone's record has none.
- 12 FIXED: what plate about 1.5x and deep, cropped by the frame (supply-chain's diagram now reads as a diagram);
  schematic plates 1.4x wider; the line's ink 0.4 (phone 0.1, thinner).
- 10 phone half and FLIGHT's ask FIXED (first run's patch, checked on the final engine): the plate is in the frame from
  the first frame after the door.

## Needs elsewhere
- DOCS: DESIGN.md and CLAUDE.md do not describe the chapters' figures: the count (units of light, a/b dim, thousands
  as a field, zero an empty rule, "4K" none), the teaser as bars, the record's plate, the phone without a band for
  measured / teaser / facts.

## Plan (this run)
1. Finding 7: no plate for facts / teaser. Teaser = the measured bars (it IS a before -> after row). Facts = THE COUNT:
   units of light, one per thing counted, on each row's own line in the free third (desktop) or under the row's number
   in the number column (phone): rows of 10 (phone 5) short blades; "21/49" = 49 units, 21 bright, 28 dim; "0" = an
   empty rule; thousands ("48,000") = a fine field of dots, one per hundred (phone: per five hundred); "4K" is not a
   count: no units. The units light one by one as the row comes up past 72 % of the frame (a row in 0.7 s). One
   formation (the bars') serves measured, teaser and facts: the chapter nearest the reading line; a new chapter takes
   it only once the old light is out.
2. Finding 8: phone band only for what / schematic / list, its item from `reading()`; facts and teaser lose the band.
3. Finding 11: (a) a facts chapter's own list gets the list stack while its rows are read; (b) the lit plate never
   shifts toward the text, the stack keeps all its plates (lists have at most six); (c) the record gets a free third
   in scene mode (desktop) and the work's plate far in the room, turned the other way: the shot ends on the plate it
   opened with. More work spans the full width: stays without a figure.
4. Finding 12: the "what" plate about 1.5x larger and deeper, its far edge cropped by the frame; schematic plates about
   1.4x wider; the line's ink lower (desktop 0.6 -> 0.4, phone 0.36 -> 0.2).

## Decisions
- The count is light on the rows, the measured bars' kin (the critic kept the bars as good), never glass with a number.

## How to run and look
- `python scripts/serve-static.py 5342 .shots/n-fix-cases/dist public` (pages from this lane's Astro build, scripts
  and stage live from `public/`); scripts in `.shots/n-fix-cases/_scripts/` (copied from `.shots/n-cases/_scripts/`
  and `.shots/n-critic/_scripts/`, ports repointed to 5342). HEAD for comparisons: `git archive HEAD public` into
  `.shots/n-fix-cases/_before`, served on 5343.
- `look.mjs d|m|d1 --tag=x case-...` (a still per fact, per item, per record; GPU, plates, halvings); `sstrip.mjs tag
  page selector [--m]` (a reader's scroll as a strip); `printed2.mjs case-...` (printed states against HEAD on 5343);
  `dbg2.mjs` (the rows formation's state while scrolling); `gpu.mjs`, `trace2.mjs`, `textproof.mjs`, `cstrip.mjs`
  (the flight into a case) as before.
