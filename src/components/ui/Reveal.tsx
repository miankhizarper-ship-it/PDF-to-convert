"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { EASE_OUT, ensureGsap, gsap } from "@/lib/gsap";
import { useCalmMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Distance in px travelled on the Y axis. */
  y?: number;
  x?: number;
  scale?: number;
  delay?: number;
  duration?: number;
  /** Stagger direct children marked with `data-reveal-item`. */
  stagger?: number;
  /** ScrollTrigger start position. */
  start?: string;
  once?: boolean;
  /** Optional id for the wrapper element. */
  id?: string;
  as?: "div" | "section" | "article" | "li" | "header" | "aside";
};

/**
 * Scroll-reveal wrapper built on GSAP + ScrollTrigger.
 *
 * Uses `fromTo` so the natural (visible) state is the DOM default: if JS never
 * runs, content is still readable. Under reduced motion / calm mode it does
 * nothing at all and clears any inline styles.
 */
export function Reveal({
  children,
  className,
  style,
  y = 28,
  x = 0,
  scale,
  delay = 0,
  duration = 0.9,
  stagger,
  start = "top 88%",
  once = true,
  id,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const calm = useCalmMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (calm) {
      gsap.set(element, { clearProps: "all" });
      element.querySelectorAll<HTMLElement>("[data-reveal-item]").forEach((node) => gsap.set(node, { clearProps: "all" }));
      return;
    }

    ensureGsap();

    const context = gsap.context(() => {
      const targets = stagger
        ? gsap.utils.toArray<HTMLElement>("[data-reveal-item]", element)
        : [element];

      gsap.fromTo(
        targets,
        {
          autoAlpha: 0,
          y,
          x,
          ...(scale ? { scale } : {}),
        },
        {
          autoAlpha: 1,
          y: 0,
          x: 0,
          ...(scale ? { scale: 1 } : {}),
          duration,
          delay,
          ease: EASE_OUT,
          stagger: stagger ?? 0,
          scrollTrigger: {
            trigger: element,
            start,
            once,
          },
        },
      );
    }, element);

    return () => context.revert();
  }, [calm, delay, duration, scale, start, stagger, once, x, y]);

  return (
    <Tag id={id} ref={ref as never} className={cn(className)} style={style}>
      {children}
    </Tag>
  );
}
