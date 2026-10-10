"use client";

import { useEffect, useRef } from "react";
import { ensureGsap, gsap } from "@/lib/gsap";
import { useCalmMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type OrbitDividerProps = {
  className?: string;
  /** Accent used for the drawn strokes. */
  accent?: "acid" | "volt" | "iris";
  label?: string;
};

const strokeFor = {
  acid: "var(--color-acid)",
  volt: "var(--color-volt)",
  iris: "var(--color-iris)",
} as const;

/**
 * Section divider: orbital ellipses + a horizon rule that draw themselves as
 * the user scrolls (`pathLength={1}` normalises every stroke, so there is no
 * measurement pass). Reduced motion renders the finished state.
 */
export function OrbitDivider({ className, accent = "acid", label }: OrbitDividerProps) {
  const ref = useRef<SVGSVGElement>(null);
  const calm = useCalmMotion();
  const color = strokeFor[accent];

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;

    const paths = gsap.utils.toArray<SVGGeometryElement>("[data-draw]", svg);

    if (calm) {
      gsap.set(paths, { strokeDashoffset: 0, opacity: 1 });
      return;
    }

    ensureGsap();
    const context = gsap.context(() => {
      gsap.set(paths, { strokeDashoffset: 1, opacity: 0.85 });
      gsap.to(paths, {
        strokeDashoffset: 0,
        duration: 1,
        ease: "none",
        stagger: 0.12,
        scrollTrigger: { trigger: svg, start: "top 92%", end: "bottom 55%", scrub: 0.7 },
      });
      gsap.fromTo(
        gsap.utils.toArray<SVGElement>("[data-node]", svg),
        { autoAlpha: 0, scale: 0.4, transformOrigin: "50% 50%" },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "back.out(2)",
          scrollTrigger: { trigger: svg, start: "top 80%", once: true },
        },
      );
    }, svg);

    return () => context.revert();
  }, [calm]);

  return (
    <div className={cn("relative", className)}>
      <svg
        ref={ref}
        viewBox="0 0 1200 180"
        preserveAspectRatio="none"
        className="h-[120px] w-full sm:h-[160px]"
        fill="none"
        aria-hidden
      >
        <line x1="0" y1="90" x2="1200" y2="90" stroke={color} strokeOpacity="0.18" strokeWidth="1" data-draw pathLength={1} strokeDasharray={1} />
        <ellipse cx="600" cy="90" rx="540" ry="58" stroke={color} strokeOpacity="0.4" strokeWidth="1" data-draw pathLength={1} strokeDasharray={1} />
        <ellipse cx="600" cy="90" rx="330" ry="34" stroke={color} strokeOpacity="0.55" strokeWidth="1" data-draw pathLength={1} strokeDasharray={1} />
        <ellipse cx="600" cy="90" rx="150" ry="76" stroke="var(--color-iris)" strokeOpacity="0.45" strokeWidth="1" data-draw pathLength={1} strokeDasharray={1} />
        <path d="M120 90 L240 90 L280 52 L400 52" stroke="var(--color-volt)" strokeOpacity="0.5" strokeWidth="1" data-draw pathLength={1} strokeDasharray={1} />
        <path d="M1080 90 L960 90 L920 128 L800 128" stroke="var(--color-volt)" strokeOpacity="0.5" strokeWidth="1" data-draw pathLength={1} strokeDasharray={1} />
        <circle cx="600" cy="90" r="4" fill={color} data-node />
        <circle cx="400" cy="52" r="3" fill="var(--color-volt)" data-node />
        <circle cx="800" cy="128" r="3" fill="var(--color-volt)" data-node />
        <circle cx="60" cy="90" r="2.5" fill="var(--color-iris)" data-node />
        <circle cx="1140" cy="90" r="2.5" fill="var(--color-iris)" data-node />
      </svg>

      {label ? (
        <span className="hud absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-void/80 px-4 py-1">
          {label}
        </span>
      ) : null}
    </div>
  );
}
