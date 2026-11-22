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
