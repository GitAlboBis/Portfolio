# PAGE lane — build notes (round "Storia")

- **Lane:** PAGE (port 5181). Owns `parts/*`, the five `fx-*.css`, `assemble.mjs`, `fx-nav.js` / `fx-scroll.js` (only where the new sections need them), `PRODUCT.md`, `scripts/check-claims-proto.mjs`.
- **Plan:** night block + tokens → Consulting → Obla (SVG still) → data attributes → nav/menu/header-on-night → strings EN/IT → PRODUCT.md §10–§11 → gates → look at 1440 and 390, EN and IT, `--reduce`, `--nogpu`.
- **How to run and look:** `python scripts/serve-static.py 5181 public` then `GATE_MAX_STEPS=30 node scripts/visual-gate.mjs <tag> proto/rivista/index.html proto/rivista/it/index.html --base=http://127.0.0.1:5181`.

## State (run 2, 2026-11-10)

Run 1 wrote only the stub (nothing else on disk). Run 2 built everything below and closed the lane: gates green
(assemble, --check exit 0, claims OK + selftest), looked at EN/IT 1440 and 390 (`.shots/page/en`), `--reduce`
(`.shots/page/rm`), `--nogpu` IT (`.shots/page/nogpu`), the sticky scenes and the two holds with a WebGPU browser
(`.shots/page/b`, `.shots/page/scene`), header and menu (`.shots/page/chrome`), no script (`.shots/page/nojs`). Console
clean everywhere (the one warning in --nogpu is the existing "no WebGPU in this browser").

Fixed after looking: "ME" alone on a phone line (nowrap "with me"), "MULTI-" at a line end in Italian (nowrap
"multi-agente,"), the Fig. 05 label leaving "IT" alone (balanced), the first entry starting below the box's top line
(now on it), a paper strip in the gutter beside the night (html takes the night while the header is over it), the
Italian header breaking at 1024 ("Chi / sono", "EN / / IT": gaps step down from 1024 to 1279, header words never
wrap), the letter box squeezing the Italian passes title (the title now spans both columns; IT box beside the lead),
and a `$` lost in a replace that left the scenes never sticky.

## For the other lanes (HOST+DAY, NIGHT) and the director

- `html.stage-on` (set by fx-stage.js while it draws) shows ", drawn live" and the `[data-stage-instr]` span, and hides
  `[data-stage-poster]` (the Obla SVG) and `.st-still`. The instrument span is empty and hidden until then; its words:
  `FX.t("stage.points", { n })` = "{n} points" / "{n} punti" plus the existing `FX.t("instr.gpu", { ms })`.
- `--z-stage: 50` (fx-core.css §2): above sheets (3), below menu (59), header (60) and covers (88+).
- Scenes are sticky only with `[data-on]` on `[data-stage-scene]` (desktop >= 1024, motion, not `html.gl-off`, not
  `?stage=0`). On a phone the box is in the flow above the entries (never sticky): steps still pass as entries scroll.
  The host can read `[data-stage-scene][data-on]` to know whether the scene scrolls.
- `[data-stage-anchor="letter"]` is `display: none` below 1024 (rect 0x0): skip it there. EN 1440: 318 x 426 from the
  eyebrow; IT 1440: 318 x 183 beside the lead (the Italian title crosses the column).
- Holds: while `#path` and `#obla` hold, their content does not move and the next sheet rises over it. `#path`'s rect
  stays in the viewport during its hold (its section box is one screen taller: the run); the night's top edge is
  `[data-night]`'s top, its visible bottom is `#contact`'s top (the band covers the night's last screen). The header
  uses exactly that (fx-nav.js `measureNight`).
- Keep-outs: every `.btn` (Consulting's "Write to me") is covered by the default rule; no extra `data-stage-keepout`
  was needed. The Obla SVG is inside the obla box (it is the still; hidden under stage-on).
- When fx-stage.js lands: run `node public/proto/rivista/assemble.mjs` (every page goes stale: the module list gains it).
- Obla geometry note: the eyes sit at `y = -sin(-0.12)·ry` = +0.12 ry, i.e. slightly BELOW the body's middle in screen
  coordinates (engine.ts and gen-icons.mjs both do this); the spec's "0.12 R above the middle" reads the pitch sign the
  other way. The SVG follows the code.

## Deviations from the spec

- Fig. labels are split into the label and its live suffix (", drawn live" / ", disegnato/i dal vivo"), shown only
  under `html.stage-on` (spec §8: "drawn live" only while the stage draws). Same words as the deck.
- Added `ob.still` ("Still: the character drawn from the app's own shape." / "Fermo immagine: …"): the printed Obla figure
  says what it is, as the hero's still line does. Not in the deck.
- Proof lines use the house separator device (`.seps`): "Proof · On request". 2 links to the brand film case (S5 cut
  attributes like the Capabilities proofs), 3 to `#obla`, 4 prints the thesis title as an italic `cite` (lang="en" on IT).
- Italian typography: "l’AI", "Un’impostazione", "l’agente", "l’orlo" with ’ (the build's rule).
- Case pages: the header nav also gains Consulting and the menu the eight entries (links back to the home). The band's
  folio stays home-only (CSS), now "08 ·"; the band markup is byte-identical everywhere, with `data-stage="contact"`.
- Scenes also print (no sticky) under `html.gl-off` and `?stage=0`, not only under reduced motion: without a stage the
  tall entries would be empty screens.
- The claims gate: §9 now ends before §10; §10–§11 are a global source only (no case may cite them).
- PRODUCT §11 leaves the drawing numbers in Obla's files ("4 crests", "2/2.7" would have widened the global truth).

Done (run 2):
- `parts/c-main.index.html`: `data-stage` on every home section (hero in `b-hero.html`, contact in the band of
  `c-main.case.mjs`, so on every page: harmless, the stage runs on the home only), `data-stage-anchor="ring"` on the Now
  frame, `.st-letter[data-stage-anchor="letter"]` in the passes head, `#path` held (`.sc-hold`), the night block
  `div.night[data-night]` with `#consult` and `#obla` (scenes `[data-stage-scene]`, boxes `[data-stage-anchor]`,
  entries `[data-stage-step]`, captions with `[data-stage-instr]`, Obla's SVG `[data-stage-poster]`).
- Headers (index and case): nav Work, About, Consulting, Contact; menu 01–08. Band folio on the home: `08 ·` (CSS, the
  band markup stays byte-identical; case pages print no folio, as before).
- `strings.mjs`: `sec.consult`, `sec.obla`, `co.*`, `ob.*`, `js.stage.points`.
- CSS: night tokens + remap (`fx-core.css` §1), `--z-stage: 50`, header `.is-night` and no-script solid header
  (`fx-nav.css` §1), §12 in `fx-scroll.css` (holds, night sheet, scenes, letter box, print).
- JS: `fx-scroll.js` `buildHolds` (holds + scene `data-on`, motion only; scenes also off under `gl-off` and `?stage=0`),
  `layoutSig` reads the night's sections; `fx-nav.js` header `.is-night`, spy maps `#obla` to no word.
- `PRODUCT.md` §10, §11; `check-claims-proto.mjs` reads §10–§11 as global sources (S9 now ends before §10).
- Letter box verified: the passes head's eyebrow, title and lead have the same left/width/height with and without the
  grid, EN and IT, 1024 and 1440 (box EN 1440: 318 x 426 from the eyebrow; IT 1440: 318 x 183 beside the lead).

## Decisions

- **The two passages (spec 2): a "hold".** The last screen of `#path` holds still while the night rises over it; the last
  screen of `#obla` holds still while the contact band rises over the night. Mechanism (the Now sheet's, generalised):
  the held section's `.row` is `position: sticky` with `top: calc(100svh - var(--sc-hold-h))` (its own height plus the
  section's bottom padding, measured by fx-scroll.js), an empty `<i class="sc-hold-run">` after it is `100svh` tall, and
  the next sheet has `margin-top: -100svh`. All of it only under `[data-on]`, which fx-scroll.js sets inside its
  motion-ok matchMedia: no script, reduced motion, print = plain flow, straight edges by tone, nothing sticky.
- **Night tokens** (inside `.night` the day tokens are remapped, so every component reads unchanged). Contrast (WCAG):

  | token | value | on ground `#0c0e14` | on deep `#12151d` |
  |---|---|---|---|
  | `--night-ink` (type) | `#f6f3ec` | 17.41 | 16.47 |
  | `--night-graphite` (body, lead) | `#cfcabf` | 11.81 | 11.17 |
  | `--night-stone` (captions) | `#9a958a` | 6.47 | 6.12 |
  | `--night-accent` (eyebrows, indices, links, focus) | `#8fa2ff` | 8.07 | 7.63 |
  | `--night-line` (hairline) | `#262a36` | 1.35 | 1.27 (day: `#dcd5c8` on paper is ~1.25) |
  | filled button: paper on cobalt `#2340c9` | | 7.16 (hover `#1a2f99`: 9.92) | |

- **fx-stage.js is not on disk yet** (HOST lane). `head.html` lists it after `fx-nav.js`; `assemble.mjs` leaves it out of
  the built pages while the file is missing (printed as a `fallback ·` line), so no page asks for a 404 and `--check`
  stays green. When the file lands, `assemble.mjs --check` reports every page stale: re-run `assemble.mjs`. Even when
  listed and missing, the boot does not break: the head loader counts `onerror` like `onload` (`s.onload=s.onerror=end`).
