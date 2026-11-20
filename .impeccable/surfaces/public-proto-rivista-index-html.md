---
version: 3
slug: "public-proto-rivista-index-html"
primary_target: "public/proto/rivista/index.html"
related_targets: ["public/proto/rivista/it/index.html"]
---

## Scope

The cover of the site (public/proto/rivista/index.html, both editions), as built in round 10 (2026-11-11), after Alberto looked at the site and said: «Puoi fare molto di più , la hero non mi piace . Crea qualcosa di veramente strabiliante. 3d camera motion world lights immersive . Aggiungi più animazioni , transizioni , migliora . Le scritte piccole non mi piacciono , sopratutto nei bottoni e nel menu». Three scenes and the dawn close: `hero` (the hall: the name as a sculpture of light seen by a moving camera; stage/scenes/cover/world.js and hero.js), `now` (Now at SerSan, the sersan.io capture inside the lit plate at the far end of the hall), `index` (four rows to Work, About, Consulting, Obla, each with its emblem of light), then the dawn close with the address. Visitor mode: Experience with a Persuade graft (the button "Write to me" in the first viewport). This brief replaces the one of the round before, in which the hero was the flat name with one plate in front of its last letters and a sheaf of rays: a poster with an effect, which Alberto did not like. The contract is docs/redesign/rivista-story/50-from-zero-spec.md; where the cover left it, docs/redesign/rivista-story/60-as-built.md.

## Audience, job, proof

Recruiters, CTOs and studios judging craft in 45 seconds, and companies or private individuals looking for help with AI content, video editing, Claude Code practice and multi-agent systems. The cover must say who he is, where he works now and where to go, and prove real-time WebGPU work by being it: a world drawn live, with a camera, light that glows and glass. Constraints: real HTML text over the canvas (the h1 stays the accessible name), AA contrast on both grounds, nothing a visitor reads under 15 px on a phone or 16 px on a desktop, reduced motion and no-WebGPU as complete printed pages, the stage moving only in its rest window after an input (14 s on the cover), no invented facts, two languages from one source.

## Direction contract

THESIS: A dark hall, one swarm of light, plates of glass, a camera that travels. The cover is a world seen by a moving camera, not a page with an effect. Refused: a poster with an effect laid over it, anything liquid (no drop, bead, pool, drip, ripple, wave, wet edge, reflecting floor or horizon line), large soft round discs in front of things, the anonymous particle galaxy, glassmorphism, and every trait of the white magazine.

OWN-WORLD: Near-black blue ground (#0c0e14); warm white type (#f4f1ea) in Sofia Sans Extra Condensed 800 capitals, set like film titles; light that is cobalt where it is thin and white where it gathers, glowing through the canvas's own bloom; thick plates of clear glass with straight edges, soft-box reflections and a spectral split at their bevels; straight beams; fine dust in depth. No floor, no horizon, no reflection: the hall has depth, not ground. With all content removed: black, a name of points standing in depth, tall plates at several distances, beams crossing behind.

STORY: Who he is (the name, standing in the hall), where he is now (the camera flies through the name to the lit plate in the distance, which holds sersan.io and becomes Now), where to go (the index), and at the end of the page, at dawn, the address to write to.

FIRST VIEWPORT (1440×900): On a cold load the page's h1, ALBERTO TUVERI on one line across the measure, rises as type while the swarm flies in and lands on its letters, the camera looking straight at it; at 1.45 s the flat h1 fades into the points. From 1.55 s to 3.7 s the camera pulls back and rises a little, off to one side: the name shows its thickness (a white-hot front face, the sides along the letters' edges, five thin cobalt layers behind), five tall plates come into frame (two near the eye, large and soft; three behind and between), six straight beams fall from high out of frame and cross behind the name, dust hangs through the depth, the glow opens, and far behind, small and bright, the plate that holds sersan.io. At rest the camera drifts slowly; the pointer orbits the eye about the name by several degrees, and the near plates, the letters' layers and the far field slide against one another. Under the name, entering at 1.9 s and 2.05 s: left, the role line in accent and the sentence; right, "Write to me" (18/20 px bold, 56/64 px tall, its ink filling in from the left edge under the hand) and two quiet links. Bottom right: "160,000 points · {ms} ms GPU". On a phone the name is two lines and the hall has three plates. Scrolling (the hero is 150svh tall), the camera flies forward through the gap between the two words (on a phone between the two lines), the letters pass the lens on both sides and go soft, then the focus racks to the far plate, which grows into Now's plate and ends on the site's straight camera, so Now takes over without a seam.

FORM: Scroll-driven scenes: sticky full-viewport views the stage fills, real text stepping beside them; on the cover a free camera path (coverCamera, shared by hero.js and now.js). Code-led.

## Memorable moment

The flight through the name: the letters of light open on both sides of the eye, pass the lens and go soft, and the small lit window at the end of the hall comes sharp and turns out to be the real sersan.io, inside the glass, where Now begins.

## Unresolved decisions

The arrival: for the first 1.4 s the cover still reads as the flat name rising as type and then handing over to the light; the decided opening (points flying in along straight lines and building the letters) does not read yet. At rest the letters keep a fine speckle at their edges; a near plate passing the lens shows for a moment as a grey bar; the cut between pages shows the title card's name and the arriving h1 together for about 100 ms. Alberto has not yet seen the new hall live (headless captures only).
