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
  surfFilter: BiquadFilterNode;
  /** LFO depths — scaled with submersion so base − depth can't go negative
      (a phase-inverted surf trough / a 0 Hz-clamped pad read as thumps) */
  swellAmt: GainNode;
  padLfoAmt: GainNode;
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let graph: Graph | null = null;
let running = false;
let lastK = -1;
let lastSub = -1;
let intensK = 0;
let subK = 0;
/** ctx time until which surfaceBreak() owns surfGain.gain — applyDynamics
    must not stomp the swell on the very next scroll frame */
let swellHold = 0;

/* combined dynamics: scroll intensity opens the sea up, submersion muffles it
   (the underwater lowpass of LA RISALITA — ears break the surface too). */
function applyDynamics() {
  if (!ctx || !graph) return;
  const t0 = ctx.currentTime;
  if (t0 >= swellHold) {
    graph.surfGain.gain.setTargetAtTime((SURF_BASE + intensK * 0.11) * (1 - 0.45 * subK), t0, 0.18);
  }
  graph.padFilter.frequency.setTargetAtTime((320 + intensK * 380) * (1 - 0.7 * subK), t0, 0.25);
  graph.surfFilter.frequency.setTargetAtTime(650 * (1 - 0.64 * subK), t0, 0.3);
  graph.swellAmt.gain.setTargetAtTime(0.035 * (1 - 0.8 * subK), t0, 0.25);
  graph.padLfoAmt.gain.setTargetAtTime(140 * (1 - 0.75 * subK), t0, 0.25);
}

/*
  Autoplay discipline: soundEnabled is PERSISTED, so enable() also fires on a
  plain page load for a returning opted-in user — with no user activation.
  Creating/resuming an AudioContext there is blocked by Chrome (silent-ON +
  console warning). So: without activation we don't touch WebAudio at all —
  we arm one-shot gesture listeners and boot on the first real interaction.
*/
let armed: (() => void) | null = null;
function disarm() {
  if (!armed) return;
  window.removeEventListener("pointerdown", armed);
  window.removeEventListener("keydown", armed);
  armed = null;
}
function arm() {
  if (armed) return;
  const on = () => {
    disarm();
    if (running) startNow();
  };
  armed = on;
  window.addEventListener("pointerdown", on, { passive: true });
  window.addEventListener("keydown", on);
}

/** Build/resume the sea — call only under (assumed) user activation. */
function startNow() {
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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
  // belt: if the policy still held us back, the next gesture retries
  if (ctx.state === "suspended") arm();
}

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

  return { stops, surfGain, padFilter, surfFilter, swellAmt, padLfoAmt };
}

export const marea = {
  get running() {
    return running;
  },

  /** Start (or resume) the sea — safe on both the toggle click AND the
      persisted-restore page load (defers to the first gesture there). */
  enable() {
    if (running) return;
    running = true;
    lastK = -1;
    lastSub = -1;
    const ua = (navigator as unknown as { userActivation?: { isActive: boolean } })
      .userActivation;
    if (!ctx && ua && !ua.isActive) {
      arm(); // restore path: no WebAudio until a real interaction
      return;
    }
    startNow();
  },

  /** Fade out and quiesce (graph torn down; context kept for re-enable). */
  disable() {
    if (!running) return;
    running = false;
    disarm();
    if (!ctx || !master) return;
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

  /** 0..1 — scroll velocity: the surf rises and brightens as you dive.
      Dead-banded: an idle page must not schedule ~120 identical AudioParam
      automation events per second on the audio thread. */
  setIntensity(v: number) {
    if (!running || !ctx || !graph) return;
    const k = Math.min(1, Math.max(0, v));
    if (Math.abs(k - lastK) < 0.004) return;
    lastK = k;
    intensK = k;
    applyDynamics();
  },

  /** 0..1 — how deep underwater the "camera" is (LA RISALITA drives this):
      1 = fully submerged (muffled lowpass), 0 = surfaced. Dead-banded like
      setIntensity — scrubbed scroll must not spam the audio thread. */
  setSubmerged(v: number) {
    const k = Math.min(1, Math.max(0, v));
    if (Math.abs(k - lastSub) < 0.004) return;
    lastSub = k;
    subK = k;
    if (!running || !ctx || !graph) return;
    applyDynamics();
  },

  /** the break itself: a quick surf swell as the head clears the water.
      swellHold keeps applyDynamics off surfGain.gain while it plays. */
  surfaceBreak() {
    if (!running || !ctx || !graph) return;
    const t0 = ctx.currentTime;
    swellHold = t0 + 0.8;
    const base = (SURF_BASE + intensK * 0.11) * (1 - 0.45 * subK);
    const g = graph.surfGain.gain;
    g.cancelScheduledValues(t0);
    g.setTargetAtTime(Math.min(0.26, base * 3), t0, 0.05);
    g.setTargetAtTime(base, t0 + 0.22, 0.5);
  },
};
