# w-phone — lane PHONE, chain 9 (port 5242)

Owns: stage/scenes/evidence.js, obla.js, gallery.js, css/page-work.css, css/page-night.css, parts/c-main.work.html, parts/c-main.obla.html.
Status: DONE. Three items built and looked at (390x844 DPR 2, EN and IT); gates green; server 5242 stopped.
Run: python scripts/serve-static.py 5242 public ; node .shots/w-phone/_scripts/cap.mjs <out> <route> m|d targets… (stripTo:<t> for a strip)

## Done
1. Evidence head (evidence.js, phone branch only): set 1 is drawn under the head as a small chart, the same rows'
   pairs (same lengths) spaced evenly (gap <= 64 px) between the header and the bottom of the figure's part; from
   step 2 local 0..0.5 the rows' local y open out onto their rows (same dock as desktop). Only the y spacing changes,
   so every strand keeps its segment count (stable particle order; targets reset only while docking).
   Desktop path identical (rect/line maths unchanged). Looks: after/work-en/m-07, after/work-it, after/strip-en.png.
   During the dock the bars pass behind set 1's eyebrow and title (keep-outs cut them): brief, accepted.
2. Obla opening (obla.js, side "top" only): the free band is looked for over the whole screen under the header (not
   only the top 55 %), capped at the figure's height; hysteresis (stays in its band unless another is 1.25x larger);
   when the best band is across a text block the character fades (weight 0), moves after 0.3 s unseen, comes back
   (never slides over text). The CSS already puts the opening's text in the lower half. Looks: after/obla-it.png,
   after/obla-en.png (top, y 200/340/500, the five states, the close), after/obla-strip.png.
3. Gallery clear plate (gallery.js, phone only): while an etched plate is at the apex the queue moves aside
   (+0.44 pw right, 160 px deeper, by its place) and dims by how much is still behind the clear face. Looks:
   after2/m.png (steps 3, 4, 7, 8, 9), after/work-it.png; desktop after2/d.png unchanged.

## GPU median (tier B, phone, at rest; BOOT lane editing the stage at the same time, so ±0.05 noise)
Work gallery steps 0.54–0.63 -> 0.52–0.61; Evidence head 0.079 -> 0.144 (the chart now draws); set 1 0.262 -> 0.275.
Obla 0.16–0.23 -> 0.15–0.23.

## Needs elsewhere
- none.
