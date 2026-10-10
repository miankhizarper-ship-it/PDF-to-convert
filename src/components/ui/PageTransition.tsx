"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ensureGsap, gsap } from "@/lib/gsap";
import { useCalmMotion } from "@/lib/motion";

const PANELS = ["var(--color-acid)", "var(--color-void)", "var(--color-iris)"];

/**
 * Route transition: three panels drop over the viewport and exit downwards
 * whenever the pathname changes. Skipped on first paint, and entirely under
 * reduced motion / calm mode.
 */
export function PageTransition() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const calm = useCalmMotion();
  const isFirst = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const panels = gsap.utils.toArray<HTMLElement>("[data-wipe]", container);

    if (calm || isFirst.current) {
      isFirst.current = false;
      gsap.set(panels, { yPercent: -101 });
      return;
    }

    ensureGsap();

    const timeline = gsap
      .timeline({ onStart: () => container.setAttribute("aria-hidden", "true") })
      .set(container, { autoAlpha: 1 })
      .fromTo(
        panels,
        { yPercent: -101 },
        { yPercent: 0, duration: 0.44, ease: "power3.inOut", stagger: { each: 0.05, from: "start" } },
      )
      .to(panels, {
        yPercent: 101,
        duration: 0.52,
        ease: "power3.inOut",
        stagger: { each: 0.045, from: "end" },
        delay: 0.08,
      })
      .set(container, { autoAlpha: 0 });

    return () => {
      timeline.kill();
      // Never leave a panel covering the page if navigation happens mid-wipe.
      gsap.set(panels, { yPercent: -101 });
      gsap.set(container, { autoAlpha: 0 });
    };
  }, [pathname, calm]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[190] opacity-0"
    >
      <div className="flex h-full w-full">
        {PANELS.map((color, index) => (
          <div
            key={color + index}
            data-wipe
            className="h-full flex-1"
            style={{ backgroundColor: color, transform: "translateY(-101%)" }}
          />
        ))}
      </div>
    </div>
  );
}
