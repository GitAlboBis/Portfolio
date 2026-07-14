/*
  MAREA — generative ambient sound engine (WebAudio, zero assets, zero fetch).

  The footer's "Ambient" toggle (store.soundEnabled) finally has a body: a
  synthesized golden-hour sea — a warm detuned pad breathing through a slow
  lowpass, and a looping pink-noise "surf" whose swells ride a ~11s LFO. Scroll
  couples in via setIntensity (SoundScape reads Lenis velocity): diving makes
  the sea rise. Everything is built lazily inside enable(), which only ever
  runs from the user's toggle click — autoplay-policy safe by construction.

  Volumes are deliberately low (master ≈ -25dBFS): atmosphere, not soundtrack.
*/

const MASTER_VOL = 0.055;
const SURF_BASE = 0.05;

type Graph = {
  stops: Array<() => void>;
  surfGain: GainNode;
  padFilter: BiquadFilterNode;
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let graph: Graph | null = null;
let running = false;

function buildGraph(ac: AudioContext, out: GainNode): Graph {
  const stops: Array<() => void> = [];

  // ── pad — A2 + E3 + A3 triangles, gently detuned, under a breathing lowpass
  const padGain = ac.createGain();
  padGain.gain.value = 0.5;
  const padFilter = ac.createBiquadFilter();
  padFilter.type = "lowpass";
  padFilter.frequency.value = 320;
  padFilter.Q.value = 0.4;
  padGain.connect(padFilter);
  padFilter.connect(out);

  (
    [
      [110, -4, 0.22],
      [164.81, 3, 0.16],
      [220, -7, 0.09],
    ] as const
  ).forEach(([freq, detune, vol]) => {
    const osc = ac.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    osc.detune.value = detune;
    const g = ac.createGain();
    g.gain.value = vol;
    osc.connect(g);
    g.connect(padGain);
    osc.start();
    stops.push(() => osc.stop());
  });

  // filter LFO — the pad inhales/exhales over ~22s
  const padLfo = ac.createOscillator();
  padLfo.frequency.value = 0.045;
  const padLfoAmt = ac.createGain();
  padLfoAmt.gain.value = 140;
  padLfo.connect(padLfoAmt);
  padLfoAmt.connect(padFilter.frequency);
  padLfo.start();
  stops.push(() => padLfo.stop());

  // ── surf — looped pink-ish noise, lowpassed, swelling like waves
  const seconds = 4;
  const buf = ac.createBuffer(1, seconds * ac.sampleRate, ac.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02; // one-pole toward pink
    data[i] = last * 3.5;
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const surfFilter = ac.createBiquadFilter();
  surfFilter.type = "lowpass";
  surfFilter.frequency.value = 650;
  surfFilter.Q.value = 0.7;
  const surfGain = ac.createGain();
  surfGain.gain.value = SURF_BASE;
  src.connect(surfFilter);
  surfFilter.connect(surfGain);
  surfGain.connect(out);

  const swell = ac.createOscillator(); // ~11s wave cycle on the surf volume
  swell.frequency.value = 0.09;
  const swellAmt = ac.createGain();
  swellAmt.gain.value = 0.035;
  swell.connect(swellAmt);
  swellAmt.connect(surfGain.gain);

  src.start();
  swell.start();
  stops.push(() => {
    src.stop();
    swell.stop();
  });

  return { stops, surfGain, padFilter };
}

export const marea = {
  get running() {
    return running;
  },

  /** Start (or resume) the sea. MUST be called from a user gesture. */
  enable() {
    if (running) return;
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
    }
    void ctx.resume();
    if (!graph && master) graph = buildGraph(ctx, master);
    if (master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(MASTER_VOL, ctx.currentTime, 0.9); // ~2.5s rise
    }
    running = true;
  },

  /** Fade out and quiesce (graph torn down; context kept for re-enable). */
  disable() {
    if (!running || !ctx || !master) return;
    running = false;
    const ac = ctx;
    const deadGraph = graph;
    graph = null;
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setTargetAtTime(0, ac.currentTime, 0.25);
    window.setTimeout(() => {
      deadGraph?.stops.forEach((stop) => stop());
      if (!running) void ac.suspend();
    }, 1400);
  },

  /** Pause without teardown (tab hidden); resume() to continue. */
  suspend() {
    if (running && ctx) void ctx.suspend();
  },
  resume() {
    if (running && ctx) void ctx.resume();
  },

  /** 0..1 — scroll velocity: the surf rises and brightens as you dive. */
  setIntensity(v: number) {
    if (!running || !ctx || !graph) return;
    const k = Math.min(1, Math.max(0, v));
    graph.surfGain.gain.setTargetAtTime(SURF_BASE + k * 0.11, ctx.currentTime, 0.18);
    graph.padFilter.frequency.setTargetAtTime(320 + k * 380, ctx.currentTime, 0.25);
  },
};
