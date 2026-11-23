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

## J3 online, J2b NOW launched (23 Nov, about 09:55)

- The director: J3 committed (`6405b8a`), his diary `17d593d`; the squash `c02be7b` on top of `24eaba4` pushed. He
  passes Alberto the three checks (the bar, the notch, sideways) and asks for a screen recording of two quick flicks,
  the iPhone model and the iOS version.
- J2b NOW launched on `17d593d` without the rail (notes `j-now.md`, captures `.shots/j-now/`, ports 5446-5448).

## J2b NOW, done (run wf_c79d552f-9c8, returned 23 Nov about 12:25; notes `j-now.md`)

- On an upright phone Now is three captions held at the foot (`[data-cap-step]` boxes inside the one step: the desktop
  keeps one step to the stage and the eye); the orrery held in the band for the whole of Now, the mark 128 px (HEAD 65),
  front bodies 51-66 (HEAD 45-54), one name at a time; it arrives earlier inside `lit` (70 px as it lights, HEAD 22-32);
  at the join it rides up with the last caption and fades while the gallery's head comes up (J2r replaces this).
  Desktop and printed states identical; GPU in place below HEAD; gates green. The lead looked at
  `.shots/j-now/vF-en/sheet.png`. Summary sent to the director.
- Open: the hero's tail between k 0.31 and 0.42 is the cosmos alone (as on HEAD: closing it means moving `lit`); the
  smallest front body is 51 px; the header shows no scene name during captions 2 and 3 (fx-motion, for J2c).

## J2r's brief from J2b (its `forRail`)

NOW ON AN UPRIGHT PHONE (caption grammar on)
- Now's section is three screens tall: 2,532 px at 390x844, 2,556 at 393x852. Its top is the hero's end (190svh): y 1,604 at 390, 1,619 at 393, in EN and IT alike.
- It holds three caption boxes, each 100svh. Each has a sticky .sc-cap held at top: calc(100svh - max(var(--s5), env(safe-area-inset-bottom))).
- The active box is the one whose caption holds the reading line. fx:step sends {scene: 'now', step 1..3, of: 3}.

WHERE THE ORRERY STANDS
- Config phone: 2 (SHAPE.tall), centred in the band, built from the host's ctx.fig.
- x is about 196-198 css px. Config y: 263.7 (EN 390), 248.2 (IT 390), 267.6 (EN 393).
- The band runs from 68 + safe top to capT - capH - 24, which ends at about 504-512 in EN and 474-482 in IT (the Italian tallest caption is taller).
- A is 150-152. In place z is 0 and the camera is coverCamera's straight view at k 1.
- Important: the orrery has no world anchor. now.js places it each frame in screen terms (x, y, A in css px; z in world units toward the eye; label bottom = L.top + ride).

WHEN IT LEAVES
- It is held until Now's section bottom reaches the view bottom (scrollY = Now top + 2 vh, so 3,292 at 390 and 3,323 at 393).
- Then ride = min(0, section.y + section.h - vh) moves it 1:1 with the last caption.
- It fades by leave = sstep(0.64, 0.86, max(c.weight, Now's c.share through a 0.07 s follower)). Now's weight drives it: it is gone at around 300 px past the release.
- gone = clamp(-ride / vh) also dims it through sstep(0.3, 0.8, gone).
- now.js returns null one screen past the release.
- Now is blend: false (it weighs itself). The raw c.share steps one of 40 rows at a time, so do not drive alpha from it directly.
- z (the arrival) and c0 0.5 apply only while the hero's flight k is below 1. flightK is a 0.26 s damped follower.

WHAT THE GALLERY'S HEAD DOES (J2a)
- Its section top is Now's end: y 4,136 at 390, 4,175 at 393.
- Its band top is the view's y 80 + safe (CAP_HDR).
- The plates' alpha follows the gallery's damped weight (SCENE_S 0.16 s).
- Its head caption (the opening row) comes up with its section and is held once its view stands; fx:step gallery step 1 is the head.

FOR THE CAMERA'S TRAVEL
- Replace or coordinate now.js's ride, leave and gone: the screen-space ride and the fade are what make the faint crossing.
- If the camera travels from Now's place to Work's (placeOf), give the orrery a world anchor, or turn the camera's travel into its screen offset, so the figure stays put and the eye moves.
- Keep c.fig's band and the caption keep-outs as they are: a caption is a keep-out only while shown, and the held title is not read live.

## J2b online, J2r RAIL launched (23 Nov, about 12:50)

- The director: J2b committed (`96cf06c`), his diary `8835161`; the squash `18e6b07` on top of `c02be7b` pushed.
- J2r RAIL launched on `8835161` (notes `j-rail.md`, captures `.shots/j-rail/`, ports 5449-5451), full proofs (it moves
  the stage's camera), the rail on Now → Work only; and, as a separate topic with light proofs, the header's empty scene
  name during held captions (fx-motion.js's observer), live today on the phone's gallery and on Now.
- **Lighter proofs (the director agrees, CLAUDE.md §3):** a lane that only touches layout or 2D runs the gates, its own
  proof of what it changed, one GPU round on the phone tier against HEAD, the first frame once, desktop identity at the
  opening and one mid-page place in each edition, and a look at the captures. Full proofs stay for lanes that change the
  stage (stage.js, the WGSL, the camera, the passes). Alberto's word wins if he answers.

## J2r cut, then resumed (23 Nov, 13:30-13:45)

- The first run (wf_440cbacc-5dd) was cut by the old account's weekly limit after about an hour, with topic 1 and topic 2
  built in the tree (uncommitted), 27 clean touch strokes and SMOOTH at the join done (`j-rail.md`). Its three servers
  (5449-5451) were left running: the lead stopped them by pid.
- Alberto logged the session in with another account (/login) and said «riprendi». A relaunch on Fable failed at once
  (that account's Fable limit, resets 25 Nov 17:00); the lane runs again on the session's model, Opus 5.5 at max effort
  (run wf_0402348a-e6c), told to continue from `j-rail.md` and the tree, not to redo what its notes record as done.

## J2r RAIL, done (run wf_0402348a-e6c continuing wf_440cbacc-5dd, returned 23 Nov about 14:35; notes `j-rail.md`)

- On an upright phone, over Now's last screen the EYE travels 1.1 view widths to the right (placeOf drifts +x at every
  j, so the side and the cosmos agree), a quintic of the scroll, exact both ways: the orrery leaves on the left with its
  name, the opening row of plates comes in from the right, side by side mid-pan; the captions hold and hand over at the
  foot. Opt-in `data-place` on the two sections. 27 touch strokes clean; the eye's speed at the join's ends 0-2 px/s
  (HEAD 115-190); GPU at the join's peak 0.69-0.73 (HEAD 0.76-0.80); desktop, sideways, printed states identical.
- Topic 2 (fx-motion.js, committed apart and FIRST): the header names the scene whose caption is shown; HEAD's stale
  name after a jump fixed (seq).
- The lead looked at `.shots/j-rail/pair-b-drag-it.jpg`. Summary sent to the director. **J2c waits for Alberto's yes to
  the rail**; its brief, from J2r, is below.

## J2c's brief from J2r (its `forJ2c`)

HOW TO LAY THE RAIL ON EVERY OTHER JOIN (the notes are in C:/Users/alber/Desktop/PortfolioAlbertoTuveri-viva/docs/redesign/rivista-story/build/j-rail.md, «For J2c»)

1. Opting in. Put two attributes on a scene's section: data-caption (the caption at the foot; measure its captions first with .shots/j-caption/_scripts/caph.mjs) and data-place.
- Two opted-in scenes one after the other in the page's [data-stage] order are a join, automatically.
- fx-scroll.js railJoins marks them rail-out / rail-in, and css/scene.css holds their end captions so they hand over in place.
- fx-stage.js railOf gives each scene its place: each join adds RAIL_K x the view width to the right, and a scene off the rail stands at the place of the rail scene before it.
- railAt glides the eye over the first scene's last screen (the quintic), and the chips' window follows the eye.
- The host needs nothing more. Never use data-rail: assemble.mjs refuses it as a marker of the water site.

2. The order on the home is hero, now, gallery, stack, path, consult, obla, contact.
- Opting in the stack makes gallery → stack a rail join. The gallery's two exit guards (its last frame's lift and its last plate's fade, skipped on c.rail.out) are already in gallery.js.
- Places at 390 then run 0, 429, 858, 1287 and so on.
- about.html (stack → path) gets the same join from the same code. Consulting, Obla and Contact have one scene per page, so nothing changes on those pages.

3. Each scene at a join end (c.rail.out / c.rail.into):
- Never ride with the page and never fade by your weight: the eye's pan takes the figure out of the frame. Stand the figure in c.fig; the host holds the view at the top on the join's side.
- Place any extra pass at c.rail.at, as now.js does for the orrery's x and hx. Consult's splat mark is such a pass.
- Move anything placed in screen px (a name, a band, a keep-out of your own) by c.rail.at - c.rail.eye.
- Let go of a figure only once it is out of the frame (now.js lets go past away 0.92; measure each figure's extent to set yours).
- Drop the phone dodges listed in J2a's brief: stack.js the free band, the push and the glass stepping back (lines 162-207); path.js the pane stepping back and the line dimming (189-295); consult.js the four figures whole in the band; obla.js the hop (43-89).

4. Contact. The morning is DOM ([data-dawn], the day's straight edge rising with the page), not part of the world, so a sideways pan cannot bring it in. My advice is to leave Contact off the rail: it then stands at Obla's place and Obla → Contact stays the day's vertical rise. Ask Alberto if he wants otherwise.

5. Measure each pair before opting it in:
- Each figure's screen extent at rest (geo.mjs). With RAIL_K 1.1 the next figure is wholly out of the frame at the join's start, the first one wholly out at its end, and mid-pan there is a clear gap (61-77 px here). A figure wider than about one view width needs a per-join step; RAIL_K is global today.
- Each figure's band must end above the other scene's caption shown during its half of the pan. The Italian captions are taller.
- GPU at rest at the hand-over, where both figures are whole: +0.16 ms here. The stack's eight plates next to the path's panes may cost more.
- Joins must stay at least a screen apart, because each join's glide spans the first scene's last screen.

6. What this lane learned:
- (1) fx:step goes out before the step's class moves: read .is-active a microtask later.
- (2) A part's opening held in a caption that waits at the foot used to play unseen. fx-motion.js now waits for the caption, for any caption scene.
- (3) At a join a figure's presence must be the rail's (whole), not the rows' share, or the plates come in faded. Air, field, camera and looks keep the share.
- (4) A presence ramp is invisible only once the figure is off the frame.
- (5) The header names the caption scene shown, generically, and show() puts in only the latest name. Prove the header after a quick walk and a jump (hrace.mjs), not only at rest.
- (6) The host's measure on work.html varies by 0.1 px between loads of HEAD itself; check with measdiff.mjs before blaming a change.

7. Probes are in C:/Users/alber/Desktop/PortfolioAlbertoTuveri-viva/.shots/j-rail/_scripts/: geo, stills, rtouch (--every=16 --win=), rrec + ran (SMOOTH), gpurail, desk (--a/--b, --pl), later, hdr, hdrshot, astronav, layout, plain, hrace, hrace2, measdiff, dbox, ff2/ff2t2. They assume the Now → gallery join (its selectors and y): generalise those.

## J2r online, Alberto's yes, J2c split (23 Nov, afternoon)

- The director: J2r committed in two topics (`072945f` the header, `7073df6` the rail), the squash `240c6c0` on top of
  `18e6b07` pushed. Alberto, in the director's session after the five checks on his iPhone: «si vabene» (yes to the rail).
- J2c split into three lanes, each published before the next: **J2c1 ABOUT** (the stack and the path; Work → stack,
  stack → path, home and about.html), **J2c2 CONSULTING + OBLA** (path → Consulting, Consulting → Obla), **J2c3
  CONTACT** (Obla → Contact and the morning's edge). Light proofs for captions and layout, full proofs for the rail.
- J2c1 launched on `e33bd73` (notes `j-about.md`, captures `.shots/j-about/`, ports 5452-5454); its plan went to the
  director first.

## J2c1 ABOUT, done (run wf_19011901-0a9, returned 23 Nov about 18:10; notes `j-about.md`)

- The stack and the path on captions and on the rail (Work → stack in the home, stack → path in the home and on
  about.html); host changes in fx-stage.js (no yields during a join; S.rk keeps a rail scene whole after its join).
  126 touch strokes clean; GPU at the joins below HEAD; desktop, sideways, printed identical; gates green. The lead looked
  at `.shots/j-about/pair-sp-b-en-p2.jpg`. The director's four notes were not proved by the lane (they reached its notes
  after it started): a short check runs (wf_0dbac55f-bbd) before the summary goes to the director.

## J2c2's brief from J2c1 (its `forNext`)

For J2c2 (Consulting and Obla; path → Consulting, Consulting → Obla). HEAD will be the director's J2c1 commits; pick ports other than 5452-5454.

1. Opting in
- Add `data-caption data-place` to the Consulting and Obla sections in parts/c-main.consult.html and c-main.obla.html. Both builds and the home read these partials.
- In the home this makes the path → consult and consult → obla joins. On consulting.html and obla.html each is the only rail scene, so nothing travels there.
- Home places at 390: now 0, gallery 429, stack 858, path 1287, then consult 1716 and obla 2145 (RAIL_K 1.1 × vw). Contact stands at the last place.

2. Measure the captions first (.shots/j-about/_scripts/caph.mjs, change the selector)
- The path's band ends at 502 IT / 533 EN at 390, so Consulting's first caption must start below that.
- The path's last caption (B.Sc. and thesis) is 208 EN / 240 IT tall, with its top at 564 IT at 390, so Consulting's band must end above it.
- The host gives every step the band above the scene's tallest caption, so one tall step shrinks every band. Shorten by layout, never by size.

3. What the host already does (fx-stage.js)
- While `c.rail.join`, slabs and extra passes are whole (bwF) and yields are skipped.
- Swarm formations keep the share. Consulting's gen/cut/code/agents and Obla's character are formations, so watch the points pass to and from the path's line during the pan.
- Whole weight (figure:true) was tried: it moves the swarm's rank intervals all at once (stage.js packSlots) and empties the leaving figure. Do not retry it.
- After a join, S.rk keeps the arriving scene whole while it holds more than half the screen.
- Any factor of a scene's own share must be 1 while `c.rail.join` (the path had `sstep(0.6, 0.9, share)`).
- Consulting's splat mark (gen as gaussian blocks) is an extra pass: check that it sits at c.rail.at and stays whole through the pan.

4. The path's end
- The path now pulls its eye back to the straight view over local 0.5-0.9 of its last step. Without that, the blended camera swung at the exit (pair-pathexit.jpg).
- Once path → consult is a join, that is the first 40 % of the pan. Look at it in 16 ms strips; if it reads as a lurch, shape `gone` in path.js's cap branch.
- In a caption band, drive nothing from the caption's text box at a scene's end: the caption hides at once at local 1.
- A figure that must leave with its view moves in the world (dy), not by re-aiming the eye.

5. Proofs
- Check that the +5.4 to +5.75 empty window at the home's path → Consulting exit is gone.
- The probes in .shots/j-about/_scripts/ take the join or scene as a parameter:
  - jtouch: --join, add the consult and obla selectors and their y.
  - gpujoin: --to.
  - rrec + jran: --join=y0,y1 --ids.
  - desk: --sel.
  - floorab: --sc.
  - stills: --sel --offs.
  - sleepdbg: --to --at.
  - astroab: Astro soft navigation, change the page.
  - Also stackext, sheetrun, tsum, caph, pathsearch (a figure's geometry chosen offline with the scene's own math), measdiff, later and hdr.

6. Do not retry
- tb-driven `gone` in a caption band.
- Re-aiming the camera to make a figure ride.
- The phone's 0.26 feather in a caption band: it drew a wide blurred band.
- `a[href$=…]` selectors on pages whose links carry ?debug=1.
- Editing a probe with sed -i while a batch runs it (the running bash keeps the old file).

## The director's notes for J2c2 (23 Nov, about 18:30; J2c2 approved, launched after J2c1 is committed; these go in its brief)

1. Consulting keeps its walk (§1). Four figures of light, each at its place in the room's depth, and the eye walks from
   one to the next as the steps change. That walk is inside the scene, not the rail. On the phone the band holds the
   figure of the step being read; the eye's walk between figures follows SMOOTH's law (glideK, follow), no cut, no jump.
2. If a step's text cannot fit one caption under the band at 390x844 even by layout, split it into phone-only captions
   as Now did ([data-cap-step]: one heading, every word once, the desktop untouched). Never by type size.
3. Obla's two tables of fields are text: no chips, light or plates over them at rest (FIX2D cleared the chips from that
   table once; do not bring them back). Obla describes itself as a finished product: no status line is added.
4. The failure switches still print complete: ?failsplat=1 (the gaussian mark), ?failfield=1, ?stage=0 and reduced
   motion, on both pages and in the home's parts.
5. The header names the scene at every caption, as J2r's rule does; fx-motion's snap of any year or count fires once,
   as its caption shows.
6. On obla.html, Obla's light leaves as the day rises (obla.js), exactly as today. The home's Obla → Contact stays J2c3's.

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
