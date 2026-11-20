# m-sound — wave 6, lane SOUND (20 November; run 1 02:31-03:04, cut by the 5-hour limit; run 2 07:31-08:02, Fable 5.2)

- **Done:** both items. One site file changed: `public/proto/rivista/fx-sound.js` (+113 / -13, the page half only; the
  engine is untouched). `sound/render.mjs` and `parts/strings.mjs` are as they were (no new word).
- **Next:** nothing of the brief is left. Open, for an ear and for real browsers: see "Not proven".
- **Decisions:** below ("Item 1").
- **How to run and look:** from the root `python scripts/serve-static.py 5363 .shots/m-sound/dist public` (the Astro
  pages; scripts live from `public/`), or `… 5363 public` for the assembled pages. Then
  `node .shots/m-sound/_scripts/first.mjs --fresh 3` (the first click, timed; `--m` phone, `--neutral`,
  `"--q=?sound=0"`), `matrix.mjs` (every state, S1-S18; `--asm` A1-A4), `late.mjs` (the late room's fade and a browser
  that refuses a context), `walk.mjs --port=5363` (25 navigations), `pstrip.mjs first hdr2about --port=5363` (a strip
  at 50 ms), `nofx.mjs`. Logs in `.shots/m-sound/logs/`. The server is stopped; nothing of mine runs.
- **Needs elsewhere:** the documents still say the first click is "to be built": `CLAUDE.md` §2 (the sound's rule:
  «L'AudioContext nasce alla prima attivazione vera») and §8 (the first click of a visit), `PLAN.md` §0,
  `docs/redesign/rivista-story/60-as-built.md`. New wording: a first press that leaves for another page makes nothing;
  the context is made after the arrival, in an idle moment, on the activation the document already has. No file of
  another lane has to change. `fx-sound.js` reads, and needs kept: `fx:nav:start`, `fx:nav:arrived`, `fx:nav:reset`,
  `fx:ready`, `html.stage-on` / `html.stage-lit`, `<html data-page>`, `window.__rvRouter`, `window.__rvArrive`.

## Item 1: the first press that leaves (what the code does)

- A press, tap or Enter on a link to another page of the site (`leaves()`: the router's and fx-nav's own tests) makes
  nothing when no engine exists yet: the press is held, its `click` decides. The flight starts at once, silent.
- Under the router the room is then owed (`window.__rvSoundLate`). After `fx:nav:arrived` (or `fx:ready` on a plain
  swap) + 450 ms it waits, in steps of 200 ms and at most 12 times, while the arriving page still opens (the stage not
  lit yet, or a finite animation running on the document's clock: the titles), then makes the context in an idle
  callback on the sticky activation and fades the room in (`begin(2.4)`). A browser that refuses (WebKit) keeps the
  context suspended, the toggle "armed", no console line, and starts it at the next gesture.
- While the room is owed, or while any cut is in flight with no engine, no gesture makes a context (a stray press, a
  double click, a click mid-flight); after the flight only a click may bring it sooner.
- Assembled pages: that click ends the document, nothing is made; the next page starts at its first gesture as
  today, even if it is again a link (`rv-snd-first` in sessionStorage: once a visit, or a visitor who only follows
  links would never hear the room). A second press while the page leaves makes nothing either.
- Run 2 added: (a) **S14 fixed**: after a reload a first click on a link made a context 227-249 ms after the press,
  at the change of page. Cause: `init()`'s `mayResume()` branch (an assembled page arriving by a cut) also ran on the
  page the router swapped in. Now never on a swapped page (`window.__rvSoundRan`). (b) the in-flight rule above. (c)
  if a document ever ends with the room still owed (the router gave the page to the browser: a failed swap, a slow
  network) the visit stops counting on the router (`rv-snd-hard`): a first press on a link then starts the room in
  the press, as on the assembled pages. (d) a page back from the browser's cache makes a context only if that
  document was ever pressed. (e) the room's key comes from `<html data-page>` when it names a room: the 404 page
  keeps its own chord at any address (a host serves it at the missing address; by the path it played the cover's).

## Proof (20 November 07:48-07:59, the machine at 1-8 % load, all on the final file, written 07:44:51)

- **The first click, fresh browsers, the Astro build** (`logs/first-final-2.log`): desktop `fx:nav:start` +3 ms after
  the press (three runs; `?sound=0` +3), no AudioContext at +150 / +400 / +700 ms, one made at +2400 to +2416 ms
  (39-46 ms, no long task), running. Phone: +3 to +4 ms, made at +2381 to +2395. Before the change, same probe: +21 to
  +67 ms and the context in the press (`logs/first-before-d.log`). A first neutral click: made in the press, as today.
- **Every state** (`logs/matrix-astro-final.log`, `matrix-asm-final.log`): `?sound=0`, neutral click, Back, Forward,
  the toggle off and on and remembered over a reload, off before and after the first click, reduced motion (made
  487 ms after the press), keyboard, a second click before the room is made, a press that ends off the link, phone,
  the language link, a reload, `?stage=0`, `?gl=0`, Back before any gesture with a click mid-flight, a failed swap,
  the 404 at another address; assembled: first click, second page, neutral first, a double click. All as written
  above. Console clean (the one line in S17 is the probe's own aborted fetch).
- **A walk of 25 navigations by clicks** (`logs/walk-25.log`; it starts with a click on a header link): at its three
  counts (after 11, after 18, at the end) one context in the document, running, on the page's own room (home,
  consult, home), no voice alive at the end; console clean, the stage asleep (0 frames in 3 s after 19 s).
- **The late room** (`logs/late-2.log`): -43.7 dBFS at 0.25 s, -38.2 at 0.5, -34.5 at 1 s, -32.8 at 1.5 s; a browser
  that refuses, imitated: suspended, armed, clean; running 700 ms after the next press.
- **A `?fx=` list without sound** (`logs/nofx.log`): no toggle, no context. **A strip at 50 ms** of a cold first click
  (`strip/first/sheet.jpg`, looked at): the text is already leaving at 50-150 ms.
- **Gates at 07:59:** `node --check`, `assemble.mjs --check` exit 0, claims OK (32 pages), Astro build exit 0, PARITY
  OK, asserts ok, claims on the build OK.

## Item 2: the critic's sound findings, checked on the walk (nothing changed)

`sound/render.mjs` with `.shots/n-final/sound-cues.json` (671 cues, 31.5 s), read with
`.shots/n-integrate/_scripts/wav.mjs` (`logs/walk-levels.txt`) and through a 4th-order high-pass (`_scripts/small.mjs`,
`logs/walk-small.txt`).

| | asked by the critic | the walk |
|---|---|---|
| the room at rest | weight between 300 Hz and 3 kHz, -38 dBA or more (it was -45.6 dBA, 73 % at 60-150 Hz) | -31.6 dBFS, **-36.6 dBA**; 17 % at 60-150 Hz, 49 % at 150-400, 27 % at 400-1k, 7 % at 1-3k; centroid 417 Hz |
| on a laptop's speakers (above 300 Hz) | audible | keeps its level within **2.7 dB** (-35.0 dBFS) |
| on a phone's (above 500 Hz) | | 7.5 dB lower (-39.8 dBFS): there, but faint; the cut loses only 2.7 dB |
| a scroll | small, tonal, never the loudest (it was +8.5 dBA, a plume to 10 kHz) | **+0.6 dBA** at its crest at a reader's speed; 0.2 % of its energy above 3 kHz, as the room: no noise |
| the cut | the largest gesture | -31.0 dBA whole, **+5.6 over the room**; peak -13.3 dBFS |
| every room | | Work -36.3, a case -36.5, Contact -37.6 dBA |

Verdict: the two findings hold as fixed by wave 5; nothing is still wrong by measure, so the engine was left alone.

## Not proven

- Nobody has heard it: every level is a measure.
- Safari, Firefox, a real phone: the refusing browser is imitated in Chrome. A really hidden tab and a return from the
  browser's cache are read in the code only.
- The browser's task for the context is still there (38-46 ms here, 50-160 ms on a cold or busy machine): it now
  falls at rest, about 1.3 s after the room stands (2.4 s after the press); on the cover about 3 s after it (the
  name's opening outlasts the 2.4 s of waiting).
- No impeccable and no Context7 for a library: no pixel, markup, style or stage code changed and no library is
  called. Context7 (MDN) was read once for the autoplay policy the late room rests on: an AudioContext needs sticky
  activation, not a fresh gesture; one made without it stays suspended until `resume()` in a gesture.

- **CUT AT 03:04 BY THE 5-HOUR LIMIT (director, 07:33).** The run of 02:31-03:04 was cut mid-work; a new run of this
  lane started at 07:31 with the same brief. Digest of the cut run: `.shots/_director/m-sound-run2-digest.md`. Run 2
  read it and finished from the code on disk.
