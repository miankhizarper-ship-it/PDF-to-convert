"use client";

import { useEffect, useState } from "react";
import { hudLines } from "@/data";
import { cn } from "@/lib/utils";

/** Cycles the HUD status lines. Decorative — hidden from assistive tech. */
export function HudTicker({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % hudLines.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={cn("hud relative h-4 overflow-hidden text-[0.5625rem] text-ash", className)} aria-hidden>
      {hudLines.map((line, lineIndex) => (
        <span
          key={line}
          className={cn(
            "absolute inset-0 whitespace-nowrap transition-all duration-500",
            lineIndex === index ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
          )}
        >
          <span className="mr-2 text-volt">▸</span>
          {line}
        </span>
      ))}
    </div>
  );
}
