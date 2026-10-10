"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ensureGsap, gsap } from "@/lib/gsap";
import { useCalmMotion, useFinePointer } from "@/lib/motion";
import { cn } from "@/lib/utils";

type MagneticProps = {
  children: ReactNode;
  /** Pull strength — 0.35 is a subtle, premium feel. */
  strength?: number;
  className?: string;
};

/**
 * Magnetic hover: the child drifts toward the cursor and snaps back on leave.
 * Desktop-only (fine pointer) and fully disabled under reduced motion.
 */
export function Magnetic({ children, strength = 0.32, className }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const fine = useFinePointer();
  const calm = useCalmMotion();
  const enabled = fine && !calm;

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    ensureGsap();
    const xTo = gsap.quickTo(element, "x", { duration: 0.7, ease: "elastic.out(1, 0.4)" });
    const yTo = gsap.quickTo(element, "y", { duration: 0.7, ease: "elastic.out(1, 0.4)" });

    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const relX = event.clientX - (rect.left + rect.width / 2);
      const relY = event.clientY - (rect.top + rect.height / 2);
      xTo(relX * strength);
      yTo(relY * strength);
    };

    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerleave", onLeave);
    element.addEventListener("blur", onLeave);

    return () => {
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerleave", onLeave);
      element.removeEventListener("blur", onLeave);
      gsap.set(element, { x: 0, y: 0 });
    };
  }, [enabled, strength]);

  return (
    <span ref={ref} className={cn(className, "inline-block will-change-transform")}>
      {children}
    </span>
  );
}
