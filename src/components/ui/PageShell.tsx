"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ensureGsap, gsap } from "@/lib/gsap";
import { useCalmMotion } from "@/lib/motion";

/**
 * Per-route entrance applied by `app/template.tsx`. Deliberately subtle (fade +
 * 12px rise) so it never competes with the section reveals inside a page.
 */
export function PageShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const calm = useCalmMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || calm) {
      if (node) gsap.set(node, { clearProps: "all" });
      return;
    }

    ensureGsap();
    const tween = gsap.fromTo(
      node,
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: 0.55, ease: "power2.out", delay: 0.05 },
    );

    return () => {
      tween.kill();
      gsap.set(node, { clearProps: "all" });
    };
  }, [calm]);

  return <div ref={ref}>{children}</div>;
}
