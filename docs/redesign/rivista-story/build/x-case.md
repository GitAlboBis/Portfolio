# x-case — the case opens on its plate (lane CASE, port 5231)

- Status: DONE (run 2, 2026-11-11, after the PC restart; run 1 left only these notes and baseline captures).
- Done:
  - `parts/c-main.case.mjs`: the opener is `<section class="sc sc-left cs-sc" data-stage="case" --steps:2>`; step 1
    `.cs-hero` (text as before), step 2 `.cs-look` holding `figure.cs-pic[data-case-hero]` with the img as
    `[data-slab=SLUG][data-stage-poster]` (or `.cs-words[data-slab-words=SLUG][data-stage-poster]`) and its caption.
    renderTile untouched (work.html bytes unchanged).
  - `css/case.css`: plain flow zeroes the step chrome (layout measured identical to HEAD with ?stage=0: every box top
    and height equal); scene mode: text column min(42rem,44vw), title min(t-d1,6.4vw); step 2 is 175svh tall with its
    caption sticky at the foot (a 2-block sticky view otherwise lets go the instant step 2 arrives); phone: step 1
    starts at hdr+36svh so the plate has the top of the first screen.
  - `stage/scenes/case.js` (+ `case/etch.js`, the gallery's etch drawing): one plate + cover/shared.js `field` behind
    it + the room's mist. Arrival once per load (waits for html[data-arrive] to clear and the texture), 0.85 s from
    z −2600 turned away into focus. Step 1 pose turned −0.36 rad in the figure half; step 2 square, as large as fits
    above the caption; leaves up, nearer, soft, faded as the view lets go. blend:false (share-scaled alpha left it
    translucent). Desktop: the plate slides right / shrinks (damped) to stay off step 1's text while it turns.
    Guards: text crossing hides it; never below the opener's bottom (the chapters).
  - `fx-stage.js`: main[data-case] keeps its "mist" scene even when it holds a scene section.
  - `assemble.mjs`: case asserts (opener is scene "case", h1 in block 1, plate = the gallery step's slab, main
    [data-case] kept); 404 close = cover's close except its own engine line (asserted both ways);
    `parts/c-footer.404.html` + string `nf.engine` (EN/IT).
- Decisions: connectors searched in run 1 (21st "Perspective Tunnel Hero", Magic UI "backlight"): mechanism taken =
  arrival from depth, light gathered behind the plate; refused CSS 3D cards, glassmorphism, DOM glows.
- How to look: `python scripts/serve-static.py 5231 public`; `.shots/x-case/_scripts/cap.mjs <tag> <route> d|m y:N`.
- GPU (one reading, ?debug=1): 1440 tier A 0.41–1.2 ms; 390 0.21–0.63 ms.
- Needs elsewhere: none.
