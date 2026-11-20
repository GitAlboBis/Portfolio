// @ts-check
/**
 * portal.js — the cut between pages as a flight through a portal of glass (plan 70 §7: separate pages with the 3D kept
 * alive between them; lane PORTAL, notes docs/redesign/rivista-story/build/p-portal.md).
 *
 * ONE progress, p: 0 = the room, 1 = the eye inside the glass. The portal is one tall plate of clear cut glass (the
 * plates' own API: a slab with its lit arris), pinned to the EYE (view space), so whatever camera a scene runs (the
 * orbiting one, the free one, the cut's push) the flight reads the same:
 *   p 0      edge-on, far to one side (the side of the link that was clicked), behind the page plane: nothing drawn
 *   p 0..1   it swings into the eye's path and comes toward the eye; the room is seen more and more through it, bent;
 *            the light gathers along its arris
 *   p 1      it fills the frame (its edges well outside it), face on, near: the eye is inside the glass
 * Leaving a page the host runs p 0 -> 1 in about 300 ms (the sheet then floods the frame in the same tone); arriving it
 * starts at 1 under the sheet and runs 1 -> 0 in about 350 ms as the sheet leaves (the glass falls away to the side and
 * back). When the stage survives a navigation (the Astro router, a later wave) the two halves are one call each way on
 * the same stage: portal(1) at the click, swap the scenes while p = 1, portal(0) — no sheet.
 *
 * Pure functions, no GPU: stage.js calls portalSlab() once per drawn frame while p > 0 and puts the result first in
 * the plates' list.
 */

const clamp = (/** @type {number} */ x, /** @type {number} */ a, /** @type {number} */ b) => (x < a ? a : x > b ? b : x);
const ss = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/** the look of the portal (tuned on strips, .shots/p-portal/) */
export const PORTAL = Object.freeze({
  zFrom: -0.32,      // x D: its depth at p 0 (behind the page plane)
  zTo: 0.5,          // x D: its depth at p 1 (the picture grows x D / (D - z) = 2)
  cover: 2.1,        // how far past the frame its edges sit at p 1 (x the viewport, after the projection); (lane o-router,
                     // was 1.45) with a thicker block its side face must stay out of the frame at p 1
  aspect: 1.55,      // at least this much taller than wide: a portal, a door of glass
  xFrom: 0.62,       // x vw: its centre's offset toward the clicked side at p 0 (it enters the frame already turning)
  yawFrom: 0.46,     // rad at p 0 (its far edge toward the clicked side); never edge-on in frame: a side seen edge-on
                     // reads as a dark bar. (lane o-router) Less turned than the first version (0.72): its broad face, with
                     // the studio's reflections on it, crosses the frame, not its edge (that read as a white line wiping)
  yawTo: 0.1,        // rad left at p 1: a parallel slab face on bends nothing; this keeps the room shifted and bent
  thick: 0.05,       // x its width: a block of cut glass (clamped 30..80 px): the room behind it is displaced across its
                     // arris by its thickness, which is what reads as glass on a dark room
  ior: 1.62,         // denser than the room's plates (1.5): the room bends more through it
  bevel: 9,          // px of the lit arris: the light along it reads, the side face does not become a bar
  /* (lane o-fix) THE DOOR. A plate swinging in from one side read as a wipe (a hairline crossing the frame, then its
     side face as a grey column), and face on it bent nothing: a parallel slab shows the room as it is, so the frames
     inside the glass read as a dark pause. Now the glass is a tall pane met head on, in the middle of the frame, a
     little toward the clicked side, that the eye flies into: its two arrises part from the middle and leave the frame
     on both sides, and its rims are deep bevels (a thick block's rounded-off edge, a lens): as each rim passes over the
     room it bends it hard and splits it faintly at the arris, which is what reads as glass the eye goes through. */
  door: true,
  dW0: 0.34,         // x vw: its picture's width at p 0 (deep, small, in the middle)
  dX: 0.08,          // x vw: its centre toward the clicked side at p 0 (to the middle at p 1)
  dYaw0: 0.06,       // rad at p 0 (its far edge toward the clicked side), dYaw1 at p 1: nearly face on (at 0.2 its side face
                     // stood inside it as a grey column with a rounded end)
  dYaw1: 0.02,
  dBevel: 0.08,      // x its width: the rims (each side), where the room is bent (0.16 smeared the title into a white block)
  dIor: 1.38,        // gentler than the room's plates: the rims bend the room, they do not stretch a letter across the frame
  dThick: 0.03,      // x its width (clamped 14..40 px): thin, so its two arrises on a side read as one edge
  dDisp: 0,          // no split through it: one ray, not three (a full-frame plate), and the rims smeared the title into colour; its arris keeps its faint split
});

/** the door (PORTAL.door): see above @param {number} p @param {number} q @param {number} s
 *  @param {{ vw: number, vh: number, D: number }} o */
function doorPose(p, q, s, o) {
  const P = PORTAL;
  const z = o.D * (P.zFrom + (P.zTo - P.zFrom) * q);
  const k = o.D / Math.max(1, o.D - z);                 // the picture's scale at that depth
  const pic = P.dW0 * o.vw + (P.cover * o.vw - P.dW0 * o.vw) * Math.pow(q, 1.15);
  const w = pic / k;
  const h = Math.max((1.3 * o.vh) / k, 1.75 * o.vh);    // its top and bottom never in the frame
  return {
    x: o.vw / 2 + s * P.dX * o.vw * (1 - q),
    y: o.vh / 2,
    z,
    yaw: -s * (P.dYaw1 + (P.dYaw0 - P.dYaw1) * (1 - q)),
    w, h, t: clamp(P.dThick * w, 14, 40),
    alpha: ss(0.0, 0.12, p),
    edge: 0.18 + 0.3 * ss(0.5, 1, p),
    glow: 0,   // its rims are a third of it: the swarm's glow there cost eight taps a pixel over most of the frame
    sheen: 0.06,
    bevel: P.dBevel * w,
    dispersion: P.dDisp,
    ior: P.dIor,
  };
}

/**
 * The portal's pose in VIEW space at progress p (0..1).
 * @param {number} p
 * @param {{ vw: number, vh: number, D: number, side: number }} o side: -1 left, 1 right
 */
export function portalPose(p, o) {
  const P = PORTAL, s = o.side < 0 ? -1 : 1;
  const q = p * p * (3 - 2 * p);                       // the flight: slow off the mark, fast in the middle, settles
  if (P.door) return doorPose(p, q, s, o);
  const scale = 1 / (1 - P.zTo);                        // its picture's growth at p 1
  const w = (P.cover * o.vw) / scale;
  // tall enough that its top and bottom never enter the frame, even far and small at p 0 (a phone is tall): a
  // door of glass seen whole would read as a framed card
  const h = Math.max((P.cover * o.vh) / scale, w * P.aspect, 1.75 * o.vh);
  const sweep = 1 - ss(0, 0.82, p);                     // it comes in from the side before it comes near
  return {
    x: o.vw / 2 + s * P.xFrom * o.vw * sweep,
    y: o.vh / 2,
    z: o.D * (P.zFrom + (P.zTo - P.zFrom) * q),
    yaw: -s * (P.yawTo + (P.yawFrom - P.yawTo) * Math.pow(1 - q, 1.2)),
    w, h, t: clamp(P.thick * w, 30, 80),
    alpha: ss(0.0, 0.1, p),
    // the arris catches the light as the eye comes near; the broad face keeps the studio's reflections
    // (lane o-router) faint while it sweeps across the frame (a bright hairline crossing a dark room read as a wipe),
    // lit once it is near and the frame is mostly glass
    edge: 0.12 + 0.88 * ss(0.4, 0.9, p),
    glow: 0.15 + 0.45 * ss(0.5, 1, p),   // the swarm behind lights the arris; a full glow at a slant blooms into a soft grey band
    // the studio's soft boxes on the broad face: faint while it turns (seen at a slant they read as a grey band), whole
    // face on
    // (lane o-router) kept faint at every p: on this block the soft box's reflection is a tall grey column with a rounded
    // end (looked at: .shots/o-router/pstill-work-*.png); the glass reads by the room displaced across its arris instead
    sheen: 0.05 + 0.07 * ss(0.7, 1, p),
  };
}

/**
 * A pose in view space as a slab of the plates' API (world: cx, cy viewport px at cz, yaw / pitch / roll), given the
 * camera of the frame: view = R (world - P) + O (stage.js camMatrix; R orthonormal, rows).
 * @param {ReturnType<typeof portalPose>} v
 * @param {{ R: number[][], P: number[], O: number[], scroll: { x: number, y: number } }} cam
 * @param {{ fade?: number }} [o] fade 0..1: its presence (a portal whose glass joined late enters)
 */
export function portalSlab(v, cam, o) {
  const { R, P, O, scroll } = cam;
  // the centre: view space (document px, like the plates' own centres) back to world
  const u =[scroll.x + v.x - O[0], scroll.y + v.y - O[1], v.z - O[2]];
  // R^T u (+ P): the rows of R are the view axes in world space
  const w = [0, 1, 2].map((i) => R[0][i] * u[0] + R[1][i] * u[1] + R[2][i] * u[2] + P[i]);
  // orientation: the plate's turn M (plates.js obj: yaw . pitch . roll) such that R M = Y(yaw in view)
  const cy = Math.cos(v.yaw), sy = Math.sin(v.yaw);
  const V = [[cy, 0, -sy], [0, 1, 0], [sy, 0, cy]];
  /** @type {number[][]} */ const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) M[i][j] = R[0][i] * V[0][j] + R[1][i] * V[1][j] + R[2][i] * V[2][j];
  const pitch = Math.asin(clamp(M[1][2], -1, 1));
  const roll = Math.atan2(M[1][0], M[1][1]);
  const yaw = Math.atan2(-M[0][2], M[2][2]);
  return {
    id: "portal", cx: w[0] - scroll.x, cy: w[1] - scroll.y, cz: w[2], yaw, pitch, roll,
    w: v.w, h: v.h, t: v.t, tex: null, alpha: clamp(v.alpha * (o && o.fade != null ? o.fade : 1), 0, 1),
    glow: v.glow, edge: v.edge, sheen: v.sheen, ior: /** @type {any} */ (v).ior ?? PORTAL.ior, bevel: /** @type {any} */ (v).bevel ?? PORTAL.bevel,
    ...(/** @type {any} */ (v).dispersion != null ? { dispersion: /** @type {any} */ (v).dispersion } : {}),
    // always sharp: the cut's push softens the room and its plates (plates.js soften), never the portal the eye flies
    // into; and the free camera's focus would blur a plate this near (plates.js clamps the product to 1)
    sharp: 60,
    ...(/** @type {any} */ (v).bevel != null ? { rimSheen: 0 } : {}),   // (lane o-fix) the door's rims mirror no soft box
  };
}
