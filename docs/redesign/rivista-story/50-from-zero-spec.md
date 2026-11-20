# From zero: the night, one swarm, plates of glass — spec 50

> Written 2026-11-10 (night) by the director. It REPLACES the look, the layout, the vocabulary and the page
> compositions of specs 10, 20 and 30, of `DESIGN.md` and of `CLAUDE.md` §1. What survives from them is listed in §0.
> Where this file is silent, decide as a designer starting from nothing, not by keeping what is there.

## 0. Alberto's words, and what they keep

«ti ho detto che avevi carta bianca su scelte totali , e hai comunque mantenuto parte dellostile e design , mettendo
le gocce di acqua!. PUOI fare meglio di cosi .fai finta che lo stai sviluppando da zero , senza conoscere niente ,
tranne le cose nuove che hai aggiunto che ti ho dtto prima che mi son piaciute»

Earlier the same day: «il tuo lavoro anche se parziale per ora mi piace»; «non voglio che sia tutta una spa , ma che
ci siano pagine diverse»; «immersivo 3d interattivo story telling , camera , luci , refrazione . make it beautiful»;
«puoi refactorizzare e cancellare quello che vuoi , cambiare tutto il design e architettura che vuoi»; «nell' hook hai
anche tutti gli mcp , come 21.st». His "prompt base" (examples to beat, not to copy): a glass object floating over big
HTML type and bending it, turning with the cursor with inertia; scrollytelling where a 3D object turns, comes apart
and approaches while HTML text enters and leaves; image planes that answer the pointer; GPU particles; render only
what is visible.

**Kept, because he liked it:** the swarm (GPU particles: light on the night ground, ink on a white ground, depth of
field, rest 5 s after the last input); the night ground and its tokens; the scenes of Consulting and Obla (a living
figure in step with short entries) with the figures gen, cut, code, agents and Obla's character; separate pages with a
cut between them; the build (one set of partials, strings in two languages, the two gates) and the facts of
`PRODUCT.md`.

**Gone:** "la rivista bianca" in every trait: cream paper as the site's ground, Cormorant Garamond and Figtree, the
hairline magazine layout and its staircase titles, "Fig. NN" captions, the magazine's words (issue, in print,
colophon, plate, In this issue, Read), the old sections as laid out (rail, ledgers, capability rows, timeline, band,
back cover), the line-mask rise as the signature verb, chapter numbers 01–08. And every glass body that reads as
liquid: the body over the name, the drop, the row lens, the rail lens, the beads, the pool, the settle lens, the drips
of the fall. **Nothing on the site may read as water: no drop, bead, pool, drip, ripple or wet edge, in glass, in
light or in ink.**

## 1. Direction contract

- **THESIS.** A dark room, one swarm of light, plates of glass. The site is a night studio seen through a camera the
  reader moves. Its only light is one swarm of points with a memory: the same points become every figure the story
  needs. Its only objects are thick plates of clear glass with straight edges: they hold the real work inside them and
  bend the light and the type behind them. Every page ends at a straight edge where the night becomes morning: a white
  ground, the same points as ink, and the address to write to. Refused: a page with effects laid over it; organic
  blobs and anything liquid; the anonymous particle galaxy; glassmorphism (frosted panels, blur as UI chrome).
- **OWN-WORLD.** A near-black blue ground; warm white type in one condensed grotesk family, set like film titles;
  light that is cobalt where it is thin and white where it gathers; clear, heavy, cut glass with soft-box reflections,
  a thin spectral split at its bevels, and edges that light up when the swarm passes behind. With all content removed:
  black, a field of points in depth, and standing plates of glass catching two soft lights.
- **STORY.** Cover: who he is, where he is now, where to go. Work: nine plates, then what was measured. About: the
  stack he covers, layer by layer, then the path. Consulting: four ways to work with him. Obla: the agent that works
  at night. Every page closes at dawn: write to him.
- **FIRST VIEWPORT** (cover, 1440×900). Night. ALBERTO TUVERI on one line across the measure, in the display face, as
  the page's `h1`. Right of centre a plate of clear glass, taller than the name, about 0.22 of the viewport wide,
  turned some 25° about its vertical axis, floats in front of the name's last letters and bends them; the swarm drifts
  deep behind it, seen through the plate and around it. Under the name, left: the role line and the sentence; right:
  the filled button "Write to me" and two quiet links. Bottom right, small: "{n} points · {ms} ms GPU". The pointer
  swings the two soft lights across the glass and turns the plate a few degrees, with inertia.
- **FORM.** Scroll-driven scenes on separate pages: a scene is a full-viewport sticky view that the stage fills, with
  real HTML text stepping beside it. User-pinned direction (his words above): no concept roll. Code-led.
- **FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict,
  DESIGN.md, and every shipping raster carrying its provenance.

## 2. Tokens and type

| token | value | use |
|---|---|---|
| `--night` | `#0c0e14` | the ground of every page but Contact |
| `--night-2` | `#12151d` | the sheets of the cuts, the menu, the header when solid |
| `--ink` | `#f4f1ea` | display type, values |
| `--body` | `#cfcabf` | running text |
| `--mute` | `#9a958a` | labels, meta |
| `--line` | `#262a36` | rules |
| `--accent` | `#8fa2ff` | indices, marks, hovered links, focus |
| `--cobalt` | `#2340c9` | the filled button; the ink at dawn |
| `--dawn` | `#f3f4f6` | the dawn ground |
| `--dawn-ink` · `--dawn-body` · `--dawn-line` | `#0c0e14` · `#3a3f4b` · `#d6d9e0` | type and rules at dawn |

Compute the contrast of every text pair and write it in the notes; body text holds AA on both grounds.

**One superfamily, Sofia Sans** (Google Fonts, variable weight; check the served CSS first). Display: Sofia Sans Extra
Condensed 800, uppercase, line-height 0.86, tracking 0. Text: Sofia Sans 400 and 500. Labels: Sofia Sans Condensed
600, uppercase, tracking 0.12em. Scale: `mega` (the name) `clamp(5rem, 18.5vw, 21rem)`; `d1`
`clamp(3.5rem, 9vw, 9.5rem)`; `d2` `clamp(2.2rem, 4.4vw, 4.5rem)`; lead `clamp(1.2rem, 1.55vw, 1.55rem)`; body
`1.125rem / 1.55`; label `0.8125rem`. Tabular figures for every number. If the family cannot be served, the fallback
is Barlow with Barlow Condensed in the same roles, recorded in the notes. No serif, no mono, no second family.
Corners are square. No CSS shadow, glow, gradient or backdrop blur anywhere: every glow is the canvas's.

## 3. The scene grammar (DOM)

```
<section class="sc" data-stage="NAME">            one scene; its height is (steps + 1) × 100svh when it steps
  <div class="sc-view" data-stage-anchor="NAME" aria-hidden="true"></div>   sticky, 100svh, empty: the stage draws here
  <div class="sc-track">
    <div class="sc-step" data-stage-step="1"> … real text … </div>          one screen of scroll per step
  </div>
</section>
```

- The view is never boxed: no border, no frame, no caption inside it. Text sits in one half (desktop: a column of at
  most 34rem on the side the scene names; phone: the lower 45 % of the screen), the figure in the other. Dense light
  belongs to the figure's half; over text the swarm is mist (under about 10 % coverage).
- `data-stage-cue="ID"` on a link or row: while it is hovered, focused, or (on touch) the row nearest the middle of
  the screen, the scene receives `cue = ID`.
- `data-refract` on display type that glass may bend (the host rasterises it for the stage).
- `[data-dawn]` on the closing section of every page; `html[data-ground="night"|"dawn"]` written by the build.
- `[data-stage-instr]` for the instrument line; `html.stage-on` while the stage draws; `[data-stage-poster]` for
  anything shown only without the stage.
- Without the stage (reduced motion, no WebGPU, no script, print) a scene is plain flow: its text blocks in order,
  with their real images as `<img>` (the nine works' captures are always in the DOM; the stage reads them as textures).

## 4. Pages and scenes

Header on every page: the name as a label at left; Work, About, Consulting, Obla, Contact and EN / IT at right; no
ground until the reader scrolls, then `--night-2`. Chapter indices where useful: 01 Work, 02 About, 03 Consulting,
04 Obla, 05 Contact. Words to use: Open (not Read), Index (not In this issue), Case (not plate).

| page | scene `data-stage` | text | what the stage does |
|---|---|---|---|
| Cover `index.html` | `hero` | the name (`h1`), role line, sentence, button, two links, instrument line | §1 FIRST VIEWPORT. On leaving, the plate turns to face the reader |
| | `now` (1 step) | "Now at SerSan": label with the date, title, lead, body, link | the same plate now holds the real sersan.io capture inside the glass; the swarm lights its edges |
| | `index` | four large rows, each a link with one sentence and "Open": Work, About, Consulting, Obla | the swarm becomes the emblem of the row under `cue`: a fan of small plates, a line with five nodes, the hub and its agents, Obla's outline. No cue: a calm field |
| Work `work.html` | `gallery` (9 steps, after a head) | head "Nine works" and the lead; per step: "01 / 09", kind, name, one line, "Open the case" | nine plates of glass on a curved line in depth; the camera travels; the plate in step is sharp and near, its neighbours soft and dim. Six hold their capture; three are clear glass with the case's own key words etched (frosted) in the display face. The pointer tilts the near plate |
| | `evidence` (3 steps) | "Measured before and after." and the lead; then the two sets of figures as rows: label, before → after | per row the swarm draws two bars of light to the exact lengths, before dim, after bright, aligned to the DOM rows |
| About `about.html` | `stack` (8 steps, after a head) | head "Capabilities" and its lead; per step: group name, tools, proof link | eight thin layers of glass, one above the other, seen from three quarters; the layer in step lifts and its edges light; the camera turns slowly with the scroll |
| | `path` (5 steps, after a head) | the title and lead; per step: when and kind, what, where | one line of light through the room with five nodes; the node in step is bright; the swarm runs along the line |
| Consulting `consulting.html` | `consult` (4 steps) | as built (spec 10 §6.1), in the new type | gen, cut, code, agents as built, unboxed, filling the figure's half |
| Obla `obla.html` | `obla` (5 steps) | as built (spec 10 §6.2), in the new type | the character and its light as built, unboxed |
| Contact `contact.html` | `contact` (dawn page) | "Write to me." at `mega` scale, one sentence, the address with its copy control, LinkedIn, GitHub | the points as cobalt ink, fine threads settling in slow arcs around the line; no glass |
| every page's close | `dawn` | "Write to me.", the address, the copy control, then the legal line and "Back to top" | at the straight edge the points that cross it stop being light and are ink; nothing pours or drips |
| nine cases | none in this round | the case template in the new system on the night ground; its capture as a plain image; "More work" list | the swarm as mist only |
| 404 | none | the new system | none |

New copy (both languages; everything else reuses existing strings, reworded only to drop the magazine's words):
Work row "Nine works, and two sets of figures measured before and after." / «Nove lavori, e due serie di numeri
misurati prima e dopo.»; verb "Open" / «Apri»; "Open the case" / «Apri il caso»; work head "Nine works" / «Nove
lavori»; index label "Index" / «Indice»; contact sentence "For a role, a project, or one of the four ways to work
together." / «Per un ruolo, un progetto o uno dei quattro modi di lavorare insieme.»; closing line "The light and the
glass are drawn live by an engine written directly against the GPU API, in WebGPU." / «La luce e il vetro sono
disegnati dal vivo da un motore scritto direttamente sull'API della GPU, in WebGPU.» No new number, no new claim.

## 5. The stage

- **The swarm** stays as built: one compute pass, soft discs with depth of field, light on night, ink on dawn decided
  per fragment, rest after 5 s, tiers, the budget.
- **Plates** replace every other glass body. A plate is a box of clear glass drawn analytically (ray against an
  oriented box: no marching): the ray bends entering the face it hits and again leaving, with a three-way spectral
  split on tier A; a bevel a few pixels wide bends the normal at the edges (that is where the split shows); Fresnel
  reflection of a studio of two soft rectangular lights that the pointer swings, plus one fixed rim; a faint cool tint
  that deepens with the path through the glass; an optional image at mid-thickness (so it shifts against the faces as
  the plate turns), or frosted etched type; edges that brighten with the light of the swarm behind them; `sharp` lets
  an out-of-focus plate go soft and dim. What a plate bends is the swarm behind it and the rasterised display type.
  No shadow blob, no caustic crescent, no ripple.
- **Camera.** One camera for swarm and plates. `camera = { yaw, pitch, dolly }` turns and pushes the view about the
  centre of the scene's view; zero is the straight view of today. Every change is damped; the pointer adds a few
  degrees; nothing moves on an idle clock outside the 5 s window.
- **Dawn.** Up to two viewport rectangles are day: inside them a point is ink (cobalt, premultiplied over), outside
  light. On the Contact page the whole viewport is day.
- **Cross-lane contract** (pinned; add fields, never rename):
  `stage.slabTexture(id, source)` (image element, bitmap or canvas);
  `stage.set({ …, camera: { yaw, pitch, dolly }, dawn: [{ x0, y0, x1, y1 }], slabs: [{ id, cx, cy, cz, yaw, pitch,
  roll, w, h, t, tex, alpha, glow, sharp }] })` with at most 12 slabs: `cx, cy` the centre in viewport CSS px, `cz`
  depth in px toward the reader (0 is the page plane), `w, h, t` in CSS px at `cz = 0`, angles in radians, `tex` a
  texture id or null, `alpha` presence, `glow` edge light, `sharp` focus, each 0–1.
- **Scenes.** For every `[data-stage="NAME"]` on a page the host imports `stage/scenes/NAME.js` (a missing module is
  skipped). A scene gets, per frame: the view's rect, `step`, `local` (0–1 inside the step), `progress` (0–1 across
  the scene), `cue`, the pointer, the scroll velocity, the tier, and how much of the viewport it holds; it answers
  with its swarm formations and weights, its slabs and its camera. The host blends scenes by how much of the viewport
  each holds. The API a scene author reads is the header of `stage/scenes/README.md`.

## 6. Motion

- The verb of this world is **focus**: text arrives by coming into focus (opacity 0 → 1, blur 10 px → 0, 0.7 s,
  ease-out; lines of a title 60 ms apart) and leaves in a third of that. Nothing slides in from a side.
- A step change is a focus pull: the leaving block softens as the arriving one sharpens; on the stage the leaving
  plate or figure goes soft as the next comes sharp.
- Page to page: a straight-edged sheet rises (`--night-2`, the destination's name in the display face), the page
  changes under it, it leaves upward. To Contact the sheet is `--dawn`: the sharp passage. The image flight between a
  tile and its case is retired.
- Hover is an immediate change of colour or a rule drawn under a word. The cursor is the native one.
- Reduced motion: no stage, no sticky stepping, no blur; every page complete and in order.

## 7. Lanes (no two lanes own the same file)

Wave 1, together:
- **SYSTEM**: the new design system and chrome. Owns `parts/*`, `assemble.mjs`, the stylesheets (write them new under
  `css/`: tokens, base, type, scene grammar, chrome, cuts, dawn, case, print, and one empty file per page:
  `page-cover.css`, `page-work.css`, `page-about.css`, `page-night.css`, `page-contact.css`; `fx.css` stays the built
  output; the five old `fx-*.css` are deleted when nothing reads them), `fx-core.js`, `fx-nav.js`, `fx-scroll.js`,
  `fx-hero.js`, `scripts/**`. At the end every page renders whole in the new system (night ground, new type, scenes
  as plain flow with their steps), gates green.
- **CORE**: the stage's engine. Owns `stage/**` except `stage/scenes/**`, `stage/day/**`, `stage/night/**`: plates
  (replacing `stage/glass/` bodies), the camera, dawn rectangles, the bench.
- **HOST**: owns `fx-stage.js`, `stage/scenes/**` (new), `stage/day/**`, `stage/night/**`: the scene loader and its
  README, the night figures moved to scenes with their look unchanged, a `dawn` scene and a `contact` scene in ink,
  every liquid figure deleted.

Wave 2, together (each owns its page partial, its page stylesheet and its scenes; all three may ADD strings to
`parts/strings.mjs` with their page's prefix, re-reading the file before each edit and never rewriting it whole):
- **COVER**: `index.html` — `hero`, `now`, `index`.
- **WORK**: `work.html` — `gallery`, `evidence`.
- **REST**: `about.html` (`stack`, `path`), `contact.html`, and Consulting and Obla in the new type, unboxed.

Wave 3: **INTEGRATE**: gates, every page in both editions at 1440×900 and 390×844, the cuts, the printed states,
cross-lane fixes, a report with captures and a commit plan in `build/z-integrate.md`.

Every lane: notes from the first minute in `docs/redesign/rivista-story/build/z-<lane>.md`; headless only; no commits;
gates `node public/proto/rivista/assemble.mjs`, `--check`, `node scripts/check-claims-proto.mjs`; look at your own
captures at both sizes before you return. Before hand-writing a component or an effect, search the connectors
(21st.dev `search`, Magic UI, ui-layouts, OriginKit, Vengeance UI) and note in one line what you take as a mechanism.
