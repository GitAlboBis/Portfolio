# s-critic — CRITIC3 (port 5282), cold eye on cover v3 "the lit hall"
- State: DONE. Server 5282 stopped. No site file changed.
- Run: python scripts/serve-static.py 5282 public; node .shots/s-critic/_scripts/s.mjs open|rest|sweep|flight|cut|states [--m] [--dpr= --w= --h= --tag=]; gpu.mjs; crop.mjs.
- Captures: .shots/s-critic/{open,open-m,rest-d2,rest-d1,rest-1920,rest-m,sweep,flight,cut,states}/

## Numbers
- GPU at rest (32 s, blades crossing): 1440 DPR2 med 1.23 / max 1.26; 1920 DPR1 0.95 / 0.96; phone B 0.36 / 0.37. 160k drawn, no halving.
- Boot: first frame 718-777 ms desktop, 725 phone; one long task 80 ms at ~640-700 (before first frame); field ready AFTER first frame (+6 ms).
- Wall behind foot: ground 20 (max ch), foot bands 20/21 p50/p90 (ok); pointer low (sweep y09) beside SCROLL p90 42 (lit cell patch).

## Verdict per decision
- A wall: reached at rest (rest-d2/rest.png); not in the first ~1 s.
- B chips: partly. Many visible A's and marks, but near ones few and dim; tiny marks read as rings; chips over Now's title (states/c-now-text.png); one touches ABOUT in the header (rest-d2/c-header.png).
- C shafts: reached (smooth blade, no static) at rest; the flight's descent is blue streak noise (flight/flight-down-sheet.jpg).
- D name: partly. Width 0.74, from below, nearest/farthest ~1.19 (<1.25); receding outlines stippled (rest-d2/c-nameR.png); phone letter edges beaded (rest-m/c-name.png).
- E plates: partly. Left plate behind "AL", text bright, reads as a screen; washed grey at pointer x~0.46 (sweep/c-x05-plate.png); phone plate under header band.
- F camera: reached (rest-d2/rest-time-sheet.jpg drift; sweep shows parallax), name's perspective change under the hand is modest.
- G opening: not. 0-700 ms empty night on cold load (open/open-r1-sheet.jpg), ~650 ms after a cut (cut/cut-sheet.jpg); wall dim until ~1.2 s; foot ~2.9-3.1 s ok.
- H flight: partly. Letters pass as walls; descent 1.5-2 s of blue streaks; mid-flight parks are a small card in an empty room (flight/park-sheet.jpg).
