# m-titles — the remains of the 2D (wave 6, TITLES lane, Opus 5.5 max)

- **Done (20 Nov, one run, 10:5x–11:47):** the four items of the brief, on disk, gated on both builds and looked at.
  (a) the Supply Chain diagram traces itself; (b) About's years snap; (c) the record counts / snaps; (d) the scene's
  name in the phone's header. Server 5365 stopped; nothing of this lane left running.
- **Next:** nothing of the brief. The one thing outside it: the release must keep the drawing (Needs elsewhere).
- **Files:** `fx-motion.js` (years/snap, the trace, `step()` → snap, `sceneName()` → `.hdr.has-scene`, api `snap`,
  `traceLoad`, `trace`), `fx-scroll.js` (read-ahead and entrance hooks for `[data-trace]`, `countUp()` out of
  `counts()`, `record()`), `css/case.css` (the `.tr` layer), `css/motion.css` (the scene's name at every width; below
  1024 px under the name), `css/chrome.css` (the name's lift), `parts/c-main.case.mjs` (`TRACED` → `data-trace`);
  assembled: `fx.css`, `case-agricultural-supply-chain.html` and its Italian twin.

## Decisions

- **(a)** The drawing is read at run time from `/captures/<stem>.svg` (the img's src, `-NNNN.webp` → `.svg`) by
  fx-scroll's pre-observer (1.5 screens ahead), parsed (title, desc, metadata, scripts, links and `on*` dropped), set
  over the picture in the same box without its connectors (`.tr-base.is-tracing`) and measured in an idle callback.
  At the entrance each visible connector segment (clipped to the drawing's window, dash phase kept) is a small inline
  svg under a straight clip from its start; heads (triangles, diamonds, arrows) and labels fade in as the pen passes;
  the grey connectors left to right (starts spread over 0.6 s), the accent thread (specificare, eseguire, dettagliare:
  the traceability) after them as one line; pen 1250 units/s; the pen starts 380 ms into the picture's entrance; then
  the drawing's own connectors show and the pieces go (same vector: the rest state equals the printed webp). Live
  scene mode only (`sc-on`, not `gl-off`, not `stage-dead`, motion, library). A drawing not in within 0.8 s of the
  entrance opens as printed; a resize during the trace ends it at once. Compositor only (clip-path, opacity).
- **(b)** A year is never counted: it snaps (an odometer per year, each column 0 → its digit, 45 ms apart, 520 ms,
  `--ease-io`), every time its step of About's path comes into focus, starting while the text comes into focus (the
  first look showed "0000" for 0.4 s: fixed).
- **(c)** The record (`.cs-dl`), once as it enters, live scene mode only: a count ("161", "circa 50") counts from 0 in
  its held box, left-aligned (the column reads from the left); a year snaps as in (b); with its row's stagger. Only
  what the row prints; the text ends as printed (the count's box keeps an sr-only copy while it runs).
- **(d)** Below 1024 px the label stands under the header's name, which rises 0.6em by `translate` (the header's
  entrance owns `transform`) while a name stands (`.hdr.has-scene`); 16 px label (`--t-label`), a 1rem rule before it;
  it ends 7.75rem + gutter from the right (toggle and MENU clear by ~14 px at 390); hidden, and the name back, while
  the menu is open. About 10 of the 63 Italian names (the longest case chapter headings) end in an ellipsis at 390.
- No lookbehind in the new regexes (an older Safari would fail to parse the whole module).

## Proof (20 Nov, quiet machine: CPU 0 % at the start)

- Gates on the final tree: `assemble.mjs --check` exit 0; claims OK (32 pages); Astro into `.shots/m-titles/dist`:
  PARITY OK, asserts ok (32 pages, 980 references), claims OK.
- Looked at: `strip-a.jpg` (the trace, 1440, 30 frames at 100 ms), `trace-still-1440.png` (DPR 2: mid-trace, at rest,
  printed), `strip-b.jpg` (step 4's years, after the timing fix, on the Astro build), `strip-c-sphere-ai.jpg` and
  `strip-c-doit-voice-ai-agent.jpg` / `strip-c-top.jpg` (the record), `strip-d.jpg` and `phone-hdr.png` (390 DPR 2:
  top, a short name, a long name, menu open, 768), `astro-hdr-390.png` (after a flight).
- Printed states (`printed.mjs`, 1440 and 390): `?stage=0`, `?gl=0`, reduced motion, no script: the webp shown, no
  `.tr`, no odometer, no count span, nothing hidden; print after a live visit: the webp shown, `.tr` hidden.
- Astro build after router flights (`astro.mjs`, 1440 and 390): the trace ran and ended clean; About's years turned;
  the phone's header showed the lockup. Italian (`it-check.mjs`): "circa 50" counted, the five steps' years snapped.
- Long tasks over 50 ms after the first frame (`longtask.mjs`, two runs: the read-ahead, the trace, the record, the
  five path steps): none.

## Needs elsewhere

- **`web/scripts/release.mjs`**, `LEFT_OUT`: the rule `[/^captures\/.*\.svg$/, …]` drops the drawing the trace reads.
  Keep `captures/agricultural-supply-chain-detail.svg` (e.g. `/^captures\/(?!agricultural-supply-chain-detail\.svg$).*\.svg$/`).
  Without it the deployed figure opens as printed (no error) and the trace never ships.
- **DOCS** (DESIGN.md Motion and Header, 60-as-built): the years that snap, the record's counts, the traced diagram,
  the phone's scene name under the header's name.

## How to run and look

- `node public/proto/rivista/assemble.mjs`, `--check`, `node scripts/check-claims-proto.mjs`; from `web/`:
  `node scripts/build.mjs --outDir ../.shots/m-titles/dist`, parity, asserts, claims.
- `python scripts/serve-static.py 5365 public` (or `.shots/m-titles/dist public`); probes in
  `.shots/m-titles/_scripts/`: `strips.mjs 5365 a,b,c,d`, `trace-still.mjs 5365 1440 900 2 0`, `printed.mjs`,
  `phone-hdr.mjs`, `names.mjs`, `astro.mjs`, `it-check.mjs`, `longtask.mjs`.
