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
