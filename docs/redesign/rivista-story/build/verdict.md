# VERDICT lane: verdict pass on the finish review (after FIX-STAGE and FIX-PAGE)

- Lane: VERDICT (port 5196, now stopped; 5179 not touched). I changed no file except this one. Everything ran headless. Captures are in `.shots/verdict/`.
- State: DONE.
- Method: the impeccable `finish-reviewer` Verdict Pass, run inline because this harness gives the lane no reviewer subagent. Each finding gets one score: resolved, partial or unresolved. Then at most three regressions, and no new hunt. The lanes' own accounts were not used as evidence. Every score below rests on a capture I opened.
- Tree: HEAD `60cd604` plus the two fix lanes' uncommitted work (65 paths in `git status`). The task said "tree clean"; it is not, which is expected before the director commits.

## Gates (run before capturing)

- `node public/proto/rivista/assemble.mjs`: every page up to date; structural asserts ok (2 editions, 9 cases, 191 strings).
- `node public/proto/rivista/assemble.mjs --check`: exit 0.
- `node scripts/check-claims-proto.mjs`: OK. 32 pages, every number in scope, 16 Italian pages match.
- visual-gate `verdict/en` (cover, Work, About, Consulting, Obla, Contact; 1440 and 390; stage on; `GATE_MAX_STEPS=30`): CLEAN, 0 errors, 0 warnings.
- visual-gate `verdict/it` (it/index): CLEAN. `verdict/rm` (`--reduce`, cover and Consulting): CLEAN. `verdict/ng` (`--nogpu`, cover and Consulting): CLEAN.
- Reader-like glides (`.shots/verdict/glide/`, scratch script). Each place is reached by a smooth scroll: Lenis at 1440, a 1.2 s eased scroll on the phone. Then 2 s of stillness, then the capture. Console clean on every page.

## Evidence check

All captures are valid: no blank or half-loaded frames, the document top shows on every `-00`, and dimensions are 1440x900 and 390x844@2. The gate frames jump the scroll and wait 900 ms. For that reason, everything the stage draws is judged on the glide frames.

## verdict

1. **Cover body erasing letters: resolved.** `crops/cover-m-name.png` (390): ALBERTO and TUVERI are whole. The R is lighter grey on its right half but present, and the V is dark and bent. `crops/cover-d-body.png` (1440): R, T, V, E and R are bent and dark through the body. The crown's grey fill is gone, and the Italian cover (`glide/lens-it-d-top.png`) reads the same.
2. **About beads: resolved.** `glide/about-d-caps.png`, `about-d-caps2.png` and `about-m-caps.png` show one or two small beads sitting on each rule, clear of cap height. There is no halo over the letters.
3. **Day ink as pale smear: partial.** Work's current is now cobalt threads with no haze band (`glide/work-d-top.png`, `work-m-top.png`), and About's margins are fine cobalt lines (`about-m-path.png`). The cover still shows pale grey or lavender marks on paper:
   - a speckled grey column in both margins at 1440 and 390 (`crops/cover-d-leftmargin.png`, `glide/cover-d-contents.png`, `glide/cover-m-contents.png`);
   - a whitish-lavender spatter band just above the dusk strip;
   - short pale drip tails just below it (`glide/cover-d-dusk.png`, `cover-m-dusk.png`, `cover-d-band.png`).

   The FIX-STAGE lane named the phone dusk edge as still open; these captures show the same at 1440.
4. **"Read" printed twice under reduced motion: resolved.** `rm/proto_rivista_index_html-desktop-02.png` and `-03.png`: "READ →" appears once per row.
5. **Fig. 02 ring: resolved.** `glide/cover-d-fig02.png` and `cover-d-now.png`: one thin cobalt circle round the plate, broken by the caption, with no smudge under the header.
6. **Night gutter on the cover: resolved.** `crops/cover-d-gutter.png` (`en/..index_html-desktop-03.png`, right edge): the scrollbar track stays paper beside the night header. The reduced-motion frame `rm/..desktop-03.png` is the same.
7. **No WebGPU keeps the scroll spacing: resolved.** `crops/ng-cons-d-sheet.png`: Consulting without WebGPU is compact, five viewports at 1440 instead of a screen per entry. The figure box holds only its "Live figure: it needs WebGPU and motion." field, as specified.
8. **Kickers that carry nothing: partial.** "BY NIGHT" / "DI NOTTE" is gone (`glide/cover-m-dusk.png`, `rm/..desktop-02.png`). "SOFTWARE & AI ENGINEER · CREATIVE LEAD" still sits above the cover statement (`en/..index_html-desktop-00.png`, `-mobile-00.png`, `lens-it-d-top.png`). FIX-PAGE kept it on the task's word, and the review asked to fold it.

From the lesser list and the ceiling (only the items the lanes took):

- **Night figures 2–3 s to resolve.** Resolved at 1440, partial at 390. At 1440, every Consulting and Obla step is resolved 2 s after a glide (`crops/cons-d-sheet.png`, `obla-d-sheet.png`). At 390, Consulting step 2 is still a single line with no frames after 2 s, and step 3 still carries blurred orbs over the code rows (`crops/cons-m-sheet.png`). Obla at 390 is resolved (`crops/obla-m-sheet.png`).
- **Obla "It works" sessions: resolved.** Three session windows of light with the streams reaching them, at both sizes (`obla-d-sheet.png`, `obla-m-sheet.png`).
- **Italian Obla row: resolved.** It now reads "e ogni mattina alle 08:00 fa rapporto" (the FIX-PAGE sheets; the Italian gate frames show the row). Alberto still has to confirm it as a native speaker.
- **White plastic pool beside "Write to me.": partial.** Cobalt rings now settle round it (`glide/cover-d-band.png`), but the body itself still reads as an opaque milky pebble that bends nothing.
- **Phone seam under the sticky figure: partial.** The figure now ends on a 1 px rule, but the copy line at the seam is still cut through its letters along that rule (`cons-m-sheet.png`, `obla-m-sheet.png`).
- **Ceiling, camera inside a figure box: partial.** The agents (the network is now seen in perspective, `cons-d-sheet.png` step 4) and Obla turn. Gen, cut and code are still flat front views.
- **Ceiling, Contact the least immersive page: partial.** A glass lens now rests on "ME.", bends it, and has cobalt rings round it (`glide/contact-d-top.png`, `contact-m-top.png`). But the first viewport is still empty paper above the band: half the screen at 1440, about 950 px of 1688 on the phone.
- **Ceiling, Work's `current` the weakest formation: resolved.** It is now four cobalt threads (`work-d-top.png`).

## Regressions introduced or newly visible (at most three)

1. **Phone row lens erases WORK.** After a reader's path (glide to Now, then Fig. 02, then In this issue), the pill lens on the first row of In this issue at 390 turns blank milky white and the word WORK disappears. It stays gone at 2, 4 and 6 s, in 3 of 3 runs (`crops/lens-m-sheet2.png`, `glide/cover-m-contents.png`). A glide straight from the top shows WORK correctly (`crops/lens-m-sheet.png`), and in the DOM the word is visible (opacity 1, no clip). So the glass is sampling a stale backdrop and painting over the word. The review's frames showed WORK through this lens, and FIX-STAGE changed `glass.wgsl.js` and `fx-stage.js`, so this batch is the likely cause. I have not proved it. It breaks the rule the round set for fix 1: bend a word, never delete it.
2. **Settle rings cross display letters.** On the Contact page the rings cross the O of "TO" (`contact-d-top.png`, `contact-m-top.png`), and on the cover band they cross "ME." (`cover-d-band.png`). Only display type is crossed and it stays readable, but it is new marking over a title.
3. **The cover body is quieter.** The dome is lower and the studio reflections are now thin lines. The bend is smaller, and the spectral rim and curved studio boxes that the review praised are much fainter. Compare `crops/cover-d-body.png` with `.shots/review/sheets/crop-body-d.png`. Refraction still bends the name, so I do not count it as diluted. It is the item on the keep list closest to the line.

## remaining

- Fix 3, partial: pale grey and lavender marks on the cover's paper (margin columns, the band above the dusk strip, the drip tails below it and below the night band), at 1440 and 390.
- Fix 8, partial: the role kicker above the cover statement.
- Regression 1: the phone row lens erases WORK after a normal reading path.
- Lesser and ceiling, partial: night figures on the phone slower than 2 s on Consulting; the pool's milky body; the phone seam cut; the camera on gen, cut and code; Contact's empty first half.

## What a visitor would still notice first

1. On the phone cover, a white lozenge where the WORK row's title should be, after scrolling down from Now.
2. Pale grey and lavender dust on the warm paper around the dusk strip and down the margins, which reads as smudge, not cobalt ink.
3. Contact's empty top half above "Write to me." The lens and rings are calm, but the page still opens on bare paper.

## Keep list

Not diluted: the S5 cut into night (its straight edge), the night figures once settled (the SerSan mark, the strip with the playhead, hub and six agents, Obla and its card of light, now with session windows), the exact paper and night grounds (paper `#f6f3ec`, night `#0c0e14`), and the type. The cover body still bends the name with real refraction, but with less magnification and a fainter spectral rim than in the review (regression 3). It is held, and it is the closest item to dilution.

disposition: fix

(Not ship. Fix 3 and fix 8 are partial, and regression 1 deletes a word.)

## Captures looked at (one line each)

- `.shots/verdict/en/proto_rivista_index_html-desktop-00.png`: cover 1440. The body bends the name and the letters are dark; the role kicker is still above the statement.
- `.shots/verdict/en/proto_rivista_index_html-mobile-00.png` and `crops/cover-m-name.png`: phone cover; ALBERTO and TUVERI are whole.
- `.shots/verdict/crops/cover-d-body.png` vs `.shots/review/sheets/crop-body-d.png`: the body at 1.5x, after and before; the crown fill is gone and the bend is smaller.
- `.shots/verdict/glide/cover-d-now.png` and `cover-d-fig02.png`: Fig. 02 ring is a thin cobalt circle; a pale grey speckle column sits in the left margin.
- `.shots/verdict/crops/cover-d-leftmargin.png`: that margin column at 1:1.
- `.shots/verdict/glide/cover-d-contents.png`: pill lens on WORK reads at 1440; pale speckle in both margins; a lavender band above the dusk strip.
- `.shots/verdict/glide/cover-d-dusk.png`: dusk strip with no label; pale spatter above it and drip tails below it on paper.
- `.shots/verdict/glide/cover-d-band.png`: pool beside "Write to me." with cobalt rings; the body is still milky; drips under the night band.
- `.shots/verdict/en/proto_rivista_index_html-desktop-03.png` and `crops/cover-d-gutter.png`: the gutter stays paper beside the night header.
- `.shots/verdict/glide/cover-m-contents.png`, `crops/lens-m-sheet2.png`: phone lens blank and WORK gone after the reader's path (2, 4 and 6 s).
- `.shots/verdict/crops/lens-m-sheet.png`: the same lens reads WORK / LAVORI when reached straight from the top.
- `.shots/verdict/glide/cover-m-dusk.png`: phone dusk strip with no label; pale spatter at the top edge, pale tails below.
- `.shots/verdict/glide/work-d-top.png`, `work-m-top.png`: the current is four cobalt threads with no haze; the rail lens is over the capture.
- `.shots/verdict/glide/about-d-caps.png`, `about-d-caps2.png`, `about-m-caps.png`, `about-m-path.png`: beads on the rules clear of the caps; cobalt margin threads.
- `.shots/verdict/glide/contact-d-top.png`, `contact-m-top.png`: lens on "ME." bending it, rings crossing the O of "TO", empty top half.
- `.shots/verdict/crops/cons-d-sheet.png`: Consulting steps 1–4 at 1440, resolved 2 s after the glide; agents in perspective.
- `.shots/verdict/crops/obla-d-sheet.png`: Obla's five states at 1440, resolved; three session windows.
- `.shots/verdict/crops/cons-m-sheet.png`: Consulting at 390. Steps 2 and 3 are still migrating at 2 s; the copy is cut at the seam rule.
- `.shots/verdict/crops/obla-m-sheet.png`: Obla at 390, resolved at every step.
- `.shots/verdict/rm/proto_rivista_index_html-desktop-02.png`, `-03.png`: reduced motion shows "READ" once and a paper gutter.
- `.shots/verdict/crops/ng-cons-d-sheet.png`: Consulting without WebGPU is compact.
- `.shots/verdict/crops/ng-cover-m-sheet.png`: phone cover without WebGPU is intact, with the "Live figure" field.
- `.shots/verdict/glide/lens-it-d-top.png`: Italian cover at 1440; the name reads and the Italian strings are in place.
