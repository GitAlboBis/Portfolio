# l-cosmos — the neural cosmos behind every room (wave 7, decision 4)

- **Done (runs 1-2, cut at 17:40; on disk, never revert):** `stage/cosmos/web.js` (new: the web seeded once, 190 nodes,
  ~470 filaments, 120k galaxies + 5.6k stars, made across tasks; `journeyOf`/`placeOf`: every page a place);
  `field.wgsl.js` (the wall's grid gone: `vsCosmos/fsCosmos` instanced points with the stage's DoF, `vsRibbon/fsRibbon`
  the filaments' own light, impulses + node flash on `frame.clock.z`, haze no longer stopped by a wall); `field.js`
  (`readCosmos`, `wallAsCosmos`, `journey()`, impulses on the stage clock, uniform slots 32-49, `TIER_COSMOS`);
  `room.js` + `cover/world.js` (`cosmos` instead of `wall`, blades `haze: 0, wall: 0`: key lights for the chips);
  `cover/shared.js` (the index's lattice `rest` removed); `stage.js` (`set({ cosmos })`, `pack` gets `eye`, `fly`);
  `fx-stage.js` (measure: `M.cosmos` key/slug/max/parts; `stage.set({ cosmos: {..., y, vh} })` each frame).
- **Run 3 (20 Nov, 20:52-21:06, stopped by the director; its notes never written, read from the code's "(run 3)"):**
  300 nodes (web.js); the cosmos's quads as triangle strips (`corner4`); a filament as a thin beaded CORE plus a faint
  HALO (`cosR`, `beads`), never a tube; a galaxy's ceiling with a soft knee and a node core's ceiling past the glow's
  threshold (`cosC`: the bloom gathers on the dense nodes only); `__cosmosLook` overrides for probes (`prof3.mjs`).
- **Run 4 (20 Nov, 21:10-21:11):** built `.shots/l-cosmos/dist`, one look (r4a: cover and Work at rest), then cut.
- **Run 5 (20 Nov, from 21:18):** grid hunt done (no wall, lattice or grid left in the field, room.js, cover/**; the
  scenes' comments that still say "the wall's grid" are other lanes' files). Gates green on the tree at 21:19. The
  look (r5a-r5c, 1:1 crops): run 3's even beads read as dew on a thread and a near halo of 8 px as a blue cable; every
  galaxy sat at 0.2-0.28 (the ceiling squashed the power law); the small chips read as specks and rings. Changed:
  `knots()` (three incommensurate noises) for `beads()`; core and halo ceilings 1.5 / 3.4 css px; gain 2.6 (cover 2.75)
  and a galaxy ceiling 0.42 (the few bright read as stars, the many stay faint); a bright galaxy's point a little
  larger; node cores to 0.1 of the radius at 1.7x (the bloom gathers there); 560 nodes (934 filaments: a lace, not a
  dozen strands), straighter filaments (bend 0.03-0.11: no ring arcs), a steeper fall with distance (0.5); the journey
  drifts aside (placeOf: Work, About and Consulting began one box apart, the same web); chips: a size floor (16 css px,
  12 phone: `floor`, FU.shapes.w) and fewer (rooms 1200 / 800, cover 3000 / 1800). Text crops clean (Work, cover).
  Proven (21:30-21:41, `_scripts/gpu5.sh`, `gpu5.mjs`, `gpufly5.mjs`, `lt.mjs`, `impulse.mjs`, `homej.mjs`): see
  "Measured" below; the flight Work -> About as a strip (`.shots/l-cosmos/fly/sheet.jpg`: the lace inside the door, no
  rAF gap over 34 ms, no error); an impulse caught on Work (r5d/impw-sheet.png: a short glint running the thread);
  More work's prism keeps its shaft over the lace (r5e); the cosmos ends at the edge of day (About's close, r5e); the
  home's journey j 0 / 1.03 (Now) / 3 / 11 / 19 / 24 / 29 at each part's top. `field.stats().cosmos.pulseAt` (the
  running impulse's two nodes on screen, css px) is a probe's. Gates green on the final tree at 21:41. Server stopped.

## Measured (20 Nov, 21:30-21:41; CPU 27-60 %: noisy; lane on 5382 against the live site = HEAD, same hour, twice)

GPU ms, rest median (x2 rounds) and the reader's-scroll peak; the swarm never halved (160,000 / 80,000 throughout):

| | lane rest | HEAD rest | lane peak | HEAD peak |
|---|---|---|---|---|
| 1440 cover | 1.16, 1.16 | 1.50, 1.49 | 1.56, 1.54 | 2.18, 1.84 |
| 1440 Work | 1.48, 1.49 | 1.70, 1.70 | 3.52, 7.16 (p95 1.93, 1.91) | 5.31, 4.15 (p95 2.15, 2.16) |
| 1440 About | 1.51, 1.52 | 1.79, 1.79 | 2.48, 2.40 | 5.15, 4.74 |
| 1440 case-sphere-ai | 1.88, 1.88 | 2.09, 2.10 | 2.33, 2.38 | 7.45, 7.52 |
| 1920 cover / Work | 0.97 / 1.12 | 1.19 / 1.26 | 1.33 / 2.13 | 1.35 / 5.27 |
| phone cover (B) | 0.36, 0.36 | 0.39, 0.39 | 0.68, 0.67 | 0.53, 0.61 |
| phone Work (B) | 0.56, 0.56 | 0.59, 0.59 | 0.69, 0.83 | 0.62, 0.74 |

Flight Work -> About at 1440: out top 2.38 (HEAD 2.35), in top 1.90 (HEAD 2.09). Sleep: 0 frames in 3 s after 19 s of
quiet (About). Long tasks after the first frame: none (cover, Work, About; the web is made in slices, 110-175 ms in
all, while the field's pipelines compile). Single-frame peaks (Work 7.16) are the machine's noise (p95 under HEAD).
The phone's peak is about 0.1 ms over HEAD's (under the 1.5 ms limit).
- **How to run:** gates as in CLAUDE.md §6; Astro into `.shots/l-cosmos/dist`; serve on port 5382 (stop it by pid).
- **How to look:** `node .shots/l-cosmos/_scripts/look.mjs 5382 <tag> d|d1|m <page> 0,1.5 [--look={"gain":1.2}]`.

## Decisions

1. The cosmos is drawn by the FIELD where the wall was (`encodeWall`), so it follows the field's opt-in, fade,
   keep-outs (`wallKeep`, floor <= 0.06), the dawn mask (`stageNight`) and `?failfield=1` (no field: no cosmos).
2. Points in the engine's language: energy-kept gaussian discs, DoF at a small factor, stochastic 8-bit rounding,
   light added (alpha 0). The filaments' gas as strips (20 pieces a filament), drawn by area, never fullscreen.
3. A periodic box (BOX = 8 D a side) from one seed, wrapped about a window half a box ahead of the eye.
4. Every page a place: `j` (D) by page and scroll (BASE/SPAN in web.js); the home runs through its parts in order;
   a case is a room off Work's way (side step by its slug).
5. Blades: no wall, no haze; key lights the chips catch. The aimed shaft (index prism, More work) keeps its haze.
6. The morning: the cosmos ends at the straight edge of day (`stageNight`); Contact (all dawn) has none.

7. (run 5) Chips in the void: only glass that reads as glass (a size floor, fewer); the blades light only the glass;
   the aimed shaft (index prism, More work) keeps its haze. The web: 560 nodes, gentle bends, knots not beads.

## Where the engine and the host changed (STAGE takes both after COSMOS)
- `stage/stage.js`: `cosmosHeld` and `set({ cosmos })` (kept across reset()); `field.pack` gets `eye` and `fly`.
- `fx-stage.js`: the measure's `M.cosmos` (key, slug, max, the home's parts) and `stage.set({ cosmos: {..., y, vh} })`
  each frame.

## Needs elsewhere
- `stage/scenes/README.md` "The field" and DESIGN.md "The room" still describe `wall` (the ruled grid): a scene returns
  `cosmos` now ({ z, alpha, gain, stars, white, far, dof, keep, thread, cap }; an old `wall` gets the cosmos at its
  depth); chips take `floor` (css px). Comments that still say "the wall's grid": consult.js l.7 and 27, evidence.js
  l.16, gallery.js l.51, 57, 355, index.js l.22, case/figures.js l.649 (harmless; not this lane's files).
