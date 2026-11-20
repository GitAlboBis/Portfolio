// @ts-check
/**
 * gpu.js — the stage's own adapter and device (spec "Cuts and glass" §1: the stage imports nothing from water/).
 * Copied from water/engine/gpu.js (describeAdapter, requestWaterAdapter, createWaterDevice), trimmed to what the
 * stage uses. Capability contract: an adapter that is missing or is a fallback (software) adapter counts as
 * "no WebGPU"; `timestamp-query` is the only optional feature asked for; every other limit is the core default.
 */

/**
 * @typedef {object} AdapterDescription
 * @property {string} vendor
 * @property {string} architecture
 * @property {string} device
 * @property {string} description
 * @property {boolean} isFallbackAdapter
 * @property {boolean} timestampQuery
 */

/** @param {GPUAdapter} adapter @returns {AdapterDescription} */
export function describeAdapter(adapter) {
  /** @type {any} */ const a = adapter;
  /** @type {any} */ const inf = a.info || {};
  return {
    vendor: String(inf.vendor || ""),
    architecture: String(inf.architecture || ""),
    device: String(inf.device || ""),
    description: String(inf.description || ""),
    isFallbackAdapter: !!(inf.isFallbackAdapter || a.isFallbackAdapter),
    timestampQuery: adapter.features.has("timestamp-query"),
  };
}

/** The options the head script uses for its early request (window.__rvGpu), so both ask the same thing.
 *  Chrome on Windows ignores powerPreference and logs a warning when it is passed (crbug.com/369219127). */
export function adapterOptions() {
  /** @type {any} */ const nav = navigator;
  const windows = /Windows/i.test((nav.userAgentData && nav.userAgentData.platform) || nav.userAgent || "");
  return /** @type {GPURequestAdapterOptions} */ (windows ? {} : { powerPreference: "high-performance" });
}

/**
 * Ask for the adapter. Resolves { adapter: null, reason } for every "no WebGPU" outcome instead of throwing.
 * @returns {Promise<{ adapter: GPUAdapter | null, reason: string | null }>}
 */
export async function requestAdapter() {
  const gpu = typeof navigator !== "undefined" ? navigator.gpu : undefined;
  if (!gpu) return { adapter: null, reason: "no-webgpu" };
  let adapter = null;
  try { adapter = await gpu.requestAdapter(adapterOptions()); }
  catch (e) { return { adapter: null, reason: "request-adapter-threw: " + (e instanceof Error ? e.message : String(e)) }; }
  if (!adapter) return { adapter: null, reason: "no-adapter" };
  if (describeAdapter(adapter).isFallbackAdapter) return { adapter: null, reason: "fallback-adapter" };
  return { adapter, reason: null };
}

/**
 * (lane m-glass, plan 70 phase 4) THE CANVAS: its format and its tone mapping, decided once per device (stage.js
 * prepareStage; every pipeline that draws into the canvas is compiled for this format).
 *
 * HDR: where the screen shows more than paper white (the media query `dynamic-range: high`) and the browser can show
 * it (a float16 canvas configured with `toneMapping: { mode: "extended" }` reads back "extended"), the canvas is
 * rgba16float with extended tone mapping: the stage's lights rise above paper white instead of burning to a flat white
 * (values above 1 are brighter than the page's white; up to 1 every value is today's). Everywhere else (and with
 * `?hdr=0`) the canvas is the preferred 8-bit format with standard tone mapping: exactly today's image and cost.
 * `?hdr=1` forces the float16 canvas on any screen (a probe's switch: on a standard screen it draws today's image).
 * A browser that cannot answer (no getConfiguration, a throw) gets the 8-bit canvas, silently.
 * @param {GPUDevice} device
 * @returns {{ format: GPUTextureFormat, hdr: boolean, why: string }}
 */
export function canvasSetup(device) {
  /** @type {GPUTextureFormat} */ const sdr = navigator.gpu.getPreferredCanvasFormat();
  const q = typeof location !== "undefined" ? location.search : "";
  if (/[?&]hdr=0/.test(q)) return { format: sdr, hdr: false, why: "hdr=0" };
  const forced = /[?&]hdr=1/.test(q);
  let screen = false;
  try { screen = typeof matchMedia === "function" && matchMedia("(dynamic-range: high)").matches; } catch { screen = false; }
  if (!screen && !forced) return { format: sdr, hdr: false, why: "screen" };
  try {
    if (typeof OffscreenCanvas === "undefined") return { format: sdr, hdr: false, why: "no-offscreen" };
    const ctx = /** @type {any} */ (new OffscreenCanvas(1, 1).getContext("webgpu"));
    if (!ctx || typeof ctx.getConfiguration !== "function") return { format: sdr, hdr: false, why: "no-getConfiguration" };
    ctx.configure({ device, format: "rgba16float", alphaMode: "premultiplied", toneMapping: { mode: "extended" } });
    const c = ctx.getConfiguration();
    const ok = !!(c && c.toneMapping && c.toneMapping.mode === "extended");
    try { ctx.unconfigure(); } catch { /* gone */ }
    return ok ? { format: "rgba16float", hdr: true, why: forced && !screen ? "forced" : "screen" } : { format: sdr, hdr: false, why: "no-extended" };
  } catch (e) {
    return { format: sdr, hdr: false, why: "threw" };
  }
}

/**
 * The device, with `timestamp-query` when the adapter offers it (the instrument line's GPU ms).
 * @param {GPUAdapter} adapter @param {{ label?: string }} [opts]
 * @returns {Promise<{ device: GPUDevice, timestamps: boolean }>}
 */
export async function createDevice(adapter, opts = {}) {
  const timestamps = adapter.features.has("timestamp-query");
  /** @type {GPUFeatureName[]} */ const requiredFeatures = timestamps ? ["timestamp-query"] : [];
  const device = await adapter.requestDevice({ label: opts.label ?? "stage", requiredFeatures });
  return { device, timestamps };
}
