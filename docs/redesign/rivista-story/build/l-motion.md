# l-motion — the home's 2D, header, sound and links (wave 7, lane MOTION)

- Done (runs 1-2, all on disk; brief items 1-5 complete):
  - fx-nav.js: the morning is the first [data-dawn] (the header turns to the morning over Contact's part in the home);
    the part being read = the section.part on the viewport's middle line (IO), FX.nav.part, fx:part {part, from};
    .is-here on the header item and the menu row of that part's page; the travelling rule rests under it.
  - fx-motion.js: cueItems() (the page's first-screen beats, shared); parts(): each part's opener (its page's first
    screen: title letters behind a straight mask, a curtain for [data-refract], hairline, lead lines, controls) built
    paused 1.5 screens ahead (.mo-own, hold()/.mo-held), played once when its title reaches 85 % of the view, or when
    its block is on screen with the title already past that line (a jump never leaves text held; Contact's block is a
    screen tall, title 246 px / 384 px into it, so the block alone would play too early); step() leaves an unplayed
    opening step to it; hereN() reads .is-here; clear() drops .mo-held; the header's scene name now waits until the
    scene's heading has gone UP (it named the gallery over Now's text on the phone).
  - fx-scroll.js: reveal() leaves .mo-own to fx-motion.  fx-sound.js: banks (bankOf/bankStop), crossTo (dovetailed
    cross-fade ~2.4 s, a 3-5 dB breath for ~1 s, like a page's step-back but gentler), cue "part", pageKey() = the part
    in the home, fx:part debounced 220 ms, partRoom() after a cut's arrival.  chrome.css .is-here; motion.css print.
  - The language switch keeps the part with fx-core.js's existing place record (nth main > section + ratio): EN home at
    About's path step 2 -> IT home at About's path step 2, same ratio (lang1440/log.json). No code needed.
- Looked at (.shots/l-motion/): op1440 + op1440b + op390b + op1440it (openers; Contact rises after the fix: contact-strip),
  hdr1440 + hdr390 + hdr390b + menu-open (header), lang1440 (before/after/fresh-it), links1440 (6 links fly, copy
  works: "COPIED", clipboard holds the address), steps2d (counts 52% -> 68%, the year snapped, bars drawn).
  held.mjs: reduced motion 0 hidden, ?stage=0 0 hidden. lt.mjs: no long task in a whole-home wheel scroll (load 1 %).
  SOUND's first.mjs --fresh 3: start +5/+6 ms, no context until +2550 ms (idle, on Work), console clean. matrix.mjs:
  same states as wave 6. partsnd.mjs: the room follows every part (2 banks in a fade, 1 after), Contact = morning.
- Needs elsewhere: STAGE (the path plates keep the English months after a language flight: lang1440/after.png "MAY/JAN
  2026" vs fresh-it.png "MAG/GEN 2026"); DOCS (DESIGN.md Header/Motion/Sound for the home: .is-here, the scene name's
  rule, the part openers, the part's room).
- Gates (final tree, run 2): assemble 0, --check 0, claims OK (34 pages); Astro build 0, PARITY OK, asserts ok (1154
  refs), claims on the build OK. held.mjs after the last edit: 0 .mo-held, only the cover's foot hidden (it fades by
  the cover's own design as the eye flies into the name, back at the top). Server 5384 stopped (pid 7332).
- How to run: port 5384; Astro into .shots/l-motion/dist; `python scripts/serve-static.py 5384 .shots/l-motion/dist public`.
- How to look: .shots/l-motion/_scripts/ openers.mjs <tag> [--m] [--it] · header.mjs <tag> [--m] [--menu] · lang.mjs
  <tag> [--at=path] · links.mjs <tag> · partsnd.mjs · held.mjs [--reduce] [--q=stage=0] · lt.mjs · steps2d.mjs.
