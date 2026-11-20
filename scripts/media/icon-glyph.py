"""scripts/media/icon-glyph.py · the favicon's letters (redrawn for the night studio of spec 50, 2026-11-10)

Writes public/proto/rivista/icons/icon.svg: the initials "AT" in the site's display face, Sofia Sans Extra Condensed
at weight 800 (the cover name's face and weight), as vector outlines, warm white #f4f1ea on the night ground #0c0e14.
The outlines are read with fontTools from the same Google Fonts file the pages load (the variable latin subset,
instanced at wght 800). Sofia Sans: SIL Open Font License 1.1, (c) the Sofia Sans Project Authors (Lettersoup).

    python scripts/media/icon-glyph.py [--font <sofia sans extra condensed woff2>]

Then node scripts/media/chrome-icons.mjs renders the PNG set from this SVG, headless.
"""
import io
import os
import sys
import urllib.request

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

# the latin subset of Sofia Sans Extra Condensed, as css/fonts.css serves it (2026-11-10)
URL = "https://fonts.gstatic.com/s/sofiasansextracondensed/v6/raxoHjafvdAIOju4GcIfJH0i7zi50X3zRtuLNiMS0fSuJk4.woff2"
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "proto", "rivista", "icons", "icon.svg")

NIGHT, INK = "#0c0e14", "#f4f1ea"
BOX = 64          # the icon's unit square
CAP = 0.62        # the letters' height as a share of the square
TEXT = "AT"


def load_font():
    args = sys.argv[1:]
    if "--font" in args:
        with open(args[args.index("--font") + 1], "rb") as fh:
            data = fh.read()
    else:
        req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
    font = TTFont(io.BytesIO(data))
    if "fvar" in font:
        font = instantiateVariableFont(font, {"wght": 800})
    return font


def main():
    font = load_font()
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    # lay the letters out on the font's own advances, then measure the ink of the pair
    names = [cmap[ord(c)] for c in TEXT]
    xs, x = [], 0
    for n in names:
        xs.append(x)
        x += hmtx[n][0]
    bp = BoundsPen(gs)
    for n, dx in zip(names, xs):
        gs[n].draw(TransformPen(bp, (1, 0, 0, 1, dx, 0)))
    x0, y0, x1, y1 = bp.bounds
    w, h = x1 - x0, y1 - y0
    s = BOX * CAP / h
    ox = (BOX - w * s) / 2 - x0 * s
    oy = (BOX + h * s) / 2 + y0 * s
    sp = SVGPathPen(gs, ntos=lambda v: ("%.2f" % v).rstrip("0").rstrip("."))
    for n, dx in zip(names, xs):
        gs[n].draw(TransformPen(sp, (s, 0, 0, -s, ox + dx * s, oy)))
    d = sp.getCommands()
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d">\n' % (BOX, BOX)
        + "<!-- Alberto Tuveri, favicon: the initials AT in Sofia Sans Extra Condensed 800 (SIL OFL 1.1), the display"
        + " face of the site, outlines read with fontTools from the Google Fonts file the pages load (wght 800)."
        + " Written by scripts/media/icon-glyph.py, 2026-11-10. -->\n"
        + '<rect fill="%s" width="%d" height="%d"/>\n' % (NIGHT, BOX, BOX)
        + '<path fill="%s" d="%s"/>\n' % (INK, d)
        + "</svg>\n"
    )
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(svg)
    print("icon.svg: %s, ink box %.0f x %.0f units, scale %.4f, %d bytes" % (TEXT, w, h, s, len(svg)))


if __name__ == "__main__":
    main()
