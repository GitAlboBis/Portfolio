# w-fix3d — lane FIX3D (port 5291) — DONE (for the director to look and commit)

- Owns: non-cover scenes + engine. Answered the critic's 3D findings 1–12.
- Run/look: python scripts/serve-static.py 5291 public; .shots/w-fix3d/_scripts/{walk,sheet,strip,first,probe,gpu,cover,bench,benchroom,textcrop,states}.mjs (PORT env for gpu; HEAD copy via git archive on 5296).

## Per finding
1 FIXED — host `yields` (fx-stage.js): stack/gallery plates step back from other scenes' text. Path head clean (final-about.png, about/still-11-path.png).
2 FIXED (phone) / PARTLY (desktop) — line reveal soft, starts 0.3 node behind the pane, phone ink thins with depth, eye more to the side; phone panes move into shot.js freeBand. No teardrop; a short bright ray still leads the line into the next pane (about-m/crop15.png).
3 FIXED — field.wgsl.js wallKeep + room keepDim: wall dimmed (floor 0.18, 150 px fall), grid continuous behind text (about/still-15-path.png, consulting sheet). Trade-off: the grid shows faintly between glyphs (tc/zoom.png).
4 PARTLY — blades now cross the visible wall (sweep 0.42 wallW), haze up, plates bloom 0.14–0.22 (work, case). Not the cover's density of light.
5 PARTLY — canvas 250 ms everywhere, room fade 0.25 s: lit at ~1.05 s on Work (was 1.5–2 s); the DOM/stage-on wait is not this lane's (work/load.png).
6 PARTLY — words steady and bright (no focus dip), glow 0.95–1, bevel 10; bevels still thin (case-mt/still-01-case.png).
7 FIXED — glide (half the travel linear), last plate stays to 0.82, yields to the evidence head (work/sheet.png).
8 FIXED — top layer named bright at the head; phone stack in a free band (present every step); at most 2 glass layers: 1.5–2.15 ms rest, no halving (HEAD 3.0–3.3, halved 3x).
9 PARTLY — chapters dim 0.45, one blade on the right, chips 5000: grid present. Plate ghost on release kept (HEAD).
10 FIXED — dawn.js focuses the page plane: threads ruled and sharp (case-mt sheet 07).
11 PARTLY — phone gallery apex in a free band, Supply Chain and Voice AI plates now show, etched plates brighter; the plate hops between bands when a text block passes the middle (damped 0.3 s).
12 FIXED — hub frames lighter (no glowing square), figure overlap 0.85 (consulting sheet 04–05).

## Night's Needs elsewhere
- room.js keep: done (keepDim). Subject band straight lower edge: stays (night's tall-band workaround in place; a vertical fall would need a shaft() profile change).

## Numbers (other lanes' Chrome running, 37 processes)
- 1440 DPR2 rest/peak: About 1.5–2.15/2.19 (no halving in 2 reruns; one run showed halv 1 under contention); Work 1.25–1.89/1.93; case-mt 1.52–2.12/2.16; case-io 1.19–2.08/2.13; Consulting 0.74–1.25/1.68; Obla 0.84–1.04; index 1.25–1.29/2.29.
- 1920 DPR1: <= 1.77. Phone B: <= 0.86.
- First frame (ms) mine vs HEAD: index 794/740, work 582/588, case-io 546/591, case-mt 585/640, about 553/580, consulting 544/589, obla 629/596, contact 571/557 (single runs, noisy); no long task > 50 ms after.
- Cover: frozen bench (dev.html?view=cover&t=2500) 0.00 % vs HEAD; live page differs only by drift timing and other lanes' DOM.
- States: debug / failfield / gl=0 / stage=0 / reduced motion on 9 pages incl. it/: expected on/off, console clean.
- Gates: assemble --check exit 0; check-claims-proto OK.
