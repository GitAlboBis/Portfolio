# Scenes — what a scene author needs (spec 50 §3, §5; plan 70)

> Brought up to the code of 17 November 2026 (wave 5) by its DOCS lane; corrected in place for wave 6 (20 November)
> and wave 7 (21 November: the home as one page of every page's scenes, the neural cosmos where the wall was, the
> looks mixed by weight). The engine's own reference is the header of `stage/stage.js`; the host's is the header of
> `fx-stage.js`. Where this page and the code disagree, the code wins.

A scene is one module, `stage/scenes/NAME.js`, for every `<section data-stage="NAME">` on a page (a case page's
`main[data-case]` is given the `mist` scene). The host (`fx-stage.js`) imports it when the page has that section (a
missing or failing module is skipped), registers its formations with the stage, calls `frame(ctx)` every frame while
the section is near the viewport, blends the answers of every scene on screen by how much of the viewport each holds,
and sends one `stage.set` per frame. Today: `hero`, `now`, `gallery`, `evidence`, `stack`, `path`, `consult`,
`obla`, `contact`, `dawn`, `mist`, `case` (wave 7: the index left the home with its scene, `index.js`). The home holds
the scenes of every page but the cases in one document (hero, now, gallery, evidence, stack, path, consult, obla,
contact): the host registers a scene's formations ahead of the reader (`AHEAD` in `fx-stage.js`: 1.5 screens up, 3
down; on a cold load only the scenes near the reader are imported before the first frame, the others after it in page
order, one formation a task), mixes the scenes' looks by weight (a key a scene does not ask for counts at the stage's
`LOOK`), and contact draws the edge of day there. A scene runs its `frame` only once its formations are in. Every
scene of a page keeps its own shot in the home: each part hands the frame to the next by weight, the cosmos
travelling between them.

Where things live: helpers in `stage/scenes/lib/` (never a scene name: `room.js`, `camera.js`, `page.js`, `prism.js`,
`portal.js`, `raster.js`); the cover's world in `scenes/cover/`; a case's plate, glow and chapter figures in
`scenes/case/`; light figures and the shot helpers (`shot.js`) in `stage/night/`; ink figures in `stage/day/`; the
room's engine in `stage/field/`; Gaussian splatting in `stage/splat/`; the glass in `stage/plates/`.

## The module

```js
export default {
  formations: { id: formationDef, … },  // registered once as "NAME:id" (the stage's formation API: stage/stage.js header)
  blend: true,                         // false: the host does not scale your weights by your share (you weigh yourself);
                                       // true (a night scene): the host also lets your light go as the morning's
                                       // edge rises past the middle of the screen
  glassEntry: false,                   // true: you bring your plates in on ctx.glass (below); the host adds no pull
  yields: false,                       // true: your plates step back from every OTHER scene's text on screen
  litSignal: false,                    // true: the page's fx:stage:lit waits until your frame returns lit: true
  async init({ tier, phone, etch, texture }) {},   // optional, once after registration
  prepare({ vw, vh, phone, tier }) {},             // optional: work before your first frame on an arrival by a flight
                                                   // (may return a promise; the room waits for it at most 0.4 s)
  frame(ctx) { return { swarm, slabs, camera, keepouts, focus, rest, bloom, field, passes, subject, lit }; },   // null for nothing
};
```

## ctx (every rect is VIEWPORT css px: { x, y, w, h })

| field | what |
|---|---|
| `name` | the scene's name |
| `view` | the sticky `[data-stage-anchor]` (100svh) inside the section, else the section |
| `fig` | the figure's half of the view: opposite the text column; on a phone (text across) the top 55 %. `data-stage-side="left\|right\|top\|full"` on the section overrides |
| `side` | which side the figure took |
| `section` | the section's rect (its `y` is where it starts relative to the viewport's top) |
| `step`, `steps`, `local` | the step under the reading line (1-based; 0 without steps), how many, 0–1 inside it |
| `progress` | 0–1 through the scene (while its view is stuck; else from entry to exit) |
| `through` | 0 when the section's top enters at the bottom, 1 when its bottom leaves at the top |
| `cue` | the `data-stage-cue` id hovered, focused, or (touch) nearest the middle of the screen; else `null` |
| `pointer` | `{ x, y, present, down, nx, ny }`; `nx, ny` −1..1 across the viewport |
| `scrollVelocity`, `scrollY` | px/s (positive down), document px |
| `vw`, `vh`, `phone`, `tier`, `inkK` | viewport, `vw < 760`, "A"/"B"/"C", ink factor for the tier's count (A 1, B 2, C 4) |
| `share`, `weight` | the scene's share of the viewport (0–1) and its smoothed blend weight |
| `marks` | `{ ID: rect }` of every `[data-stage-mark="ID"]` in the section (their glyph box) |
| `imgs` | `{ ID: { tex, w, h, aspect, rect, el } }` of every `<img data-slab="ID">`; `tex` is the texture id once decoded, else `null` |
| `texts` | the section's text blocks on screen: `[{ tag, x, y, w, h }]` (glyph boxes): keep-outs, the display line |
| `media` | the section's pictures on screen (`img`, `picture`, `video`, `canvas` outside the view): rects, for keep-outs |
| `dawn` | the day rectangles on screen (inside them a point is ink) |
| `ground` | `"night"` or `"dawn"` (the Contact page) |
| `time`, `dt`, `state` | host seconds, frame seconds, a scratch object kept for the scene |
| `clock` | `{ time, activity, awake }`: the stage's simulated seconds (they stop when it rests) and its activity 0–1. Drive an idle drift with `clock.time`, never with `time`, or the stage never sleeps |
| `glass` | `{ ready, age, late }`: whether plates can draw yet, seconds since they could (0 until then), and whether the stage drew before they could (see "The glass signal") |
| `etch(id, lines, o)` | etched words (display face, uppercase; `o.w`, `o.h` the canvas in css px: the plate's aspect) as a slab texture for a slab's `etch`; returns its id once drawn, else `null` (ask again next frame) |
| `texture(id, source)` | a canvas or bitmap of your own as a slab texture; returns its id |
| `look(partial)` | your ask of the stage's LOOK (e.g. `{ far, near }`: the sim clamps every point's z to far..near, −700..450 by default; the cover's hall asks −2.6 D..4.7 D; `keepFeather`). Since wave 7 an ask, not an order: every frame the host mixes the asks of the scenes in the frame by their weight, and a key a scene does not ask for counts at LOOK's value (`fx-stage.js` `lookOf`; `keepFeather` always, any other key, `far` and `near` included, once a scene of the page asks for it: the hero and Now do, so the home's parts hand their looks over as their scenes hand over the frame; a page whose scenes never ask for a depth range keeps the one it was flown in with, LOOK's on a load). Sent to the stage only when it changes, kept across a rebuilt stage. Ask every frame you are on screen, from the scenes whose look it is (Now asks the hero's) |
| `speed` | 0..1 the reader's speed (the scroll velocity over 2600 px/s, up in 0.12 s, down in 0.7 s, exactly 0 at rest) |
| `aim` | `{ x, y, touch }`: the hand's orbit input, −1..1: the pointer on a desktop, a horizontal drag on a touch screen |
| `textRects(o)` | the scene's text now, viewport px, at its final layout box (see "The room"): what to keep clear |
| `arrival` | `{ cut, under, age }`: reached by a cut, a sheet still over the page, s since the stage's first frame on this page (see "The arrival") |
| `flight` | 0 (the room) … 1 (the eye inside the glass): the progress of the cut's portal (see "The cut, as a scene sees it") |

## The answer

- `swarm: [{ id, weight, rect?, scene?, progress? }]` — `id` one of your formations; `weight` 0–1; `rect` viewport px
  (default `fig`); `scene` `{ step, local, progress }` (default the ctx's) reaches the formation's `update(c).scene`.
  The stage draws the four heaviest formations of the page; the host damps every weight (0.22 s).
- `slabs: [{ id, cx, cy, cz, yaw, pitch, roll, w, h, t, tex, alpha, glow, sharp, etch?, inset?, bevel?, ior?,
  dispersion?, tint?, sheen?, edge?, shape? }]` — at most 12 on the page (`MAX_SLABS`; the door of a flight, when
  the stage adds it, takes one): centre in viewport px, `cz` px toward the reader (0 = the page plane), `w h t` px at
  `cz = 0`, angles in radians, `tex` an image id from `imgs` (or null: clear glass), `etch` an id
  from `ctx.etch` (its alpha is frosted into the glass: make the canvas the plate's aspect), `alpha` presence, `glow`
  edge light (default 0.5), `sharp` focus, each 0–1; the rest as the stage's header says. While a slab shows, the host
  rasterises the `[data-refract]` type near the viewport for the plates to bend.
- `camera: { yaw, pitch, dolly, pointer? }` — the orbiting camera: blended by weight across scenes; the stage damps it
  and adds a few degrees from the pointer (`pointer` scales them, default 1; 0 for figures that must stay registered
  to DOM rows).
- `camera: { pos, target, roll, lens, focus, aperture, near, nearFull, fog, bokeh, damp, orbit, parallax, snap }` —
  the FREE camera (a world seen by a moving camera; full reference in `stage/stage.js`, "THE FREE CAMERA"). Units: x, y
  viewport css px, z px toward the reader (page plane z = 0); angles radians; `focus`, `near`, `nearFull`, `fog`
  distances from the eye in px; `lens` a multiple of the default focal length D (≈ 1.25 × the viewport's diagonal,
  1100–2600: 2122 px at 1440 × 900, 1162 px at 390 × 844); `aperture` a multiple of the default blur; `damp` s (0 = the
  pose is exact every frame: a scripted move). The straight view is `pos [vw/2, vh/2, D]`, `target [vw/2, vh/2, 0]`.
  When one scene on screen returns a free camera the host turns every other scene's camera into a free pose and mixes
  the poses by weight (no host smoothing: keep `damp: 0` for a path and the move is exact). Points and plates nearer
  than `nearFull` fade, nothing draws nearer than `near`, past `fog[1]` the hall is night. `orbit: { yaw, pitch, damp,
  pivot }` turns the camera about the pivot with the pointer (rad at the viewport's edge).
- `rest` — seconds the stage keeps moving after the last input (default 5; a slow idle drift wants about 14).
- `bloom` — light that glows: a strength (0.5–1.2 reads as glow; 0 or absent = none, nothing runs) or
  `{ strength, threshold, knee, plates }`. Blended by weight; the dawn never glows.
- `keepouts: [rect]` — no ink inside them (with the page's `[data-stage-keepout]`, 16 in all).
- `focus` — the depth in sharp focus (px; 0 = the page plane).
- `field: { lights, chips, cosmos }` — THE FIELD (round 11): shafts of light, chips of cut glass in the air, and (wave
  7) the neural cosmos where the back wall was. Opt-in: absent, nothing of it runs. See "The field" below.
- `passes: { id: cfg }` — switches an extra pass on (see "An extra pass"): today `rays` and `splat`.
- `subject: { x, y }` — viewport px: where the cut's push aims (the leading scene's; default the figure's centre).
- `lit: true` — with `litSignal: true` in the module: the subject is lit now (the cover says it when the name stands);
  the host then sends `fx:stage:lit` and writes `html.stage-lit` (without a `litSignal` scene: at the first frame).

A slab with `shape: "prism"` (and `inset: -1`, which carries the shape through the host) is **a prism**: a triangular
prism of cut glass inscribed in the plate's box, traced with two refractions and one internal reflection
(`stage/plates/plates.js` `isPrismSlab`). Since wave 6 a prism can carry **a beam inside its glass**, drawn between two
points of its outline (`PRISM_BEAM` `u0` where the light enters, `u1` where it leaves; `prismOutline(u, hx, hz)` gives
the point in the prism's own space, so a scene aims its shaft at `u0` and starts its ray at `u1`): its light rides
`inset` below −1, as `inset: -(1 + k)` (k the beam's light, read up to 2; `-1` alone is a prism with no beam). One
prism exists since wave 7 (the index's, with its beam, left with the index): More work's in a case
(`case/figures.js`, `inset: -1`, no beam: its shaft, the light inside it and its ray are drawn by the `rays` pass).

## A camera path (the free camera, `lib/camera.js`)

```js
// a hall: the camera arrives from deep and high, settles in front of the word, then flies through it on scroll
import { cameraPath, drift } from "./lib/camera.js";

export default {
  formations: { /* the word, the beams, the dust */ },
  frame(c) {
    const cx = c.vw / 2, cy = c.vh / 2;
    const s = c.state, D = Math.min(2600, Math.max(1100, 1.25 * Math.hypot(c.vw, c.vh)));
    if (s.t0 == null) s.t0 = c.time;
    const arrive = Math.min(1, (c.time - s.t0) / 3.2);              // the opening move, 3.2 s
    const k = 0.5 * arrive * arrive * (3 - 2 * arrive) + 0.5 * c.progress;   // then the scroll
    const path = cameraPath([
      { at: 0, pos: [cx + 300, cy + 420, D * 1.7], target: [cx, cy, -500], roll: -0.05, focus: D * 1.9, aperture: 1.6 },
      { at: 0.5, pos: [cx, cy - 30, D], target: [cx, cy, 0], roll: 0, aperture: 1 },   // focus: the target (rack focus)
      { at: 0.85, pos: [cx - 40, cy, 380], target: [cx, cy, -1600], focus: 650 },         // through the name
      { at: 1, pos: [cx + 60, cy, -1500], target: [cx + 80, cy, -2800], focus: 1200 },     // toward the lit plate
    ]);
    const pose = path(k), d = drift(c.clock.time, 12);
    pose.pos = pose.pos.map((v, i) => v + d[i]);
    return {
      camera: { ...pose, damp: 0, orbit: { yaw: 0.1, pitch: 0.06 }, fog: [D * 1.3, D * 2.6] },
      rest: 14, bloom: 0.8,
    };
  },
};
```

Shoot on `stage/dev.html?view=fly` first: the bench's test world with this kind of path (`p=0..1` holds it, live it
loops every `period` s).

## The field (shafts, chips, the cosmos: `stage/field/`, `stage/cosmos/`)

Stateless and drawn by the stage (`stage/field/field.js`, `field.wgsl.js`, `atlas.js`): nothing is simulated, so a
field costs nothing until a scene returns one, and it stands still when the stage rests. Every position is in the free
camera's space (x, y viewport css px at the current scroll, z px toward the reader, the page plane z = 0), the space
of `camera.pos`; it works with the orbiting camera too. The host blends two scenes' fields by their weights (lights
pooled, the four strongest kept, each one's `strength` times its scene's weight; chips and cosmos: numbers mixed by
weight, their presence the sum of the weights, shapes from the heavier). Its pipelines compile at boot after the
swarm's (never before the first frame); the field enters in 0.7 s once they are in, the chips once their shapes are rasterised. A failure leaves the stage drawing without it
(`stage.whenField` resolves false; `?failfield=1` forces it). Nothing of it draws in the dawn or over a keep-out.

- `lights: [{ pos, target | dir, radius, aspect, roll, spread, soft, strength, tint, length, haze, wall, chips }]` — up
  to 4 shafts. `pos` the origin, `target` a point it aims at (or `dir`); `radius` the half height of its section (px,
  default 110) and `aspect` its width / height (default 1.8: a blade with straight sides, the light of a tall window;
  0 = a round section, avoid: it reads as a spotlight disc), `roll` turns the blade about the axis (rad); `spread` the
  half angle the shaft opens by (rad, default 0.04), `soft` the soft fraction of its edge (0.02–1, default 0.55),
  `strength` (default 1), `tint` 0 paper-white … 1 the night's cobalt light (default 0.15), `length` px (default
  6000), `haze` its own light in the air (0 none, 0.03–0.08 a shaft through dust; it fades when the eye is inside or
  within ~500 px of it, so the night never turns grey), `chips` how much it lights the chips (default 1; `wall` is still
  read, but since wave 7 there is no wall and the cosmos takes no light: a light is a key light the glass catches).
  (wave 2, FIX) `across: [x, y, z]` the section's width axis (made normal to the direction; it replaces `roll`): the
  default axis flips when a shaft leans past ~18°, turning a leaning blade edge-on; `across: [0, 0, 1]` holds the
  blade's width toward the reader, so a slanted shaft keeps its body (the room's glow blades use it). The chips' atlas
  is cut as soon as the field exists.
- `chips: { count, center, size, wind, spin, sizes, shapes, body, edge, glint, shininess, transmit, bevel, edgeFade,
  near, cap, seed, mask, alpha }` — `count` at tier A (≤ 16000; B draws half, C a quarter), spread through the box
  `center` ± `size`/2 (px; defaults [720, 450, −900], [2600, 1600, 2400]); `wind` px/s (they wrap inside the box,
  faded near its faces), `spin` rad/s; `sizes` [min, max] css px at z = 0 (default [7, 22]); `shapes` up to 4 of
  `{ shape: "A" | "mark" | "own" | "facet", weight, depth, width, scale }`: `depth` 0 the box's back … 1 its front,
  `width` the spread of that depth (0 = everywhere), `scale` its size against `sizes` (the mark reads from about
  1.6). `body` / `edge` the unlit cobalt (defaults 0.03 / 0.05: almost invisible), `glint` / `shininess` the flash
  of a face turning through a light (2.2 / 80), `transmit` the glow inside a light (0.3), `bevel` the cut edge (cell
  px, 7). `near` css px: a chip bigger on screen fades (160); `cap` the blur past which one fades (0 = the camera's
  bokeh cap). `mask`: a canvas or bitmap whose alpha is the `own` shape. `alpha` presence 0–1.
- `cosmos: { z, alpha, gain, stars, white, far, dof, keep, thread, cap }` — (wave 7, COSMOS) THE NEURAL COSMOS where
  the ruled wall was (the grid is gone from every room): the large-scale structure of the universe, one web seeded once
  for the whole site (`stage/cosmos/web.js`: nodes, the filaments between them, galaxies strung along them, a faint
  field of distant stars), drawn before the swarm so the plates bend it, with the stage's depth of field; only the
  dense nodes' cores pass the glow's threshold. Every page is a place in it (`journeyOf` / `placeOf`, from the host's
  `stage.set({ cosmos: { key, slug, max, parts, y, vh } })`): a page's scroll travels through its place, the home's
  scroll is one journey through every page's, and a flight shows it inside the door. While the stage is awake an
  impulse of light now and then runs a filament from node to node (the stage's clock: it stops at rest; none in a
  flight). It stops at the straight edge of day. An old `wall` is read as the cosmos at its depth (`wallAsCosmos`).
  The fields (defaults in `field.js` `FIELD_DEF.cosmos`): `z` the room's back plane in px (only what lies behind it
  draws; default −1200, the room kit sends −0.6 D), `alpha` its presence (1), `gain` its light (2.6), `stars` the far
  stars' own (0.16), `white` the thin light's share of paper white (0.32; the rest is cobalt, denser light goes white),
  `far` the fog's end in D (7), `dof` the depth of field's factor of the stage's aperture (0.012: deep focus), `keep`
  the dim round the kept text `{ floor, fall, haze }` (0.04, 140 px, 0.12; the floor never above 0.08), `thread` the
  filaments' light `[core gain, halo gain, core width, halo width]` and `cap` `[a galaxy's ceiling, a node core's
  ceiling, a core's reach, its size]` (only the node cores pass the glow's threshold). The web itself is not a
  scene's to change: one seed, the same everywhere (`stage/cosmos/web.js`; `field.stats().cosmos` for a probe).

```js
// a hall with the field: one key light sweeping the room on the clock, A's near, SerSan marks deep, the cosmos behind
frame(c) {
  const cx = c.vw / 2, cy = c.vh / 2, ph = Math.sin(c.clock.time * 0.7);
  return {
    camera: { pos: [cx, cy, 2100], target: [cx, cy, -1200], damp: 0, fog: [3600, 6400] },
    bloom: 0.7,
    field: {
      lights: [
        { pos: [cx - 1700, cy - 520, 700], target: [cx - 300 + 1400 * ph, cy + 150, -2700],
          radius: 230, aspect: 1.5, roll: 0.25, soft: 0.6, tint: 0.1, haze: 0, wall: 0 },
      ],
      chips: { count: 3000, center: [cx, cy, -1150], size: [c.vw * 2.4 + 1400, c.vh * 2.4 + 900, 3000],
        wind: [9, -4, 14], spin: 0.5, sizes: [9, 28], floor: c.phone ? 12 : 16,
        shapes: [{ shape: "A", depth: 0.78, width: 0.24 }, { shape: "mark", depth: 0.22, width: 0.24, scale: 1.7 }] },
      cosmos: { z: -2700 },
    },
  };
}
```

Shoot on `stage/dev.html?view=field` (options in the file's head comment: `p=`, `sweep=`, `only=chips|wall` (`wall`:
the cosmos, since wave 7), `lights=`, `haze=`, `n2=`, `field=0`, `failfield=1`, `t=` to freeze, `tier=`).

## The room (the cover's lit hall for any scene: `lib/room.js`)

One call puts a scene in the cover's room: the cosmos behind it (wave 7; the back wall's grid is gone), chips cut as the
A and the SerSan mark at every depth with their edge light (under `floor` css px on screen a chip fades: no specks), two
blades of light that travel across the room on the stage's clock (key lights for the chips since wave 7),
the hand's blade where the pointer aims (desktop, with weight), an optional light that follows a subject (a plate, a
figure: it lights the chips near it), and the scene's text kept clear. The cover keeps its own code
(`cover/world.js` hallField); the room is the same studio, generalised. Nothing in it reads the DOM.

`room(c, o) -> { field, keepouts, look }`. Options (all optional):

- `temp` 0 cool (toward cobalt) … 1 warm (paper white): the blades', the subject's and the chips' edge light (default
  0.3). A page runs cool at the top and warms toward its dawn: pass its progress (`pageK(c)` of `lib/page.js` is the
  whole page's, so in the home it runs over the whole journey).
- `dim` 0 … 1: the light and the chips go down (1: the cosmos at half its light, no blades). `alpha` the whole room's
  presence (1).
- `wall: { z, size, alpha }`: the room's back plane (default −0.6 D behind the page plane, D = `eyeD(vw, vh)`): since
  wave 7 the cosmos starts behind it; `size` the chips' box (1); `alpha` the cosmos's presence (a quieter room asks a
  quieter night: 0.4 + 0.6 alpha).
- `chips` tier A's count: since wave 7 a scene's own number is taken at about a quarter (× 0.26) and the default is
  1,200 on a desktop, 800 on a phone (in the void the glass is a few shapes at depth, not confetti over the cosmos;
  0 none; the kit thins B to 80 % and C to 60 % before the field halves and quarters them); a chip under `floor` css px
  on screen fades (16, 12 on a phone: a speck reads as a ring); `depth` 0..1 how far they reach from the back plane
  toward the eye (1), `scale` (1).
- `blades` 0–2 (2), `period` s (30), `hand` (true). Since wave 7 the blades, the hand's light and the subject's light
  have no haze (key lights the glass catches); `haze` (0.13 desktop, 0.09 phone; tier B 70 %, C none) now feeds only
  an aimed shaft (`aim`).
- `subject: { x, y, z, w, h }` the CENTRE (viewport px), depth and size of a plate or a figure: its light follows it 0.35 s behind.
- `keep` the rectangles to keep clear (default `c.textRects({ pad: 14 })`), `pad`, `header` (true).
- `clear: { rect, point }` the field's clear rectangle (chips nearer than `point` stay out of `rect`). (wave 2, FIX)
  `night/shot.js` `clearOf(c, pose, P, w, h, pad)` builds it for a subject at world point P seen from a pose (every chip
  in its box: a figure of points draws before the chips with no depth between them, so a chip behind Obla still drew
  across its face); `project(c, pose, P)` is the screen point under that pose. Obla and the path's pane in step use it.
- `glow` 0 … 1 (wave 2; default 0): the room as lit as the cover's hall: the blades come down from high above,
  brighter, their travel kept inside the frame; more chips, the middle population larger and rimmed as the cover's;
  since wave 7 the cosmos a little brighter, the blades lighting only the glass.
- **Light never draws a figure** (wave 3, LIGHT3): two blades leaning opposite ways crossed behind every page as a
  large grey X. Every blade now leans the same way as the cover's shaft, the slant set per page by `seed`.
- `aim: { at, from?, radius?, strength?, tint?, aspect?, haze?, over? }` (wave 4, PRISM): the room's ONE shaft comes
  down onto a subject at `at` and ends in it, with its haze; the second blade stays dark. The index aimed it at its
  prism until wave 7, when the index left the home; More work's prism draws its shaft as a ray of the `rays` pass.
- The hand's blade and the subject's light step aside while the cut's portal closes on the eye (`c.flight`).
- `center` [x, y] (the viewport's centre), `eye` [x, y, z] (the straight view's eye, [vw/2, vh/2, D]), `seed` per
  page (the chips' scatter and the blades' phase), `fade` s (0.25), `off`.

What the host gives every scene for it (fx-stage.js):

- `c.textRects({ pad, header, display, max })` — the scene's text now, viewport px: its text blocks at their FINAL
  layout box (a word under its rise mask, a row on its way in, an Anime.js or WAAPI move: every axis-aligned transform
  from the block down is undone at measure time), its `[data-refract]` titles, its controls, and the header's words
  while the header is in; padded, merged to at most `max` (10). No layout read per frame.
- `c.speed` 0..1 the reader's speed (|scroll velocity| / 2600 px/s, up in 0.12 s, down in 0.7 s, exactly 0 at rest),
  and `speedLens(lens, c.speed)` in `lib/camera.js`: at most 6 % wider, eased, no pumping.
- `c.aim { x, y, touch }` the hand's orbit input −1..1: the pointer on a desktop, a horizontal drag on a touch screen.
  On a touch screen the host turns that drag into the orbit the scene's camera declares (`orbit`), released with the
  same damping; the body gets `touch-action: pan-y pinch-zoom` while the stage draws, so the vertical scroll and pinch
  zoom stay the browser's. Nothing in the DOM follows the finger.

```js
// a page scene in the room: one continuous shot down the page, cool at the top, warm toward the dawn
import { room, eyeD } from "./lib/room.js";
import { cameraPath, speedLens } from "./lib/camera.js";

export default {
  formations: { /* the scene's own figures */ },
  frame(c) {
    const D = eyeD(c.vw, c.vh), cx = c.vw / 2, cy = c.vh / 2;
    const path = cameraPath([
      { at: 0, pos: [cx - 120, cy + 60, 1.05 * D], target: [cx, cy, -0.2 * D] },
      { at: 1, pos: [cx + 160, cy - 40, 0.9 * D], target: [cx + 40, cy, -0.3 * D] },
    ]);
    const pose = path(c.progress);
    const r = c.imgs.w1 && c.imgs.w1.rect;                      // a plate's DOM place (top-left, size)
    const R = room(c, { temp: 0.2 + 0.6 * c.progress, seed: 4, subject: r ? { x: r.x + r.w / 2, y: r.y + r.h / 2, z: 0, w: r.w, h: r.h } : null });
    if (c.look) c.look({ ...R.look });                         // 40 px of soft fall round the kept-clear text
    return {
      camera: { ...pose, lens: speedLens(pose.lens, c.speed), damp: 0, orbit: { yaw: 0.12, pitch: 0.06, damp: 1.1 }, fog: [3 * D, 7 * D] },
      bloom: { strength: 0.45, threshold: 0.5, knee: 0.3, plates: 0.1 },
      field: R.field, keepouts: R.keepouts, rest: 14,
    };
  },
};
```

What a scene still does itself: its camera path (one continuous shot: pose by progress, never a cut), its bloom (the
cosmos's node cores are the only light of the room over the glow's threshold), its own keep-outs beyond the text (a
figure's place), and one `c.look` call a frame that includes `R.look` (the look is mixed by weight across the scenes
in the frame: a scene that sets `far`/`near` puts `keepFeather` in the same call).
Two scenes in a crossfade pool their lights (the four strongest are kept): give the scenes of one page the same `seed`
so their blades coincide. Cost: the wave 1 bench measured the room with its wall at 0.42 ms at 1440×900 DPR 2 tier A,
0.32 at 1920×1080 DPR 1, 0.07 on a phone (tier B); since wave 7 the cosmos costs less than the wall did on every page
measured (`build/l-cosmos.md`), on top of the scene's swarm and plates.

(wave 1, WORK) Two more options: `subject.strength` (default 0.42; a capture on a plate wants about 0.26) and `sweep:
[lo, hi]` in −1 (the room's left) … 1 (its right): where the two blades and the hand's blade may fall (default the
whole width; a page with its text in the left half passes `[0.05, 1]`, or a blade cut by the text's keep-out reads as
a dark card). A scene with `blend: false` weighs itself, so
the host pools its field at full weight: pass `alpha` (its own presence) or its blades light the next scene.

ONE SHOT PER PAGE (`lib/page.js`): `span(c, sel)` a section's place in the document, `pageK(c)` 0..1 down the page,
`through(c, span)` how far the reader is through a section while it holds the screen (layout read every 1.5 s, never
per frame). Every scene of a page asks one function of the scroll for the eye (`gallery.js` `workEye`, `case.js`
`caseEye`), so the host mixes equal poses and the eye never jumps; a scene composes its plates in screen px as the
straight view would see them and places them for that eye (a pure translation: they draw where composed while the
room moves behind them). In the home every part keeps its page's shot (an eye follows its own sections' spans, `span` /
`through`, wherever they stand; `pageK`, the temperature, runs over the home's whole scroll), and the host mixes the
parts' poses by weight where two meet.

Shoot on `stage/dev.html?view=room` (`sweep=`, `temp=`, `dim=`, `n2=`, `seed=`, `speed=`, `keep=0`, `field=0`, `t=`).

## An extra pass (a drawn layer of your own: `registerPass` in `stage/stage.js`)

A module outside the engine adds a pass every stage of the page draws, with the stage's device, camera, fog and clock,
into the same target as the swarm (the bloom reads it). Opt-in twice: the module registers it, and a scene switches it
on from its answer with `passes: { <id>: cfg }` (the host sends the heaviest scene's `cfg` plus `weight`, the scenes'
blend 0–1). With nothing registered, or nothing asked, the frame is exactly what it was.

```js
import { registerPass } from "../stage.js";            // the same URL the host imports (no query string)
registerPass({
  id: "splat", layer: "under",                          // "under": after the field's cosmos, before the swarm; "over": after it
  async init(api) {                                     // { device, format, frameLayout, frameWGSL, noiseWGSL, blend, tier, log }
    const pipe = await makePipeline(api);               // layout [api.frameLayout, yours...], target { format, blend }
    return {
      set(cfg) { /* cfg = the scene's config + weight */ return true; },
      compute(encoder, ctx) { /* optional: before every render pass (a depth sort) */ },
      encode(pass, ctx) { pass.setPipeline(pipe); /* group 0 (StageFrame) is already set */ pass.draw(4, n); },
      busy() { return false; },                         // true keeps the stage drawing; it must settle to false
      destroy() {},
    };
  },
});
```

`ctx = { cfg, R, P, O, D, clip, free, time, dt, view, scroll, allDawn, platesOn, bw, bh, dpr }` (the stage's camera
rows, pivot, origin, lens distance, `clip` = [near, nearFull, fogStart, fogEnd], simulated time). Output is premultiplied
and sRGB-encoded like the discs (`stageOETF`). With plates on screen the pass is drawn into the light the plates bend:
it is always behind the plates. A throw turns only that pass off; `stage.stats().passes` says which are ready and on.

Since wave 6 (`stage.js` "THE POST"): `api.format` is the canvas's own format, the preferred 8-bit one or
`rgba16float` on an HDR screen (`stage/gpu.js` `canvasSetup`; `?hdr=0` / `?hdr=1`): build the pipeline with it, never
with a format of your own. A pass that writes smooth dark light adds the grain just before its write,
`stageGrainLight(col, pos.xy)` from `api.frameWGSL` (one 8-bit step where there is light, seeded from the stage's
clock, 0 on an HDR canvas), and keeps added light under the ceiling `frame.band.w` (1 on the 8-bit canvas, 1.6 on an
HDR one), as `lib/prism.js` does: `return vec4f(stageGrainLight(min(col, vec3f(frame.band.w)), i.pos.xy), 0.0);`.

### The two passes that exist

- **`rays`** (`lib/prism.js`; importing the file registers it): straight, thin rays of light with a soft core, drawn
  in the room, behind the plates (so a prism bends what passes behind it). `passes: { rays: { rays: [{ a, b, w, k,
  rgb }], ina?, outa? } }`: `a`, `b` the ends in the free camera's space, `w` the core's width in css px at the page
  plane, `k` its light 0..1.5, `rgb` its colour (paper white to cobalt), `ina` / `outa` the share of its length it
  takes to come in and to fade out. Up to 8 rays. Added light only, kept off keep-outs and the dawn.
- **`splat`** (`stage/splat/splat.js`): Gaussian splatting, with no library and no second canvas. Put the data in by
  id, then switch the pass on:

```js
import { putSplats, gen } from "../splat/splat.js";          // or a dynamic import after the first frame (consult.js)
await putSplats("A", gen.letter({ text: "A" }));              // gen.mark(), gen.relief(img), gen.extrude(mask), loadSplats(url) (.ply / .splat)
// in frame():
passes: { splat: { sets: [{ id: "A", pos: [x, y, z], size: 520, rot: [yaw, pitch, roll], settle: 0..1 }] } }
```

  `pos` the set's centre in the free camera's space, `size` css px for one local unit, `settle` 0 = points scattered
  like the swarm, 1 = in place and in shape. Up to 16 sets a frame; the pool by tier: A 400,000, B 150,000, C 60,000
  (a set over what is left keeps its splats nearest its centre). It draws over the swarm and the chips; with plates on
  screen, behind them. `splatShown(id)` says how far a set has come in on a live pass (0: not on the GPU, or no
  pass): hand your own figure over to the set only when it is above 0. `?failsplat=1` breaks it on purpose: the stage
  draws on without the pass. Used by Consulting's made mark and, behind `?name=splat`, by the cover's name
  (`cover/splatname.js`). Bench: `stage/dev.html?view=splat`.

## The arrival (`ctx.arrival`)

`ctx.arrival = { cut, under, age }`: `cut` the page was reached by a cut (the stage drew its first frames under the
arriving sheet), `under` the sheet still covers the page, `age` seconds since the stage's first frame on this page. The
room is at full light from the first frame: a scene that ramps its light in rises in at most 250 ms on a cold load and
not at all when `arrival.cut` (the reader first sees the room as the sheet leaves).

An arrival **by a flight** (the Astro build's router) has no sheet: `arrival.cut` is true and `arrival.under` false
from the first frame (`cut && !under && age < 1.5` is "just flown in", as `contact.js` tests). The stage this page
draws on is the one the page before handed over; the scene's `prepare()` ran while the eye was still on its way to the
door (the cover builds its name there, in slices between frames), and the scene's first frame is primed before the
room takes the stage. Start a plate inside the frame on a flown arrival: the eye is already moving into the room.

Since wave 6 the page changes 200 ms after the click, long before the door, and the arriving page's scenes come up
**in the shadow** (`fx-stage.js` `shadow`): while the room left behind is still drawn (the leaving page's scenes no
longer run: that room stands as their last answers left it), the host loads the scenes, prepares their formations
(`stage.prepare`, with room made in the targets buffer by `stage.reserve`), awaits their `prepare()` (at most 0.4 s),
runs their first frame undrawn (`ctx.etch` and the display type rastered then) and uploads the first screen's
captures. What a scene asks then that would change the room on stage (a texture the stage already holds, the
backdrop, `ctx.look`) is held and applied at the takeover, in one task, at the first frame where the door's glass
hides the whole frame. A scene needs nothing new for this: `frame()` may run once before the room is its own.

## The cut, as a scene sees it

The cut between pages is the host's and the engine's; a scene does not drive it, but three things reach it.

- **The push** (`stage.cut`): on `fx:nav:start` the eye pushes in toward the leading scene's `subject` (default its
  figure's centre). Return `subject` when the thing to fly at is not in the middle of your figure.
- **The portal** (`stage.portal`, the assembled pages): a tall plate of glass swings in from the clicked link's side
  and closes on the eye. `c.flight` runs 0 → 1 with it; dim what only the room's own light should show (the room kit
  already takes the hand's blade and the subject's light away).
- **The flight** (`stage.fly`, under the router): the stage itself dollies the eye along its view axis through the room
  to a door of cut glass standing in the room (`LOOK.flyDoor` × D behind the page plane), and adds the door as a slab
  of its own. The scene keeps returning its pose: the flight is added to it. `c.flight` stays 0. The page's display
  type leaves the glass with the text (the host clears the backdrop), so a plate stops bending the old title.

The events (`fx:nav:start { to, side, dawn, back, ms, door, glass, day }`, `fx:nav:covered`, `fx:nav:arrived`,
`fx:stage:frame`, `fx:stage:lit`, `fx:step { scene, step, of }`, and since wave 7 `fx:part { part, from }`, the home's
part being read) are for the page's modules; a scene reads `ctx` only.

## The glass signal (a plate never pops)

The stage starts while the page loads (`stage/boot.js`, from the head script): the swarm draws as soon as its own two
pipelines are compiled, and the plates' pipeline may still be compiling then. Until `ctx.glass.ready` the host drops
every slab a scene returns (the swarm alone draws). From the frame it turns true:

- A scene with `glassEntry: true` in its module brings its plates in itself, from `ctx.glass` and its own state: the
  cover (`now.js`) starts its plate's entrance on the first frame `ready` is true (deep in the upper room, small and
  soft, into its place in front of the name and into focus in 0.85 s; a reader restored lower down gets a 0.45 s focus
  pull instead). Use `age` for the time since the glass could draw; keep the start in your own `state` (the first frame
  you see `ready`) when the entrance must happen even if the glass was ready before your first frame.
- Every other scene gets the host's short focus pull when the glass joins late (`late`): for 0.45 s its slabs' `alpha`
  rises from 0 and their `sharp` from 0.3. When the glass was ready by the first frame nothing is added (the canvas's
  own fade-in covers the start).

Nothing may read as water: no drop, bead, pool, drip, ripple or wet edge (spec 50 §0). Over text the swarm is mist.

## A 36-line example

```js
// stage/scenes/fan.js — a fan of small plates of light that opens with the scroll, and one plate of glass
import mist from "../night/mist.js";
import { Sets } from "../night/lib.js";

const fan = {
  share: 0.4, fit: "contain", capacity: 6 * 400,
  targets() {
    const s = new Sets();
    for (let k = 0; k < 6; k++) { const a = -0.6 + k * 0.24; s.rect(-0.3 + a, -0.5, 0.3 + a, 0.5, 300, k * 0.08, 1); }
    return s.set();
  },
  look: { ink: 0.04, size: 1.1 }, flow: { amp: 3 },
  update(c) { return { rotate: [0, (c.sectionProgress - 0.5) * 0.8, 0] }; },
};

export default {
  formations: { fan, mist },
  frame(c) {
    const open = Math.min(1, c.progress * 2);
    const f = c.fig;
    const etch = c.etch("word", ["Eleven", "works"], { w: 400, h: 560 });
    return {
      swarm: [
        { id: "fan", weight: open },
        { id: "mist", weight: 0.5, rect: { x: 0, y: 0, w: c.vw, h: c.vh } },
      ],
      slabs: [{
        id: "plate", cx: f.x + f.w * 0.5, cy: f.y + f.h * 0.5, cz: 40,
        yaw: 0.44 - 0.3 * open + 0.06 * c.pointer.nx, pitch: 0.03 * c.pointer.ny, roll: 0,
        w: f.w * 0.42, h: f.h * 0.62, t: 26, tex: null, etch, alpha: 1, glow: 0.3, sharp: 1,
      }],
      camera: { yaw: 0.05 * (c.progress - 0.5), pitch: 0, dolly: 0 },
      keepouts: c.texts.map((t) => ({ x: t.x - 8, y: t.y - 8, w: t.w + 16, h: t.h + 16 })),
    };
  },
};
```

Look at a scene on `stage/scenes/bench.html?scenes=NAME&debug=1` (real host, a stand-in for `fx-core.js`); add its
markup to the bench's builder if the generic steps do not fit.

## More the host and the kit do

- `yields: true` on a scene's default export: the host steps that scene's plates back from every OTHER scene's text on
  screen (straight-view box of the plate, gone on contact, full 140 px away). Set by `stack` (the path's head lay bent
  double under its last plate) and `gallery` (the evidence's head).
- The room's keep-outs never cut a hole: `room(c, { keepDim })` dims the room's light to a floor inside a kept rect
  over a long fall (since wave 7 the cosmos's floor is a quarter of the one asked and never above 0.06: default 0.035
  desktop, 0.05 phone; fall 150 / 90 px; the haze's 0.12; `keepDim: false` = the old cut). Engine: the field's
  `cosmos.keep { floor, fall, haze }` (slot `wallK`, `wallKeep` in `field.wgsl.js`); no fall = the stage's keep-out
  as before.
- Room defaults: fade 0.25 s, the blades sweep the part of the room the frame shows (0.42 × its width).
- `night/shot.js freeBand(c, x0, x1)`: the tallest band no text crosses (the phone's path, stack and gallery move into it).
- `dawn` returns the straight view focused on the page plane (aperture 0.2): the threads stay ruled and sharp. Since
  wave 7 `contact` does the same in the home, where Contact is a part on a night page: the dawn close's threads at
  its straight edge, the same sharp camera, the strokes' upper band from Contact's own top.
- A scene that reads a field of the room's answer (`field.wall`, `field.chips`, …) must cope with it gone: in wave 7
  `now.js` read `field.wall` after the wall became the cosmos, threw, and the host marked it broken for good (the
  `[stage] scene "now" frame threw` line shows only with `?debug=1`).
- A page's chapters without sticky scenes can still have figures: `mist.js` hands a case's chapters to
  `case/figures.js`, which reads `section[data-ch]`, composes one figure per chapter type in the free third the CSS
  leaves (plates, a line of light, bars and counts on the rows), places them for the page's eye (`case.js` `caseEye`)
  and fades any plate whose box meets a block of text. The same pattern serves any long page. Since wave 6 a figure
  may also switch on an extra pass: `mist.js` imports `lib/prism.js` (which registers `rays`) and forwards the
  figures' `passes` in its answer (More work's prism and its ray).
- The stage sleeps: whatever a scene moves at rest must run on `c.clock.time` and settle exactly (a value that creeps
  by an ulp a frame keeps the stage awake; `case/figures.js` `ease` snaps within 1e-3).
