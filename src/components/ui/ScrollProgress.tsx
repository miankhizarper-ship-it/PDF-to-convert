"use client";

import { useEffect, useRef } from "react";
import { onScrollTick, scrollState } from "@/lib/scroll-bus";

/** Top scroll-progress rail. Driven by the global rAF bus — never re-renders. */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    return onScrollTick(() => {
      if (barRef.current) barRef.current.style.transform = `scaleX(${scrollState.progress.toFixed(4)})`;
      if (valueRef.current) {
        const next = `${Math.round(scrollState.progress * 100)}`.padStart(2, "0");
        if (valueRef.current.textContent !== next) valueRef.current.textContent = next;
      }
    });
  }, []);

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[130] h-[2px] bg-edge/40">
        <div ref={barRef} className="loader-bar h-full w-full origin-left scale-x-0" />
      </div>
      <div
        aria-hidden
        className="hud pointer-events-none fixed right-4 bottom-4 z-[130] hidden items-center gap-2 border border-edge/70 bg-void/70 px-2.5 py-1.5 backdrop-blur-sm lg:flex"
      >
        <span className="text-acid">SCROLL</span>
        <span ref={valueRef} className="text-frost">
          00
        </span>
        <span className="text-ash">%</span>
      </div>
    </>
  );
}
