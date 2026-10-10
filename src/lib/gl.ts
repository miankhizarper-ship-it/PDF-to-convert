/** Environment probes. Safe to import anywhere — every call guards on `window`. */

export type WebGlSupport = "webgl2" | "webgl" | "none";

export function detectWebGL(): WebGlSupport {
  if (typeof window === "undefined") return "none";
  try {
    const canvas = document.createElement("canvas");
    if (canvas.getContext("webgl2")) return "webgl2";
    if (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) return "webgl";
    return "none";
  } catch {
    return "none";
  }
}

/** Cheap heuristic for low-power devices: few cores or little memory. */
export function isLowPowerDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const cores = (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  return cores <= 4 || memory <= 4;
}

export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}
