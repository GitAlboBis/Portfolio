# k-sound — the sound goes, entirely (wave 8, 21 November)

- Done: everything in the brief (below). The lane's server (5401) is stopped; no process of the lane is left.
- Next: nothing. The director commits; the docs lane takes the documents listed under "Needs elsewhere".
- Decisions: Alberto 21 Nov «Il suono è orribile, togli tutti i sound effects»; the director: no module, no toggle, no
  switch, no AudioContext ever, no renderer tool. No guard regex added to assemble.mjs (it would itself be a reference).
  "Sound design" in strings.mjs, cases.json and the About partial stays: it is Alberto's craft (CV), not the site's sound.
  The fx:part event stays (fx-nav.js; cheap, no listener left after the sound, may serve another lane).
- How to run and look: `node .shots/k-sound/_scripts/nosound.mjs --port=<p>` (AudioContext counter, first click, strip
  in .shots/k-sound/strip/) and `node .shots/k-sound/_scripts/hdr.mjs --port=<p>` (header crops against the live site,
  in .shots/k-sound/hdr/), with `python scripts/serve-static.py <p> .shots/k-sound/dist public`.

## What changed (working tree only; the index is untouched)

- Deleted: `public/proto/rivista/fx-sound.js` (941 lines), `public/proto/rivista/sound/render.mjs` (the folder).
- `parts/head.html`: `'fx-sound.js'` out of the loader's list (the stage's boot URL is still taken from the list's last
  entry, now `fx-stage.js`, same folder; `../fx-stage.js` under it/).
- `parts/a-header.html`: the toggle (`button.hdr-snd[data-snd]`) and its comment out.
- `parts/strings.mjs`: `chrome.sound` and its comment out (166 strings).
- `css/chrome.css`: the toggle's block (bars, states, dawn colours, reduced motion, print), `.hdr-snd` out of the
  entrance, its delay, the arrival's pause and the reduced-motion list; `.hdr-nav { margin-left: auto }` moved into the
  one desktop rule with a comment on the header's right end.
- `fx-nav.js`: the fx:part comment no longer names the sound (file kept LF: an edit had left it CRLF, normalised back).
- `fx-core.js`: the header comment's script order (with fx-motion) and count (eight scripts, was "ten").
- `web/scripts/release.mjs`: the LEFT_OUT entry for `sound/` out.
- `assemble.mjs`, `web/src/**` (router excluded), `asserts.mjs`, `parity.mjs`: nothing of the sound was there.

## Proof (21 Nov, about 12:05–12:30)

- Gates: assemble ok; `--check` exit 0; claims OK (34 pages). Astro build into .shots/k-sound/dist exit 0; PARITY OK;
  asserts ok (1154 local references); claims OK. Release (VERCEL_ENV=production): its three [release] lines, exit 0, 154
  files, its self-check passed (every address a file of the release); no fx-sound.js, no sound/ in it.
- nosound.mjs on the Astro build (port 5401), AudioContext / webkitAudioContext / OfflineAudioContext wrapped before
  any script: 0 constructions at the load, after the visit's first click (header Work), after the flight, after a
  scroll, a key, a press on an empty point, a second flight (header About); phone IT (tap on a cover link, scroll): 0.
  First click: fx:nav:start +6 ms after the press, covered +215, arrived +1006 (desktop); phone tap +8 / arrived +800.
  Storage keys read: rv-pt, rv-place, rv-y|… (no rv-sound, no rv-snd-*); media devices never read. Console clean; no
  failed request, no response >= 400. The strip (strip/first-click-work.jpg, 50 ms): the eye pushes into the name at
  once, the door, Work's gallery, the title rising from 900 ms.
- hdr.mjs (live site = HEAD with the toggle, against the lane): desktop 1440 DPR 2, EN and IT, the cover's top and
  Work read: EN / IT now ends on the gutter (1314–1397, 43 px from the edge = 3vw), where the toggle ended (1343–1397);
  the scene's name, which takes the free space, is 62 px longer. Phone 390 DPR 2: MENU on the gutter as before
  (316–374); the toggle (248–292) gone; the scene's name keeps its box (16–250, "Eleven works" / "Undici lavori").
  Looked at: hdr/desk-right.png (1:1), hdr/desk-full.jpg, hdr/phone.png (1:1). Console clean.

## Needs elsewhere

- `css/motion.css` (SMOOTH) line 95: `right: calc(var(--gut) + 7.75rem)` kept the phone's scene's name clear of the
  toggle (248–292) and MENU (316–374, 59 px wide at 18 px). With the toggle gone, `calc(var(--gut) + 5rem)` gives the
  name 44 px more (box 16–294 at 390) and still clears MENU's box by 22 px (its word by 34): fewer Italian chapter titles
  would end in an ellipsis (CLAUDE.md §8). Its comment on line 74, «it ends before the sound's toggle and MENU», →
  «it ends before MENU».
- `css/cuts.css` line 93: drop `, .hdr-snd` from the `:is()` list (a dead selector of the removed toggle; harmless).
- `fx-scroll.js` (SMOOTH) line 63: the comment's lane tag «(lane n-sound)» before the fx:step contract could go (the
  contract stays: fx:step is in the nav events' list).
- Documents (the docs lane): CLAUDE.md (§1 «Il sito ha un suono», §2 «Il suono», §4 the file map's fx-sound.js,
  sound/render.mjs and the header's «interruttore del suono», the switches table's `?sound=0`, `?fx=` with sound and
  `__rvSoundDbg`, §6 the render command, §8 «Il suono»); DESIGN.md (front matter `sound-toggle`, `sound-toggle-off`,
  Overview, the header row of Typography with `.hdr-snd` and `--t-nav`'s use, the Layout table, Shapes, «The sound
  toggle», the scene's name «clear of the sound toggle and MENU», the Sound section, Motion's «flies at once and silent
  (see Sound)», the printed state's list); `.impeccable/design.json` (the sound's entries); README.md line 9; PLAN.md;
  HANDOFF.md; docs/redesign/rivista-story/60-as-built.md.
- Optional, not the sound: `parts/c-main.about.html` line 22 writes «Sound&nbsp;design» in the partial instead of a
  `{{t:…}}` twin (the same words in both editions, so assemble passes).
