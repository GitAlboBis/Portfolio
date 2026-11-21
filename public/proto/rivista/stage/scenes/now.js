// @ts-check
/**
 * now — "Now at SerSan" (spec 50 §4; lanes COVER, HERO), and the lit plate the cover's camera flies to.
 *
 * One plate of thick clear glass holding the sersan.io capture. It stands where Now's layout wants it (the figure's half
 * on a desktop, the band under the header on a phone), at the page plane, and it is in the cover's world from the first
 * frame: seen from the hero's camera it is the small bright window far behind the name (scenes/cover/world.js: the name
 * stands two eye-distances in front of the page plane). The scroll flies the camera to it; when Now's view reaches the
 * top the camera is the straight view and the plate is exactly in its place, sharp. From there it rides with the Now
 * section and leaves upward with it. Both scenes return the same camera (coverCamera), so the host's blend is one shot.
 *
 * The pointer turns it a few degrees with inertia (a spring that overshoots a little); a press brightens its edges for a
 * moment. The swarm gathers deep behind it as a soft field (low-discrepancy, not random), so the plate's own edges catch
 * the light. No outline: a dotted frame read as a string of LEDs (lane LIGHT).
 */
import { C, clamp, sstep, mix } from "./cover/shared.js";
import { coverCamera, flightK, hallField, liveKeeps } from "./cover/world.js";
// (lane NAME) ?name=splat: the same splat config as hero.js (the host takes the heaviest scene's)
const NAME_SPLAT = typeof location !== "undefined" && /[?&]name=splat(?:&|$)/.test(location.search);
/** @type {any} */ let SN = null;
if (NAME_SPLAT) import("./cover/splatname.js").then((m) => { SN = m; }, () => {});

const TEX = "now";

/* ================================================================ the glow behind the plate
 * A squared-off glow as wide as the plate, flat behind it and still bright under its four edges, soft past them; a long
 * faint band at a shallow slant whose ends show past the glass; drawn from a low-discrepancy sequence so every region of
 * the glow gets its fair share of points: one smooth soft field. */
const GN = 40000;
const GLOW = 0.8;          // the glow's share of the points (the rest: the band)
/** the d-dimensional R sequence (Roberts): the k-th coordinate of point i, in [0, 1) */
const PHI6 = (() => { let x = 1.2; for (let k = 0; k < 40; k++) x = Math.pow(1 + x, 1 / 7); return x; })();
const AL = [1, 2, 3, 4, 5, 6].map((k) => 1 / Math.pow(PHI6, k));
const R = (/** @type {number} */ i, /** @type {number} */ k) => (0.5 + i * AL[k]) % 1;
/** an even spread of u in (0, 1) to a normal deviate (logistic approximation, enough for a soft edge) */
const nrm = (/** @type {number} */ u) => { const v = Math.min(1 - 1e-6, Math.max(1e-6, u)); return 0.5513 * Math.log(v / (1 - v)); };
/** @param {{ sw: number, sh: number, z: number, D: number }} q */
function glowSet(q) {
  const d = new Float32Array(GN * 4), a = 0.26, ca = Math.cos(a), sa = Math.sin(a), ng = Math.round(GN * GLOW);
  const sg = (/** @type {number} */ u, /** @type {number} */ e) => { const t = u * 2 - 1; return Math.sign(t) * Math.pow(Math.abs(t), 0.7) + nrm(e) * 0.16; };
  for (let i = 0; i < GN; i++) {
    const z = q.z + nrm(R(i, 4)) * 30, s = q.D / (q.D - z);
    let x, y, w;
    if (i < ng) { x = sg(R(i, 0), R(i, 2)) * q.sw * 0.5; y = sg(R(i, 1), R(i, 3)) * q.sh * 0.5; w = 0.62 + 0.38 * R(i, 5); }
    else {
      const j = i - ng, u = nrm(R(j, 0)) * q.sw * 0.75, v = nrm(R(j, 1)) * q.sh * 0.07;
      x = u * ca - v * sa; y = u * sa + v * ca; w = 0.65 + 0.35 * R(j, 5);
    }
    d[i * 4] = x / s; d[i * 4 + 1] = y / s; d[i * 4 + 2] = z; d[i * 4 + 3] = w;
  }
  return { data: d, path: 0, closed: false };
}
const glow = {
  share: 0.3, fill: 1, fit: "px", inkArea: 300000, capacity: GN, carry: 1, emit: 0,
  targets: () => glowSet({ sw: 600, sh: 600, z: -520, D: 2100 }),
  look: { ink: 0.16, size: 1.3, mistInk: 0, mistSize: 1.1 },
  motion: { spring: 3.6, speed: 1600, inertia: 0.22, fuzz: 0 },
  flow: { amp: 1.2, wavelength: 900, evolution: 0.02, z: 0.2 },
  respond: { hand: 0.3, wind: 0.5, fadeIn: 1.2, fadeOut: 1.2 },
  /** @param {any} c */
  update(c) {
    const q = C.field;
    if (q) {
      const key = `${Math.round(q.sw / 6)},${Math.round(q.sh / 6)},${Math.round(q.z / 8)},${Math.round(q.D / 20)}`;
      if (c.state.key !== key) { c.state.key = key; c.setTargets(glowSet(q)); }
    }
    // the ink per point scales with the rect's area (inkArea): a phone's plate is a quarter of the tuned one
    return q && q.phone ? { ink: 2.2 } : {};
  },
};

export default {
  formations: { field: glow },
  blend: false,
  // the plate brings itself in (README "The glass signal"): the host adds no focus pull of its own
  glassEntry: true,
  /** @param {any} c */
  frame(c) {
    const s = c.state, dt = c.dt, vw = c.vw, vh = c.vh, y = c.scrollY, phone = c.phone;
    // Now's top in the document: the end of the cover's flight
    const nowTop = Math.max(1, c.section.y + y);
    C.nowTop = nowTop;
    const k = flightK(c);
    // ------------------------------------------------ the plate's place in Now (viewport px when Now's view is at the
    // top): the figure's half across, the first screen down; on a phone the room between the header and the text
    const f = c.fig;
    let top = vh * 0.55;
    for (const r of c.texts) top = Math.min(top, r.y - c.section.y);
    const band = Math.max(120, top - 64 - 28);
    const side = phone ? Math.min(vw * 0.7, band * 0.84) : Math.min(f.w * 0.64, vh * 0.62, 620);
    const P = phone
      ? { cx: vw * 0.5, cy: 64 + band * 0.5 + 6, w: side, h: side, t: 22, yaw: -0.08, pitch: 0.03, cz: 40 }
      : { cx: f.x + f.w * 0.5, cy: vh * 0.5, w: side, h: side, t: 40, yaw: -0.12, pitch: 0.02, cz: 50 };
    // fixed to the viewport through the flight (the camera moves), then it rides up with the section
    const ride = Math.min(0, nowTop - y);
    // far down the hall the window stands above and right of the name on a desktop, below it on a phone (seen from the
    // rest pose it would sit on the letters); the flight brings it down into its place long before it is near
    const lift = 1 - sstep(0.12, 0.78, k);
    const lx = (phone ? 0.7 : 0.1) * vw * lift, ly = (phone ? -0.6 : -0.5) * vh * lift;   // a phone: above the name, in the band under the header (below it the foot's text stands)
    // ------------------------------------------------ the pointer: a few degrees, with inertia
    s.tx ??= 0; s.ty ??= 0; s.vx ??= 0; s.vy ??= 0; s.flash ??= 0;
    const p = c.pointer, nx = p.present ? p.nx : 0, ny = p.present ? p.ny : 0;
    const amp = mix(0.3, 1.4, k);
    if (dt > 0) {
      const kk = 16, d = 2 * 0.58 * Math.sqrt(kk);
      s.vx += (kk * (nx * 0.1 * amp - s.tx) - d * s.vx) * dt; s.tx += s.vx * dt;
      s.vy += (kk * (-ny * 0.065 * amp - s.ty) - d * s.vy) * dt; s.ty += s.vy * dt;
      if (p.down && !s.wasDown) s.flash = 1;
      s.flash *= Math.exp(-dt / 0.38);
    }
    s.wasDown = p.down;
    // ------------------------------------------------ presence: it comes up with the hall (the hero's arrival), never
    // before the glass can draw and never in one frame
    const gl = c.glass || { ready: true };
    if (gl.ready && s.g0 == null) s.g0 = c.time;
    const gIn = s.g0 == null ? 0 : sstep(0, 0.6, c.time - s.g0);
    const enter = Math.min(gIn, sstep(2.2, 3.3, C.at ?? 99));
    const img = c.imgs[TEX];
    const held = img && img.tex ? img.tex : null;
    const plate = {
      id: "plate", cx: P.cx + lx, cy: P.cy + ride + ly, cz: P.cz,
      yaw: P.yaw + s.tx, pitch: P.pitch + s.ty, roll: 0,
      w: P.w, h: P.h, t: P.t, tex: held, inset: held ? Math.max(6, P.w * 0.045) : undefined,
      // far down the hall it is the lit window: its edges bright; in place, the plate as it always was
      // it stays while the name's letters sweep past the lens (the engine sorts each point against the plate's own
      // mid plane, draw.wgsl.js ZWin: a letter in front is drawn over it), the window ahead all through the flight
      alpha: enter, glow: clamp(mix(0.95, 0.85, k) + 0.45 * s.flash), sharp: 1,
    };
    // ------------------------------------------------ the field behind the plate (FZ behind the page, out of focus)
    const FZ = -520, D = clamp(1.25 * Math.hypot(vw, vh), 1100, 2600), kP = D / (D - P.cz), kF = D / (D - FZ);
    C.field = { sw: P.w * kP, sh: P.h * kP, z: FZ, D, phone };
    const gone = clamp((y - nowTop) / vh);
    // only from the flight on: at rest the hall's four formations (the name's face and depth, the shafts, the sheen)
    // hold the stage's four slots
    // (round 12, COVER3FIX) only once the name's points have gone dark behind the lens (world.js gone(), k 0.42-0.5):
    // handed over while dark, they appear on the glow's places instead of flying across the screen as blue streaks
    const hw = mix(0.3, 1, sstep(0.55, 1, k)) * enter * sstep(0.52, 0.62, k) * (1 - sstep(0.3, 0.8, gone));
    // Now's keep-outs once the letters are behind the eye (during the pass they cut rectangles out of them)
    // (round 12, COVER3FIX) the title from the live DOM (the host's rect of it is taken under its rise mask), and the
    // header's words: no chip over them
    const keep = k < 0.45 ? [] : c.texts.filter((/** @type {any} */ r) => r.tag !== "h2").map((/** @type {any} */ r) => ({ x: r.x - 16, y: r.y - 16, w: r.w + 32, h: r.h + 32 })).concat(liveKeeps(c, true));
    if (gone >= 1) return null;
    // the hall's chips and wall at the end of the flight and in Now's own view (the same numbers as the hero's, so the
    // host's blend is one field; the hero alone brings the light): the plate arrives among the SerSan marks, which
    // thin out as Now leaves
    let field;
    if (k > 0.88 || y >= nowTop) {
      field = hallField(c, { at: C.at ?? 99, k });
      // (wave 7, STAGE) the hall's back is the cosmos now (no `wall`): reading field.wall threw here and the host marked
      // the scene broken for good (no plate, no keep-outs over Now's text from the first frame of the flight on). In the
      // home the cosmos runs on behind Now into the gallery's room: only the chips thin out as Now leaves
      if (field) { const g = 1 - sstep(0.05, 0.5, gone); field.chips.alpha *= g; if (field.wall) field.wall.alpha *= g; }
    }
    const fx = vw / 2 + (P.cx + lx - vw / 2) * (kP / kF), fy = vh / 2 + (P.cy + ride + ly - vh / 2) * (kP / kF);
    const passes = SN ? SN.nameFrame(c) : null;
    // (wave 7, STAGE) the cover's one shot is one look: Now asks the hero's (the host mixes the scenes' looks by weight,
    // and a scene that asks none counts at the stage's defaults: Now would have pulled the hall's depth in mid-flight)
    if (typeof c.look === "function") c.look({ far: Math.round(-2.6 * D), near: Math.round(4.7 * D), keepFeather: k > 0.45 && y < nowTop + vh * 0.5 ? 40 : 6 });
    return {
      ...(passes ? { passes } : {}),
      swarm: [{ id: "field", weight: hw, rect: { x: fx - P.w / 2, y: fy - P.h / 2, w: P.w, h: P.h } }],
      slabs: [plate],
      keepouts: keep,
      camera: coverCamera(c), field,
      rest: k < 1 ? 14 : undefined,
      // the window glows far down the hall; in place the capture is a picture, not a lamp
      bloom: { strength: mix(0.6, 0.12, sstep(0.45, 1, k)), threshold: 0.36, plates: mix(0.12, 0.03, k) },
    };
  },
};
