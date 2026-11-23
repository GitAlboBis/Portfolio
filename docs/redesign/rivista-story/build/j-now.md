# j-now — lane J2b NOW (phone wave 9): Now pinned on a phone, the orrery twice the size

- **Brief:** the director's five notes in `j-mobile.md` («The director's notes for J2b NOW») plus J2a's `forJ2b`; no rail
  (that is J2r's). Built on HEAD `17d593d`. Scratch and captures `.shots/j-now/`, probes `.shots/j-now/_scripts/`.
  Ports 5446 (tree), 5447 (HEAD export `.shots/j-now/head/public`), 5448 (the Astro build `.shots/j-now/dist` + `public`,
  then the release `web/release`).
- **State: DONE** (23 Nov 2026, about 12:25). Built, probed, one bug found and fixed, one idea tried and left out, the
  final round on the final tree, gates green (12:19), documents written. Nothing committed: the director commits.
  Servers 5446 (pid 34956), 5447 (pid 34008), 5448 (pid 9308 the Astro build, then pid 28332 the release) stopped by pid,
  the ports closed, no headless Chrome left. `HANDOFF.md` and `build/j-mobile.md` changed in the tree during the lane: not
  mine, left alone.

## What Now does on a phone now

- Held upright (under 1024 px, portrait, scene mode, fx-scroll running), Now's text is **three captions held at the
  foot**, a screen of scroll each, handing over in place (the J2a hand-over: out in 120 ms, in by the focus pull): the
  date label, the title and the lead; the body and the two links; "What I do" and the nine names. The orrery stands in
  the band above the tallest caption for the whole of Now and never moves while a caption hands over (0 px/s in every
  hand-over stroke).
- **Twice the size** (`layout.js` `SHAPE.tall`, `phone: 2`): at 390 and 393 the mark 128-129 px tall (HEAD 65), a body at
  the front 51-66 px (HEAD 45-54; the smallest is the cube taken apart), at the back 41-54 (HEAD 20-25). Grains and spores
  scale with the figure (the shader's sprite size is in the figure's units; the tier's sample unchanged); the mark's motes
  now full (they come in from 40 px to 100 px of mark). One name at a time under the front body, 16 css px.
- **The earlier arrival**, inside `lit = sstep(0.42, 0.56, k)`: once lit the figure stands nearer the eye (`z`), reading
  at 0.55 of its size and growing to the whole by k 0.95, back at z 0 at k 1; its bodies condense from k 0.5 (`c0`; HEAD
  0.66). At the same scroll positions (`fpF/pair-p3-en.jpg`, `pair-p2-it.jpg`): 70-72 px as it lights (HEAD 22-32), 88-92
  at y 1350-1390, 105-117 by y 1490-1560 (HEAD 24-39), 128 in place (HEAD 46-65). The frames from k 0.31 to the lighting
  stay the cosmos alone in both (the gate).
- **The join into Work**: held until Now's last caption is let go (Now's end at the view's foot), then it rides up with
  that caption and fades with Now's blend weight (`sstep(0.64, 0.86, max(c.weight, share followed in 0.07 s))`) while
  the gallery's head comes up below with its opening row and its plates' light rises with that scene's weight.

## How (no word twice, the desktop's one step)

- `parts/c-main.index.html`: `data-caption`; inside the step's `.sc-in` two boxes `[data-cap-step="1|2"]` each with a
  `.sc-cap`; the list of names `dl[data-cap-step="3"]` holds a `.sc-cap` round its dt and dd. One h2, the same order.
- `css/scene.css` "a step split into the phone's captions": in the caption grammar the outer step and its column are
  `display: contents; position: static`, each box a screen with its sticky `.sc-cap` (J2a's hold), first and last boxes.
  `css/page-cover.css`: the column's margins for the boxes where they are plain blocks (desktop identical).
- `fx-scroll.js`: `collect` keeps `caps`; `pick` uses them in the caption grammar (the other list cleared; `fx:step` numbers
  them); `capFocus` finds the caption box. `fx-stage.js` `measure`: in the grammar a scene with `[data-cap-step]` has them
  as its steps (the caption is `:scope > .sc-in, :scope > .sc-cap`, `stepNo` from `data-cap-step`), and a caption box is no
  keep-out (the dl's `data-stage-keepout` is a screen tall there).
- `stage/scenes/now.js` `orreryAsk`: the tall band from `c.fig` (`capB`), `ride` from the section's end, `gone`, `zq`,
  `leave`, `c0`; the keep-outs of the first caption before the flight's damped k reaches 0.45. `layout.js`: `SHAPE.tall`,
  `EXTENT.tall`, the bodies' desktop sizes (`g`) in it. `orrery.js`: `c0` (one line).

## Found on the way

- **A bug (fixed):** with the step and its column `display: contents`, the column kept J2a's `position: sticky` in its
  computed style; the host resolved the captions through a sticky ancestor with no box and Now's captions had no keep-out
  at all (`_scripts/dbgnow.mjs`: `c.texts` empty; HEAD 3-8 keep-outs there). `position: static` fixed it; the light over
  the first caption's line in a flick (p95 up to 99, Italian Astro build) went to 0.
- **Tried and left out:** a curtain on the title at each hand-over. A title clipped shut is not "in view" to the
  IntersectionObserver that lets its lines rise, so a reader landing on a later caption and coming back saw the curtain,
  then the rise, 1.3 s late (`_scripts/dbgcurtain.mjs`, `ho-back12`). The title rises once, as on HEAD; hand-overs are
  the focus pull (`ho-back12b`).
- **Two or three names** in the band (note 4): `_scripts/tune.mjs` with WIN 0.7 / 1.04: they give way 69-132 % of the turn
  (mean 1.3-1.7 standing): not legible. One at a time kept.
- **The back flick** left the frame without a figure for ~20 frames (the plates leave the frame's foot by position before
  their damped weight lets go, the orrery waited for Now's damped weight): the return now also follows Now's share
  through a 0.07 s follower (the raw share stepped a row at a time: one pop).

## Final numbers (the final tree)

- **Gap proof** (`_scripts/gap.mjs`, the pass's own `orreryProof`, 1600 steps a turn, real hulls and words): 390 EN A 150.4,
  mark 112x128, front 51.2-65.7, back 40.8-53.7, bodies >= 10.8 px apart, >= 17.5 from the mark, one word never nearer
  than 9.2 px to anything (gave 0); 393 DPR 3 EN 10.9 / 17.7 / 9.6; 390 IT 10.8 / 17.5, a fading word 4.9 px (gave 0.1 %:
  one step of 1600); 393 IT 10.9 / 17.6 / 5.3; 360x740 (extra) mark 105, 8.9 / 14.3. Type 16 css px.
- **Captions** (`_scripts/floor.mjs`, 393 EN and 360 IT): one shown and one taking taps at a time, type 16 (labels) and
  18 (body), no horizontal overflow, caption tops under the band's foot; one h2, Now's words once (576 / 621 characters);
  Tab reaches Now's two links with their caption in focus and shown.
- **Touch strokes** (`_scripts/touch.mjs`; `tF-tree-en-p3`, `tF-astro-it-p2`, the join and back again in `tH-*`): the
  hand-overs (a drag at 550-680 px/s, flicks to 1,650): two captions 0, a caption moving while seen 0, the orrery or a
  plate over a seen caption 0, frames without a figure 0, with both 0, pops 0, light over a seen caption 0 (p95 max 1). The
  join and back (flicks 1,470-2,670 px/s, drags 560-690): never a figure over a caption, no light over one, no pop; where
  the figures cross both are faint: the orrery at 0.05-0.17 of its light while a plate passes 0.3 (0-14 frames of a drag),
  a plate at 0.23-0.26 while the orrery is under 0.05 (0-6 frames of a fast flick back). HEAD's same strokes: 67-242
  frames with no figure and 133-391 with two captions seen at once (`t1-head-en-p3`).
- **1:1 crops** (`crops/sheet.png`): the three captions with the stage on, the same frames with every word transparent: the
  light over the night in each caption's rows p95 0, p99 1. `?stage=0`: `crops/stage0-now.png`.
- **Desktop and sideways** (`_scripts/desk.mjs`, `deskF-*`): 1440 EN, 1920 EN, 1920 IT, 844x390: at 36 places the DOM
  layer 0 px, `stage.set` deep-equal (the orrery's config included), the host's measure of every scene (side, steps,
  numbers, boxes, captions, texts, view) and fx-scroll's `fx:step` equal to HEAD.
- **Printed states** (`_scripts/layout.mjs`, `plain.mjs`, `plainvar.mjs`): the heights and all 121 text boxes of hero, Now
  and gallery equal in 24 pairs (`?stage=0`, `?gl=0`, reduced motion, print; 390, 393 DPR 3, 1440; EN, IT); reduced motion
  and print 0 channels in 8 pairs; the `?stage=0` / `?gl=0` pixel differences are HEAD's own (HEAD gives 3 pictures in 4
  loads). `?failorrery=1`: desktop DOM 0 channels, the nine names printed (orrery-off); phone: the names in the third
  caption (`plain/fail-m-sheet.png`).
- **GPU** phone tier B 390x844, two rounds, HEAD in the same minutes (`gpu-g1.log`, `gpu-g2.log`): Now in place 0.46-0.49
  ms median, max 0.51-0.54 (HEAD 0.79, max 0.82-0.89: HEAD's Now has the gallery near); the second caption 0.43-0.44 (HEAD
  0.56); three screens through Now and the join peak 0.78-0.79, p95 0.74-0.75 (HEAD 0.82-1.05, 0.77-0.78); the flight peak
  0.51-0.63, p95 0.39-0.41 (HEAD 0.46-0.51, 0.37-0.39). The larger figure's own cost: 0.01-0.03 ms (pass off against on,
  two pairs). Asleep: 0 frames in 3 s after 19 s of quiet (both). Never halved (80,000 drawn throughout).
- **First frame** (`ff2.mjs`, ten alternated pairs): phone 417, 439, 410 ms against HEAD 443, 423, 381 (medians crossing),
  1440 432 against 474; no long frame after it but one 62 ms "no script" frame at about 2.75 s in one load of each, once.
  The host's measure on the phone's home 9.6-11.2 ms against 8.4-11.1 (three more sticky boxes: 23 against 20).
- **SMOOTH** (k-smooth `rec.mjs --m` + `cmp.sh`, five flings from Now's top; `rec/jn-*.json`): touch flings: the eye's worst
  step 12 world px/s (HEAD 30), the gallery's first plate riding in 3,692 px/s ALL / 3,524@19 TAIL (HEAD 7,824 / 3,458@31);
  JS flings: the eye 11 (HEAD 14-17), the plate 1,397 (HEAD 3,305). The orrery: 0 px/s while held; at the join it rides
  with the page exactly (its frame-to-frame steps are the scroll's own), as Now's last caption does.

## Gates (12:19, the final tree; `gate2-*.log`)

`assemble.mjs` exit 0 (fx.css up to date), `--check` exit 0, `check-claims-proto.mjs` OK (34 pages); from `web/`:
`build.mjs --outDir ../.shots/j-now/dist` 34 pages, `parity.mjs` PARITY OK (150 shared files, 0 differ), `asserts.mjs` ok
(34 pages, 1,154 local references), the claims on the build OK; `VERCEL_ENV=production node web/scripts/release.mjs`
exit 0, three `[release]` lines (34 pages, 32 in the sitemap, 159 files, 5.5 MB). The release served from its root:
Now's captions and the tall shape (A 151.6, mark 128.9 px), EN and IT, console clean.

## Still open

- Inside the gate, a flick from the name that lands before k 0.42 lands in the cosmos alone (k 0.31 to the lighting).
- The header names Now only once its title's caption has left the foot (a held, hidden title is "on screen" to
  fx-motion's observer); during captions 2 and 3 the header shows no scene name (as J2a's gallery after its head).
- The orrery's glow (the swarm's soft field behind the mark) is placed for the page plane; while the figure stands nearer
  in the arrival they part a little.
- Nothing seen on a real iPhone. The rail across the join is J2r's.
