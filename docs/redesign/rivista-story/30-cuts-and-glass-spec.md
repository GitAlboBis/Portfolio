# Cuts, and glass: camera, light, refraction — spec (amends `10-story-spec.md` and `20-pages-spec.md`)

> Written 2026-11-10 by the director on the messages Alberto sent after opening the first build:
> - «inoltre vanno tagliate tante parti della versione vecchia, come un questi screenshot . non mi piacciono . hai
>   pieno controllo per cambiare qualsiasi cosa delle cose che c'erano gia , il tuo lavoro anche se parziale per ora
>   mi piace .» The two screenshots: the eight letters of Fig. 03 "One frame, pass by pass", and the pale water A
>   standing alone on the screen with its caption.
> - «hai pieno controllo , con lo stile iniziale che abbiamo detto e quella base di prompt . immersivo 3d interattivo
>   story telling , camera , luci , refrazione . make it beautiful .» ("That prompt base" is the set of examples in
>   `10-story-spec.md` §0.3: an organic form that flees the pointer, refractive glass with dispersion over HTML type,
>   scrollytelling with a damped camera, a bulge under the pointer on image planes, GPU particles.)
> - «puoi refactorizzare e cancellare quello che vuoi , cambiare tutto il design e architettura che vuoi»
> - «nell' hook hai anche tutti gli mcp , come 21.st»
> What he likes: the stage of ink and light and the night sections. What he does not: the water A and its making-of.
> The agreed style stands: the white magazine in 3D, the night for Consulting and Obla, a sharp passage between them.

## 1. What leaves the site

Not loaded by any page from now on. He allows deleting: a lane deletes what is dead and unreferenced when that is
clean, and lists in its notes what it left behind as dead code for a later sweep.

- The water A in every form: the hero plate and its posters, the preloader with the pour (S1), the scroll stage where
  the letter stands alone and the Now sheet rises over it (S3), the water's instrument line, the beads in the contact
  band, and the flags `?presence`, `?water`, `?dive`, `?caustics`. `?gl=0` stays as the switch for "no WebGPU".
- `fx-water.js` leaves the module list. The stage no longer borrows the water's device: `fx-stage.js` asks for its
  own adapter and device (the helpers in `water/engine/gpu.js` and the rule in `water/engine/tier.js` are copied
  under `stage/` so the stage imports nothing from `water/`). The getter added to `fx-water.js` in `5f1e177` is moot.
- Fig. 03 "One frame, pass by pass" (`#fig02`): its section, its strings, its place in the contents. The `letter`
  formation beside it goes too. The capital A is no longer a figure anywhere: it lives only in the type and in the
  brand mark.
- Every sentence that speaks of the water A (captions, the colophon, meta descriptions, alt texts). Share cards that
  show it are regenerated when the new cover exists; until then the gap is recorded.
- The lane may cut or shorten anything else of the old home that reads as filler once the issue is paged. It never
  cuts a proof: the nine works, the two ledgers, the capabilities and the path are facts of `PRODUCT.md` §3 and stay.

## 2. What takes its place: glass

The stage gains drawn bodies of clear liquid glass: lit, refracting what is behind them. One material, on white paper
by day and on the night ground by night, beside the ink.

- **Material.** Clear glass with a faint cobalt absorption where it is thick. Refraction of the backdrop with a small
  chromatic dispersion (three samples). Fresnel reflection of a procedural studio (two or three soft rectangular
  lights, no texture download). One key light that follows the pointer, damped, and one fixed rim. A soft contact
  shadow and a caustic crescent on the paper beside the body. No bloom and no tone-map pass.
- **Shape.** Organic and alive, never a letter, never a logo: a few smoothly blended volumes with slow noise. It leans
  away from the pointer and springs back (no physics engine); a press or tap sends a ripple through it. Like the ink
  it moves only inside the 5 s window after an input, then stands still.
- **Backdrop.** Glass can only bend what the stage can redraw. The host rasterises into a texture, in document space,
  the things glass may pass over: display titles marked `data-refract` (drawn with Canvas2D in the page's own font at
  the DOM's own positions), the plates (their images) and the paper. The particles are drawn to a texture of their
  own first, so glass refracts ink and light too. Glass never passes over body copy: text blocks are keep-outs for it,
  so nothing it cannot redraw is ever hidden.
- **Camera.** The page plane stays registered with the DOM to the pixel. Depth shows by parallax, by the bodies
  turning with the scroll, by focus pulls between depths when a chapter changes, and, inside a figure box, by a camera
  that may orbit. Every move is driven by scroll or pointer and damped; nothing moves on an idle clock.
- **Cost.** The glass pass is bounded to the bodies' screen rectangles. Budget at tier A: the whole stage within about
  3 ms of GPU at 1440×900, glass included; lower tiers march fewer steps and drop dispersion before they drop a body.

## 3. Where glass appears

| where | what the reader sees |
|---|---|
| Cover, Fig. 01 | a large body of glass over the name, bending ALBERTO TUVERI, with ink turning around and behind it. Caption: "Fig. 01 · Glass and ink over the name, drawn live" / "Fig. 01 · Vetro e inchiostro sopra il nome, disegnati dal vivo", with the instrument line "{n} points · {ms} ms GPU". Printed state: the lockup as it is, the caption without "drawn live", and the still line "Live figure: it needs WebGPU and motion." |
| Cover, on scroll | the body leaves the name, travels down as a drop with the reader, rests as a lens on each row of "In this issue" (it magnifies the row's display line) and sinks into the edge of the dusk strip |
| Work | a lens that rides the rail: over a tile's capture it magnifies and bends the picture; a hovered tile calls it. The S4 cut is unchanged |
| About | small beads on the rules of Capabilities and of the path, each bending the display line beneath it |
| Night pages | no glass in this round, unless highlights alone prove cheap and beautiful; the figures there are light |
| Contact band | the drop comes to rest beside "Write to me." and the ink settles around it |

## 4. Page contract added by this spec

- The cover's hero: `data-stage="hero"`; the lockup carries `data-refract="lockup"` (the host reads the rects of its
  `.ch` spans); an empty box `data-stage-anchor="glass"` where the plate was (no border, never any text) is the body's
  home; the caption below it carries `data-stage-instr="hero"`.
- Display titles the glass may cross carry `data-refract` (chapter heads, the display lines of "In this issue").
- The head script keeps its early adapter request on a plain cover load (`window.__rvGpu`); the stage consumes it.

## 5. Lanes

Wave A, together: **GLASS** (the renderer inside the stage, the backdrop and particle textures, the bodies, the
lights, the bench; owns `stage/glass/**` and what it must change in `stage/stage.js`, `stage/wgsl/**`,
`stage/dev.html`) and **CUT** (the page: what leaves, the new cover hero, Now as an ordinary chapter, the band without
water, the module list, strings; owns the page files of `20-pages-spec.md` §8 except `fx-stage.js`).
Wave B, together: **PAGES** (`20-pages-spec.md`) and **HOST** (`fx-stage.js`: its own device, every page, the
backdrop, the glass figures of §3 as modules under `stage/day/`, the camera and focus by chapter).
Then **INTEGRATE**: every page, both editions, 1440 and 390, the cuts between pages, the printed states.

## 6. Sources before hand-writing

Before writing a new component or effect, a lane searches the connectors for what exists (21st.dev `search`, which is
free; Magic UI; ui-layouts; OriginKit; Vengeance UI; load them with ToolSearch) and writes one line in its notes:
what it found, what it takes as a mechanism, what it refuses and why. This site has no framework: a React component is
studied, never imported. A paid call (`get_component` on 21st.dev) is not made.
