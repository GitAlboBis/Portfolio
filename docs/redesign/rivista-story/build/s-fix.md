# s-fix — COVER3FIX lane (port 5281), round 12: answer the critic's 10 findings on cover v3
- Owns: hero.js, now.js, cover/**, b-hero.html, page-cover.css; field/** (new opts, default = HEAD); plates/** (per-plate sheen only); guarded hunks fx-stage.js / stage.js.
- State: DONE. Servers 5281 and 5283 (HEAD copy in scratchpad) stopped; 5178 untouched.
- Run: python scripts/serve-static.py 5281 public; scripts in .shots/s-fix/_scripts/.
- Next: read world.js/hero.js/now.js/stage.js boot path; then fix 1..10 in order.

## Done (keep current)
- F1: stage.js prepareStage: field pipelines start at once (beside sim/draw) -> field ready before frame 1 (603/682 vs frame 638/717).
  hero.js: world prebuilt at module load (fonts.load then ensureWorld with guessed tier) -> the 70 ms task moves before fx:ready.
  world.js: blades rephased (off 0.62 / 0.1: one on the wall right of the name at frame 1), name light starts at 0.6.
- F2: plates.wgsl.js/plates.js: per-plate `sheen` (face reflection kept 0..1, default 1 = HEAD) packed in mat.w above tint (+64*cut).
  hero.js slabs sheen 0.12.
- F7: world.js plates moved low beside the name's ends (w1 sx .07 sy .625 d 1.45 w .28 turn -.48; w2 .935/.6/1.95/.25/.52); phone sy .168 w .40.
- fx-stage.js: `sheen` passed through to slabs.
- F3: world.js liveKeeps() (header name + nav, Now's #now-h from live DOM, read <= 2/s); hero.js adds header keeps at rest;
  now.js uses live title rect (host's h2 rect is taken under the rise mask: 43,291 320x267 vs live 43,197 544x223).
- F4: deep layers: disc 1.6 x contour spacing, flow 0.02, ink 0.6/0.5; sheen on rim only (was the glitter stipple); lens 0.55 yaw -0.30.
- F5: face outline share 36 %, fill eroded by 0.6 disc; face flow 0. Phone edges still slightly bumpy (partly).
- F6: world.js gone(): name ink to 0 at k .42-.5; now.js glow weight from k .52: no blue streaks down or up (flight-a sheets).
- F8: wall alpha to k .78-1, lights to .72-1 (x0.15 left): mid-flight lit wall + chips (flight-a/park-50).
- F9: wall relief .06, spec .22, displace 6; marks scale 2.6 weight .18; hand blade y clamp .3.
- F10: ignition emit 0.3 (short streak), spawn -0.06 D.
- Plates: w1 .075/.56/1.6/.26/-.44, w2 .935/.57/1.95/.25/.52; pitch orbit .12 (plates slid over the foot at .14). Phone .78/.128 w .32.
- Gates after: assemble 0, --check 0, claims OK.
- hero.js keepFeather 40 also in Now's view (a 6 px feather cut a hard dark rect out of the wall around Now's text).

## Numbers
- GPU at rest (median/max, 64 samples): 1440 DPR2 1.42/1.46 (HEAD 1.37/1.43); 1920 DPR1 1.12/1.14 (HEAD 0.99/1.04); phone B 0.40/0.41 (HEAD 0.35/0.37). Opening peak 1.43 / 1.15 / 0.38. No halving.
- First frame (same session): HEAD desktop 653/698/715, mine 639/638/641; phone HEAD 671/677, mine 650/632. Field ready before frame 1 (596-615). Long task 50-71 ms now at ~165 ms (prebuild, before fx:ready); none after frame 1.
- Bench vs HEAD copy (5283): field 2, gallery 0, stack 0, work 2, case 4 max diff, 0 % px > 8.
- States (st/): it, failfield, stage=0, gl=0, reduce, nodevice, noadapter as expected; Back/Forward after a cut OK; console clean.

## Still wrong (ranked)
1. Left plate still reads partly as a screenshot card (bright headline of the capture); plates slide inward under the hand.
2. Phone letter edges still slightly bumpy and glowing past the outline.
3. Igniting letter still fuzzy for a frame or two; after a cut ~400 ms of night between the card and the lit room (compile-bound).
4. Receding outlines are soft continuous lines now, not razor-crisp; Now's text keep-out still faintly visible as a darker rect.
