"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/data";
import { ensureGsap, gsap } from "@/lib/gsap";
import { useCalmMotion } from "@/lib/motion";
import { useUiStore } from "@/lib/store";

const SESSION_KEY = "orbital-cyber:booted";

/**
 * Boot sequence: an orbital loader that counts to 100, then splits apart to
 * reveal the hero. Runs once per browser session — later visits fade straight
 * through so navigation never feels gated.
 */
export function Loader() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const calm = useCalmMotion();
  const setBooted = useUiStore((state) => state.setBooted);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const alreadyBooted = typeof sessionStorage !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1";

    // Calm mode / returning visit: skip the show entirely.
    if (calm || alreadyBooted) {
      setProgress(100);
      setDone(true);
      setBooted(true);
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(SESSION_KEY, "1");
      gsap.set(overlay, { autoAlpha: 0, visibility: "hidden" });
      return;
    }

    ensureGsap();

    const target = { value: 0 };
    const duration = 1.7;

    const counter = gsap.to(target, {
      value: 100,
      duration,
      ease: "power2.inOut",
      onUpdate: () => {
        const next = Math.round(target.value);
        setProgress(next);
        if (counterRef.current) counterRef.current.textContent = String(next).padStart(3, "0");
        if (barRef.current) barRef.current.style.transform = `scaleX(${next / 100})`;
      },
    });

    const exit = gsap.timeline({
      delay: duration + 0.18,
      onComplete: () => {
        setDone(true);
        setBooted(true);
        if (typeof sessionStorage !== "undefined") sessionStorage.setItem(SESSION_KEY, "1");
      },
    });

    exit
      .to("[data-loader-line]", { scaleX: 0, duration: 0.4, ease: "power2.in" }, 0)
      .to("[data-loader-content]", { autoAlpha: 0, y: -14, duration: 0.35, ease: "power2.in" }, 0)
      .to("[data-loader-panel-top]", { yPercent: -101, duration: 0.72, ease: "expo.inOut" }, 0.22)
      .to("[data-loader-panel-bottom]", { yPercent: 101, duration: 0.72, ease: "expo.inOut" }, 0.22)
      .set(overlay, { autoAlpha: 0, visibility: "hidden" });

    // Safety: never trap the page if something above stalls.
    const failsafe = window.setTimeout(() => {
      setDone(true);
      setBooted(true);
      gsap.set(overlay, { autoAlpha: 0, visibility: "hidden" });
    }, 4200);

    return () => {
      window.clearTimeout(failsafe);
      counter.kill();
      exit.kill();
    };
  }, [calm, setBooted]);

  if (done) return null;

  return (
    <div
      ref={overlayRef}
      className="boot-overlay fixed inset-0 z-[200]"
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio"
    >
      <div data-loader-panel-top className="absolute inset-x-0 top-0 h-1/2 bg-void" />
      <div data-loader-panel-bottom className="absolute inset-x-0 bottom-0 h-1/2 bg-void" />

      <div
        data-loader-content
        className="relative z-10 flex h-full flex-col items-center justify-center gap-7 px-6"
      >
        <svg viewBox="0 0 120 120" className="h-24 w-24 animate-spin-slower" aria-hidden>
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-edge)" strokeWidth="1" />
          <ellipse cx="60" cy="60" rx="52" ry="20" fill="none" stroke="var(--color-acid)" strokeOpacity="0.65" strokeWidth="1" />
          <ellipse cx="60" cy="60" rx="20" ry="52" fill="none" stroke="var(--color-iris)" strokeOpacity="0.5" strokeWidth="1" />
          <circle cx="60" cy="60" r="5" fill="var(--color-volt)" />
          <circle cx="112" cy="60" r="2.5" fill="var(--color-acid)" />
        </svg>

        <div className="text-center">
          <p className="hud text-acid">{site.brand}</p>
          <p className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            INITIALISING ORBIT
          </p>
        </div>

        <div className="w-[min(340px,72vw)]">
          <div className="relative h-[2px] w-full overflow-hidden bg-edge">
            <div ref={barRef} className="loader-bar absolute inset-0 origin-left scale-x-0" />
          </div>
          <div className="hud mt-3 flex items-center justify-between">
            <span>BOOT SEQUENCE</span>
            <span className="text-frost">
              <span ref={counterRef}>000</span>
              <span className="text-ash">%</span>
            </span>
          </div>
        </div>

        <div className="flex w-[min(340px,72vw)] gap-1" aria-hidden>
          <span data-loader-line className="h-px flex-1 origin-left bg-acid/50" />
          <span data-loader-line className="h-px flex-1 origin-left bg-volt/40" />
          <span data-loader-line className="h-px flex-1 origin-left bg-iris/40" />
        </div>
      </div>

      <span className="sr-only">{progress}% loaded</span>

      {/* Without JavaScript the boot sequence can never finish — never trap the page. */}
      <noscript>
        <style>{`.boot-overlay{display:none!important}`}</style>
      </noscript>
    </div>
  );
}
