# j-mobile — the phone, made as good as the desktop (the lead's notes; session `portfolioalbertotuveri-viva-27`)

- **Asked by Alberto, 22 Nov 2026, about 21:30, with a screenshot of the live home on his iPhone** (Safari, 21:28,
  `albertotuveri.sersan.io`; saved at `C:/Users/alber/.claude-albi/uploads/fcd41c0d-79e9-4b80-83ca-74bed9dfd9c1/bd1ff445-image.png`):
  «Ora dobbiamo fare in ottimizzazione anche per mobile , e renderlo bellissimo come quello su desktop . Per ora su
  mobile non è progettato bene , bug, animazioni storte e non continue , che si vedono dietro le scritte. Non è uno
  scroll continuo in un mondo come su desktop».
- **What the screenshot shows:** the header, one glass plate with a capture at the top right, the hero's foot (role,
  sentence, «Write to me», Work, About). NOT there: the name ALBERTO TUVERI made of light, the cosmos, the chips.
- **What nobody had done before:** a real phone. Every "phone" check of waves 1 to 8 was Chrome with a phone
  viewport (CLAUDE.md §8, «Mai provati»). Safari's WebGPU, an HDR screen (the float16 canvas path is taken where
  `dynamic-range: high` matches: an iPhone does) and a browser bar that changes the view's height while scrolling
  were never exercised.
- **Phase 1, root causes before any fix** (`systematic-debugging`): (a) three questions to Alberto: the device, whether
  the name ever appears, and what `https://albertotuveri.sersan.io/?hdr=0` shows on his phone; (b) two read-only
  readers (workflow `mobile-understand`): DEVICE (why Safari on an iPhone draws plates but no name and no cosmos; what
  the host does when the view's height changes; a diagnostic Alberto can open on his phone) and WALK (the whole home at
  a phone's size on the live site, every place where the journey breaks). Their notes: `build/j-device.md`,
  `build/j-walk.md`; captures in `.shots/j-walk/`; ports 5430 to 5434.
- **Nothing in the tree is changed in phase 1.** The director (`portfolioalbertotuveri-viva-3f`) commits and publishes;
  push, merge and deploy only with Alberto's explicit yes.
- **Alberto's answers (21:45):** iPhone, Safari (iOS 26); the name of light «non compare mai»; `?hdr=0` not tried yet.
- **The director (21:45):** this session leads the phone wave. Lanes one at a time, notes in `build/j-*.md`, no commits;
  before a lane writes into the tree, its plan to the director in a few lines; when done, the summary (files, gates,
  numbers against HEAD, captures, what is still wrong). Build on `15fb573` (main on GitHub `5b22104`). A diagnostic page
  on the site goes online only through the director with Alberto's OK. Shared files (`stage.js`, `fx-stage.js`, the
  scenes, `css/*.css`): one lane at a time.
- **22:00:** the first run of `mobile-understand` (wf_f89838a8-fbe) fell at once on the Fable weekly limit (resets 26
  Nov). Alberto set the session to Opus 5.5; the two readers run again on it, effort max, with his answers in.

## Phase 1, the diagnosis (run wf_c6edb1c5-2c6, 22 Nov, returned about 22:35; notes `j-device.md`, `j-walk.md`)

- **Why the iPhone shows one plate and no world (DEVICE, likely; the lead looked at the evidence).** The stage adds all
  its light (the name's points, the cosmos, the chips, the haze, Now's orrery, the bloom) as premultiplied colour with
  ALPHA 0 over the page (`draw.wgsl.js` night alpha × `LOOK.nightAlpha` = 0; the field's passes return alpha 0; the
  bloom adds with alpha zero/one); only the plates carry alpha. The WebGPU spec leaves colour above alpha undefined on
  screen, and WebKit bug 278926 reports Safari dropping exactly such light. Emulating a compositor that un-premultiplies
  gives Alberto's screenshot pixel for pixel: `.shots/j-device/cmp-alberto.png` (his iPhone | the emulation | Chrome).
  The stage did not turn itself off (it would have printed the name). Open: whether only the float16 HDR canvas (which
  an iPhone takes) loses it, or the 8-bit one too (`?hdr=0` decides).
- **Why the phone's motion is crooked and not continuous (WALK, confirmed in Chrome).** Under 1024 px every scene puts
  its figure in the top 55 % of a sticky view and each step's text travels up through that band; each scene dodges in
  its own way (plates and the stack and Obla change sides, the last plate fades and comes back, Consulting's figures
  vanish under the text), so figures hop; frames go empty (the hero's tail, the end of Now, the path's head) or hold
  two scenes' figures at the joins; Now's orrery and the path are much weaker than on a desktop. Also (DEVICE, likely):
  the touch scroll is native while the canvas follows `window.scrollY` in rAF; every show or hide of Safari's bar
  re-measures the whole page twice; the views are 100svh, the canvas 100vh. Plain layer: the etched line about 13 px,
  the language link and the address link under 44 px, no top safe area in the header.

## The wave (proposed by the lead, 22:40; one lane at a time, the director commits and publishes)

1. **J1 LIGHT** (`stage/stage.js`, `stage/gpu.js`, the WGSL as needed): every pixel the stage writes is valid
   premultiplied (alpha at least the brightest channel), the same look in Chrome; Safari keeps the 8-bit canvas unless
   `?hdr=1`. Then online, and Alberto looks on his iPhone (`/` and `/?hdr=1`).
2. **J2 BAND** (`css/scene.css`, `fx-stage.js` figOf, the scenes; maybe split in two): on a phone each step's text is a
   caption held at the foot of the view (as a case's caption already is), the figure owns the band above it, the
   dodges go, the joins hand over, Now's orrery and the path get the band.
3. **J3 VIEWPORT** (`fx-stage.js`, `css`): no full re-measure when only Safari's bar moves; the canvas on the views'
   viewport; the header's top safe area; then the canvas against the finger, measured on his phone.
4. **J4 PLAIN**: tap targets to 44 px, the etched line at the 15 px floor, the header over the night.

## J1 LIGHT, done (run wf_fb47c2b2-dc2, returned 22 Nov about 00:20 on the 23rd; notes `j-light.md`)

- One last full-screen pass (`stage/wgsl/resolve.wgsl.js`) writes the canvas valid premultiplied with the ground
  compensated, so Chrome's look is unchanged; WebKit keeps the 8-bit canvas unless `?hdr=1` (`gpu.js isWebKit`).
  The director's six notes (in `j-light.md`'s head) all met; the blend-state way rejected for four stated reasons.
- The lead looked at `.shots/j-light/sheet-emu-iphone.png` (HEAD loses the light through both emulations, the tree
  keeps it) and read `isWebKit` and the `canvasSetup` branch. Summary sent to the director for commit and release;
  Alberto then opens `/` and `/?hdr=1` on his iPhone.
- **Next:** J2a GRAMMAR + GALLERY, launched only once the director says J1 is committed (his release must not see
  half a lane). Its plan went to the director with J1's summary.
- **23 Nov, 00:33 (the director):** J1 committed (`44471ab` the diagnosis, `2e7a046` the resolve and isWebKit) and online
  (the squash `c4c0646` on top of `5b22104`). HEAD `2e7a046`.

## J2a CAPTION (launched 23 Nov about 00:40 on `2e7a046`; notes `j-caption.md`, captures `.shots/j-caption/`, ports 5440-5442)

- The caption grammar on a phone, opt-in per scene, the gallery first, its phone-only dodges out; the director's six
  notes in the brief (the caption kept clear every frame, the type floor, the house motion, the safe area and the bar
  without J3's work, SMOOTH's no-snap law with its probe and tier B GPU, printed states unchanged).
- **Done (run wf_ad2d8385-1b3, returned 23 Nov about 02:30):** `data-caption` on the gallery; captions held at the foot
  in svh (`css/scene.css`), picked by `FX.scroll.caption` (`fx-scroll.js`), kept clear and given the band above them by
  the host (`fx-stage.js` figOf, `ctx.caption`); `gallery.js` without its phone dodges. Plates over a shown caption: 0
  frames (HEAD up to 4,657); SMOOTH's worst step 116-134 px/s against 346-361; desktop and printed states identical;
  gates green. The lead looked at `.shots/j-caption/pair-r2-b-drag-home-en.jpg`. Summary and J3's plan sent to the
  director. **J2b waits for Alberto's look at J2a on his iPhone**; its scene-by-scene brief is J2a's `forJ2b`, kept at the
  end of this file.

## J2a online, J3 VIEWPORT launched (23 Nov, about 02:45)

- The director: J2a committed (`a5a1fff`) and online (the squash `24eaba4` on top of `c4c0646`); live check at 390x844 on
  /work.html: one caption at a time held at the foot, plate whole above, console clean. HEAD `0f19daa` (diary only).
- J3 VIEWPORT approved and launched on `0f19daa` (notes `j-viewport.md`, captures `.shots/j-viewport/`, ports 5443-5445),
  with the director's five notes: a canvas that never changes size or reallocates when Safari's bar moves (the large
  viewport, scenes mapped through the canvas's real box); re-measures only on real changes, keep-outs following the
  text through an emulated bar change; the safe areas (top, and sideways left and right), CAP_HDR following the header;
  desktop identical, tier B GPU, sleep, halvings, first frame, SMOOTH; the finger-against-canvas lag left to his phone.
- Alberto has not yet answered on J1 or J2a. J2b stays parked until he has seen J2a.

## Alberto on his iPhone (23 Nov, 07:55-07:56; two screenshots on the live site)

- **J1 works on his device:** the home shows the name ALBERTO TUVERI of light, the cosmos's threads and the chips
  (`C:/Users/alber/.claude-albi/uploads/fcd41c0d-79e9-4b80-83ca-74bed9dfd9c1/c0d7d373-image.png`). `/?hdr=1` not reported.
- **Now, mid-flight** (`.../e7595de7-image.png`): the cosmos is there; the orrery a small far mark with its haze; the text below.
- His words: «Ho visto la galleria di work , è Vabene. L'unico problema è che in now at Sersan non si vede il logo con
  le competenze che ruotano, è troppo piccolo e sparisce con lo scroll perché va dietro le scritte, lo stesso problema
  che c era in work e che hai risolto , e che devi fare anche per le altre sezioni, bloccando lo scroll pinnando la
  posizione tipo in modo tale che l animazione si possa vedere senza che la pagina scenda giù e la scritta vada sopra .»
- **Read as:** J2a accepted. Now first, then every other section: pin (the sticky view with captions handing over in
  place, not scroll-jacking), the figure large and held in the band above, the text never over it.
- **Plan (relayed to the director):** J2b NOW (on a phone Now opts in to captions; its text split into two or three
  phone-only steps, the desktop unchanged; the orrery held in the band for the whole of Now and about twice today's
  size, the mark from about 65 px to 120 or more, front bodies 56 or more, proved by the gap probe; lit and arriving
  before Now's first caption, never on the name's letters; the join into Work handed over). Then J2c: About's stack and
  path, Consulting, Obla, the joins (J2a's brief below). Each after the previous lane is committed; J3 still running.

## The director's notes for J2b NOW (23 Nov, about 08:05; J2b then J2c approved, each after the previous commit)

1. Now split into two or three steps on the phone ONLY. The desktop stays one step to the stage as well as to the eye:
   the host's step count, the scene's steps, fx-scroll's fx:step and the anchors equal to HEAD (prove the stage's inputs
   deep-equal, as J2a did). One heading, the same reading order, no duplicated text in the DOM (a screen reader must not
   hear Now twice).
2. The first view stays exactly as it is: the figure lights only once the name's letters are behind the eye (CLAUDE.md
   §1). Close the hero's empty tail by arriving earlier inside that rule, never by drawing over the name. Prove it with
   the hero's frames against HEAD during the flight.
3. Twice the size on a 390 phone, with the gap probe over a whole turn. The names' type at or above the phone's label
   scale; the mark's grains and spores at the size Alberto approved on the desktop bench; the band clear of the caption
   in every frame (light and chips included).
4. If a larger band lets more than one name stand legibly on a phone, show it; otherwise keep one at a time. The nine
   names stay printed in their caption («What I do»).
5. The join from Now into Work: one take, no empty frame, no two figures at once.
Same proofs as J2a otherwise: captions clear every frame, the type floor, the house motion, SMOOTH (--m), tier B GPU,
sleep, halvings, first frame, desktop and printed states identical. «Pinnando» = a sticky view with captions handing
over in place; no scroll-jacking: the vertical scroll stays the browser's (CLAUDE.md §2).

## Alberto, 23 Nov about 08:10: travel through the world on the phone, not down the page

His words: «Puoi fare anche un movimento nel mondo 4D verso destra per esempio per le card di capabilities , non che si
slidano verso destra. Ma intendo proprio la posizione della sezione e dell elemento nel mondo 4D che è verso destra
rispetto alla sezione precedente. Al posto di scrollare e far si che sia tutto verso il basso nel mondo su telefono ,
possiamo fare I movimento nello spazio dimensionale come facciamo gia su desktop .»

- **Read as (the lead):** on a phone each section's figure stands at its own PLACE in the world, beside the previous one
  (his example: About's capabilities stack to the right of the section before), and the scroll moves the EYE through
  space from place to place, as on the desktop; the cards never slide on their own. The vertical scroll stays the
  browser's (no scroll-jacking); the captions hand over at the foot (J2a); what moves in the canvas is the camera.
- **What the code does today:** the cosmos already travels the same way on both (`stage/cosmos/web.js` `placeOf`:
  forward, -z, with a slow drift aside, +x, and down; `journeyOf` maps the home's parts to it). On a phone the scenes'
  figures stand in the band and go up with their sections, so the eye reads «everything goes down».
- **Folded into the wave:**
  - J2b NOW makes the join from Now into Work the first spatial move, as a generic phone-only mechanism (a rail):
    - each scene's figure at its own place, to the right of the previous one, following the cosmos's own curve so the
      two agree;
    - across a join the eye travels there, scroll-driven and reversible, the old figure leaving to the left and the new
      one arriving from the right into the band as its first caption comes;
    - never two figures in the band, never an empty frame.
  - J2c applies the rail to every other join: Work → About's stack → About's path → Consulting → Obla → Contact, and
    between the scenes of a single page.
  - The desktop stays unchanged.

## The director on the rail (23 Nov, about 08:20): a new order, and the notes for J2r

No law of CLAUDE.md §1-§2 is broken: the eye travelling from place to place is §1 itself. The rule it must not cross is
§2's «nessun testo entra scivolando da un lato»: only the world moves, and captions still hand over in place.
**The order now (small lanes; Alberto sees the rail on one join before it spreads):**
1. **J2b NOW**, as approved, WITHOUT the rail: Now's captions, the figure held in the band at about twice the size, the
   earlier arrival.
2. **J2r RAIL**, its own lane after J2b is committed: the generic phone-only rail, built on one join (Now → Work),
   published for Alberto's look.
3. **J2c**, afterwards: captions and the rail on the other sections and joins, once Alberto has said yes to the rail.
**Notes for J2r:**
1. It is the camera that travels: the eye moves along the cosmos's placeOf curve, through the pivot and free camera
   with the existing springs. Figures are never translated in screen space, so the parallax is true (near chips pass
   faster than far threads) and the cosmos agrees with the figures.
2. Scroll-driven and exactly reversible (place = f(scroll)), a quintic glide (glideK) across the join, no velocity
   step at its ends. SMOOTH's probe at the join, 16 ms strips plus the 50 ms strip, forward and back.
3. During the pan both figures may stand in frame side by side: that is the shot. They must never overlap each other
   or a caption, and no frame may be empty.
4. The side: Alberto said right «per esempio»; agreement with the cosmos matters more than the side. If placeOf drifts
   the other way, either the rail follows it or the phone's journey mirrors; pick one and say why.
5. The phone's horizontal drag still orbits the eye around the pivot as the rail moves it (pivotStep's spring); the
   vertical scroll stays the browser's.
6. Tier B GPU at the join's peak (the whole frame changes there); sleep, halvings and first frame as usual; desktop, a
   phone held sideways, reduced motion and printed states unchanged.

## J3 VIEWPORT, done (run wf_c325da51-0cc, returned 23 Nov about 09:30; notes `j-viewport.md`)

- A real bug found: on an iPhone HEAD drew the small viewport into a canvas that followed Safari's bar; with the bar
  hidden the picture was stretched 1.14 times (plates jumped and grew, keep-outs 56-98 px below their text), and every
  bar change cost two measures and up to four type rasters. Now the canvas is max(100%, 100lvh) and never changes size,
  the frame is mapped into its box, a resize measures only when the layout really moved, and the safe areas are in
  (--hdr, --gut, ctx.safeTop). The lead looked at `.shots/j-viewport/bar/cmp-work-gal-rest.jpg`. Summary sent to the
  director. **Next:** J2b NOW on his commit.

## J2b's brief, as J2a left it (its `forJ2b`, 23 Nov about 02:30)

Opting a scene in is one attribute: data-caption on its section. The CSS (holds, first and last step), fx-scroll (which caption is shown), the host (captions as text blocks, keep-outs, the band, ctx.caption) and the keyboard all follow from it. Before opting in, measure the scene's captions on a phone (C:/Users/alber/Desktop/PortfolioAlbertoTuveri-viva/.shots/j-caption/_scripts/caph.mjs, change its selector). The host gives every step the band above the scene's tallest caption, so one tall step shrinks every step's band. Shorten by layout, never by size. The gallery's captions are 245-315 px (29-43 % of the screen) and leave a 280-420 px band.

Already handled generically, from pitfalls hit here:
- A step that is itself a text element (an li) was read as one text block in its flow place, a screen away from its words. Now each caption .sc-in is one block, read where it is held.
- With a negative bottom margin, align-self: flex-end pushes the box down by that margin. The first caption is placed by its top margin instead.
- The last caption has no hold below its step and keeps its room as padding, so it leaves just above the next scene's top.
- The first caption sits at its step's foot and rides up with the scene; held from the start, it sat under the figure still rising with the view.
- The home's part opener needs no change.

Scene by scene:
- Now has no steps, and its text (title, lead, body, links, nine names) is far taller than a caption. Either split Now into two or three caption steps with the orrery held in the band above for the whole of Now, or keep it in flow and hold the orrery's band (now.js orreryAsk, stacked) for the whole of Now instead of letting it leave at the second half-screen.
- About's stack: on a phone with a caption, drop the free band, the push (softClamp/softMin) and the glass stepped back as it crosses (stack.js 162-207). Stand the stack in c.fig and centre its slide on the hand-over (its own off = 0). Measure its .tools rows first.
- About's path: drop the pane stepping back within 64 px and the line dimming within 72 px (path.js 189-295). The band lets the phone run the desktop's walk along the line through two or three panes, and the empty frame at the path's head closes.
- Consulting: the keep-outs will hold only the caption, so the figures stand whole; give the walk between the four figures the band. Its .btn controls inside captions already follow the captions' visibility (capAt). The grey blob of the splat mark and the faint film strip are figure matters.
- Obla: drop the hop (obla.js 43-89) and stand the character in c.fig. The fields table makes one caption tall: measure it.
- Joins: where two caption scenes meet, the first scene's last caption rides up just above the next section and the next scene's first caption comes up with its section. Text moves with the page there, never through a held figure. Make each figure leave with its last caption (the gallery's band rises from local 0.5 of its last step) and enter with its first.
- The hero's empty tail is not a caption matter: shorten it on a phone or light Now's figure earlier.

Probes to reuse, in .shots/j-caption/_scripts/ (they use gallery selectors, generalise them): touch.mjs, stills.mjs, floor.mjs, desk.mjs, plain.mjs, gpugal.mjs and gpugal.sh, ff2.mjs, meas.mjs, pairstrip.mjs.
