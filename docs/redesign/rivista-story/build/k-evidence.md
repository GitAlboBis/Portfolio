# k-evidence — the scene `evidence` removed everywhere (22 November)

- **Done:** every item of the brief. Two runs: the first (14:30-15:05) edited the sources and was cut by the five-hour
  limit before its notes caught up; the second (18:50-19:45) assembled nothing new (the pages were current), built,
  looked, found and fixed two defects of the new joins, measured the GPU three rounds, wrote the documents.
- **Next:** nothing of the brief. For the director: Alberto's eye on the two new joins; the cases' measured and teaser
  bars (the «linee orizzontali» Alberto found ugly live on there; the brief kept the cases).
- **Decisions:** the director's: the whole scene goes, Work = gallery + dawn, home = hero · now · gallery · stack ·
  path · consult · obla · contact; cases untouched. Mine: the gallery keeps its phone keep-feather (24 px), set for the
  bars; no share card changes (the cards are the home and the cases; og-cards.mjs reads no meta.work); the two fixes
  below (an engine rule in plates.js, two scene rules in gallery.js); `#evidence` / `#measured` go to work.html.
- **How to run:** assemble + --check + claims; Astro into `.shots/k-evidence/dist` (parity, asserts, claims); release.
  Servers (stopped): 5408 = `.shots/k-evidence/dist public` (mine), 5409 = HEAD 96da9c4's Astro build
  (`.shots/k-evidence/headroot/head` + `.shots/k-evidence/headtree/public`, built from `git archive 96da9c4 web
  public/proto/rivista public/captures` with a junction to web/node_modules, removed after the build).
- **How to look:** `.shots/k-evidence/_scripts/`: look (Work stills), joins (50 ms strips), camjoin (the camera per
  frame), drop (every frame + the texture log), fly (flights), printed, imgs, hero, gpujoin + gpu.sh (GPU rounds),
  atstack, jank. All headless (launch() of scripts/lib/headless.mjs through n-integrate's hl.mjs).

## What changed

- Sources (first run): the section out of `parts/c-main.work.html`; its 22 strings out of `strings.mjs` (`ui.lower`,
  `ui.tiny`, `ui.to` stay: the cases' rows read them); `ix.work` and `meta.work.desc` rewritten (EN+IT, no new fact);
  `head.html` OLD `measured`/`evidence` → `work.html`; `page-work.css` (the .ev rules, Work's `.mx-n`) and `blocks.css`
  (`.ev-h em`, `.ev-set em`, `.ev-note`; a case's `.metric`/`.mx-*` stay); `fx-scroll.js` TITLES; `evidence.js`
  deleted; `gallery.js` `workEye` without the E term, its constants no longer exported (only evidence.js read them);
  `CHAPTERS` in both builds (`evidence: []`: asserted nowhere); comments in `figures.js`, `boot.js`, `fx-stage.js`.
- **Two defects the new joins exposed, fixed (second run):**
  1. In the home, at the gallery → stack join, the last plate (Supply Chain) went blank for a few frames
     (`joins/d-en/quad-550-700.jpg`, frame 600). The gallery (6 captures, 6 lifted pictures, 5 etched words) and the
     stack (8 names) need more than the plates' 16 layers; both revive what they lose (fx-stage.js `held`), and the
     plate's lifted picture waited on the raw capture's texture, which no plate draws, so the LRU gave it up first
     (`drop/home-b`: "agricultural-supply-chain lost its layer"). `gallery.js`: the lift no longer waits on the raw
     texture. `plates.js`: the LRU never evicts a texture drawn in the latest frame while another will do, and a
     texture made now ranks behind those drawn (a tie went to the oldest entry). With the LRU fix alone the raw
     capture was still lost (`drop/home-c`); with both, every frame keeps the picture through the fade (`drop/home-d`).
  2. On Work the dawn close now follows the last plate, and its glass crossed onto the paper as a grey slab
     (`drop/work-d/crop670.png`). `gallery.js`: a plate goes while the day's edge rises toward its foot (`c.dawn`, as
     obla.js). After: `drop/work-e/crops.jpg`, `look/work-en-d2`.

## Gates (19:38-19:40, on the final code)

assemble (35 up to date) exit 0; --check exit 0; claims OK (34 pages); Astro build into `.shots/k-evidence/dist`
exit 0, PARITY OK (144 shared files, 0 differ), asserts ok (1156 references), claims OK; release
(VERCEL_ENV=production) three [release] lines, 34 pages, 32 in the sitemap; its home's scenes: hero now gallery stack
path consult obla contact; the only "evidence" left in a page is the old-address map.

## Looked

- Work EN/IT at 1440 DPR 2 and 390 DPR 2 (`look/work-{en,it}-{d,m}`, after the fixes `work-en-d2`, `-m2`): head,
  plates, the last plate fading as the dawn's edge rises, the morning; nothing between; no glass on the paper.
- The home's join, 50 ms strips at 1440 and 390 (`joins/d-en`, `joins/m-en`, `joins/m-en2`), every frame at 1440
  (`drop/home-d`): the last plate leaves, the cosmos travels, CAPABILITIES rises with CORE. The header marks Work until
  About's top crosses the middle line, then About (`joins.mjs --parts`).
- Camera per frame (`camjoin.mjs`): at most 3 px a frame across the home's join (HEAD's evidence → stack: 4), 1.4 into
  Work's dawn, 4.7 on the phone after the scroll stops (the stack's own drift); swarm whole.
- Flights from the home's last plate to About and from Work to About (`fly/h2a-d`, `fly/w2a-d`): covered 220 ms, lit
  480, arrived 975; no empty or grey frame; no long task.
- Printed Work (?stage=0, print, reduced motion; EN/IT; `printed/sheet.jpg`): the gallery then the dawn, no hole, all
  6 images loaded; the printed home Work → About complete (two lazy, display:none images of the cover unloaded: same
  on HEAD, `imgs.mjs`). The hero (`hero-1440.jpg`): untouched.

## GPU (against HEAD 96da9c4's build, same minutes; rest median/median, peak p95 (max), ms)

Round 1 (before the fixes) agrees with rounds 2 and 3 (final code). Round 3 (19:28-19:35, CPU 2-19 %):
- 1440 DPR 2 (A): Work gallery 1.70/1.70, 2.10 (2.16) vs 1.70/1.70, 2.09 (2.24); Work's last plate → dawn 0.67/0.74,
  1.14 (1.21) vs HEAD's last plate → evidence 0.89 (0.95) and evidence → dawn 1.11 (1.20); home's last plate → stack
  0.83/0.82, 1.38 (1.59) vs HEAD's last plate → evidence 0.82/0.81, 0.96 (1.00) and evidence → stack 1.46 (1.73);
  stack 1.51/1.52, 1.71 (1.96) vs 1.51/1.53, 1.70 (1.95).
- 1920 DPR 1: gallery 1.33, 1.71 (1.75) vs 1.33, 1.71 (1.79); home's last plate → stack 0.75/0.71, 1.21 (1.26) vs
  0.83 (0.88), HEAD evidence → stack 1.20 (1.53); stack 1.22, 1.26 (1.34) vs 1.17-1.19, 1.26 (1.35).
- Phone (B): gallery 0.63 both; last plate → dawn 0.36 vs 0.37; home's last plate → stack 0.29/0.30, 0.49 (0.52) vs
  0.36 (0.38), HEAD evidence → stack 0.50 (0.54); stack 0.43/0.42, 0.45 vs 0.41/0.40, 0.45.
- Round 2 (19:20-19:28): the same within 0.1 ms; single frames of 5-6 ms on both builds in rounds 1-2 (noise).
- The swarm never halved (160000 / 80000 in every probe); the stage sleeps (0 frames in 3 s after 19 s quiet, Work
  and the home, final code); jank across the join (`jank.mjs`, 3 runs each): no gap over 7 ms, no long animation frame,
  mine and HEAD alike.
- Above HEAD: the stack at rest 0.02-0.05 ms at 1920 and on a phone, with the same formations, plates and fields
  (`atstack.mjs`); the home's crossing into the stack above HEAD's crossing into evidence (a lighter scene), level with
  HEAD's crossing from evidence into the stack.

## Documents

CLAUDE.md (§1 the home's and Work's rows and the old addresses; §4 fx-scroll and the plates' layers; §7 a bullet with
Alberto's words, «the wall's grid» list; §8 SMOOTH's line, a «dopo l'ondata» bullet, the GPU line, «La home, da
guardare»), DESIGN.md (old addresses, the home's parts, Work's heading, shot and dawn rule, «No measured figures», the
counts, "eight" scenes, the texture rule; MIRROR OK), `.impeccable/design.json` (metric purpose, the index row's
example), the scenes README (list, yields), 60-as-built (A4, A5, C, §G). README.md names no scene: unchanged.
HANDOFF.md and k-orrery.md were changed by others (the director's diary at 18:51, ORRERY at 18:58), not by this lane.
