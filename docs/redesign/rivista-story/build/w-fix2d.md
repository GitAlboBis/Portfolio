# w-fix2d — lane FIX2D (port 5293) — DONE

- Task: answer the critic's 2D findings 1-9 (w-critic.md). Files: fx-motion.js, fx-nav.js, css/motion.css, parts/head.html.
- Done: all fixes below, gates green, strips looked at. Servers 5293/5298 stopped.
- Run/look: python scripts/serve-static.py 5293 public; .shots/w-fix2d/_scripts/ (load.mjs <port> <route> <tag> [--m] [--q=] [--reduce]: cold-load strip + timings; misc.mjs cuts|menu; strip.mjs; floor.mjs; pairs.mjs; scene.mjs: header scene names; unsplit.mjs; first.mjs). HEAD copy in .shots/w-fix2d/_before.

## Per finding
1. FIXED. Header never held or claimed (its CSS words, as HEAD: ~200-260 ms). Hold --mo-safe 1.6 s -> 0.5 s; anime import starts with the deferred scripts (head.html), in by ~250-300 ms locally; the opening starts at the stage's first frame or at 0.44 s at the latest, title at +40 ms. Title now rises from ~0.4 s (was ~1.0 s). A library later than 0.44 s claims nothing: the CSS entrances play at 0.5 s.
2. FIXED. sceneName() joins lines (clone, <br> -> space, a space after each .ln/.w/.mo-w); "Four ways to work with me" / "Quattro modi di lavorare insieme". Also: the name no longer flashes for a frame on load (waits for both observers' first report).
3. FIXED. Case label is no longer splitText'd (its lines had no beat and showed at once); a label right before its title goes after it in the cue sheet. Order now: title ~0.4 s, plate (stage), label, lead, buttons.
4. PARTLY. Arrival: the title starts at half the card's clear, the sheet starts leaving at 0.6 x clear with a fast-start ease (was a slow ease-in on an empty sheet): blank frames between card and page 150-200 ms -> ~100 ms; arrivals 865-948 ms (were 903-1043). The camera push before the sheet and the room lit on arrival are the stage's (Needs elsewhere).
5. FIXED. Cover foot starts at stage-on + 1.45 s (name lit), not stage-on + 2.25 s + stagger: lands ~2.4-2.6 s.
6. FIXED. Menu numerals rise with their row behind a mask (no tick). Closing: rows go up behind their masks (last first), foot fades, the sheet edge travels on --ease-io.
7. FIXED. Contact title rises from ~0.4 s (same as 1).
8. FIXED for non-[data-refract] titles: after their rise the printed nodes are put back (unsplit). [data-refract] titles (Work, About heads) stay split (the stage's backdrop keeps those text nodes): risk remains on a late font swap.
9. STAYS. Supply Chain trace, About years, record numerals not built; scene name desktop-only.
- Also: ?fx= without motion no longer sets mo-wait (no 0.5 s CSS hold without the module).

## Needs elsewhere
- fx-stage.js / stage.js (stage.cut): the push before the sheet is not visible in 0-300 ms; and the arriving room lights ~0.5 s after the sheet leaves (cover: name starts ~0.5 s after arrival).
- fx-stage.js could emit fx:stage:first; hero.js fx:stage:lit (the foot now assumes stage-on + 1.45 s).
