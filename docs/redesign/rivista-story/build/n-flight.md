# n-flight — the cut as a flight (wave 5)

NAV EVENTS (the contract, final): window CustomEvents through FX.emit.
- `fx:nav:start { to, side, dawn, back, ms }` at the click (fx-nav.js cutTo). `back`: Back (the flight runs backward). `ms`: planned time from now until the new room stands.
- `fx:nav:covered { to }` when the page changes (Astro build: rv-router.js swapPage, sent on the OLD page's FX just before it leaves; assembled pages: fx-nav.js, as at HEAD). TIMING: under the router the page changes about 0.1 s BEFORE the eye is through the door (desktop: about 420 ms after the click, the door at 520; phone: about 345, the door at 430), so the new page's start-up falls in the flight. Toward Contact and toward the cover it changes at the door. The old page's modules are gone from that moment: anything that must sound at the door itself is scheduled from `fx:nav:start` (520 ms desktop / 430 ms phone) or from this event plus 0.1 s.
- `fx:nav:arrived {}` when the new room stands (the new page's FX; fx-nav.js arrive / arriveFlown).
- Unchanged: `fx:nav:uncovered` (the page's text may rise), `fx:nav:reset`, `fx:stage:frame`, `fx:stage:lit`, `fx:stage:full` (internal: the page may change).

## What it is now (second run; the first was cut at 22:59, relaunched 23:20, 12 November)

One dolly of the eye along its view axis, on real time (`stage.fly`, LOOK.flyDoor / flySwap / flyHold / flyVeil / flyGlow in stage/stage.js):
- LEAVING: the text leaves by a masked exit (fx-nav.js leaveText: every block on screen up behind a straight mask, 150 ms, the rest out by 190 ms). The eye accelerates forward (u squared, 520 ms desktop / 430 phone) 1.25 D; the page's plates grow and pass the lens (the orbit camera takes the free camera's near rules in a flight), the wall's cells grow. The room stays lit (no fade of mine; room.js fades only on the old portal's `c.flight`, which a flight never raises).
- THE DOOR: a tall pane of cut glass in the world, in the wall straight ahead (0.55 D behind the page plane, 1.2 vh tall, whole in the frame from across the room), lit arrises, its bevels mirroring the studio, and inside it a wash of frosted light falling from the upper right (an etched layer of the plates, `fly:night`; toward Contact the whole pane is paper, `fly:dawn`, and the sheet floods to paper as the eye reaches it). It comes up 170 to 300 ms after the click, once the text has left. Its rims reach the frame's edges as the page changes.
- THE SWAP: the page changes at u 0.8 of the leaving (fx-stage.js FLY_LEAD), the router's bridge flies the eye on to the door, adopt() holds the new room back until the door is reached, loads the first screen's captures and runs the scenes' first frame undrawn (priming) while the last picture is still the door's light. A late page: the eye drifts on toward the door (to 0.09 D), the pane's light coming down a third.
- ARRIVING: `fly("in")`: the eye starts 0.76 D behind the opening pose at the leaving's last speed and slows in (cubic, 520 / 400 ms); the door's light falls away over 220 ms; the scenes stand from the first frame (`data-arrive` goes with the room's first frame, `html.cut-flown` holds the text until the eye is nearly still: u 0.46, then the title rises); `fx:nav:arrived` when the eye is still.
- BACK: the same path run backward (leaving u cubed backward 0.76 D, the door's light rising in the last 220 ms; arriving 0.3 D in front of the wall's door, deep in the room, drawing back, the door shrinking and going).
- A page seen in the morning (Contact, a dawn close on screen) leaves by the plain cut (the push and the rising sheet), no glass on paper.
- Cost: in the flight's fast part the plates are drawn lean (plates.js `f.lean`: one ray for the three channels, no inner bounce, no gathered edge light); the swarm at a half only while the door fills the frame before the change. Textures a kept stage still holds are not uploaded again (fx-stage.js TEXSRC).

## Numbers (headless Chrome, other lanes rendering at the same time: noisy; each measured 2 to 6 times)

- Click to `fx:nav:arrived`: desktop 1060 to 1130 ms (case, About, Obla, Contact, Back); the cover 1270; Work on a first visit about 1250. Phone 820 to 910; the cover 1030.
- GPU in flight, 1440x900 DPR 2 tier A, six flights, six runs: median 1.8 to 1.9 ms, p90 2.6 to 3.0 ms; single frames of 3.7 to 8 ms at a different place in every run (also in frames with no plate and no door): I could not certify the 3.3 ms peak in this noise. Rest 1.85 before, 1.7 after. 1920 DPR 1: median 1.46, p90 2.15 (one frame 13 ms). Phone tier B: median 0.49, p90 0.81, max 1.36.
- Long frames: none over 28 ms in any fly-in after the last change; 35 to 40 ms at the click (u 0.1); the new page's start-up at the door (hidden): about 0.1 s toward the cover, 0.13 s toward Work on a first visit.
- 25 navigations (walk.mjs, final code): 25 pages with their h1 visible, console clean, listeners 91 / 89 / 89, observers 10 / 11 / 11, one canvas, heap 8.0 / 14.1 / 8.6 MB.
- Asleep after a flight: 0 frames in 3 s after 19 s with the mouse on the page.
- Gates on the final code: assemble --check exit 0, check-claims-proto OK, Astro build exit 0, PARITY OK, asserts ok, claims OK on the build.

## Open (what still does not read, unsoftened)

- TOWARD THE COVER the eye waits about a quarter of a second at the door (five frames at 50 ms of a grey pane with the wall's grid behind it, drifting): the cover's start-up is one task of about 0.1 s plus its scenes' first frame. On the phone the same wait is 0.25 to 0.3 s and the pane already fills the narrow frame from 390 ms.
- A CASE ON THE PHONE: after the door two frames (about 100 ms) are a dark room with only the grid and the blade: the case's plate enters from above the frame (case.js, not mine).
- The first 150 to 200 ms after the door in About and in a case on a desktop are a dark room with a small subject growing and chips: lit, moving, but dim.
- Toward Contact the card's light letters cross the paper door (the last letters of the name are lost on it for about 0.25 s), and the frame is flat paper for about 150 ms.
- Leaving Contact (or any view in the morning) is still the plain sheet cut, and its arrival has no fly-in.
- The door's light is one frosted wash for every night room: it does not take the destination's temperature.
- In the fast part the plates lose their spectral split (the lean flag): not seen in the strips, not checked on a slow replay.
- First frames against HEAD and the long-task check on a cold load were not re-measured (nothing in the boot path changed; the door's texture is made at the first flight).
- Context7 did not connect in either session of this lane: no new library API is used.

## Needs elsewhere

- `public/proto/rivista/stage/scenes/case.js` line 174 (CASES): the arrival reads `document.documentElement.hasAttribute("data-arrive")`. It works today because fx-nav.js takes the attribute away at the room's first frame on a flown arrival; `c.arrival.under === false` (the host's) is the right test. And on a phone the plate could start inside the frame on a flown arrival (`c.arrival.cut && !c.arrival.under`), so the first frames after the door are not empty.
- `public/proto/rivista/fx-sound.js` (SOUND): the first click builds the AudioContext: 300 to 480 ms of main thread in headless Chrome in the first run's profile, which delays the flight's first frame by that much on a page's first click. Build it at the first pointerdown / pointerover instead of in the click's `fx:nav:start`, or defer it one task. And see the timing of `fx:nav:covered` above.
- The cover's start-up (fx-core.js boot with the cover's modules: one task of about 0.1 s): splitting it would take the wait at the door away.

## Run and look

`python scripts/serve-static.py 5340 .shots/n-flight/dist public`; build `sh .shots/n-flight/_scripts/rebuild.sh`. Scripts in .shots/n-flight/_scripts/: `strip.mjs <tag> <g2case|hdr2about|hdr2obla|hdr2contact|case2cover|back> [--m] [--ms=25] --n=28` (sheet in .shots/n-flight/strip/<tag>/sheet.jpg), `flylog.mjs <from> <hrefPart>` (the flight polled through the swap), `gpuflight.mjs [--m|--d1]` (GPU, gaps, peaks by phase), `swapcost.mjs <from> <hrefPart>` (long tasks through a soft navigation), `walk.mjs` (25 navigations, log in walk.log), `sleep.mjs`. Sound off in probes: `?fx=core,motion,nav,scroll,stage`.
