// @ts-check
/**
 * tier.js — the stage's tier rule (spec "Cuts and glass" §1), copied from water/engine/tier.js chooseTier so the stage
 * imports nothing from water/. The counts, DPR scales and budgets of each tier live in stage.js (TIER_COUNTS, TIER_DPR,
 * TIER_BUDGET_MS) and glass/glass.js (GLASS_TIER).
 *
 * - C: deviceMemory <= 4.
 * - B: touch, a viewport under 768 px, or an integrated / mobile vendor (intel, qualcomm, arm, imagination).
 * - A: otherwise. ?tier=A|B|C forces one.
 */

/** @typedef {"A" | "B" | "C"} TierName */

const LOW_VENDORS = ["intel", "qualcomm", "arm", "imagination"];

/**
 * @param {{ touch?: boolean, width?: number, vendor?: string, deviceMemory?: number, forced?: string | null }} o
 * @returns {TierName}
 */
export function chooseTier(o) {
  const f = (o.forced || "").toUpperCase();
  if (f === "A" || f === "B" || f === "C") return f;
  if (typeof o.deviceMemory === "number" && o.deviceMemory <= 4) return "C";
  const vendor = (o.vendor || "").toLowerCase();
  if (o.touch || (typeof o.width === "number" && o.width < 768) || LOW_VENDORS.some((v) => vendor.includes(v))) return "B";
  return "A";
}
