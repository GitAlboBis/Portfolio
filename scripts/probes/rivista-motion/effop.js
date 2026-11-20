/* effop.js · effective opacity (lane P, rivista motion canon §2 P3).
 *
 * Computed opacity is not inherited: an element at opacity 1 inside a wrapper at 0.4 is seen at 0.4.
 * effop(el) = the product of `opacity` over el and every ancestor up to <html>, and 0 when el or an
 * ancestor is display:none / visibility:hidden (visibility is inherited, so el's own value suffices).
 *
 * Two ways to use it:
 *   1. In the browser (Playwright): `await page.addInitScript({ path: EFFOP })` (or page.evaluate of the
 *      file text), then `page.evaluate(() => __effop(".btn"))`. It defines window.__effop and
 *      window.__effopAll. The file has no imports so it can be injected as is.
 *   2. In Node: `createRequire(import.meta.url)("./effop.js")` returns { effop, effopAll, SOURCE }, where
 *      SOURCE is this file's browser half as a string, for page.evaluate / addInitScript({ content }).
 */
(function (root) {
  /** @param {Element|string} el @returns {number} */
  function effop(el) {
    if (typeof el === "string") el = document.querySelector(el);
    if (!el || !el.isConnected) return 0;
    var cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.visibility === "collapse") return 0;
    var o = 1;
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      var s = n === el ? cs : getComputedStyle(n);
      if (s.display === "none") return 0;
      o *= parseFloat(s.opacity);
      if (o === 0) return 0;
    }
    return o;
  }

  /** Every match: { i, eff, own, inView, clip, text } (own = the element's own computed opacity). */
  function effopAll(sel) {
    var out = [];
    var list = document.querySelectorAll(sel);
    for (var i = 0; i < list.length; i++) {
      var el = list[i], r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      out.push({
        i: i,
        eff: +effop(el).toFixed(4),
        own: +parseFloat(cs.opacity).toFixed(4),
        inView: r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
        clip: cs.clipPath,
        text: (el.textContent || "").trim().slice(0, 40),
      });
    }
    return out;
  }

  if (typeof window !== "undefined" && root === window) {
    window.__effop = effop;
    window.__effopAll = effopAll;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      effop: effop,
      effopAll: effopAll,
      SOURCE: "(function(){var effop=" + effop.toString() + ";var effopAll=" + effopAll.toString() +
        ";window.__effop=effop;window.__effopAll=effopAll;})();",
    };
  }
})(typeof window !== "undefined" ? window : globalThis);
