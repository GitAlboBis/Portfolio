# n-fix-sound: the critic's findings on the sound, answered (13 November)

- Lane: FIXSOUND. First run 02:21 to 02:33 (cut by the usage credits in the middle of an edit; digest
  `.shots/_director/n-fix-sound-first-run.md`); second run 03:27 to 04:02. The code wins over anything here.
- Files changed (uncommitted): `public/proto/rivista/fx-sound.js`, `public/proto/rivista/sound/render.mjs` (the demo's
  cues and its header), `public/proto/rivista/parts/a-header.html` (`title` on the toggle) and the 32 generated pages.
  Nothing else: `fx-scroll.js`, `strings.mjs`, `head.html`, `chrome.css` and `web/` are as the build lane left them.
- State: DONE. Nothing is half-way. Servers 5341 and 5349 stopped.
- Gates at 03:58, after the last change (`fx-sound.js` written 03:57:48): `node --check`; `assemble.mjs --check`
  exit 0; `check-claims-proto.mjs` OK; Astro build into `.shots/n-fix-sound/dist` exit 0, PARITY OK (144 shared
  files, 0 differ), asserts ok (32 pages), claims on the build OK. Then live on that file: `logs/kbd2.log` (Astro)
  and `logs/asm.log` (assembled), console clean on both.

## The damage of the cut, repaired

The first run's last edit had replaced BOTH tables (`PAGES`: `tones`, `mix`, `color`, `air`; `L`: `tone`, `low`, `air`,
`eye`, `body`, `rush`, `rushLow`, `door`) while the engine still read `P.ratios` and `L.room`: `partG.gain.value =
L.room` was the non-finite value. The change is finished, not undone. Console clean on both builds: Astro
(`logs/snd-a.log`, `snd-b.log`, `snd-c.log`, `kbd2.log`), assembled (`logs/asm.log`, `logs/back.log`).

## What plays now, and at which level

Offline, the 30 s demo (`demo.wav`), the critic's analyser (`.shots/n-critic/_scripts/wav.mjs` through
`_scripts/an.sh`); before = `before.wav`, the build lane's engine. Tables: `logs/demo-before.txt`, `logs/demo-after.txt`.

| | before | now |
|---|---|---|
| the room at rest | -33.1 dBFS RMS, -45.6 dBA; 71 % of its energy at 60-150 Hz, 0.1 % over 1 kHz; centroid 138 Hz | -31.6 dBFS, **-36.6 dBA**; 17 % at 60-150, 48 % at 150-400, 27 % at 400-1k, 7 % at 1-3k; centroid 418 Hz |
| every page's room | not measured | -36.5 to -37.4 dBA on the eight pages (`pages.wav`); within 0.7 dB over two minutes (`still.wav`) |
| a scroll, at its crest | -37.5 dBA, +8.1 over the room, a plume of noise 0.7 to 10 kHz | -35.0 dBA, **+1.6 over the room**, two tones of the room's chord, no noise |
| a row of the index held | -40.3 dBA | -34.1 dBA (+2.5 over the room) |
| the cut, whole (1.1 s) | -40.6 dBA, under a row and a scroll | **-30.3 to -30.6 dBA, about +6 over the room** (toward Contact -32.0 to -32.3); the largest event by 3.3 dB (a row held -33.9) |
| the cut's peak (the door) | -17.2 dBFS | -12.6 to -13.8 dBFS over three renders. With the door 1.5 dB louder it had reached -10.5 offline and -10.6 live, the knee of the shaper (straight to -10.5), so `L.door` went from 0.026 to 0.022; NOT measured live after that |
| the 0.5 s after the door | -38 dBFS live (the room stepped back) | the new room at its level (-36.5 dBA; live -31.7 to -31.0 dBFS from 700 ms) |
| step, menu, copy | peaks -20 to -21 dBFS | -35.1, -35.0, -34.5 dBA; peaks -18.2, -18.7, -19.3 dBFS |

- THE ROOM (`PAGES.tones`, `L.tone`, `L.low`, `L.air`): a chord of up to four pure tones between 220 and 790 Hz, each
  page its own (cover D A E, Work C F C G, About an E minor triad, Consulting a G major one, Obla C E G D, Contact an
  A major one, a case B flat F C F, the 404 B E B); no two tones nearer than a minor third. Under it the old root and
  fifth; around it the air, now open to 1.3-3.2 kHz. Every page as loud to the ear as the cover (`norm`, `airAmp`).
  A change of page never slides the chord: it steps back, the tones are set while silent, the new chord opens with
  the door (`setPage(key, t, glide, openAt)`).
- THE EYE (`L.eye`, `L.body`): the scroll lights two overtones of the room's chord and a faint weight. No noise, no sweep.
- THE CUT (`navStart`, `door`, `L.rush`, `L.rushLow`, `L.door`): `fx:nav:start {ms, door, glass, dawn, back}` schedules
  everything at the click, on the audio clock: the rush tops at `glass`, the door sounds there (a low touch, the
  block's body, and two bright ones leaving the centre; coming in from the ears when `back`), the next page's chord
  opens with it. `fx:nav:covered` (the router sends it on a page already leaving) is no longer needed for the door.
  Assembled pages (`hard`): the document ends at `door`; the rush closes there and the page that arrives plays the door.
- THE FIRST GESTURE (`onGesture`, `ready`): a press, a finger lifted, a key that acts start the room. Tab and the
  modifier keys make the engine and leave it silent and suspended, so a keyboard reaches the toggle (9th stop) before
  any sound and the browser's price for a context is paid at a Tab, not at Enter on a link.
- Also: an engine that comes up after a cut began picks the cut up from where it is (`flight`); `pagehide` leaves the
  time for the next page; `fx:nav:reset` puts the room back on this page's chord.

## Per finding (the critic's order)

- **1 the room is not there on small speakers: FIXED by measure, not by ear.** -36.6 dBA (asked: -38 or more), 82 %
  of its energy between 150 Hz and 3 kHz. `spec-ba-small.png` (the whole demo, before over after).
- **2 the scroll is a wash: FIXED by measure.** The plume is gone (`spec-cut-before-after.png`, 0.7 to 2 s): two thin
  tonal marks at about 590 and 880 Hz, +1.6 dB at 2400 px/s, under +1 dB at a reader's speed. Live, a reader's scroll
  is +1.1 dB RMS over the room; one 100 ms window reached +3.0 where a step's touch of glass fell in it (`logs/snd-a.log`).
- **5 the first press sticks: STAYS, the browser's price.** `new AudioContext()` cost 51 to 79 ms in eight fresh
  browsers on a quiet machine and 126, 146 and 157 ms in three more: one long task of 56 to 162 ms. No option is cheaper
  (`logs/accost.log`: default 53-57, interactive 50-54, playback 47-61, balanced 57-79, a fixed rate 125-329, no sink
  105-203). It is made at the earliest activation (a mouse's press, a finger's lift, a key), never in the click's
  handler, as the director decided; no warm-up, nothing at pointerover. With a press of 90 ms `fx:nav:start` came 2
  to 3 ms after the click (`logs/firstclick-d.log`); with a tap the click waits for it (phone: 66 and 126 ms,
  `logs/firstclick-m.log`). New: on the keyboard it is paid at the first Tab.
- **9 the cut is the quietest event: FIXED by measure.** See the table. Live (`logs/snd-a.log`, cut to About, per
  100 ms, dBFS RMS / peak): -32.0, -35.2, -34.8, -31.0, -28.5, **-25.9 / -13.9** (the door, 520 ms after the click),
  -28.4, -31.7, -31.2: the door is +5.6 dB over the room for 100 ms and the new room stands at its level from 700 ms.
  The last run of part a (after the softer draw-in, the door still at 0.026): -31.9, -34.3, -33.8, -31.2, -28.8,
  -26.2 / -10.6, -29.3, -32.0, -31.1.
- **15 the room dies on Back on the assembled pages: STAYS, the browser's rule.** After Back, Forward or a reload
  the new document has no activation (`navigator.userActivation.hasBeenActive` false, recorded by the page itself:
  `logs/back.log`); a context made there would be refused and Chrome would warn. After a click on a link the
  activation is carried and the room restarts (it does, four cuts of four). The pages are not restored from the
  browser's back-forward cache either, with the sound on or off. What changed: `pagehide` leaves the time, so a
  browser that allows it restarts the room on any arrival, not only on a cut. Under the router the room never breaks.
- **18 the toggle has no word: FIXED.** `title="Sound"` / `"Suono"` (the same string as the `aria-label`), read back
  from the page (`logs/snd-b.log`, `logs/kbd2.log`). The first Tab no longer starts the room. Not proven still:
  Safari with audio, Firefox, a really hidden tab (simulated: suspended at 400 ms, running again on return).

## Asked by the other lanes, decided by the director

1. The context at the earliest real activation, never in the handler that starts a flight: it is (finding 5).
   Nothing at pointerover, no `enumerateDevices()`.
2. The door timed on the eye in the glass: `detail.glass` for the door, `detail.door` only for the page (the contract
   in the first lines of `n-fix-flight.md`). Measured: covered at 416 to 435 ms, the door's peak in the 500 ms window.
3. `.shots/n-sound/_scripts/safe.mjs` is where it was.

## What was kept (the critic's "good")

Nothing before a gesture (0 contexts, also after a scroll); one context and the same engine through twelve soft
navigations, live AudioNodes after GC 62 > 64 > 64, 0 voices alive at rest; off in 50 ms and remembered, a click
while off makes no context; `?sound=0`; focus ring 2 px cobalt offset 4 px, Enter and Space toggle; DC under 0.0002;
the stage asleep with the sound on (0 frames in 3 s after 19 s of quiet, `logs/sleep.log`). NOT kept: the peak
"never over -16.7 dBFS": the door is the peak now, by design.

## Open, ranked

1. Nobody has HEARD it. Whether a chord of pure tones reads as a room or as a hum on real speakers, the balance of
   chord and air, whether the cut at +6 dB is right: Alberto's ears. Every number here is a measure.
2. Finding 5: the first press or tap of a visit still holds one task of 56 to 162 ms. The other way
   (a first press on a link flies at once and silent, the room comes in on arrival) was not taken: a call for the
   director or Alberto.
3. Finding 15: after Back or Forward on the assembled pages the room waits for a press (the toggle shows it armed).
4. The peak rose from -16.7 to about -13 dBFS (offline, three renders); the live peak after the last lowering of the
   door was not measured (before it: -10.6 to -13.3 over three cuts).
5. A draw-in before the door: the room 1.5 dB (offline) to 2.5 dB (live) under its level for about 200 ms.
6. Not run: Safari with audio (Playwright's WebKit here has no Web Audio at all: toggle hidden, silent, console
   clean, `logs/webkit.log`), Firefox, a phone's speaker, the 25-navigation walk, GPU times, first frames against HEAD
   (nothing of the sound runs before a gesture but the idle tables), reduced motion and the printed states (their code
   did not change). Context7 did not connect; no library call was written.

## Needs elsewhere

- Docs lane: CLAUDE.md (the switch `?sound=0`; `fx-sound.js` and `sound/render.mjs` in the file map; `sound/render.mjs`
  is not served on a deploy); DESIGN.md's header (the toggle: four bars, `title`, armed / run / off).
- Every lane's probes (a note, no change asked in `scripts/lib/headless.mjs`): `page.evaluate` runs with a user
  gesture, so `navigator.userActivation` read through it is always true; record it from an init script instead
  (`_scripts/back.mjs`).
- Integration (optional): the assembled pages are never restored from the back-forward cache (`pageshow.persisted`
  false with the sound off too); the reason was not searched.

## How to run and look

- `node public/proto/rivista/sound/render.mjs "" out.wav` (the demo), `sh .shots/n-fix-sound/_scripts/an.sh out.wav`
  (its segments), `node .shots/n-fix-sound/_scripts/peaks.mjs out.wav t0 t1 f0 f1 step` (spectral lines).
- Servers: `python scripts/serve-static.py 5341 public`; `python scripts/serve-static.py 5349 .shots/n-fix-sound/dist public`.
- Probes in `.shots/n-fix-sound/_scripts/`: `c-snd.mjs --port=5349 --part=a|b|c` and `c-asm.mjs --port=5341`,
  `c-firstclick.mjs --port=5349 [--m]` (the critic's, writing here), `kbd2.mjs` (the keyboard), `back.mjs` (the
  activation after Back), `accost.mjs` (a context's cost by options), `c-sleep.mjs`, `webkit.mjs`.
