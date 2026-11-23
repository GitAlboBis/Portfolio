// @ts-check
/**
 * contact — the Contact page, the dawn page (spec 50 §4): "Write to me." across the measure, the sentence, the address.
 * The whole page is morning: the points are cobalt ink. Fine ruled strokes settle round the line, clear of every
 * letter, no glass.
 *
 * (wave 5) The pairs no longer cross, on a phone or a desktop: near-parallel, all leaning alike (see build).
 *
 * The strokes (rewritten by the LIGHT lane in the fix round: the REST lane's arcs read as waves over a horizon on the
 * phone): long single straight strokes that cross the whole screen, a pair over the line and a pair under it, each
 * pair crossing once at a shallow angle (a few degrees), like strings or rays. No curve anywhere. They come in squeezed
 * onto the line and open out to their places over about two and a half seconds, then the ink only slides along them.
 * In focus (z near 0): a drafting line, not a haze. Every text block is a keep-out.
 *
 * The display line is [data-stage-mark="line"] if the page marks one, else the section's h1 (on Contact's own page),
 * else its h2 (in the home, where the hero's name is the only h1).
 *
 * (wave 7, STAGE) IN THE HOME Contact is the journey's last part: the night (html[data-ground="night"]) runs down to
 * Contact's straight edge of day, which crosses the frame once. There this scene draws the dawn close's threads at that
 * edge (day/threads.js, as scenes/dawn.js does at every page's close): the strokes cross the edge as light above and ink
 * below while it rises, so the frame never shows bare paper between Obla's room and the morning's strokes. On Contact's
 * own page (all dawn) there is no edge and nothing changes.
 */
import threads, { input as edgeIn } from "../day/threads.js";

const PER = 520;

const clamp = (/** @type {number} */ x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const sstep = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/** what the scene hands the strokes every frame (page px): the bands they may use, the line's centre */
const I = { vw: 1440, vh: 900, cy: 400, bands: /** @type {{ y0: number, y1: number, up: boolean }[]} */ ([]), phone: false, inkK: 1 };

/** two ruled strokes per band, crossing once at a shallow angle: one rising, one falling, both near the line
 * @param {any} H */
function build(H) {
  const { vw, cy, bands, phone } = I, ox = vw / 2, out = [];
  for (let k = 0; k < 4; k++) {
    const B = bands[k >> 1];
    const i = k & 1;
    if (!B) { out.push(H.polyline([[-ox * 3, -4000, 0, 0], [-ox * 3 + 1, -4000, 0, 0]], PER)); continue; }   // parked, unseen
    const h = B.y1 - B.y0, sgn = B.up ? 1 : -1;
    // the near edge (toward the line): the pair keeps near it
    const near = B.up ? B.y1 : B.y0;
    // the rise across the whole screen: a few degrees (a little steeper on a phone, which is narrow), never more
    // than the band allows
    const rise = Math.min(h * 0.55, vw * Math.tan(((phone ? 8 : 4.5) * Math.PI) / 180));
    const base = near - sgn * Math.min(h * 0.12, 18);
    // stroke 0 leaves the line toward the right, stroke 1 toward the left: they cross once, the pair over the line
    // right of the middle and the pair under it left of it (two pairs crossing on one vertical read as a bow)
    // (wave 5, GLASS2) on a phone the crossing pairs read as an X over and under the line on a narrow screen: there the
    // four strokes all lean the same way (rising to the right), each pair near-parallel (its two slopes a tenth apart,
    // never meeting inside the screen)
    // and on a desktop the same: the pairs crossing at 4.5 degrees still read as a flat X over and under the line
    const F = B.up ? [[0, 0.9], [0.14, 1]] : [[0.9, 0], [1, 0.12]];
    const yA = base - sgn * rise * F[i][0], yB = base - sgn * rise * F[i][1];
    const x0 = -0.06 * vw, x1 = 1.06 * vw, z0 = -4 + 8 * ((k * 37) % 10) / 10, z1 = -z0;
    const pts = [];
    for (let j = 0; j <= 32; j++) {
      const u = j / 32, x = x0 + (x1 - x0) * u, e = Math.sin(Math.PI * u);
      const yy = Math.max(B.y0, Math.min(B.y1, yA + (yB - yA) * u));
      pts.push([x - ox, yy - cy, z0 + (z1 - z0) * u, 0.22 + 0.78 * Math.pow(e, 0.5)]);
    }
    out.push(H.polyline(pts, PER));
  }
  return H.join(out);
}

const strokes = {
  share: 0.24, fill: 1, fit: "px", emit: 0, capacity: 4 * PER, inkArea: 1296000, carry: 1,
  targets: (/** @type {any} */ H) => build(H),
  look: { ink: 0.11, size: 0.72, mistInk: 0, mistSize: 1.1 },
  motion: { spring: 2.4, speed: 900, inertia: 0.35, fuzz: 0.25 },
  flow: { amp: 0.25, wavelength: 320, evolution: 0.04, z: 0.15 },
  respond: { hand: 0.5, wind: 0.2, fadeIn: 1.2, fadeOut: 1.2 },
  tails: { share: 0, length: 60, emitters: 60 },
  /** @param {any} c */
  update(c) {
    const st = c.state;
    const key = [I.vw, I.cy, ...I.bands.flatMap((b) => [b.y0, b.y1])].map((v) => Math.round(v / 6)).join(",") + (I.phone ? "p" : "");
    if (st.key !== key) { st.key = key; c.setTargets(build(c.H)); }
    // the settle, once per arrival (simulated time: still while the stage rests)
    if (c.weight < 0.05) st.t0 = null;
    st.t0 ??= c.time;
    const e = Math.exp(-clamp(c.time - st.t0, 0, 30) / 2.4);
    // they open out from behind the line (squeezed onto it, so the keep-outs hide them) into their arcs
    // (lane n-fix-flight) reached by a flight the ink is in the frame as the eye comes through the door (n-critic 6: the
    // page was blank paper for 0.15 s): its points take their ink at once (fadeIn 9 a second, not 1.2) while they open out
    return { scale: [1 + 0.08 * e, 1 - 0.5 * e, 1], shift: c.time * 5, ink: I.inkK * (I.phone ? 1.6 : 1), .../** @type {any} */ (I.flown ? { respond: { fadeIn: 9 } } : {}) };
  },
};

/** (wave 7, STAGE) the home's edge of day, as scenes/dawn.js weighs it: full while the edge crosses the screen's
 *  middle band, nothing before it comes up or once the morning fills the screen @param {any} c */
function edgeOf(c) {
  if (c.ground === "dawn") return null;
  const edge = c.section.y, e = edge / c.vh;
  const weight = sstep(1.12, 0.8, e) * (1 - sstep(0.1, -0.3, e));
  if (weight <= 0.001) return null;
  const below = c.texts.filter((/** @type {any} */ t) => t.y > edge + 4).map((/** @type {any} */ t) => t.y - edge);
  edgeIn.vw = c.vw; edgeIn.vh = c.vh; edgeIn.phone = c.phone; edgeIn.inkK = c.inkK;
  edgeIn.room = Math.max(16, (below.length ? Math.min(...below) : c.vh * 0.2) - 24);
  const H = c.vh * 0.5;
  return { id: "edge", weight, rect: { x: 0, y: edge - H / 2, w: c.vw, h: H } };
}

export default {
  blend: false,
  formations: { strokes, edge: threads },
  /** @param {any} c */
  frame(c) {
    const edge = edgeOf(c);
    /* (wave 7, STAGE) IN THE HOME (a night page) the camera is the dawn close's (scenes/dawn.js): the straight view
       focused on the page plane with a short depth of field. Blended with Obla's deep room, the orbiting camera (whose
       lens is wide open) drew the edge's threads and the strokes as soft blurred bands across the edge, a haze. The hand
       orbits the eye exactly as the orbiting camera's `pointer: 0.4` does on Contact's own page (fx-stage.js PTR_FOLLOW,
       0.035 rad: 0.4 of it, pitch 0.6 of that). On Contact's own page (all dawn) nothing changes. */
    const homeCam = c.ground !== "dawn";
    const D = Math.min(2600, Math.max(1100, 1.25 * Math.hypot(c.vw, c.vh)));
    const camera = homeCam
      ? { pos: [c.vw / 2, c.vh / 2, D], target: [c.vw / 2, c.vh / 2, 0], focus: D, aperture: 0.2, lens: 1, roll: 0, orbit: { yaw: 0.014, pitch: 0.0084 } }
      : { yaw: 0, pitch: 0, dolly: 0, pointer: 0.4 };
    const line = c.marks.line || c.texts.find((/** @type {any} */ t) => t.tag === "h1") || c.texts.find((/** @type {any} */ t) => t.tag === "h2");
    if (!line) {
      // the line not measured yet (still below the screen): the edge alone, on the page plane, sharp
      if (!edge) return null;
      return { swarm: [edge], camera,
        keepouts: c.texts.map((/** @type {any} */ t) => ({ x: t.x - 6, y: t.y - 6, w: t.w + 12, h: t.h + 12 })) };
    }
    // in page px (the rect sits on the page's top), so the threads ride with the page and are not rebuilt by a scroll
    const sy = c.scrollY, gap = c.phone ? 14 : 24;
    // the host's glyph box is the face's content area (1.2 em: ascent 0.899, descent 0.300); the capitals stand from
    // 0.189 to 0.763 of it (Sofia Sans Extra Condensed 800, measured in Chrome)
    const top = line.y + sy + 0.189 * line.h, bot = line.y + sy + 0.763 * line.h;
    const below = c.texts.filter((/** @type {any} */ t) => t.y > line.y + line.h - 2);
    const footTop = (below.length ? Math.min(...below.map((/** @type {any} */ t) => t.y)) : c.vh) + sy;
    const footBot = (below.length ? Math.max(...below.map((/** @type {any} */ t) => t.y + t.h)) : c.vh) + sy;
    // (wave 7, STAGE) the upper band starts under the header at Contact's own top: in the home the part's top is far down
    // the page (on Contact's own page it is 0, as before); the strokes belong to the morning, never above its edge
    // (wave 9, J3 VIEWPORT) the header's 64 px and its top safe area under a notch (c.safeTop, 0 elsewhere)
    const hdr = (homeCam ? c.section.y + sy : 0) + (c.phone ? 64 : 64) + (c.safeTop || 0) + gap;
    /** @type {{ y0: number, y1: number, up: boolean }[]} */ const bands = [];
    if (top - gap - hdr > 60) bands.push({ y0: hdr, y1: top - gap, up: true });
    // under the line: between it and the foot if there is room, else under the foot
    const mid = footTop - gap - (bot + gap), low = c.vh + sy - gap - (footBot + gap);
    if (mid >= 70 || mid >= low) { if (mid > 40) bands.push({ y0: bot + gap, y1: footTop - gap, up: false }); }
    // under the foot the pair stands well clear of the foot's last row (the links): close under it the row's keep-out
    // cut the strokes' near ends into fragments (phone)
    else if (low - 2 * gap > 60) bands.push({ y0: footBot + 3 * gap, y1: c.vh + sy - gap, up: false });
    else if (low > 60) bands.push({ y0: footBot + gap, y1: c.vh + sy - gap, up: false });
    I.vw = c.vw; I.vh = c.vh; I.phone = c.phone; I.inkK = c.inkK; I.cy = (top + bot) / 2; I.bands = bands;
    /** @type {any} */ (I).flown = !!(c.arrival && c.arrival.cut && !c.arrival.under && c.arrival.age < 1.5);
    const w = sstep(0.02, 0.3, c.share) * sstep(-0.3, 0.2, (line.y + line.h) / c.vh);
    return {
      swarm: [{ id: "strokes", weight: w, rect: { x: 0, y: I.cy - sy - c.vh / 2, w: c.vw, h: c.vh } }, ...(edge ? [edge] : [])],
      // every text block; the display line by its capitals (its content area reaches far over and under them)
      keepouts: c.texts.map((/** @type {any} */ t) => (t === line || t.tag === "h1"
        ? { x: t.x - 12, y: t.y + 0.189 * t.h - 10, w: t.w + 24, h: 0.574 * t.h + 20 }
        : { x: t.x - 10, y: t.y - 8, w: t.w + 20, h: t.h + 16 })),
      camera,
      focus: 0,
    };
  },
};
