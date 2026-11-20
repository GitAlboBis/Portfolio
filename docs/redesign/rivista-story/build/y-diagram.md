# DIAGRAM lane (fix round) — notes

- Job: redraw the Supply Chain class diagram (`scripts/media/vpp-plate.mjs`) in the night style; WebPs, sidecars,
  provenance, share cards EN/IT; retire `fx-fonts.css` if unread.
- How to run: `python scripts/serve-static.py 5214 public` (background), then
  `RV_FONTS=http://127.0.0.1:5214/proto/rivista/css/fonts.css node scripts/media/vpp-plate.mjs` (add `--no-log` to
  leave PROVENANCE.md alone) and `RV_BASE=http://127.0.0.1:5214/proto/rivista/ node scripts/media/og-cards.mjs
  agricultural-supply-chain it/agricultural-supply-chain`.
- Captures: `.shots/y-diagram/` (scratchpad script `ydiag-cap.mjs`, launch() of scripts/lib/headless.mjs).

## Done
1. `vpp-plate.mjs` redrawn on the night tokens of `css/tokens.css`: ground `--night-2`, each package a sunk `--night`
   field in a 1 px `--line` rule, class boxes `--night-2` with a `--mute` hairline, class names Sofia Sans 600 `--ink`,
   members Sofia Sans 400 `--body`, lines/markers/end labels `--mute`, association names Sofia Sans Condensed 500
   `--mute`, package titles Sofia Sans Extra Condensed 800 capitals `--ink`; the traceability thread
   (dettagliare / eseguire / specificare) in `--accent` (cobalt is never a line on the night). Fonts from
   `css/fonts.css` (`RV_FONTS`, default 5178); the tool checks five faces loaded. Content unchanged: same model, same
   4 packages, 56 classes, 69 relations, same labels.
2. Full plate's drawing box narrowed to x 160..1440 so Work's 4:3 glass plate (cover fit, visible x 133..1467) and the
   case top (16:9 cover, y 50..950) both keep the whole drawing. Detail keeps its old window and box.
3. WebPs + sidecars regenerated (headless), PROVENANCE.md blocks of both slugs rewritten by the tool (dated 2026-11-10,
   night typography and tokens recorded). Share cards EN/IT redrawn, manifest entries updated (only those two keys).
4. `public/proto/rivista/fx-fonts.css` deleted (nothing reads it any more; only CLAUDE.md/DESIGN.md, historic, name it).
   Deletion left unstaged.

## Gates
- assemble ok · `--check` exit 0 · check-claims-proto OK (32 pages).

## For the PAGE lane (strings I do not own) — `parts/cases.json`, case `agricultural-supply-chain`
- `rail.alt` EN "The team's class diagram of the supply-chain platform, redrawn in ink on paper." →
  "The team's class diagram of the supply-chain platform, redrawn in light lines on the night."
  IT "…ridisegnato a inchiostro su carta." → "Il diagramma delle classi del team per la piattaforma di filiera,
  ridisegnato a linee chiare sul fondo notturno."
- `fig.alt` EN "A class diagram of the supply-chain platform, redrawn in ink on paper from the team's model: classes in
  ruled boxes joined by association lines." → "A class diagram of the supply-chain platform, redrawn on a dark ground
  from the team's model: classes in ruled boxes joined by association lines, the traceability links in blue."
  IT "Un diagramma delle classi della piattaforma di filiera, ridisegnato a inchiostro su carta dal modello del team:
  …" → "Un diagramma delle classi della piattaforma di filiera, ridisegnato su fondo scuro dal modello del team: classi
  in riquadri filettati, unite da linee di associazione; i legami di tracciabilità sono in blu."
- `fig.caption[0]` and `fig.plate.caption[0]` still print "Fig. 01 · …" (a magazine trait spec 50 removes).
- chapter "list" `figure.alt` ("…the traceability links drawn in blue") is still true: no change.

## Elsewhere (not mine)
- `stage/helpers.js:187` defaults a family to "Cormorant Garamond" (a dead default of the old site).

## Looked at (.shots/y-diagram/) — DONE
- `public/captures/agricultural-supply-chain-{1600,800}.webp`, `-detail-1600.webp`: night ground, light lines,
  titles in the display face, accent thread; detail names and members legible.
- `d-work-09.png` / `m-work-09.png`: the diagram inside the 4:3 glass plate, whole drawing visible (no side crop),
  dark panel in the glass, no cream. `m-work-09b.png`: a little further, the plate has left (gallery behaviour).
- `d-case-…-top.png`, `m-case-…-top2.png`: the case's top figure is the night drawing; reads as part of the page.
- `d-case-…-detail.png`: the detail under "To code", legible at 1440.
- Share cards `og/og-agricultural-supply-chain.jpg`, `og/it/…`: night card with the diagram on the right.
- Console clean on every capture, stage on (tier A desktop, B phone). Server 5214 stopped; 5179 untouched.

## Re-run 2026-11-11 (lane relaunched after commit 087993b)
- Nothing to redo: the lane's files are clean against HEAD (committed by the director in 087993b), `fx-fonts.css`
  is gone and nothing reads it. Gates re-run: assemble ok, `--check` exit 0, check-claims-proto OK (32 pages).
- Re-looked: `agricultural-supply-chain-800.webp`, `.shots/y-diagram/d-work-09.png`, `og/og-agricultural-supply-chain.jpg`.
- Still open for PAGE: `cases.json` lines 655 and 661 still say "ink on paper" / "inchiostro su carta" (wording above).
