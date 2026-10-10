/** Tiny, dependency-free helpers shared across the app. */

export type ClassValue = string | number | bigint | boolean | null | undefined | ClassValue[];

/** Joins class names, dropping falsy values. (No tailwind-merge: composition is explicit in this codebase.) */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const walk = (value: ClassValue) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    out.push(String(value));
  };
  inputs.forEach(walk);
  return out.join(" ");
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Deterministic pseudo-random in [0,1) from an integer seed — used by procedural SVG art. */
export function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export const padIndex = (value: number): string => String(value).padStart(2, "0");

/** Reads a numeric env var with a fallback, ignoring garbage values. */
export function envNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
