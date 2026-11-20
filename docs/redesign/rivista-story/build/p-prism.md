# p-prism — the prism at the index, and the small leftovers (DONE, servers stopped)

## Done
- Tracer: a triangular prism (plates.wgsl.js prSet/prHit/prExit/prSd/prNormal/prChannel/shadePrism; isPrism = image
  aspect < 0; throughOther skips prisms). plates.js isPrismSlab: `shape: "prism"` or `inset < 0`. Guard: bench gallery
  and stack frozen = 0.000 vs HEAD; Work/About at rest with only my files over HEAD = noise (0.046 / 0.103 vs HEAD/HEAD
  0.151 / 0.115). (The full tree's About differs from HEAD by another lane's camera change, not the tracer.)
- lib/prism.js: the pass "rays" (registerPass, layer over): straight soft-core lines, additive, keep-outs, dawn, fog.
- lib/room.js `aim`: one shaft ending in a subject (wall 0, length runs out there); a lit room's blades ~15 % down
  (strength 1.45→1.24, haze 1.9→1.6 at glow 1).
- index.js: prism (axis toward the reader, triangle shows), shaft core, four rays (paper → light cobalt) to four
  stations in depth, cued ray 1.0 / others 0.12 / rest 0.42 (τ 0.1 s, settles), the cued emblem at its station, prism
  yaw with hand + scroll. Phone: small prism right of the cued row's title, fades between rows (0.2 s), tap lights the
  ray before the cut; keep-outs split round the title's line. Rest lattice dropped (its knots were soft discs).
- Leftovers: gen made = larger points, no fuzz, ink 0.92 (weave much reduced, a fine mottle remains); Obla listening =
  four lines of sound at its right side; phone path: panes clear text with a 64 px margin, passed panes leave sooner,
  line's near end tapers (0.26); phone dawn threads near-parallel; Sphere AI capture levels gentler (gain ≤ 2.4, to 0.8).

## Numbers (1440x900 DPR 2, tier A; noisy, other lanes rendering)
- index hover peaks 2.66 / 2.72 (HEAD 3.09 / 2.93 same runs); full-page run index 2.76. 1920 DPR 1 2.12. Phone 0.29.
- Paid by: the fan's nine plates at a station a third the old size, no second blade, no hand's blade, no rest lattice.
- Sleep: 0 frames on index, consulting, obla, about, work; no long task. Gates: assemble --check 0, claims OK.

## Needs elsewhere
- fx-stage.js (~line 711, the slab copy): pass `shape` through (today the prism rides on `inset: -1`).

## Open
- gen: a fine mottle inside the made mark at 1:1 (flat at page size). Phone path: one transitional frame shows a short
  soft piece of line while the eye flies between panes. Sphere AI: about 4 % darker in the plate; judge against the site.

## Run and look
- `node .shots/p-prism/_scripts/idx.mjs <port> <tag> d|m|d1` (rest + each row + gpu), strip.mjs, guard.mjs, at.mjs,
  pstrip.mjs, core.mjs (shaft core), states.mjs. HEAD copy: .shots/p-prism/_before (serve on 5326).
