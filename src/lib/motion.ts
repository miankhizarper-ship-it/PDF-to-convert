"use client";

import { useEffect, useState } from "react";
import { useUiStore } from "./store";

/** True when the OS/browser asks for reduced motion. Reactive to changes. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/** Reduced motion requested by the OS *or* calm mode toggled by the user. */
export function useCalmMotion(): boolean {
  const prefersReduced = usePrefersReducedMotion();
  const calm = useUiStore((state) => state.calm);
  return prefersReduced || calm;
}

/** Mirrors the calm flag onto <html> so CSS can neutralise animation too. */
export function useCalmAttribute(): void {
  const calm = useUiStore((state) => state.calm);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.calm = String(calm || prefersReduced);
  }, [calm, prefersReduced]);
}

/** True for devices with a precise pointer (mouse/trackpad) — gates cursor + magnetism. */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(pointer: fine)");
    setFine(query.matches);
    const onChange = (event: MediaQueryListEvent) => setFine(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return fine;
}
