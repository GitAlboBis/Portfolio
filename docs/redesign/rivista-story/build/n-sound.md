# n-sound: the room's sound (Web Audio, all synthesized)

Second run (12 Nov 23:20 to 13 Nov 00:45), after the first (22:37 to 22:59) was cut; its digest is
`.shots/_director/n-sound-first-run.md`. The code wins over anything here.

- Done (on disk, uncommitted): `fx-sound.js` (new: the engine and the page's binding), `sound/render.mjs` (new: cues
  to a WAV, offline), `parts/strings.mjs` (`chrome.sound`: Sound / Suono), `parts/a-header.html`
  (`button.hdr-snd[data-snd]`, four bars), `parts/head.html` (`fx-sound.js` last in the scripts' list),
  `css/chrome.css` (the toggle), `fx-scroll.js` (`fx:step {scene, step, of}` where the active step changes).
  Nothing in `web/` needed a change: `shared.mjs` copies every `fx-*.js`, the components print the partials, parity
  has nothing new to list (`sound/` is a tool and is not copied into the Astro build).
- Gates (00:26, after the last change the builds read): `assemble.mjs --check` exit 0, `check-claims-proto.mjs` OK;
  Astro build into `.shots/n-sound/dist`: PARITY OK, asserts ok (32 pages), claims OK.
- Next: nothing of mine is open; see "Open" for what waits for ears and for the director.
- Needs elsewhere: see the end.

## What plays, and at which level (offline, 48 kHz, after the limiter; `_scripts/levels.mjs`, `rush.mjs`)

| role | what | level |
|---|---|---|
| room | air (pink noise from 90 Hz to the page's colour, one loop read at two speeds) and three or four slow partials (root, fifth, ninth; Contact: root, octave, tenth, twelfth), each page its own root (cover D, Work F, About E, Consulting G, Obla C, Contact A, a case B flat) | -32.4 to -33.1 dBFS RMS (air -37.4, partials -35); within 0.5 dB second by second |
| eye | band-passed air (500 to 2400 Hz with the speed) and a low body at the page's root, following the scroll | with the room -28.5 RMS at 2000 px/s and more; silent 1 s after the last scroll; nothing during a cut |
| glass | a scene's step, when the reader's scroll brought it: four inharmonic partials (1, 2.756, 5.404, 8.933), 0.8 to 1.1 s, a degree of the page's mode, panned 0.35 toward the figure | peak -20.2 |
| index | the cover's four rows: D4 A4 C5 E5, held while the row has the hand or the focus | peak -19.6, +1.7 dB RMS over the room |
| cut | rush: air rising 260 to 3000 Hz (5200 toward Contact), at its top when the door comes; door: two bright touches of glass (C6; E6 with a fifth above toward Contact) leaving the centre for both ears; the room steps back to 0.55 and returns at `arrived`; under the router the room glides to the new page's tone in 1.4 s | the cut's peak -16.9 to -21 over 60 renders; the rush's top -30.3 RMS (-33 when the door comes at 0.41 s) |
| hand | tick (10 ms of air at 3.8 kHz); copy: two rising notes of glass; menu: 0.3 s of air, up to open, down to close | tick peak -27.4 (inside the room's own peaks); copy -21.2; menu -21.1 |
| Obla | steps 1 to 5: two notes of a small voice (triangle, a formant at 1.1 kHz, vibrato) | peak -18.9, -29.9 RMS over 0.5 s |

The chain ends in a limiter (a compressor, -12 dB, 20:1) and a ceiling (a shaper: straight to 0.3, never above
0.49). With every level forty times too high and every role piled up the peak is -6.2 dBFS. Demo
(`.shots/n-sound/demo.wav`, 30 s): mean -32.1 dB, max -17.9 dBFS, DC 0.000002, no flat top.

## Proof (headless Chrome, `--autoplay-policy=user-gesture-required`; ports 5341 assembled, 5348 Astro)

- Before a gesture: no AudioContext, also after a scroll; console clean. First click, tap or key (the first Tab):
  context running, the out gain 0.15 at 0.27 s, 0.56 at 0.55 s, 0.88 at 1 s, 0.97 at 1.5 s; the analyser (a mono
  fold) reads the room at -34.1.
- Live levels: scrolling -32.1; a row held -31.6 (peak -21.6), let go: 0 voices; a step after a scroll: glass (peak
  -22), a step with no scroll: nothing; Work by a reader's scroll: 6 steps, 6 voices, peak -21.1; Obla: 5 steps, 10
  voices, peak -19.1; copy on Contact: a tick and two notes; menu on a phone: a tick and a breath each way.
- Toggle: silent and the context suspended 100 ms after the click; `localStorage rv-sound = "0"`; after a reload
  `aria-pressed="false"` and a click makes no context; on again by the toggle. Keyboard: Tab order Skip, name, the
  five pages, language, Sound (phone: Skip, name, Sound); focus ring 2 px accent (cobalt on the morning), offset 4 px;
  Enter and Space toggle.
- Hidden tab (simulated: `document.hidden` and `visibilitychange`; a headless tab cannot be hidden): silent and
  suspended at 150 ms, back on return.
- `?sound=0`: no context on that page nor on the next page after a cut; the toggle turns it on and clears the visit.
- Astro build: the same context after five soft navigations (desktop, English) and after three on a phone in
  Italian through the menu; 21 voices made, 0 alive at rest; the router's counts first to last: listeners 89 to 89,
  observers 11 to 10, timeouts 0, frames 2, tweens 1; in a cut the level never under -41 (the room stepped back,
  never silent); events: covered 410 to 520 ms after the click, arrived 1050 to 1390 ms; console clean.
- Assembled build: every page arriving by a cut is running again, with the door, without a new gesture; its context
  is made at 80 to 230 ms of the page's own time, under the cover (first stage frame about 390 to 440 ms, uncovered
  490 to 570 ms); console clean.
- Sleep with the sound on (Work): 0 stage submits in 3 s after 19 s of quiet; no long task while asleep.
- First frame, cold loads, the same tree with and without `fx-sound.js` (its request refused): desktop median 694 ms
  and 694 ms (5 each), the same 50 to 55 ms tasks in both; phone 898 and 1011 ms (3 each: noise, another lane was
  rendering).
- Other states: `?fx=` without `sound`: toggle hidden, no context; `?stage=0`, `?gl=0`, the 404, a case: the sound
  works; reduced motion: sound on, 0 animations on the bars, two states.
- Header: fits with no overlap at 1440, 1024 and 390 in both languages; the toggle 54 x 44 px (44 x 44 on a phone);
  the bars 3 px wide, 14 px tall at 1440 (4 and 17 at 1920 DPR 1: whole pixels).

## Cost

- Before the gesture: the noise table and the reverb's response computed in idle slices of 6 ms at most (28 to 67 ms
  in all on this busy machine), no AudioContext.
- At the gesture: the graph 3 to 5 ms (38 ms at 4x CPU), the reverb's response set in the next idle moment (7.7 ms).
  What stays is the browser's own `new AudioContext()`: 15 to 105 ms for a document's first one when its audio
  service is up, and one long task of 112 to 190 ms at the first press of a cold browser (up to 555 ms while other
  lanes were rendering). A mouse pays it at the press, before the click, so what the click starts is not held up
  mid-way. It was 360 ms before this run (tables and reverb at the click).
- At rest: no timer, no animation frame; the bars are four compositor animations (WAAPI, transform).

## Decisions

- Components searched (first run, 22:39; this session Magic UI and ui-layouts did not connect): Magic UI 11 hits for
  "sound toggle audio bars", none a sound toggle; ui-layouts 0; OriginKit 0; Vengeance UI 0; 21st.dev search "Mute
  Toggle Button" (an icon and a label swapped on press). Taken as a mechanism: a real button with `aria-pressed` and
  two visual states. Rejected: the speaker icon and the swapped label (the sign here is four bars and no word), any
  rounded pill or glow.
- The toggle: bars as tall as the header's capitals, on their baseline, in em of the header's face rounded to whole
  pixels; off = the bars lie down into one flat rule (four dots read as an ellipsis); after the language behind a
  rule like its own; on a phone beside MENU, and it stays there with the menu open.
- The room: the weight moved from the low partials to the air (the first run's room was -32.5 of pure tones under
  150 Hz and -44.5 of air: nothing on a laptop's speakers).
- The rush is timed on the door, not on `ms`: `fx:nav:start {door}` (ms to the door) when given, else 0.36 of `ms`
  under the router and 0.58 on the assembled pages; it holds 0.3 s for a late door and `covered` ends it.
- Assembled pages: at `covered` the rush closes in 50 ms (the document ends there), the next page opens with the door.
- The eye and the steps keep quiet during a cut, for 0.9 s after a page comes up, and for a jump of more than a
  screen in one scroll event; a step sounds only within 0.7 s of the reader's own scroll.
- A module of FX (`FX.register("sound")`): a `?fx=` list without `sound` leaves it out and hides the toggle.
- Fixed from the first run: the glass's top partial never decayed (its attack ended after its decay began) and ended
  in a click; the rush had sound under 45 Hz; the 4th partial pulsed on pages that do not use it; the engine's
  `onstatechange` painted the old page's button after a soft navigation.
- Tried and dropped: a context born on the silent sink and switched to the speakers afterwards (the same cost for a
  document's first context). Not done on purpose: warming the browser's audio service before the gesture with
  `navigator.mediaDevices.enumerateDevices()` (it took the cold press from about 130 ms to 20 to 45 ms here, but it
  reads the visitor's media devices only for a side effect: Alberto's call).
- Context7 did not connect in this session. No new call into GSAP, Lenis, Anime.js or Astro was written: the eye
  reads `window` scroll events, the bars are plain WAAPI (`Element.animate`), the module registers with FX.

## How to run and look

- Render cues to a WAV with no window: `node public/proto/rivista/sound/render.mjs [cues.json] [out.wav] [--dur=30]`
  (the cues and a cut's real timing are in the file's header; without arguments the 30 s demo). Look:
  `ffmpeg -i out.wav -lavfi "showspectrumpic=s=1600x640:legend=1:scale=log:fscale=log:gain=4" spec.png`.
- Servers: `python scripts/serve-static.py 5341 public`; `python scripts/serve-static.py 5348 .shots/n-sound/dist public`.
- Probes in `.shots/n-sound/_scripts/`: `levels.mjs`, `mix.mjs`, `rush.mjs` (offline); `live.mjs [--m]`, `final.mjs`,
  `steps.mjs`, `kbd.mjs`, `off.mjs`, `hdr.mjs` (captures in `.shots/n-sound/hdr/`), `hard.mjs [--n=3]` (assembled
  cuts), `soft.mjs [--it] [--m] [--n=5]` (Astro), `cost.mjs [--cpu=4] [--m]`, `first.mjs [--m]`.
- A probe that must stay silent: `?sound=0` on its first URL (it holds for the tab), or a `?fx=` list without `sound`.
- A probe NEVER clicks a `mailto:` link: Windows opens the mail app. At 23:42 a tap of mine at (200, 600) on the
  phone cover hit "Write to me" and Outlook's new-message window opened on the desktop (closed at once).
  `_scripts/safe.mjs`: `guard(page)` cancels mail links, `emptyPoint(page)` finds a point that is not a control.

## Open

- For ears (Alberto's to judge by listening): how loud the room is and its balance of air and low tone; whether the
  eye reads as air or as a wash (the role nearest to water); the cut (is the rush too shy at -30 dBFS RMS, is the
  door glass); the phrases the steps play, the rows' chord, Obla's five motifs; the room's 1.4 s glide between
  pages; the reverb's length.
- The first press of a cold browser still costs one long task (the browser's own, see Cost).
- Only Chrome was run. By reading: Safari has no idle callback (the tables are computed at the gesture) and Firefox
  no `cancelAndHoldAtTime` (the fallback is in `glide`).

## Needs elsewhere

- `fx-nav.js` (n-flight / integration), optional: add `door` (ms from the click to `fx:nav:covered`) to
  `fx:nav:start`'s detail; the sound already reads it and then needs no estimate.
- Project documents (docs lane): CLAUDE.md's switches (`?sound=0`), file map (`fx-sound.js`, `sound/render.mjs`),
  what a deploy does not serve (`sound/render.mjs`), the golden rule on probes (no mail links); DESIGN.md's header
  (the toggle).
- Every lane's probes: a tap at about (200, 600) on the 390 x 844 cover is the mail link (see above).
