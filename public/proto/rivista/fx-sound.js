/* ==========================================================================
   fx-sound.js · the room's sound (lane n-sound; plan 70 §3.6, §5 phase 5; Alberto: «acceso di default.»)

   Everything is synthesized with the Web Audio API: no audio file, nothing from the network. One engine, made by
   RVSound.createEngine(ctx) for any BaseAudioContext, so the same graph renders live (AudioContext) and offline
   (OfflineAudioContext: public/proto/rivista/sound/render.mjs writes a list of cues to a WAV).

   THE START. No AudioContext exists before the visitor's first click, touch or key press (a scroll does not count): the
   console never sees an autoplay warning. At that gesture the engine starts and the room fades in over 1.5 s to a low
   level. The header's toggle ([data-snd], parts/a-header.html) turns it off at once (a 60 ms ramp, then the context
   suspended) and on again; the choice lives in localStorage "rv-sound" (default on). A hidden tab is silent within
   150 ms and comes back on return. ?sound=0 keeps it off for the visit (the tab's session: probes, films), and a ?fx=
   list without "sound" leaves the module out. Under the Astro build's router the engine is kept in window.__rvSound
   and this script, run again for the next page, adopts it: the room's tone glides to the new page's and never breaks.
   On the assembled build a cut is a new document: the rush closes in 50 ms as the page goes, and the page that arrives
   starts again at once, with the door, when the browser lets a context run without a new gesture
   (navigator.getAutoplayPolicy, or an activation carried over), else at the next gesture.
   THE FIRST PRESS THAT LEAVES (lane m-sound; the director, 17 November: the first click flies at once and silent, the
   sound comes in on arrival). A document's first AudioContext is one task of 50 to 160 ms of the browser's own. When
   the visit's first press, tap or Enter is on a link to another page, nothing is made in it: the flight starts at once,
   silent. Under the router the document stays, so once the new room stands (fx:nav:arrived; fx:ready after a plain
   swap) and its opening has played, the context is made in an idle moment on the activation the page already has, and
   the room fades in softly; a browser that will not run it without a fresh gesture starts it at the next one. On the
   assembled pages that click ends the document: nothing is made, and the next page starts at its first gesture; there
   it happens once a visit ("rv-snd-first" in sessionStorage), or a visitor who only follows links would never hear
   the room (the same once the router has had to give a page to the browser with the room still owed: "rv-snd-hard").
   Nothing is made by a press while a cut is in flight either. Any other first gesture starts the room in the gesture,
   as before.

   WHAT PLAYS (every role at its level in the notes, docs/redesign/rivista-story/build/n-fix-sound.md):
     room   where small speakers play (lane n-fix-sound): a chord of up to four pure tones between 220 and 790 Hz,
            each page its own (PAGES.tones), over a soft air (pink noise from 110 Hz to the page's colour, two readings
            of one loop at two speeds) and a low root and fifth for speakers that reach them; Contact's dawn brighter.
            No two tones nearer than a minor third (no beating), no amplitude swell: the drift is in the filters and a
            tenth of each tone. Every page as loud to the ear as the cover. A change of page never slides the chord.
     eye    the scroll lights two overtones of the room's chord and a faint weight, as loud as it is fast, silent at
            rest (every scroll event schedules its own decay on the audio clock: no timer). No noise. Not during a cut.
     glass  fx:step {scene, step, of} (fx-scroll.js), when the reader's own scroll brought the step: a short touch of
            glass, four inharmonic partials (a free bar's ratios), its pitch a degree of the page's mode, so reading a
            page plays a slow phrase; panned a little toward the figure's side.
     index  the cover's four rows: four notes of one chord, the row under the hand or with focus held softly.
     cut    fx:nav:start {ms, door, glass, dawn, back} (the contract: build/n-fix-flight.md): a rising rush of air
            that tops when the eye is in the door's glass (`glass`), and there the door: a low touch of glass, the
            block's body, and two bright ones leaving the centre for both ears (coming in from them on the way back).
            The whole cut is scheduled at the click, on the audio clock. fx:nav:covered: the room takes the next page's
            chord; fx:nav:arrived: it settles. Toward Contact it opens bright. The largest gesture of the site.
     hand   a press on a link or a button: a tick one almost does not hear; the copy control: two rising notes; the
            menu's sheet: a short breath, up when it opens, down when it shuts.
     obla   each of the five states (listens, thinks, works, asks, reports): a two-note motif in the character's voice.
   COST: no ScriptProcessorNode; noise from one looped buffer; every envelope an AudioParam ramp; no timer, no animation
   frame of its own (a voice frees itself on its source's onended). The noise and the reverb's response are computed
   in idle slices before the first gesture, and the reverb is set in the first idle moment after it: the gesture wires
   the graph (3 to 5 ms) and pays the browser's own price for a document's first AudioContext. A limiter and a ceiling
   (never above -6.2 dBFS) end the chain.
   ========================================================================== */
(() => {
  "use strict";

  /* ================================================================ the engine (no DOM) */
  /* the pages: root (Hz), the mode (semitones), then the room. (lane n-fix-sound) The room is heard where a laptop's
     and a phone's speakers play, between 300 Hz and 3 kHz: `tones` are the room's own chord as multiples of the root,
     voiced between 220 and 790 Hz, with their mix (the cover and a case stacked fifths, Work fourths and fifths, About
     a minor triad, Consulting and Contact a major one, Obla a major chord with its ninth; no two tones nearer than a
     minor third: no roughness, no beating); `low` is what is left under them for speakers that reach it (root and
     fifth unless said); `color` closes the tones (low-pass, Hz), `air` the air. */
  const PAGES = {
    home:    { root: 73.42, mode: [0, 2, 3, 5, 7, 9, 10], tones: [4, 6, 9],        mix: [1, 0.62, 0.3],        color: 1500, air: 1700, chord: [0, 7, 10, 14] },
    work:    { root: 87.31, mode: [0, 2, 4, 6, 7, 9, 11], tones: [3, 4, 6, 9],     mix: [0.7, 1, 0.5, 0.22],   color: 1500, air: 1900 },
    about:   { root: 82.41, mode: [0, 2, 3, 5, 7, 8, 10], tones: [3, 4, 4.8, 6],   mix: [0.7, 1, 0.5, 0.24],   color: 1400, air: 1600 },
    consult: { root: 98.0,  mode: [0, 2, 4, 5, 7, 9, 10], tones: [3, 4, 5, 6],     mix: [0.8, 1, 0.45, 0.4],   color: 1500, air: 2000 },
    obla:    { root: 65.41, mode: [0, 2, 4, 7, 9],        tones: [4, 5, 6, 9],     mix: [1, 0.5, 0.6, 0.22],   color: 1500, air: 1800 },
    contact: { root: 110.0, mode: [0, 2, 4, 5, 7, 9, 11], tones: [2, 3, 4, 5],     mix: [0.7, 0.7, 1, 0.5],    color: 2600, air: 3200 },
    case:    { root: 58.27, mode: [0, 2, 4, 6, 7, 9, 11], tones: [4, 6, 9, 12],    mix: [1, 0.62, 0.3, 0.2],   color: 1400, air: 1600 },
    "404":   { root: 82.41, mode: [0, 2, 3, 5, 7, 8, 10], tones: [3, 4, 6],        mix: [0.8, 1, 0.3],         color: 1100, air: 1300 },
  };
  /* the levels, linear amplitudes before the limiter (tuned on the offline render: the notes give the dBFS and dBA) */
  const L = {
    tone: 0.0101, low: 0.0052, air: 0.0385,    // the room: its chord, what is under it, its air
    eye: 0.0075, body: 0.004,                  // the eye at full speed: two of the room's own overtones, a faint weight
    glass: 0.028, door: 0.022, rush: 0.26, rushLow: 0.03, row: 0.019, tick: 0.012, copy: 0.026, breath: 0.11, voice: 0.026,
    verb: 0.42,                            // the reverb's return
  };
  /* every page's room as loud to the ear as the cover's: its chord's mix is scaled so that the A-weighted sum of its
     tones is the cover's (`norm`), and its air by how far its colour opens (airAmp, in the engine) */
  const aW = (f) => { const f2 = f * f, r = (12194 ** 2 * f2 * f2) / ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2)); return r * r; };
  const loud = (p) => Math.sqrt(p.tones.reduce((s, m, i) => s + (p.mix[i] || 0) ** 2 * aW(p.root * m), 0));
  Object.keys(PAGES).forEach((k) => { PAGES[k].norm = loud(PAGES.home) / loud(PAGES[k]); });
  const GLASS = [1, 2.756, 5.404, 8.933], GAMP = [1, 0.42, 0.22, 0.1], GDEC = [1, 0.55, 0.3, 0.17];
  const PHRASE = [0, 2, 4, 3, 1, 4, 5, 2, 6, 4, 3, 5];
  const semis = (f, s) => f * Math.pow(2, s / 12);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---- the two tables every voice draws from, as plain samples (no AudioContext is needed to compute them): 4 s of
     stereo pink noise at 24 kHz (Kellet's filter; a loop with no seam, DC out; everything that reads it is filtered
     well under 8 kHz and a buffer source resamples) and a 1.4 s dark stereo impulse response at the context's rate (the
     slope of a 2.5 s room, closed by a fade where it is already under the room's tone: half the convolver to set up
     and to run). A job in slices: the page computes it in idle time before the first gesture, so the gesture itself only wires nodes;
     run(Infinity) does it at once (the offline renderer). `from` lends the noise of a job made for another rate. */
  const NSR = 24000, NLEN = 4;
  function tableJob(sr, from) {
    const nsr = NSR, nN = NSR * NLEN, nI = Math.round(sr * 1.4), f0 = nI - Math.round(sr * 0.35), SL = 16384;
    const noise = from ? from.noise : [new Float32Array(nN), new Float32Array(nN)];
    const ir = [new Float32Array(nI), new Float32Array(nI)];
    let st = from ? 2 : 0, i = 0, pk = 0, b = [0, 0, 0, 0, 0, 0, 0], lp = 0, e1 = 1, e2 = 1;
    const k1 = Math.exp(-3 / sr), k2 = Math.exp(-2.7 / sr), at = 0.012 * sr;
    const job = { sr, nsr, noise, ir, done: false, ms: 0, run };
    function run(budget) {
      const t0 = performance.now();
      while (st < 4) {
        if (st < 2) {
          const a = noise[st], end = Math.min(nN, i + SL);
          let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6];
          for (; i < end; i++) {
            const w = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
            b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
            const v = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362; b6 = w * 0.115926;
            a[i] = v; const av = v < 0 ? -v : v; if (av > pk) pk = av;
          }
          b = [b0, b1, b2, b3, b4, b5, b6];
          if (i >= nN) {
            /* a loop with no seam: the last 50 ms fade into the first; then the peak at 1 and the DC out */
            const x = Math.round(nsr * 0.05);
            for (let j = 0; j < x; j++) { const k = j / x; a[nN - x + j] = a[nN - x + j] * (1 - k) + a[j] * k; }
            let m = 0; for (let j = 0; j < nN; j++) { a[j] /= pk; m += a[j]; }
            m /= nN; for (let j = 0; j < nN; j++) a[j] -= m;
            st++; i = 0; pk = 0; b = [0, 0, 0, 0, 0, 0, 0];
          }
        } else {
          const a = ir[st - 2], end = Math.min(nI, i + SL);
          for (; i < end; i++) {
            const w = Math.random() * 2 - 1;
            lp += (w - lp) * (0.18 + 0.5 * e1);   // darker as it decays
            a[i] = lp * e2 * (i < at ? i / at : i > f0 ? 0.5 + 0.5 * Math.cos(Math.PI * (i - f0) / (nI - f0)) : 1);
            e1 *= k1; e2 *= k2;
          }
          if (i >= nI) { st++; i = 0; lp = 0; e1 = 1; e2 = 1; }
        }
        if (performance.now() - t0 >= budget) break;
      }
      job.ms += performance.now() - t0;
      job.done = st >= 4;
      return job.done;
    }
    return job;
  }

  /** ctx: any BaseAudioContext. pre: a tableJob (optional). opt.lazyVerb: the reverb's response is set by verb(), later */
  function createEngine(ctx, pre, opt) {
    const sr = ctx.sampleRate;
    const tBuild = performance.now();
    let live = 0, made = 0;          // voices alive now, voices made since the start
    let pageKey = "home", P = PAGES.home;

    /* ---- buffers: the tables, computed before (a page) or now (the offline renderer, a gesture that came early) */
    const tb = pre && pre.sr === sr ? pre : tableJob(sr, pre && pre.done ? pre : null);
    if (!tb.done) tb.run(Infinity);
    const tabMs = performance.now() - tBuild;
    const noise = ctx.createBuffer(2, tb.noise[0].length, tb.nsr), ir = ctx.createBuffer(2, tb.ir[0].length, sr);
    for (let c = 0; c < 2; c++) { noise.copyToChannel(tb.noise[c], c); ir.copyToChannel(tb.ir[c], c); }

    /* ---- the chain: buses -> out (on/off, hidden) -> limiter -> ceiling -> destination. The limiter is a compressor
       (Chrome adds its make-up gain: the levels below are tuned after it); the ceiling is a shaper that is a straight
       line up to 0.3 and bends to 0.49 at most, so no sample ever leaves above -6.2 dBFS, whatever is summed. */
    const out = ctx.createGain(); out.gain.value = 0;
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -12; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.2;
    const ceil = ctx.createWaveShaper(), cv = new Float32Array(2049);
    for (let i = 0; i < cv.length; i++) { const x = (i - 1024) / 1024, ax = Math.abs(x); cv[i] = ax <= 0.3 ? x : Math.sign(x) * (0.3 + 0.19 * Math.tanh((ax - 0.3) / 0.19)); }
    ceil.curve = cv;
    out.connect(lim); lim.connect(ceil); ceil.connect(ctx.destination);
    /* the reverb: setting a convolver's response is the one heavy step of the build (the browser transforms it on the
       calling thread), so a page sets it in the first idle moment after the gesture, before any touch needs it */
    const verb = ctx.createConvolver(); verb.normalize = true;
    const setVerb = () => { if (!verb.buffer) verb.buffer = ir; };
    if (!(opt && opt.lazyVerb)) setVerb();
    const verbIn = ctx.createGain(), verbOut = ctx.createGain(); verbOut.gain.value = L.verb;
    verbIn.connect(verb); verb.connect(verbOut); verbOut.connect(out);
    const roomBus = ctx.createGain(); roomBus.gain.value = 1; roomBus.connect(out);
    const fxBus = ctx.createGain(); fxBus.connect(out);

    /** a param glides to v from t (time constant tc), from wherever it is at t */
    const glide = (p, v, t, tc) => {
      if (typeof p.cancelAndHoldAtTime === "function") p.cancelAndHoldAtTime(t);
      else { p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); }
      p.setTargetAtTime(v, t, tc);
    };
    const T = (t) => (typeof t === "number" ? Math.max(t, ctx.currentTime) : ctx.currentTime);
    const loop = (off, at = 0) => { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; s.start(at, off % NLEN); return s; };
    /** a one-shot voice: its nodes are released when its last source ends */
    function voice(nodes, srcs, end) {
      live++; made++;
      let left = srcs.length;
      srcs.forEach((s) => {
        s.onended = () => { if (--left) return; live--; nodes.concat(srcs).forEach((n) => { try { n.disconnect(); } catch (e) { /* gone */ } }); };
        s.stop(end);
      });
    }

    /* ---- THE ROOM, persistent: its air, its chord, and what is under the chord. The air is two readings of the noise
       loop at two speeds, so the loop never comes back as a pattern one could hear return (nothing comes and goes).
       (lane n-fix-sound) The chord is up to four pure tones where small speakers play (PAGES.tones), each drifting a
       tenth of its own level on its own slow period; under them the root and one more low tone (PAGES.low) for
       speakers that reach them. The mix moves, the level stays: no swell. */
    const airAmp = (p) => L.air * Math.pow(1700 / p.air, 0.45);
    const air = loop(0.37), air2 = loop(3.1), airMix = ctx.createGain(), airHP = ctx.createBiquadFilter(), airLP = ctx.createBiquadFilter(), airG = ctx.createGain();
    air2.playbackRate.value = 0.871; airMix.gain.value = 0.7071;
    airHP.type = "highpass"; airHP.frequency.value = 110; airLP.type = "lowpass"; airLP.Q.value = 0.4; airLP.frequency.value = P.air;
    airG.gain.value = airAmp(P);
    air.connect(airMix); air2.connect(airMix); airMix.connect(airHP); airHP.connect(airLP); airLP.connect(airG); airG.connect(roomBus);
    const lfo = (hz, depth, param) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = hz; g.gain.value = depth; o.connect(g); g.connect(param); o.start(); return g; };
    const airD1 = lfo(0.0213, 0.06 * P.air, airLP.frequency), airD2 = lfo(0.0137, 0.04 * P.air, airLP.frequency);
    const toneLP = ctx.createBiquadFilter(); toneLP.type = "lowpass"; toneLP.Q.value = 0.5; toneLP.frequency.value = P.color;
    const toneG = ctx.createGain(); toneG.gain.value = 1; toneLP.connect(toneG); toneG.connect(roomBus);   // toneG: the step back at a change of page
    const colD = lfo(0.0171, 0.08 * P.color, toneLP.frequency);
    const lowOf = (p) => p.low || [1, 1.5];
    const toneHz = (p, i) => p.root * (p.tones[i] || p.tones[p.tones.length - 1] * 1.5), toneAmp = (p, i) => L.tone * (p.mix[i] || 0) * (p.norm || 1);
    const DRIFT = [0.0113, 0.0167, 0.0229, 0.0191];
    const tones = [0, 1, 2, 3].map((i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = toneHz(P, i); o.detune.value = [0, 3, -4, 5][i]; g.gain.value = toneAmp(P, i);
      const dr = lfo(DRIFT[i], 0.1 * toneAmp(P, i), g.gain);   // a tenth of the tone: the mix moves, the level stays
      o.connect(g); g.connect(toneLP); o.start();
      return { o, g, dr };
    });
    const lows = [0, 1].map((i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = i ? "triangle" : "sine"; o.frequency.value = P.root * lowOf(P)[i]; g.gain.value = L.low * (i ? 0.5 : 1);
      o.connect(g); g.connect(toneG); o.start();
      return o;
    });
    /* ---- THE EYE: the scroll lights two of the room's own overtones (the octave of its first two tones) and a faint
       weight under them, as loud as the scroll is fast. (lane n-fix-sound) No noise and no sweep: a small tonal
       movement under the room, never a wash. */
    const eyeG = ctx.createGain(), eyeBodyG = ctx.createGain(); eyeG.gain.value = 0; eyeBodyG.gain.value = 0; eyeG.connect(out); eyeBodyG.connect(out);
    const eyeHz = (p, i) => (i < 2 ? toneHz(p, i) * 2 : p.root * 2);
    const eyes = [0, 1, 2].map((i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = eyeHz(P, i); o.detune.value = [2, -3, 0][i]; g.gain.value = [1, 0.55, 1][i];
      o.connect(g); g.connect(i < 2 ? eyeG : eyeBodyG); o.start();
      return o;
    });
    /** v: px/s; each call schedules its own fall to silence 180 ms later (a later call takes it over) */
    function scroll(v, t) {
      t = T(t);
      const s = clamp(Math.abs(v) / 2000, 0, 1), e = Math.pow(s, 1.1);
      glide(eyeG.gain, e * L.eye, t, 0.12); eyeG.gain.setTargetAtTime(0, t + 0.18, 0.3);
      glide(eyeBodyG.gain, e * L.body, t, 0.12); eyeBodyG.gain.setTargetAtTime(0, t + 0.18, 0.35);
    }

    /** the room becomes page `key`'s. Its chord does not slide to the next one (a chord sliding where the ear is
     *  keen is a siren): it steps back, the tones are set while they are silent, and the new chord opens; the air's
     *  colour glides. openAt (a cut): the chord steps back from t and the new one opens at openAt, with the door;
     *  without it, back in 0.3 s and open over glideS. glideS under 0.1: at once (the first page). */
    function setPage(key, t, glideS = 1.2, openAt) {
      const k = PAGES[key] ? key : "home";
      if (k === pageKey) return;           // the room already stands there (a soft navigation asks again)
      t = T(t); pageKey = k; P = PAGES[k];
      const quick = glideS < 0.1, at = quick ? t : openAt > t ? openAt : t + 0.3, tc = Math.max(0.01, glideS / 3);
      const put = (p, v) => { p.cancelScheduledValues(at); p.setValueAtTime(v, at); };
      if (!quick) { glide(toneG.gain, 0, t, openAt > t ? Math.max(0.03, (at - t) / 2.4) : 0.07); toneG.gain.setTargetAtTime(1, at + 0.01, openAt > t ? 0.09 : Math.max(0.05, (glideS - 0.3) / 3)); }
      tones.forEach((p, i) => { put(p.o.frequency, toneHz(P, i)); put(p.g.gain, toneAmp(P, i)); put(p.dr.gain, 0.1 * toneAmp(P, i)); });
      lows.forEach((o, i) => put(o.frequency, P.root * lowOf(P)[i]));
      eyes.forEach((o, i) => put(o.frequency, eyeHz(P, i)));
      glide(toneLP.frequency, P.color, t, tc); glide(airLP.frequency, P.air, t, tc); glide(airG.gain, airAmp(P), t, tc);
      glide(airD1.gain, 0.06 * P.air, t, tc); glide(airD2.gain, 0.04 * P.air, t, tc); glide(colD.gain, 0.08 * P.color, t, tc);
    }

    /* ---- GLASS: a touch of a few inharmonic partials */
    function glass(f, t, o = {}) {
      t = T(t);
      const dur = o.dur || 0.9, amp = o.amp == null ? L.glass : o.amp;
      const pan = ctx.createStereoPanner(); pan.pan.value = clamp(o.pan || 0, -1, 1);
      const send = ctx.createGain(); send.gain.value = o.send == null ? 0.55 : o.send;
      pan.connect(fxBus); pan.connect(send); send.connect(verbIn);
      const nodes = [pan, send], srcs = [];
      const n = o.partials || GLASS.length;
      for (let i = 0; i < n; i++) {
        const fr = f * GLASS[i];
        if (fr > sr * 0.45) break;
        const os = ctx.createOscillator(), g = ctx.createGain(), d = dur * GDEC[i];
        os.frequency.value = fr; os.detune.value = (i % 2 ? 4 : -3);
        const a = t + 0.004 + i * 0.001;   // the attack ends here, and the decay starts no earlier (or the attack's ramp would outlast it)
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp * GAMP[i] * (o.bright && i ? 1.6 : 1), a);
        g.gain.setTargetAtTime(0, a, d / 4.6);
        os.connect(g); g.connect(pan); os.start(t);
        nodes.push(g); srcs.push(os);
      }
      voice(nodes, srcs, t + dur * 1.6 + 0.1);   // the decay has gone under -95 dBFS by then: no step at the end
      return pan;
    }
    const degree = (k, oct = 3) => { const m = P.mode, n = m.length, d = ((k % n) + n) % n; return semis(P.root * Math.pow(2, oct), m[d] + 12 * Math.floor(k / n)); };

    function step(d, t) {
      t = T(t);
      const k = (d && +d.step) || 0;
      const pan = d && typeof d.pan === "number" ? d.pan : 0;
      glass(degree(PHRASE[k % PHRASE.length]), t, { pan: pan * 0.35, dur: 0.8 + 0.3 * ((k * 7) % 3) / 2 });
    }

    /* ---- THE INDEX: four rows, four notes of one chord, held while the row is held */
    const rows = new Map();
    function row(i, on, t) {
      t = T(t);
      const cur = rows.get(i);
      if (on) {
        if (cur) return;
        const ch = (PAGES.home.chord), f = semis(PAGES.home.root * 4, ch[i % ch.length]);
        const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), pan = ctx.createStereoPanner(), send = ctx.createGain();
        o1.type = "triangle"; o1.frequency.value = f; o2.frequency.value = f * 2; o2.detune.value = 3;
        const g2 = ctx.createGain(); g2.gain.value = 0.25;
        lp.type = "lowpass"; lp.frequency.value = 1400; g.gain.value = 0; pan.pan.value = -0.3 + 0.2 * i; send.gain.value = 0.5;
        o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(pan); pan.connect(fxBus); pan.connect(send); send.connect(verbIn);
        o1.start(t); o2.start(t);
        g.gain.setValueAtTime(0, t); g.gain.setTargetAtTime(L.row, t, 0.12);
        live++; made++;
        rows.set(i, { o1, o2, g, nodes: [lp, g, g2, pan, send] });
      } else if (cur) {
        rows.delete(i);
        glide(cur.g.gain, 0, t, 0.22);
        live--; voice(cur.nodes, [cur.o1, cur.o2], t + 1.6);
      }
    }
    function rowsOff(t) { [...rows.keys()].forEach((i) => row(i, false, t)); }

    /* ---- THE CUT */
    let rush = null, doorAt = -9;
    /** the door (lane n-fix-flight: a deep block of cut glass the eye goes through): a lower touch in the middle, the
     *  block's body, and two bright ones that leave the centre for both ears as its walls pass; on the way back they
     *  come in from the ears. Toward the morning it is higher and a fifth opens over it. */
    function door(t, dawn, back) {
      const f = dawn ? 1318.5 : 1046.5;
      glass(f / 2, t, { amp: L.door * 0.8, dur: dawn ? 0.8 : 0.62, send: 0.6, partials: 3 });
      [-1, 1].forEach((side, i) => {
        const p = glass(f * (i ? 1.0019 : 1), t, { amp: L.door, dur: dawn ? 0.55 : 0.4, bright: true, send: 0.7, partials: 4 });
        p.pan.setValueAtTime(back ? side * 0.8 : 0, t); p.pan.linearRampToValueAtTime(back ? 0 : side * 0.8, t + 0.3);
      });
      if (dawn) glass(f * 1.5, t + 0.05, { amp: L.door * 0.5, dur: 0.7, send: 0.8 });
      doorAt = t;
    }
    /** d: { ms, door, glass, dawn, back, hard, page }, fx:nav:start's detail and the next page's key (ms from the click: `glass` until the eye is in
     *  the door's glass, `door` until the page changes, `ms` until the new room stands). The rush rises to the glass
     *  and the door sounds there, both scheduled now, on the audio clock: nothing waits for an event that may come
     *  from a page already gone. hard: the document ends at the door (the assembled pages): the rush holds until
     *  nav:covered closes it and the page that arrives plays the door. */
    function navStart(d, t) {
      t = T(t); d = d || {};
      const ms = +d.ms > 0 ? +d.ms : 900, dawn = !!d.dawn, hard = !!d.hard;
      const r2 = clamp((+d.glass > 0 ? +d.glass : +d.door > 0 ? +d.door : ms * 0.45) / 1000, 0.2, 2), r1 = r2 * 0.6, top = L.rush * (dawn ? 0.75 : 1);
      const off = hard ? t + r2 + 0.3 : t + r2;   // the air closes as the eye enters the glass
      const src = loop(Math.random() * NLEN, t), bp = ctx.createBiquadFilter(), hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), gl = ctx.createGain(), send = ctx.createGain();
      hp.type = "highpass"; hp.frequency.value = 45;   // the low body carries nothing under the ear
      bp.type = "bandpass"; bp.Q.value = 0.9; bp.frequency.setValueAtTime(260, t);
      bp.frequency.exponentialRampToValueAtTime(dawn ? 2600 : 1700, t + r1); bp.frequency.exponentialRampToValueAtTime(dawn ? 4200 : 2800, t + r2);
      lp.type = "lowpass"; lp.frequency.setValueAtTime(140, t); lp.frequency.exponentialRampToValueAtTime(520, t + r2);
      g.gain.value = 0; gl.gain.value = 0;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(top * 0.1, t + 0.05); g.gain.exponentialRampToValueAtTime(top * 0.5, t + r1); g.gain.linearRampToValueAtTime(top, t + r2);
      g.gain.setTargetAtTime(0, off, hard ? 0.16 : 0.07);
      gl.gain.setValueAtTime(0, t); gl.gain.linearRampToValueAtTime(L.rushLow * 0.07, t + 0.05); gl.gain.exponentialRampToValueAtTime(L.rushLow * 0.65, t + r1); gl.gain.linearRampToValueAtTime(L.rushLow, t + r2);
      gl.gain.setTargetAtTime(0, off, hard ? 0.2 : 0.1);
      send.gain.value = 0.35;
      src.connect(bp); bp.connect(g); src.connect(hp); hp.connect(lp); lp.connect(gl); g.connect(out); gl.connect(out); g.connect(send); send.connect(verbIn);
      voice([bp, hp, lp, g, gl, send], [src], off + 1.4);
      rush = { g, gl };
      rowsOff(t);
      /* the room steps back a little while the eye flies and is whole again from the door on */
      glide(roomBus.gain, 0.88, t, r1 / 2);
      if (!hard) {
        door(t + r2, dawn, !!d.back); roomBus.gain.setTargetAtTime(1, t + r2, 0.2);
        if (d.page) setPage(d.page, t, 1.2, t + r2);   // the next room's chord opens with the door
      }
    }
    /** the page changes. Under the router the door was scheduled by nav:start and nothing is left to do; a hard cut
     *  closes its rush here; a page that arrives from one plays the door it could not (no nav:start came before). */
    function navCovered(d, t) {
      t = T(t); d = d || {};
      if (rush && (d.hard || doorAt < t - 1.5)) { glide(rush.g.gain, 0, t + 0.02, 0.07); glide(rush.gl.gain, 0, t + 0.02, 0.09); }
      rush = null;
      if (!d.hard && Math.abs(t - doorAt) > 1.5) door(t, !!d.dawn, !!d.back);
    }
    function navArrived(d, t) { t = T(t); glide(roomBus.gain, 1, t, 0.3); }
    /** a cut that was called off (fx:nav:reset, a page back from the browser's cache): the rush stops, the room returns */
    function navReset(d, t) {
      t = T(t);
      if (rush) { glide(rush.g.gain, 0, t, 0.05); glide(rush.gl.gain, 0, t, 0.05); rush = null; }
      glide(roomBus.gain, 1, t, 0.2);
    }

    /* ---- THE HAND */
    function tick(t) {
      t = T(t);
      const src = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = noise; hp.type = "bandpass"; hp.frequency.value = 3800; hp.Q.value = 1.4;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(L.tick, t + 0.002); g.gain.setTargetAtTime(0, t + 0.003, 0.006);
      src.connect(hp); hp.connect(g); g.connect(fxBus); src.start(t, Math.random() * (NLEN - 1));
      voice([hp, g], [src], t + 0.06);
    }
    function copy(t) {
      t = T(t);
      glass(degree(0, 3), t, { amp: L.copy, dur: 0.5 });
      glass(degree(4, 3), t + 0.12, { amp: L.copy, dur: 0.7 });
    }
    function breath(open, t) {
      t = T(t);
      const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = noise; bp.type = "bandpass"; bp.Q.value = 1.1;
      bp.frequency.setValueAtTime(open ? 420 : 1500, t); bp.frequency.exponentialRampToValueAtTime(open ? 1500 : 420, t + 0.3);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(L.breath, t + 0.09); g.gain.setTargetAtTime(0, t + 0.12, 0.07);
      src.connect(bp); bp.connect(g); g.connect(fxBus); src.start(t, Math.random() * (NLEN - 1));
      voice([bp, g], [src], t + 0.55);
    }

    /* ---- OBLA: a two-note motif in the character's voice */
    const MOTIF = { 1: [0, 5], 2: [4, 2], 3: [7, 7], 4: [2, 9], 5: [7, 0] };
    function obla(k, t) {
      t = T(t);
      const m = MOTIF[k]; if (!m) return false;
      const base = 523.25;   // C5: Obla's room is C
      m.forEach((sm, i) => {
        const at = t + i * 0.24, f = semis(base, sm);
        const o = ctx.createOscillator(), vib = ctx.createOscillator(), vg = ctx.createGain(), bp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), send = ctx.createGain();
        o.type = "triangle"; o.frequency.value = f;
        vib.frequency.value = 5.2; vg.gain.setValueAtTime(0, at); vg.gain.linearRampToValueAtTime(f * 0.004, at + 0.12);
        vib.connect(vg); vg.connect(o.frequency);
        bp.type = "peaking"; bp.frequency.value = 1100; bp.Q.value = 1.6; bp.gain.value = 6;
        lp.type = "lowpass"; lp.frequency.value = 2400;
        const a = L.voice * (i ? 0.85 : 1);
        g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(a, at + 0.03); g.gain.setValueAtTime(a, at + 0.14); g.gain.setTargetAtTime(0, at + 0.15, 0.05);
        send.gain.value = 0.45;
        o.connect(bp); bp.connect(lp); lp.connect(g); g.connect(fxBus); g.connect(send); send.connect(verbIn);
        o.start(at); vib.start(at);
        voice([vg, bp, lp, g, send], [o, vib], at + 0.5);
      });
      return true;
    }

    /* ---- on / off */
    let on = false;
    function start(t, fade = 1.5) { t = T(t); on = true; glide(out.gain, 1, t, Math.max(0.01, fade / 4)); }
    /** silence: a linear ramp to 0 over ms; then() runs when it is over (an audio-clock callback, no timer) */
    function silence(ms, t, then) {
      t = T(t); on = false;
      if (typeof out.gain.cancelAndHoldAtTime === "function") out.gain.cancelAndHoldAtTime(t); else { out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); }
      out.gain.linearRampToValueAtTime(0, t + ms / 1000);
      if (then) { const c = ctx.createConstantSource(); c.offset.value = 0; c.connect(out); c.onended = () => { try { c.disconnect(); } catch (e) { /* gone */ } then(); }; c.start(t); c.stop(t + ms / 1000 + 0.01); }
    }

    /** one entry for every cue (the live page and the offline renderer share it) */
    function cue(event, d, t) {
      d = d || {};
      switch (event) {
        case "start": return start(t, d.fade);
        case "stop": return silence(d.ms || 60, t);
        case "page": return setPage(d.key, t, d.glide);
        case "scroll": return scroll(d.v || 0, t);
        case "step": return step(d, t);
        case "obla": return obla(d.k, t);
        case "row": return row(d.i, !!d.on, t);
        case "nav:start": return navStart(d, t);
        case "nav:covered": return navCovered(d, t);
        case "nav:arrived": return navArrived(d, t);
        case "nav:reset": return navReset(d, t);
        case "tick": return tick(t);
        case "copy": return copy(t);
        case "menu": return breath(!!d.open, t);
        default: return undefined;
      }
    }
    let tap = null;
    /* what the build cost on the main thread: the tables (0 when they came ready) and the graph */
    const cost = { tables: +tabMs.toFixed(1), graph: +(performance.now() - tBuild - tabMs).toFixed(1) };
    return {
      ctx, cue, setPage, start, silence, rowsOff, PAGES, cost, verb: setVerb,
      get page() { return pageKey; }, get on() { return on; },
      /** a probe's ear: an AnalyserNode after the ceiling, the last node before the speakers (made once, on demand) */
      analyser() { if (!tap) { tap = ctx.createAnalyser(); tap.fftSize = 2048; ceil.connect(tap); } return tap; },
      info() { return { state: ctx.state, live, made, rows: rows.size, page: pageKey, on, out: out.gain.value }; },
    };
  }
  window.RVSound = { createEngine, tableJob, PAGES, version: 1 };
  if (window.__rvSoundEngineOnly) return;   // the offline renderer: the engine alone

  /* ================================================================ the page */
  const d = document.documentElement;
  const AC = window.AudioContext || window.webkitAudioContext;
  const KEY = "rv-sound", VISIT = "rv-sound-visit", LIVE = "rv-snd-live", FIRST = "rv-snd-first", HARD = "rv-snd-hard";
  /* a silent first flight: the room is made LATE_MS after the new one stands, or LATE_STEP after its opening has played
     (asked at most LATE_TRIES times), and fades in over LATE_FADE seconds */
  const LATE_MS = 450, LATE_STEP = 200, LATE_TRIES = 12, LATE_FADE = 2.4;
  let q = null; try { q = new URLSearchParams(location.search); } catch (e) { /* none */ }
  const DEBUG = !!(q && q.get("debug") === "1");
  const ss = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* none */ } },
    del(k) { try { sessionStorage.removeItem(k); } catch (e) { /* none */ } },
  };
  /* ?sound=0: off for this visit (this tab) on every page it goes to, until the toggle is pressed */
  if (q && q.get("sound") === "0") ss.set(VISIT, "0");
  const pref = () => { try { return localStorage.getItem(KEY) !== "0"; } catch (e) { return true; } };
  const save = (v) => { try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (e) { /* private window */ } };
  const reduce = (() => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } })();
  const rIC = typeof window.requestIdleCallback === "function" ? window.requestIdleCallback.bind(window) : null;

  let btn = null, bars = null;
  let early = null;                 // an arriving page's context, made at once under the cut's cover (init)
  let want = false;                 // the visitor's choice, as it stands on this page
  let cutUntil = 0;                 // a cut is in flight until then (performance.now): the eye and the steps keep quiet
  let quietUntil = 0;               // the page has just come up: its first steps are not the reader's
  let lastScroll = 0;               // the reader's last scroll
  let flight = null;                // the cut in flight: { d: its detail, t0 } (fx:nav:start to fx:nav:arrived)
  let first = ss.get(FIRST) !== "1";   // the visit's first press is still to come (without the router it may leave silent, once)
  let gone = false, lateT = 0, lateN = 0;   // this page has left (the router); the room owed after a silent flight: its timer, its tries
  /* the router keeps the document, so a press that leaves can wait for the arrival. If a document ever ended with its
     room still owed (the router gave the page to the browser: a slow network, a failed swap), the rest of this visit
     counts on it no more: a first press on a link starts the room in the press, once, as on the assembled pages */
  const kept = ss.get(HARD) !== "1";

  const keyOf = (path) => {
    const f = String(path || "").split("/").pop().replace(/[?#].*$/, "");
    if (!f || f === "index.html") return "home";
    if (/^case-/.test(f)) return "case";
    const k = f.replace(/\.html$/, "");
    return k === "consulting" ? "consult" : (PAGES[k] ? k : "home");
  };
  /* this page's room: what the page says it is (<html data-page>, which follows a soft navigation: the 404 page is
     served at any address), else its address */
  const pageKey = () => { const k = d.getAttribute("data-page"); return k && PAGES[k] ? k : keyOf(location.pathname); };
  const eng = () => (window.__rvSound && window.__rvSound.eng) || null;
  const running = () => { const e = eng(); return !!(e && e.ctx.state === "running" && e.on); };
  const now = () => (running() ? eng() : null);
  const isAstro = () => !!window.__rvRouter;
  const cutting = () => performance.now() < cutUntil;
  const mark = () => ss.set(LIVE, String(Date.now()));

  /* ---------------------------------------------------------------- the toggle's sign */
  function paint() {
    if (!btn) return;
    btn.setAttribute("aria-pressed", want ? "true" : "false");
    const run = want && running() && !document.hidden;
    btn.setAttribute("data-snd-state", !want ? "off" : run ? "run" : "armed");
    if (reduce || typeof btn.animate !== "function") return;
    if (run && !bars) {
      /* four straight bars, each its own period, on the compositor (transform only); WAAPI, as the 2D layer does */
      const H = [[0.45, 1, 0.6, 0.85], [0.8, 0.4, 1, 0.55], [0.55, 0.95, 0.35, 0.75], [0.9, 0.5, 0.7, 0.4]];
      bars = [...btn.querySelectorAll(".snd-b")].map((b, i) => b.animate(H[i].map((s) => ({ transform: `scaleY(${s})` })), { duration: 1100 + i * 230, iterations: Infinity, direction: "alternate", easing: "ease-in-out" }));
    } else if (!run && bars) { bars.forEach((a) => a.cancel()); bars = null; }
  }

  /* ---------------------------------------------------------------- the tables, before the gesture */
  /* the noise and the room's response are computed in idle slices once the page is up (plain arrays: no AudioContext
     yet), so the first gesture only wires the graph. 48 kHz is assumed; a context at another rate computes its response
     alone, at the gesture. then() runs in the idle moment after they are ready (an arrival by a cut starts there). */
  function warm(then) {
    if (eng() || !rIC) return;                          // no idle callback: the gesture computes them
    const fresh = !window.__rvSoundJob, job = window.__rvSoundJob || (window.__rvSoundJob = tableJob(48000));
    if (!fresh && !then) return;
    const slice = (dl) => {
      if (window.__rvSoundJob !== job) return;
      if (job.done) { if (then) then(); return; }
      job.run(Math.max(1, Math.min(6, dl.timeRemaining() - 1)));
      if (!job.done || then) rIC(slice, { timeout: 3000 });
    };
    rIC(slice, { timeout: 3000 });
  }

  /* ---------------------------------------------------------------- start, stop */
  function make() {
    if (eng()) return eng();
    let ctx = early; early = null;
    /* the one cost that stays on the gesture: a document's first AudioContext is the browser's own work (15 to 100 ms
       measured here, more when its audio service has to start or the machine is busy). A context born on the silent
       sink and switched to the speakers afterwards was tried and costs the same: plain is what is made. (A first
       press that leaves for another page pays it after the arrival instead: later(), late().) */
    if (!ctx) { try { ctx = new AC({ latencyHint: "interactive" }); } catch (e) { return null; } }
    window.__rvSoundLate = null;
    if (first) { first = false; ss.set(FIRST, "1"); }   // the visit's first press is spent, whatever it was
    const job = window.__rvSoundJob || null; window.__rvSoundJob = null;
    const e = createEngine(ctx, job, { lazyVerb: !!rIC });
    if (rIC) rIC(() => e.verb(), { timeout: 1200 });
    e.setPage(pageKey(), 0, 0.01);
    window.__rvSound = { eng: e, want, version: 1 };
    ctx.onstatechange = paint;   // a property, not a listener: it outlives a soft navigation's purge (adopted below)
    if (DEBUG) console.log("[sound] context " + ctx.state + ", built in " + (e.cost.tables + e.cost.graph).toFixed(1) + " ms");
    return e;
  }
  function begin(fade, then) {
    if (!want || document.hidden) return;
    const e = make(); if (!e) return;
    const go = () => {
      if (!want || document.hidden || eng() !== e || e.on) return;
      e.start(undefined, fade); mark(); paint(); window.__rvSound.heard = true;
      /* a cut that began while the context was still coming up (a browser that starts it a moment after the press):
         its rush and its door are played from where the flight is now, if the door is still ahead */
      const c = flight, dt = c ? performance.now() - c.t0 : 0;
      if (c && c.d.glass - dt > 120) e.cue("nav:start", { ...c.d, ms: c.d.ms - dt, door: Math.max(1, c.d.door - dt), glass: c.d.glass - dt });
      if (then) then(e);
    };
    if (e.ctx.state === "running") go(); else e.ctx.resume().then(go, () => {});
  }
  /** the engine made and left silent: its context is suspended again until a press or a key that acts (begin) */
  function ready() {
    if (eng() || !want || document.hidden) return;
    const e = make(); if (!e || e.on || e.ctx.state !== "running") return;
    /* if the room was started while the context was going to sleep, it is woken again */
    const woke = () => { if (e.on && want && !document.hidden && e.ctx.state !== "running") e.ctx.resume().then(paint, paint); paint(); };
    e.ctx.suspend().then(woke, woke);
  }
  function stop(ms = 60) {
    const e = eng(); if (!e) return;
    e.silence(ms, undefined, () => { if (!e.on && e.ctx.state === "running") e.ctx.suspend().then(paint, paint); paint(); });
    e.rowsOff();
  }
  function setWant(v, store) {
    want = v; if (window.__rvSound) window.__rvSound.want = v;
    if (store) { save(v); ss.del(VISIT); }
    if (!v) window.__rvSoundLate = null;
    if (!v && early && !eng()) { try { early.close(); } catch (e) { /* gone */ } early = null; }
    if (v) begin(0.6); else stop(60);
    paint();
  }

  /* the first gesture: a press, a touch or a key (never a scroll, never the pointer passing over). The context is made
     at the earliest event at which the browser says the page is activated (navigator.userActivation.isActive: the
     press of a mouse, before its click; the lift of a finger; a key going down; without that API, a real click), so
     it can never warn and it is never made in the handler of the click that starts a flight.
     (lane n-fix-sound) A key that only moves the focus or modifies (Tab, Shift, …) makes the engine and leaves it
     silent: the browser's price for a context is paid where nothing flies, and the room waits for a press or a key
     that acts, so a visitor on the keyboard reaches the toggle before any sound. */
  const QUIET_KEY = /^(Tab|Shift|Control|Alt|AltGraph|Meta|CapsLock|NumLock|ScrollLock|ContextMenu|F\d+)$/;
  /* (lane m-sound) THE FIRST PRESS THAT LEAVES. leaves(ev): the event is a plain press, tap, Enter or click on a link
     to another page of the site: the ones fx-nav.js cuts to ([data-pt-label]) and the router swaps (an address ending
     in .html or /), read by their own tests (the primary button, no modifier key, this tab, no download). */
  const leaves = (ev) => {
    if (ev.type === "keydown" ? ev.key !== "Enter" : ev.button > 0) return false;
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return false;
    const a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return false;
    let u; try { u = new URL(a.href, location.href); } catch (e) { return false; }
    return u.origin === location.origin && (u.pathname !== location.pathname || u.search !== location.search)
      && (a.hasAttribute("data-pt-label") || /(\.html|\/)$/.test(u.pathname));
  };
  /** the visit's first click leaves for another page and nothing was made in it. Under the router the document stays:
   *  the room is owed (window.__rvSoundLate, read by the next page's run of this script) and late() makes it once that
   *  page stands. Without the router the click ends this document: the next page starts at its first gesture. */
  function later() {
    first = false; ss.set(FIRST, "1");
    if (!isAstro()) return;
    window.__rvSoundLate = window.__rvSoundLate || { t: Date.now() };
    lateSoon();   // and if no page follows the click after all, here
  }
  /** the arriving page still opens: the stage has not lit its subject (the cover's name), or a finite animation on the
   *  document's clock is running (the title sequence; a scroll-driven one rests with the scroll, a loop never ends).
   *  The browser's task for the context would hold their frames: it waits for them. */
  const opening = () => {
    try {
      if (d.classList.contains("stage-on") && !d.classList.contains("stage-lit")) return true;
      return document.getAnimations().some((a) => a.playState === "running" && a.effect && (!a.timeline || a.timeline === document.timeline) && isFinite(a.effect.getComputedTiming().endTime));
    } catch (e) { return false; }
  };
  /** the owed room, a moment from now, in an idle one */
  function lateSoon(ms) {
    if (gone || !window.__rvSoundLate) return;
    clearTimeout(lateT);
    lateT = setTimeout(() => { if (rIC) rIC(late, { timeout: 1000 }); else late(); }, ms || LATE_MS);
  }
  function late() {
    if (gone || !window.__rvSoundLate) return;
    const ua = navigator.userActivation;
    if (eng() || !want || (ua && !ua.hasBeenActive)) { window.__rvSoundLate = null; return; }
    if (document.hidden) return;              // the tab's return asks again (onVisible)
    if (cutting()) { lateSoon(); return; }    // a cut is in flight: after it
    if (lateN < LATE_TRIES && opening()) { lateN++; lateSoon(LATE_STEP); return; }
    begin(LATE_FADE);                         // make() takes the mark away; a context the browser will not run waits for a gesture
  }
  const onGesture = (ev) => {
    if (!want || document.hidden || running()) return;
    if (ev.target && ev.target.closest && ev.target.closest("[data-snd]")) return;   // the toggle decides for itself
    const ua = navigator.userActivation;
    if (ua ? !ua.isActive : !(ev.type === "click" && ev.isTrusted)) return;
    const quiet = ev.type === "keydown" && QUIET_KEY.test(ev.key || "");
    if (!eng()) {
      /* the room is owed after a silent first flight and comes by itself (late): nothing is made while the eye flies,
         and after it only a click may bring it sooner. The press that left still counts as active for some seconds:
         the finger that then starts a scroll, or a key, must not pay the browser's task */
      const owed = !!window.__rvSoundLate;
      if (owed && (ev.type !== "click" || cutting())) return;
      /* a first press on a link to another page (under the router whenever no engine exists yet; without it once a
         visit): its click decides (a press that ends elsewhere starts the room as any other); the click itself makes
         nothing and the flight starts at once */
      if ((owed || first || (kept && isAstro())) && leaves(ev)) { if (ev.type === "click") later(); return; }
      /* a cut is already in flight and there is no engine (a second press while the page leaves, a double click; Back
         or Forward before any gesture): nothing is made in it either. Under the router a click owes the room, which
         comes when the page stands; without it this document is ending */
      if (isAstro() ? cutting() : !!flight) { if (ev.type === "click") later(); return; }
    }
    if (quiet) { ready(); return; }
    begin(window.__rvSound && window.__rvSound.heard ? 0.6 : 1.5);
  };
  /* hidden tab: silence within 150 ms (a 60 ms ramp, then the context suspended), back on return */
  const onVisible = () => {
    const e = eng();
    if (e) {
      if (document.hidden) { if (e.on) { e.silence(60, undefined, () => { if (document.hidden) e.ctx.suspend().then(paint, paint); }); e.rowsOff(); } }
      else if (want) e.ctx.resume().then(() => { if (want && !document.hidden) { e.start(undefined, 0.5); paint(); } }, () => {});
    } else if (!document.hidden) lateSoon();
    paint();
  };

  /* ---------------------------------------------------------------- what the page plays */
  function bind() {
    ["pointerdown", "pointerup", "keydown", "touchend", "click"].forEach((n) => window.addEventListener(n, onGesture, { capture: true, passive: true }));
    document.addEventListener("visibilitychange", onVisible);
    /* a page back from the browser's own cache: its cut never arrived, its room comes back */
    window.addEventListener("pageshow", (ev) => {
      if (!ev.persisted) return;
      cutUntil = 0; flight = null;
      const e = eng(), ua = navigator.userActivation; if (e) e.cue("nav:reset");
      /* a page that left on a silent first press has no engine yet: it is made here only if this document was ever
         pressed (a context made on a page nobody touched would not run, and the browser would say so) */
      if (want && (e || (ua && ua.hasBeenActive))) begin(0.6);
      paint();
    });

    /* the eye: the scroll's speed from window scroll events (Lenis moves the window too). Not during a cut, and not a
       jump of more than a screen in one event (the page put somewhere else is not the eye travelling). */
    let ly = window.scrollY, lt = performance.now();
    window.addEventListener("scroll", () => {
      const t = performance.now(), y = window.scrollY, dy = y - ly, dt = Math.max(8, t - lt);
      ly = y; lt = t;
      if (cutting() || Math.abs(dy) > window.innerHeight * 1.2) return;
      lastScroll = t;
      const e = now(); if (e) e.cue("scroll", { v: dy * 1000 / dt });
    }, { passive: true });

    /* the hand: a tick for a press on a link or a button (the toggle answers with the sound itself) */
    document.addEventListener("click", (ev) => {
      const e = now(); if (!e) return;
      const el = ev.target && ev.target.closest ? ev.target.closest("a[href], button") : null;
      if (!el || el.closest("[data-snd]")) return;
      e.cue("tick");
    }, true);

    /* the cut (fx-nav.js, the router): the rush at the click, the door when the eye is at it, the room when it stands */
    window.addEventListener("fx:nav:start", (ev) => {
      const dt = ev.detail || {}, e = now(), ms = +dt.ms > 0 ? +dt.ms : 900, hard = !isAstro();
      cutUntil = performance.now() + ms + 3000;
      /* the contract (n-fix-flight.md): door, ms from now to the change of page; glass, ms from now until the eye is in
         the door's glass, where the door sounds. Without them: the assembled pages' sheet covers at 0.58 of ms, a
         flight changes page at 0.36 and is in the glass at 0.45. Under the router this page's listeners are gone at
         the change of page, so the engine schedules the whole cut now; `hard`: this document ends at the door. */
      const door = +dt.door > 0 ? +dt.door : ms * (hard ? 0.58 : 0.36), glass = +dt.glass > 0 ? +dt.glass : hard ? door : ms * 0.45;
      const d2 = { ms, door, glass, dawn: !!dt.dawn, back: !!dt.back, hard, page: keyOf(dt.to) };
      flight = { d: d2, t0: performance.now() };
      if (e) { mark(); e.cue("nav:start", d2); }
    });
    window.addEventListener("fx:nav:covered", (ev) => {
      const e = now(); if (!e) return;
      if (isAstro()) e.setPage(keyOf((ev.detail || {}).to), undefined, 1.4);   // the next room's chord, if the cut did not bring it (it does)
      /* the assembled pages: this document ends here. The rush closes in 50 ms instead of being cut off, the room
         stays wanted, and the next page opens its own door (init, below) */
      else { mark(); e.silence(50); }
    });
    window.addEventListener("fx:nav:arrived", () => { cutUntil = 0; flight = null; quietUntil = performance.now() + 300; const e = now(); if (e) e.cue("nav:arrived"); lateSoon(); });
    window.addEventListener("fx:nav:reset", () => { cutUntil = 0; flight = null; const e = eng(); if (e) { e.cue("nav:reset"); e.setPage(pageKey(), undefined, 0.6); } lateSoon(); });
    /* (lane m-sound) the room owed after a silent first flight: the page stands (a plain swap has no fx:nav:arrived) */
    window.addEventListener("fx:ready", () => lateSoon());
    /* the page goes while its room sounds (a link, Back, Forward, a reload): the time is left for the page that comes
       next in this tab, which starts again by itself if the browser lets a context run (mayResume, below) */
    window.addEventListener("pagehide", () => { if (running()) mark(); if (window.__rvSoundLate) ss.set(HARD, "1"); });

    /* a step of a scene, when the reader's own scroll brought it: glass, or Obla's motif */
    window.addEventListener("fx:step", (ev) => {
      const e = now(); if (!e) return;
      const t = performance.now();
      if (cutting() || t < quietUntil || t - lastScroll > 700) return;
      const s = ev.detail || {};
      if (s.scene === "obla" && s.step >= 1 && s.step <= 5 && e.cue("obla", { k: s.step })) return;
      let pan = 0;
      const sc = document.querySelector(`.sc[data-stage="${s.scene}"]`);
      /* side by side from 1024 px: the text at one side (.sc-left / .sc-right), the figure at the other */
      if (sc && window.innerWidth >= 1024) pan = sc.classList.contains("sc-left") ? 1 : sc.classList.contains("sc-right") ? -1 : 0;
      e.cue("step", { ...s, pan });
    });

    /* the index: the row under the hand or with focus */
    document.querySelectorAll(".ix-a").forEach((a, i) => {
      const on = () => { const e = now(); if (e && !cutting()) e.cue("row", { i, on: true }); };
      const off = () => { const e = eng(); if (e && !a.matches(":hover") && document.activeElement !== a) e.cue("row", { i, on: false }); };
      a.addEventListener("pointerenter", on); a.addEventListener("pointerleave", off);
      a.addEventListener("focus", on); a.addEventListener("blur", off);
    });

    /* the menu's sheet (html.menu-open) and the copy control ([data-nv-copy][data-state="done"]), both fx-nav.js */
    try {
      let open = d.classList.contains("menu-open");
      const mo = new MutationObserver((list) => {
        for (const m of list) {
          if (m.target === d) {
            const o = d.classList.contains("menu-open");
            if (o !== open) { open = o; const e = now(); if (e) e.cue("menu", { open: o }); }
          } else if (m.attributeName === "data-state" && m.target.getAttribute("data-state") === "done") { const e = now(); if (e) e.cue("copy"); }
        }
      });
      mo.observe(d, { attributes: true, attributeFilter: ["class"] });
      document.querySelectorAll("[data-nv-copy]").forEach((b) => mo.observe(b, { attributes: true, attributeFilter: ["data-state"] }));
    } catch (e) { /* no observer: no breath */ }
  }

  /* ---------------------------------------------------------------- this page */
  function init() {
    btn = document.querySelector("[data-snd]");
    if (!AC) { if (btn) btn.hidden = true; return; }
    const K = window.__rvSound && window.__rvSound.eng ? window.__rvSound : null;   // kept by the Astro build's router
    /* the router swapped this page in: the document is the one that was there (this script has run in it before) */
    const soft = !!window.__rvSoundRan; window.__rvSoundRan = true;
    want = K ? K.want !== false : (ss.get(VISIT) !== "0" && pref());
    quietUntil = performance.now() + 900;
    if (window.__rvArrive) cutUntil = performance.now() + 2500;   // arriving by a cut: fx:nav:arrived ends it
    bind();
    if (btn) {
      btn.addEventListener("click", () => setWant(!want, true));
      btn.addEventListener("pointerenter", () => warm()); btn.addEventListener("focus", () => warm());
    }
    if (K) {
      /* adopted after a soft navigation, never made twice: the room glides to this page (the cut already began it) */
      K.eng.ctx.onstatechange = paint;
      K.eng.setPage(pageKey(), undefined, 1.4);
      if (want && !document.hidden && K.eng.ctx.state !== "running") K.eng.ctx.resume().then(() => { if (want && !K.eng.on) K.eng.start(undefined, 0.5); paint(); }, () => {});
    } else if (!soft && want && !document.hidden && mayResume()) {
      /* an assembled page arriving by a cut: its context is made here, at once, while the cut's cover is still up (the
         browser's price for it is paid where nothing moves); the engine follows in build(). Never on a page the router
         swapped in (lane m-sound): there the eye is in flight, and a room that is owed comes when it stands (late) */
      try { early = new AC({ latencyHint: "interactive" }); } catch (e) { early = null; }
    }
    paint();
    if (DEBUG) window.__rvSoundDbg = { info: () => (eng() ? eng().info() : null), want: () => want, cost: () => (eng() ? eng().cost : null), late: () => !!window.__rvSoundLate };
  }
  /** an assembled page that arrives by a cut may start again without a new gesture when the sound was playing a
   *  moment ago and the browser lets a context run (its own policy, or an activation carried over the navigation) */
  function mayResume() {
    if (Date.now() - (+ss.get(LIVE) || 0) > 12000) return false;
    try {
      if (typeof navigator.getAutoplayPolicy === "function") return navigator.getAutoplayPolicy("audiocontext") === "allowed";
      return !!(navigator.userActivation && navigator.userActivation.hasBeenActive);
    } catch (e) { return false; }
  }
  function build() {
    if (!AC || eng() || !want || document.hidden) return;
    /* the arriving page: the tables come in idle slices, the engine in the idle moment after them, and it opens with
       the door the last page could not finish. Any other page only gets its tables ready for the first gesture. */
    const t0 = performance.now();
    if (early) warm(() => begin(0.4, (e) => { if (window.__rvArrive && performance.now() - t0 < 1500) e.cue("nav:covered", { dawn: pageKey() === "contact" }, e.ctx.currentTime + 0.2); }));
    else warm();
  }

  /* the markup says "on": a visitor who turned the sound off sees the toggle lying flat as soon as this script runs,
     before FX boots the module */
  try {
    const b0 = document.querySelector("[data-snd]"), K0 = window.__rvSound && window.__rvSound.eng ? window.__rvSound : null;
    if (b0 && (K0 ? K0.want === false : (ss.get(VISIT) === "0" || !pref()))) { b0.setAttribute("aria-pressed", "false"); b0.setAttribute("data-snd-state", "off"); }
  } catch (e) { /* the module's own paint follows */ }

  /* a module of FX like the others: a ?fx= list that leaves "sound" out leaves the page silent (html.fx-off-sound hides
     the toggle); without FX the sound still binds itself */
  const FX = window.FX;
  if (FX && typeof FX.register === "function") FX.register("sound", {
    init, build,
    /* the page leaves (the router): the held rows let go; the engine stays */
    leave() { gone = true; clearTimeout(lateT); const e = eng(); if (e) e.rowsOff(); },
  });
  else { init(); build(); }
})();

