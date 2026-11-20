# w-night — lane NIGHT (wave 1, port 5292)

- Owns: stage/scenes/{stack,path,consult,obla,index,contact,dawn}.js, stage/night/**, stage/day/**.
- Goal: About, Consulting, Obla and the cover's index stand in the room kit (lib/room.js): one continuous shot per page, bloom, temperature cool→warm.
- Done: all five scenes rebuilt in the room (see Done below).
- Next: nothing open in the lane; see Still wrong.
- Captures: .shots/w-night/ · server: python scripts/serve-static.py 5292 public

## Plans (three lines each)
- CONSULT: shot = straight view trucked + stepped into the room per figure (stations at x .24vw / -.03 / .2, z -.3/-.6/-.9 D), hold while read, travel at the boundary; light = room seed 7, wall at -1.55 D, a tall soft subject band behind the figure in step; subject = gen (now a scan-line generation: sharp mark above a straight line, coarse square-cell preview below, half made at the head), cut, code, agents (crisp square nodes, straight lanes).
- OBLA: shot = the eye follows the character with 0.75 gain between five places in the room (x/z per state); light = room seed 9, subject band on it; subject = the character, body z from DEPTH.
- STACK: shot = eye descends the stack with the layer in step, closer when open; light = room seed 5, subject on the layer in step; subject = 3 glass layers near the step (cost), the other five as outlines of light (swarm).
- PATH: shot = the eye flies along a line receding to a vanishing point in the left half, behind each node in turn; head = straight view; light = room, subject on the node in step; subject = five panes etched with month/year.
- INDEX: the cover's room continues (room seed 3, cool), emblems set at depth with sink(), straight view + drift + orbit.

## Done
- night/shot.js (new, the shared shot helpers), night/lib.js rackFocus reads DEPTH, cut.js depth, gen.js scan-line generation, agents.js crisp nodes, consult.js in the room (looked: c1, c2).
- obla.js (scene) in the room, character at six places (night/obla.js body + light take DEPTH.obla) (looked: o1).
- stack.js: 3 glass layers max + `outlines` formation (the eight layers' edges in light), room, shot down the stack; GPU 1.8-2.5 ms 1440 DPR2, no halving (was 3.2-3.4 ms, halved x3) (looked: a1).
- path.js: rewritten as a flight; the line in world px, the eye behind the pane in step (aimAt; side offset sets the vanishing point: VP = F + side*D/L) (looked: a2, a3).
- index.js: cover formations wrapped (`deep`) to stand at -0.32 D; room seed 3; the hero's look values (looked: i1).
- Decisions: one look per page (lookFor(c, R, far)); About far 2.6 D (the line reaches -1.95 D), Consulting/Obla 1.7 D, index = the hero's {far -2.6 D, near 4.7 D, keepFeather 40}.
- Subject light: a tall band (h 1.5 vh, centre +0.3 vh) so its straight lower edge falls off-screen (with the figure's own height it drew a horizon line across the room: c1).
- path.js: panes step back while a text block crosses their band (phone) or their box at the straight view (desktop), and wait until the path holds 60-90 % of the screen (the stack's text above is not in path's c.texts) (strip-about3).
- shot.js roomFor: wall alpha 0.55 on a phone.

## Numbers (GPU median ms; other lanes' Chrome running: 47 processes, noisy)
- 1440 DPR2 A: About stack rest 1.8-2.4, peak 2.5-2.6 (HEAD 3.4 + halved once at load); path 0.9-1.3; Consulting 0.6-0.9 / peak <= 1.9; Obla 0.8-1.0 / <= 2.25; cover index 1.45 / 1.85 (scroll trace max 2.48). No halving at load (3 runs each, mine h0; HEAD About h1). Halvings seen in a few walks = contention; scroll traces at 60 and 140 px wheel: 0 halvings, max 2.62.
- 1920 DPR1: About <= 1.8, Consulting <= 1.3, Obla <= 0.9, index <= 2.0 (one 2.63 outlier, remeasured twice at 1.8).
- phone B: all <= 0.62.
- First frame (getCurrentTexture, ms, 3 runs, mine vs HEAD copy on 5297): about 679/564/548 vs 589/600/548; consulting 558/539/560 vs 574/591/553; obla 576/560/565 vs 610/570/546; index 576/543/547 vs 577/562/560. No long task after it.
- States: Italian (it/about, it/consulting, it/obla) clean; ?failfield=1 clean (room absent, scenes draw); ?gl=0 and ?stage=0 plain; visual-gate --reduce CLEAN on about/consulting/obla/index; console clean everywhere.
- Gates: assemble --check exit 0; check-claims OK.

## Still wrong (ranked by what Alberto would notice first)
1. The kit's keep-outs cut darker rectangles out of the lit wall behind every text block (Consulting's head, the index's rows: a dark panel with a straight edge at 40 px feather). Text is clean, but the room reads as having black panels behind the words. Kit (lib/room.js keep) or the field's keep fall, not mine.
2. About's path is the weakest scene: the panes are small and dark against a dark room, the line of light reads as a short bright comet through the pane in step rather than a line through five plates, the next panes wait half hidden behind it. On the phone the panes are hidden most of the time (text crosses their band) and the comet is all that shows.
3. The wall's grid is strong everywhere on About and Obla (the lit wall fills the frame); the cover's bar has darker corners. A softer wall on the night pages (alpha or unlit) would help; tried only on the phone.
4. Consulting's walk is subtle: the truck to each figure is visible in the wall's parallax, less in the figure (it holds its screen place by design); between stations the outgoing figure dims and the next gathers in depth, which at mid-travel leaves a sparse frame for a beat (0.42 in c1).
5. gen's preview cells read as horizontal bands more than squares at 1440 (the points jitter inside each cell); it reads as "being generated" but not as pixels.
6. The agents' nodes bloom into soft glowing squares at the hub (bright cores + bloom 0.55).
7. The stack's head (Capabilities) is still a dim closed block with lines through it; only from step 1 does it come alive.
8. Index hover: no emblem without a cue (the room alone) — the old "rest" lattice is barely visible at depth.

## Needs elsewhere
- lib/room.js (WORK/KIT): the subject light's lower edge is a straight line across the wall when the subject is a figure's height (it read as a horizon). I work around it with a tall subject (h 1.5 vh). A `soft` vertical fall or an option for the band's height would be cleaner.
- lib/room.js keep: see Still wrong 1 (feather the cut further, or lower the wall's lit level inside keeps rather than cutting it).

## Run / look
python scripts/serve-static.py 5292 public; .shots/w-night/_scripts/{walk,gpu,trace,hover,ff,halv,textcrop,pairs,sheet,crop,log,dbg}.mjs (walk: node walk.mjs <page> <fractions> <tag> [--m|--hd] [--q=] [--strip=N:ms]). Finals in .shots/w-night/final/.
