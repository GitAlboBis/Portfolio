// @ts-check
/**
 * character.js — Obla's character as a lit body on the stage (spec "Storia" §5), drawn through the
 * stage's body extension point. Read-only truth, from the product's own files
 * (Obla/apps/obla/src/character/shape.ts, states.ts, engine.ts, style.css):
 *
 *  - outline: a superellipse pillow, x = rx sgn(cos a)|cos a|^e, y = ry sgn(sin a)|sin a|^e, e = 2/2.7,
 *    rx = 1.14 R, ry = 0.88 R, centred 0.04 R above the middle; its lower half ends in a ghost hem
 *    amp (0.5 - 0.5 cos(2 crests a + phase)) (1 - damping |cos a|) min(1, 4 sin a), crests 4,
 *    amp 0.07, damping 0.6, added to y (y down)
 *  - eyes: vertical ovals 0.16 R x 0.34 R on the face's dome: eye yaw = side x 0.37 + look yaw,
 *    eye pitch = -0.12 + look pitch, centre (sin(yaw) cos(pitch) rx, -sin(pitch) ry), squeezed by
 *    cos(yaw); "wide" is 1.12 x; "happy" an arc over the eye, "closed" an arc under it
 *  - colours: body #E4ECEF (top) to #AEBCC6 (bottom), eyes #16202B, the state's colour as a tint
 *    from the hem up (0.75 x tint at the bottom) and here as its rim
 *
 * The body is drawn as a soft lit dome: the product's gradient and highlight, a light from the upper
 * left, the state's colour along its edge. It sits on the page plane in the obla box; the light of
 * the particles (obla.js) is drawn over it.
 */

export const EYE = Object.freeze({ w: 0.16, h: 0.34, sp: 0.37, p: -0.12 });
export const HEM = Object.freeze({ crests: 4, amp: 0.07, damping: 0.6 });
export const BODY = Object.freeze({ rx: 1.14, ry: 0.88, lift: 0.04 });
export const COLORS = Object.freeze({
  top: "#E4ECEF", bottom: "#AEBCC6", ink: "#16202B",
  idle: "#D3DCE3", listening: "#4C9BE8", thinking: "#8E7CC3", working: "#2A9D8F",
  approval: "#E8B04A", finished: "#59B377", sleeping: "#8A96A8",
});

/** "#rrggbb" -> [r, g, b] 0..1 (sRGB-encoded) @param {string} h */
export const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

/** Is the local point (in R units, around the body's centre) inside the plain pillow? @param {number} x @param {number} y */
export function insidePillow(x, y) {
  return Math.pow(Math.abs(x) / BODY.rx, 2.7) + Math.pow(Math.abs(y) / BODY.ry, 2.7) < 1;
}

const WGSL = /* wgsl */ `
struct Body {
  c   : vec4f,   // centre (document px) x, y, z; R (css px)
  m   : vec4f,   // tilt (rad), scale x, scale y, opacity
  e   : vec4f,   // look yaw, look pitch, eye scale, eye open
  s   : vec4f,   // eye wideness (1 .. 1.12), happy, closed, hem amplitude
  h   : vec4f,   // hem phase, tint, _, _
  col : vec4f,   // the state colour (sRGB-encoded)
};
@group(1) @binding(0) var<uniform> b : Body;

struct VO { @builtin(position) pos : vec4f, @location(0) q : vec2f };

const SPAN : f32 = 1.75;

@vertex fn vs(@builtin(vertex_index) vi : u32) -> VO {
  let c = vec2f(f32(vi & 1u), f32(vi >> 1u)) * 2.0 - 1.0;
  var o : VO;
  o.q = c * SPAN;
  o.pos = stageProject(vec3f(b.c.xy + o.q * b.c.w, b.c.z));
  return o;
}

// the pillow's field: below 1 inside, the hem added to the lower half
fn field(p : vec2f, grow : f32) -> f32 {
  let rx = 1.14 + grow;
  let ry = 0.88 + grow;
  var y = p.y;
  if (y > 0.0) {
    let ca = clamp(sign(p.x) * pow(abs(p.x) / rx, 1.35), -1.0, 1.0);
    let a = acos(ca);
    let sa = sin(a);
    let scallop = 0.5 - 0.5 * cos(8.0 * a + b.h.x);
    let env = (1.0 - 0.6 * abs(ca)) * min(1.0, 4.0 * sa);
    y = max(y - b.s.w * scallop * env, 0.0);
  }
  return pow(abs(p.x) / rx, 2.7) + pow(abs(y) / ry, 2.7);
}

fn cover(f : f32) -> f32 {
  let w = max(fwidth(f), 1e-4);
  return clamp(0.5 - (f - 1.0) / w, 0.0, 1.0);
}

// an arc stroke from angle a0 to a1 (canvas angles, y down), radius r, width lw: signed distance
fn arcD(q : vec2f, r : f32, a0 : f32, a1 : f32, lw : f32) -> f32 {
  var a = atan2(q.y, q.x);
  if (a < 0.0) { a = a + 6.2831853; }
  if (a >= a0 && a <= a1) { return abs(length(q) - r) - lw * 0.5; }
  let p0 = vec2f(cos(a0), sin(a0)) * r;
  let p1 = vec2f(cos(a1), sin(a1)) * r;
  return min(length(q - p0), length(q - p1)) - lw * 0.5;
}

fn eye(p : vec2f, side : f32, aa : f32) -> f32 {
  let yaw = side * 0.37 + b.e.x;
  let pit = -0.12 + b.e.y;
  let cp = cos(pit);
  if (cos(yaw) * cp <= 0.04) { return 0.0; }
  let ctr = vec2f(sin(yaw) * cp * 1.14, -sin(pit) * 0.88);
  var d = p - ctr;
  d.x = d.x / max(0.2, cos(yaw));
  let w = 0.16 * b.e.z;
  let h = 0.34 * b.e.z;
  let arcs = clamp(b.s.y + b.s.z, 0.0, 1.0);
  // the oval: wide or not, open or blinking, and it shuts as an arc takes its place
  let k = b.s.x;
  let ab = vec2f(w * 0.5 * k, max(h * 0.5 * k * b.e.w * (1.0 - 0.92 * arcs), w * 0.15));
  let oval = (length(d / ab) - 1.0) * min(ab.x, ab.y);
  let happy = arcD(d - vec2f(0.0, h * 0.15), w * 0.7, 3.4557519, 5.9690260, w * 0.45);
  let closed = arcD(d - vec2f(0.0, -h * 0.05), w * 0.7, 0.4712389, 2.6703538, w * 0.35);
  let cO = clamp(0.5 - oval / aa, 0.0, 1.0) * (1.0 - smoothstep(0.55, 0.95, arcs));
  let cH = clamp(0.5 - happy / aa, 0.0, 1.0) * b.s.y;
  let cC = clamp(0.5 - closed / aa, 0.0, 1.0) * b.s.z;
  return clamp(cO + cH + cC, 0.0, 1.0);
}

@fragment fn fs(i : VO) -> @location(0) vec4f {
  // into the body's frame: untilt, unscale (the hem and the eyes live in R units, y down)
  let ct = cos(-b.m.x);
  let st = sin(-b.m.x);
  var p = vec2f(ct * i.q.x - st * i.q.y, st * i.q.x + ct * i.q.y);
  p = p / vec2f(b.m.y, b.m.z);
  let f = field(p, 0.0);
  let body = cover(f);
  let rimF = field(p, 0.045);
  let rim = cover(rimF) * (1.0 - body);
  let aa = max(fwidth(p.x), 1e-4) * 0.9;
  if (body + rim <= 0.0) { discard; }

  // the product's body: a top-to-bottom gradient, the state's tint rising from the hem, a highlight
  let top = vec3f(0.894, 0.925, 0.937);
  let bot = vec3f(0.682, 0.737, 0.776);
  var col = mix(top, bot, clamp((p.y + 0.88) / (0.88 * 2.1), 0.0, 1.0));
  let tintA = 0.75 * b.h.y * clamp((p.y + 0.4 * 0.88) / (1.5 * 0.88), 0.0, 1.0);
  col = mix(col, b.col.rgb, tintA);
  let hl = 1.0 - smoothstep(0.0, 0.5, length(p - vec2f(-0.3 * 1.14, -0.5 * 0.88)));
  col = mix(col, vec3f(1.0), 0.45 * hl);

  // the dome: a soft light from the upper left and the front, the edge turning away from it
  let rr = pow(max(f, 0.0), 1.0 / 2.7);
  let nz = sqrt(max(1.0 - rr * rr, 0.0));
  let n = normalize(vec3f(p.x / 1.14 * 0.85, p.y / 0.88 * 0.85, nz + 0.2));
  let L = normalize(vec3f(-0.45, -0.62, 0.8));
  let diff = clamp(dot(n, L), 0.0, 1.0);
  col = col * (0.74 + 0.32 * diff);
  // the state's light along the inside of the edge
  col = mix(col, b.col.rgb, smoothstep(0.8, 1.0, rr) * (0.1 + 0.3 * b.h.y));

  // the eyes
  let ink = vec3f(0.086, 0.125, 0.169);
  let ey = max(eye(p, -1.0, aa), eye(p, 1.0, aa)) * body;
  col = mix(col, ink, ey);

  // the rim: a band of the state's colour just outside the outline
  let outc = mix(col, b.col.rgb, rim / max(body + rim, 1e-4));
  // cut by the night band like the particles (the morning band rises over it). Without a band the night is off
  // screen and so is the character: drawn whole there, it showed as a pale ghost on the morning paper (INTEGRATE)
  let nk = stageNight(i.pos.xy);
  let a = clamp(body + rim, 0.0, 1.0) * b.m.w * nk * stageKeep(i.pos.xy);
  return vec4f(outc * a, a);
}
`;

/**
 * The body module for a formation (stage.js extension point). params(ctx) returns the uniform values.
 * @param {(ctx: any) => { cx: number, cy: number, z: number, R: number, tilt: number, sx: number, sy: number, opacity: number,
 *   yaw: number, pitch: number, es: number, open: number, wide: number, happy: number, closed: number, hem: number,
 *   phase: number, tint: number, col: number[] } | null} params
 */
export function characterBody(params) {
  return {
    layer: "under",
    /** @param {any} api */
    async init(api) {
      const { device, format, frameLayout, frameWGSL, blend } = api;
      const ubuf = device.createBuffer({ label: "obla.body", size: 6 * 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
      const layout = device.createBindGroupLayout({ label: "obla.body", entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} }] });
      const group = device.createBindGroup({ layout, entries: [{ binding: 0, resource: { buffer: ubuf } }] });
      const mod = device.createShaderModule({ label: "obla.body", code: frameWGSL + WGSL });
      const info = await mod.getCompilationInfo();
      const errs = info.messages.filter((/** @type {any} */ m) => m.type === "error");
      if (errs.length) throw new Error("[obla] WGSL " + errs.map((/** @type {any} */ m) => `${m.lineNum}:${m.linePos} ${m.message}`).join("; "));
      const pipe = await device.createRenderPipelineAsync({
        label: "obla.body", layout: device.createPipelineLayout({ bindGroupLayouts: [frameLayout, layout] }),
        vertex: { module: mod, entryPoint: "vs" },
        fragment: { module: mod, entryPoint: "fs", targets: [{ format, blend }] },
        primitive: { topology: "triangle-strip" },
      });
      const U = new Float32Array(24);
      return {
        /** @param {GPURenderPassEncoder} pass @param {any} ctx */
        encode(pass, ctx) {
          const v = params(ctx);
          if (!v || v.opacity <= 0.002) return;
          U.set([v.cx, v.cy, v.z, v.R, v.tilt, v.sx, v.sy, v.opacity, v.yaw, v.pitch, v.es, v.open,
            v.wide, v.happy, v.closed, v.hem, v.phase, v.tint, 0, 0, v.col[0], v.col[1], v.col[2], 1]);
          device.queue.writeBuffer(ubuf, 0, U);
          pass.setPipeline(pipe); pass.setBindGroup(1, group); pass.draw(4);
        },
        destroy() { ubuf.destroy(); },
      };
    },
  };
}
