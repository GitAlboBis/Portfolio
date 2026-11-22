// @ts-check
/**
 * boot.js — the stage starts early (lane BOOT, chain 9). The head script (parts/head.html) imports this module and
 * calls boot() on every page that will have a stage (not with reduced motion, ?stage=0, ?gl=0, without WebGPU, on the
 * 404, or under a ?fx= list without "stage"), as soon as it runs: while the CDN scripts and the fonts load, and while
 * a cut's sheet is still up. It:
 *   1. takes the adapter the head already asked for (window.__rvGpu), else asks for one; a software (fallback)
 *      adapter is "no WebGPU";
 *   2. asks for the stage's own device;
 *   3. starts every pipeline at once (stage.js prepareStage: the swarm's two, then the plates', all async and in
 *      parallel; nothing here waits for them);
 *   4. once the DOM is parsed, fetches the page's scene modules and the type rasteriser, so the host's own imports of
 *      the same URLs are answered from the module map.
 * The host (fx-stage.js) takes the answer once: window.__rvStage.p resolves { device, info, kit, early } (kit: the
 * pipelines' promises; early.error: an uncaptured GPU error before the host took the device), { device: null, info }
 * for a software adapter, or null when there is no adapter. Everything that needs the page (measuring, the scenes'
 * frames, the first frame) still waits for fx:ready and stillness in the host.
 * Nothing here touches the page's layout, writes to the console or throws.
 */
import { describeAdapter, requestAdapter, createDevice } from "./gpu.js";
import { prepareStage } from "./stage.js";

const NAME = /^[a-z0-9-]+$/;

/** fetch the page's scene modules (what fx-stage.js sceneEls() will import), once the DOM is parsed */
function prefetchScenes() {
  const go = () => {
    /** @type {Set<string>} */ const names = new Set();
    for (const el of document.querySelectorAll("[data-stage]")) {
      const n = (el.getAttribute("data-stage") || "").trim();
      if (NAME.test(n)) names.add(n);
    }
    if (document.querySelector("main[data-case]")) names.add("mist");
    // (wave 7, STAGE) a long page of many scenes (the home: eight) fetches only its first three here: the host imports
    // the ones near the reader itself and the rest after the first frame (fx-stage.js loadScenes, loadLazy)
    let i = 0;
    for (const n of names) { if (names.size > 4 && i++ >= 3) break; import(new URL(`./scenes/${n}.js`, import.meta.url).href).catch(() => {}); }
    import(new URL("./scenes/lib/raster.js", import.meta.url).href).catch(() => {});
    // (k-fix3d) and the tiers, which the host imports the moment it takes the device (fetched then, it was a round
    // trip to the server between fx:ready and the first frame)
    import(new URL("./tier.js", import.meta.url).href).catch(() => {});
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go, { once: true });
  else go();
}

/** @returns {Promise<any>} */
export async function boot() {
  try {
    /** @type {any} */ const w = window;
    // (wave 7, STAGE) the cosmos's web (CPU work in slices, no device needed) starts now, in the adapter's and the
    // device's wait, so it is made before the field's pipelines are (field.js webEarly); the same module stage.js loads
    import("./field/field.js").then((m) => { if (m && typeof m.webEarly === "function") m.webEarly(); }).catch(() => {});
    /** @type {GPUAdapter | null} */ let adapter = null;
    const k = w.__rvGpu;
    if (k && k.p && !k.used) { k.used = true; try { adapter = await k.p; } catch { adapter = null; } }
    if (!adapter) { const r = await requestAdapter(); adapter = r.adapter; }
    if (!adapter) return null;
    const info = describeAdapter(adapter);
    if (info.isFallbackAdapter) return { device: null, info, kit: null };
    prefetchScenes();
    const { device } = await createDevice(adapter, { label: "stage" });
    // until the host takes the device: an error no scope caught is kept quiet and remembered
    const early = { error: "" };
    device.addEventListener("uncapturederror", (/** @type {any} */ e) => {
      if (e && e.preventDefault) e.preventDefault();
      if (!early.error) early.error = (e && e.error && e.error.message) || "uncaptured GPU error";
    });
    const kit = prepareStage({ device });
    return { device, info, kit, early, t: performance.now() };
  } catch (e) {
    return null;
  }
}
