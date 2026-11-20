// @ts-check
/**
 * formats.js — splat data in memory and the two common capture formats (lane SPLAT, wave 2).
 *
 * SplatData (what every generator and loader returns; local units, y down, z toward the reader):
 *   { count, pos: Float32Array(3n), scale: Float32Array(3n), rot: Float32Array(4n), color: Uint8Array(4n), bounds }
 *   scale: the gaussian's standard deviation on its three axes (linear, not log); rot: unit quaternion (w, x, y, z);
 *   color: sRGB bytes, alpha = opacity (0..255); bounds: { center: [x, y, z], radius } (filled by withBounds).
 *
 * .ply  as 3D Gaussian Splatting writes it: binary_little_endian 1.0, one "vertex" element whose float properties include
 *       x y z, f_dc_0..2 (the degree-0 spherical harmonic: colour = 0.5 + SH_C0 * f_dc), opacity (a logit), scale_0..2
 *       (logs), rot_0..3 (w x y z, not normalised). Other properties (nx ny nz, f_rest_*) are skipped by offset.
 * .splat (antimatter15's format): 32 bytes a splat: position 3 x float32, scale 3 x float32 (linear), colour rgba 4 x u8,
 *       rotation 4 x u8 ((q - 128) / 128, w x y z).
 * Nothing here is downloaded from the network: the bench writes its own scene to both formats and reads it back.
 */

export const SH_C0 = 0.28209479177387814;

/** an empty SplatData @param {number} n */
export function makeSplats(n) {
  return { count: n, pos: new Float32Array(n * 3), scale: new Float32Array(n * 3), rot: new Float32Array(n * 4), color: new Uint8Array(n * 4), bounds: { center: [0, 0, 0], radius: 1 } };
}

/** the centre and radius of a set (the radius holds 98 % of the splats: a stray splat does not blow the scatter up)
 *  @template {ReturnType<typeof makeSplats>} T @param {T} d @returns {T} */
export function withBounds(d) {
  const n = d.count;
  if (!n) return d;
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < n; i++) { cx += d.pos[i * 3]; cy += d.pos[i * 3 + 1]; cz += d.pos[i * 3 + 2]; }
  cx /= n; cy /= n; cz /= n;
  const r2 = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = d.pos[i * 3] - cx, y = d.pos[i * 3 + 1] - cy, z = d.pos[i * 3 + 2] - cz; r2[i] = x * x + y * y + z * z; }
  const k = Math.min(n - 1, Math.floor(n * 0.98));
  d.bounds = { center: [cx, cy, cz], radius: Math.sqrt(select(r2, k)) || 1 };
  return d;
}

/** the k-th smallest value of a (a copy is partitioned) @param {Float32Array} a @param {number} k */
function select(a, k) {
  const b = Float32Array.from(a);
  let lo = 0, hi = b.length - 1;
  while (lo < hi) {
    const p = b[(lo + hi) >> 1];
    let i = lo, j = hi;
    while (i <= j) { while (b[i] < p) i++; while (b[j] > p) j--; if (i <= j) { const t = b[i]; b[i] = b[j]; b[j] = t; i++; j--; } }
    if (k <= j) hi = j; else if (k >= i) lo = i; else break;
  }
  return b[k];
}

/** keep the `cap` splats nearest to `at` (default the set's centre); a set under the cap is returned as is
 *  @param {ReturnType<typeof makeSplats>} d @param {number} cap @param {number[]} [at] */
export function capNearest(d, cap, at) {
  if (d.count <= cap) return d;
  const c = at || d.bounds.center || [0, 0, 0];
  const r2 = new Float32Array(d.count);
  for (let i = 0; i < d.count; i++) { const x = d.pos[i * 3] - c[0], y = d.pos[i * 3 + 1] - c[1], z = d.pos[i * 3 + 2] - c[2]; r2[i] = x * x + y * y + z * z; }
  const lim = select(r2, cap - 1);
  const out = makeSplats(cap);
  let j = 0;
  // ties at the limit: the first ones in file order
  for (let i = 0; i < d.count && j < cap; i++) {
    if (r2[i] > lim) continue;
    out.pos.set(d.pos.subarray(i * 3, i * 3 + 3), j * 3); out.scale.set(d.scale.subarray(i * 3, i * 3 + 3), j * 3);
    out.rot.set(d.rot.subarray(i * 4, i * 4 + 4), j * 4); out.color.set(d.color.subarray(i * 4, i * 4 + 4), j * 4);
    j++;
  }
  out.count = j;
  return withBounds(out);
}

const sigm = (/** @type {number} */ x) => 1 / (1 + Math.exp(-x));
const logit = (/** @type {number} */ p) => { const q = Math.min(1 - 1e-6, Math.max(1e-6, p)); return Math.log(q / (1 - q)); };
const byte = (/** @type {number} */ x) => Math.max(0, Math.min(255, Math.round(x)));

/** the header of a .ply: its properties (name, type, offset), the vertex count, the stride and where the data begins
 *  @param {ArrayBuffer} buf */
function plyHeader(buf) {
  const head = new TextDecoder().decode(new Uint8Array(buf, 0, Math.min(buf.byteLength, 65536)));
  const end = head.indexOf("end_header");
  if (!head.startsWith("ply") || end < 0) throw new Error("[splat] not a .ply");
  const lines = head.slice(0, end).split(/\r?\n/);
  if (!lines.some((l) => /^format binary_little_endian 1\.0/.test(l))) throw new Error("[splat] .ply: only binary_little_endian is read");
  const SIZE = /** @type {Record<string, number>} */ ({ char: 1, uchar: 1, int8: 1, uint8: 1, short: 2, ushort: 2, int16: 2, uint16: 2, int: 4, uint: 4, int32: 4, uint32: 4, float: 4, float32: 4, double: 8, float64: 8 });
  let count = 0, inVertex = false, stride = 0;
  /** @type {Record<string, { type: string, off: number }>} */ const props = {};
  for (const l of lines) {
    const t = l.trim().split(/\s+/);
    if (t[0] === "element") { inVertex = t[1] === "vertex"; if (inVertex) count = +t[2]; else if (count) break; }
    else if (t[0] === "property" && inVertex) {
      if (t[1] === "list") throw new Error("[splat] .ply: list property in vertex");
      props[t[2]] = { type: t[1], off: stride }; stride += SIZE[t[1]] || 4;
    }
  }
  // the data starts after "end_header" and its newline
  const nl = head.indexOf("\n", end);
  return { count, stride, props, start: new TextEncoder().encode(head.slice(0, nl + 1)).length };
}

/** read a 3DGS .ply @param {ArrayBuffer} buf */
export function parsePly(buf) {
  const h = plyHeader(buf);
  const need = ["x", "y", "z", "f_dc_0", "f_dc_1", "f_dc_2", "opacity", "scale_0", "scale_1", "scale_2", "rot_0", "rot_1", "rot_2", "rot_3"];
  for (const k of need) if (!h.props[k] || h.props[k].type !== "float") throw new Error(`[splat] .ply: no float "${k}"`);
  if (h.start + h.count * h.stride > buf.byteLength) throw new Error("[splat] .ply: truncated");
  const dv = new DataView(buf, h.start);
  const o = Object.fromEntries(need.map((k) => [k, h.props[k].off]));
  const d = makeSplats(h.count);
  for (let i = 0; i < h.count; i++) {
    const b = i * h.stride, f = (/** @type {string} */ k) => dv.getFloat32(b + o[k], true);
    d.pos[i * 3] = f("x"); d.pos[i * 3 + 1] = f("y"); d.pos[i * 3 + 2] = f("z");
    d.scale[i * 3] = Math.exp(f("scale_0")); d.scale[i * 3 + 1] = Math.exp(f("scale_1")); d.scale[i * 3 + 2] = Math.exp(f("scale_2"));
    let w = f("rot_0"), x = f("rot_1"), y = f("rot_2"), z = f("rot_3");
    const l = Math.hypot(w, x, y, z) || 1;
    d.rot[i * 4] = w / l; d.rot[i * 4 + 1] = x / l; d.rot[i * 4 + 2] = y / l; d.rot[i * 4 + 3] = z / l;
    d.color[i * 4] = byte((0.5 + SH_C0 * f("f_dc_0")) * 255);
    d.color[i * 4 + 1] = byte((0.5 + SH_C0 * f("f_dc_1")) * 255);
    d.color[i * 4 + 2] = byte((0.5 + SH_C0 * f("f_dc_2")) * 255);
    d.color[i * 4 + 3] = byte(sigm(f("opacity")) * 255);
  }
  return withBounds(d);
}

/** read a .splat (32 bytes a splat) @param {ArrayBuffer} buf */
export function parseSplat(buf) {
  if (buf.byteLength % 32) throw new Error("[splat] .splat: size is not a multiple of 32");
  const n = buf.byteLength / 32, f = new Float32Array(buf), u = new Uint8Array(buf);
  const d = makeSplats(n);
  for (let i = 0; i < n; i++) {
    d.pos.set(f.subarray(i * 8, i * 8 + 3), i * 3);
    d.scale.set(f.subarray(i * 8 + 3, i * 8 + 6), i * 3);
    d.color.set(u.subarray(i * 32 + 24, i * 32 + 28), i * 4);
    const q = [0, 1, 2, 3].map((k) => (u[i * 32 + 28 + k] - 128) / 128);
    const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
    for (let k = 0; k < 4; k++) d.rot[i * 4 + k] = q[k] / l;
  }
  return withBounds(d);
}

/** write a 3DGS .ply (the bench's own scene; with nx ny nz and three f_rest so the reader's offsets are exercised)
 *  @param {ReturnType<typeof makeSplats>} d @returns {ArrayBuffer} */
export function writePly(d) {
  const props = ["x", "y", "z", "nx", "ny", "nz", "f_dc_0", "f_dc_1", "f_dc_2", "f_rest_0", "f_rest_1", "f_rest_2", "opacity", "scale_0", "scale_1", "scale_2", "rot_0", "rot_1", "rot_2", "rot_3"];
  const head = `ply\nformat binary_little_endian 1.0\ncomment written by the stage bench (synthetic)\nelement vertex ${d.count}\n${props.map((p) => `property float ${p}`).join("\n")}\nend_header\n`;
  const hb = new TextEncoder().encode(head);
  const stride = props.length * 4;
  const buf = new ArrayBuffer(hb.length + d.count * stride);
  new Uint8Array(buf).set(hb);
  const dv = new DataView(buf, hb.length);
  for (let i = 0; i < d.count; i++) {
    const v = [d.pos[i * 3], d.pos[i * 3 + 1], d.pos[i * 3 + 2], 0, 0, 1,
      (d.color[i * 4] / 255 - 0.5) / SH_C0, (d.color[i * 4 + 1] / 255 - 0.5) / SH_C0, (d.color[i * 4 + 2] / 255 - 0.5) / SH_C0, 0, 0, 0,
      logit(d.color[i * 4 + 3] / 255), Math.log(d.scale[i * 3]), Math.log(d.scale[i * 3 + 1]), Math.log(d.scale[i * 3 + 2]),
      d.rot[i * 4], d.rot[i * 4 + 1], d.rot[i * 4 + 2], d.rot[i * 4 + 3]];
    v.forEach((x, k) => dv.setFloat32(i * stride + k * 4, x, true));
  }
  return buf;
}

/** write a .splat @param {ReturnType<typeof makeSplats>} d @returns {ArrayBuffer} */
export function writeSplat(d) {
  const buf = new ArrayBuffer(d.count * 32), f = new Float32Array(buf), u = new Uint8Array(buf);
  for (let i = 0; i < d.count; i++) {
    f.set(d.pos.subarray(i * 3, i * 3 + 3), i * 8);
    f.set(d.scale.subarray(i * 3, i * 3 + 3), i * 8 + 3);
    u.set(d.color.subarray(i * 4, i * 4 + 4), i * 32 + 24);
    for (let k = 0; k < 4; k++) u[i * 32 + 28 + k] = byte(d.rot[i * 4 + k] * 128 + 128);
  }
  return buf;
}

/** fetch and read a capture by its extension (.ply or .splat), capped (nearest to the centre kept)
 *  @param {string} url @param {{ cap?: number }} [o] */
export async function loadSplats(url, o = {}) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`[splat] ${url}: ${r.status}`);
  const buf = await r.arrayBuffer();
  const d = /\.ply(\?|$)/i.test(url) ? parsePly(buf) : parseSplat(buf);
  return o.cap ? capNearest(d, o.cap) : d;
}

/** compare two sets (the round trip): the largest differences per field @param {ReturnType<typeof makeSplats>} a @param {ReturnType<typeof makeSplats>} b */
export function diffSplats(a, b) {
  const n = Math.min(a.count, b.count);
  let pos = 0, scale = 0, rot = 0, color = 0;
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 3; k++) { pos = Math.max(pos, Math.abs(a.pos[i * 3 + k] - b.pos[i * 3 + k])); scale = Math.max(scale, Math.abs(a.scale[i * 3 + k] - b.scale[i * 3 + k]) / Math.max(1e-6, a.scale[i * 3 + k])); }
    // q and -q are one rotation
    const dot = Math.abs(a.rot[i * 4] * b.rot[i * 4] + a.rot[i * 4 + 1] * b.rot[i * 4 + 1] + a.rot[i * 4 + 2] * b.rot[i * 4 + 2] + a.rot[i * 4 + 3] * b.rot[i * 4 + 3]);
    rot = Math.max(rot, 1 - Math.min(1, dot));
    for (let k = 0; k < 4; k++) color = Math.max(color, Math.abs(a.color[i * 4 + k] - b.color[i * 4 + k]));
  }
  return { count: [a.count, b.count], pos, scale, rot, color };
}
