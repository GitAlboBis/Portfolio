# NIGHT lane notes

- Lane: NIGHT (port 5184). Owns `public/proto/rivista/stage/night/**` only.
- Plan: one formation module per figure (gen, cut, code, agents, obla + the character body), each iterated on the bench `stage/dev.html` at 1440 and 390.
- **Status (run 1, done):** all five figures built and looked at on the bench, desktop (4:5 box) and phone (5:4 box), every Obla state, a state tween, the three consulting cross-blends. Console clean on every capture; `tsc --checkJs --strict` clean on `night/*.js`. Server on 5184 stopped.

- **Run 2 (2026-11-10 14:xx):** run 1 had finished its work but was cut before returning. Run 2 changed no module. It checked them through the real host (`fx-stage.js`, routed into the home with `?debug=1`) at 1440 and 390. All 13 formations load, and the host drives gen, cut, code and agents at steps 1–4 and obla at steps 1–5 with the right `scene`. Console clean. `tsc --checkJs --strict` exit 0. Captures: `.shots/night/integ-{desk,phone}-{consult1..4,obla1..5}.png`.
- **For the PAGE lane (found in run 2):** at 390 the two figure boxes are `position: static` above their lists (`.st-fig` static, measured). Spec §4 calls them sticky. Reading step 3 or 4 on a phone, the figure has already scrolled away, so the reader never sees it change with the step.

## Files (all under `public/proto/rivista/stage/night/`)

| file | what |
|---|---|
| `lib.js` | shared: `Sets` builder, `plate()` (the A of Fig. 01 sampled once from `fx-plate-v1.webp`, cached), `stepProgress`, `inkFor` (tone vs box size), `rackFocus` (cross-blend in depth), easing |
| `gen.js` | noise -> picture: every point leaves the noise at its own threshold, a coarse residue fades with sigma; sharp from 70 % of step 1. Frame drawn from the start, 28 sampling-step marks light under it. Leaving (step > 1), the picture shrinks into the place of cut's monitor |
| `cut.js` | monitor (the frame under the playhead, large; glides inside a shot, jumps at a cut) + reel of 8 frames in 3 shots (push in, pan, wide) with perforations, ruler, waveform (quieter at the cuts), fixed playhead. Plays with the step; pointer inside the box scrubs by its x (tau 0.09 s), out or lifted it eases back (tau 0.42 s). The frame under the playhead is brightest |
| `code.js` | 20-row listing silhouette, tokens as bars of light, tone = syntax kind (keyword > number > name > string > punctuation > comment), gutter marks; typed by step 3 progress (done at 85 %), new tokens leave the caret (emit 1, spawn = caret), block caret blinks while awake, the row being typed is brighter; seen a little from the side |
| `agents.js` | hub (8 orbits) + 6 agents (5 orbits each) on a ring seen from above, in depth (DOF does the rest). Links = closed loops out/back, pulses ride the particles (shift). Press near an agent (projected with the stage's own camera): it scatters, its links go dark, a bypass lights between its neighbours, their hub links carry more; back in 2.2 s |
| `character.js` | Obla's body through the stage's body extension point (WGSL): product outline + hem, gradient, tint, highlight, dome light, state colour along the edge and as a rim band, eyes oval/wide/happy/closed (morphing), cut by the night band, keep-outs |
| `obla.js` | the light around Obla by state: listening (inward streams), thinking (three tilted rings, front arcs dimmed over the face), working (three session windows, streams out/back), approval (a card held below-front, a calm halo), sleeping (a still night sky over the whole box), finished at step 5 local > 0.72 (a report page above, happy eyes, the sky dimmer). State weights, body parameters and colour tween (tau ~0.3 s). Eyes follow the reader's pointer in the box (product's lookTarget) |

## Decisions

- The bench's `glow` box is square; captures inject an init style so it is 4:5 at 1440 and 5:4 at 390 (the PAGE lane's `.st-box`), no repo file.
- Use `mod=night` in bench URLs: without it the bench first tries `day/<id>.js` and logs a 404.
- Figures rewrite their targets with `setTargets` only when what they show changes (gen: sigma; cut: reel offset; code: typed count and caret blink); agents (5.3k targets) and obla (5.2k) rewrite every frame while awake (~85 KB per frame, only inside the 5 s window).
- `inkFor(rect, inkArea, p)`: the stage scales ink by area; lines want sqrt. gen p=1 (area, default inkArea), cut 0.7, code 0.85, agents 0.75, obla 0.8.
- Cross-blends: instead of a double exposure, `rackFocus` sends the outgoing figure back in depth (-560 px: a faint veil in the DOF) and brings the incoming one from +220 px into focus. gen -> cut is special: gen's picture shrinks into the monitor's place, so the picture becomes the frame on screen.
- Obla's eyes follow the product code (eye pitch -0.12 puts them slightly below the middle), as the PAGE lane's SVG does; the spec's "0.12 R above the middle" reads the sign the other way.
- The body is cut by the night band when one is given (the Contact band rises over it) and drawn whole without one.
- No text is drawn anywhere: windows, card, report and listing are bars of light.

## For the HOST lane

- Register in page order: `gen, cut, code, agents` all anchored on the consult box, `obla` on the obla box. Each figure reads `scene.step` / `scene.local` (its own step: gen 1, cut 2, code 3, agents 4; obla 1..5) and its `weight` (the cross-blend uses `weight < 1` with `scene.step` past its own step to know it is leaving).
- cut wants pointer `present` + `inside` to scrub (hover on desktop, a touch on phone: pass present while touching). agents wants `clicked` (a press edge) inside the box.
- Obla's state follows `scene.step` 1..5; step 0 = idle; step 5 with local > 0.72 = finished.

## Best captures (`.shots/night/`)

gen-final-a30 (picture emerging out of noise), gen-final-a90 (the sharp A with its water highlights, frame and step marks), cut-v2-scrub / cut-final-scrub (monitor shows the scrubbed frame), cut-v2-a30, code-final-a60 (typing, caret, the active row brighter), agents-final-rest, agents-v2-fail06 (agent scattered, bypass lit), agents-final-phone-fail, blend2-gen-cut (picture shrinking into the monitor), blend2-code-agents (rack focus), obla-v1-s3 / obla-v2-phone-s3 (working), obla-v2-s1, obla-final-s2, obla-v2-s4, obla-v2-s5, obla-v2-s6 (finished), obla-v2-tw45 (tween approval -> sleeping).

## Open

- Live behaviour (cut scrubbing, agents failing by a real click, Obla's blink and sway) judged only on frozen bench captures; look at it live in the browser pane once the host runs.
- Phone agents: cores go white (dense, small box); acceptable, could take a lower ink on small boxes.
- The tween frame between an oval eye and a closed arc shows both for ~0.1 s (visible only in a still mid-tween).

## How to run and look

```
python scripts/serve-static.py 5184 public
http://127.0.0.1:5184/proto/rivista/stage/dev.html?mod=night&f=gen@glow:1&step=1&local=0.5&at=glow&atv=0.5&t=3000
  cut: &f=cut@glow:1&step=2&local=0.3&px=1250&py=450 (scrub)   agents fail: &px=..&py=..&down=1&t=600
  obla: &f=obla@glow:1&step=1..5&local=0.4 (5 + local 0.9 = finished)
  cross-blend: register both (f=gen@glow:1,cut@glow:0) and drive stage.set/advance from window.__stage.stage
```
Captures: one-off script in the scratchpad (launch() from scripts/probes/water/lib.mjs), out to `.shots/night/`.
