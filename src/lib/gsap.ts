"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/** Register GSAP plugins exactly once per client bundle. */
export function ensureGsap(): void {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: EASE_OUT, duration: 0.9 });
  registered = true;
}

export const EASE_OUT = "power3.out";
export const EASE_IN_OUT = "power2.inOut";
export const EASE_EXPO = "expo.out";

export { gsap, ScrollTrigger };
