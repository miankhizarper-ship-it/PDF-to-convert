"use client";

import { useEffect, useRef, useState } from "react";
import { useCalmMotion, useFinePointer } from "@/lib/motion";
import { onScrollTick, pointerState } from "@/lib/scroll-bus";
import { lerp } from "@/lib/utils";

const INTERACTIVE = 'a[href], button:not([disabled]), input, textarea, select, [role="button"], [data-cursor]';

/**
 * Custom cursor: an instant core dot plus a lagging ring that swells over
 * interactive elements and can show a label from `data-cursor-label`.
 *
 * Only mounts on fine-pointer devices, never under reduced motion / calm mode,
 * and animates on the shared rAF bus (no per-frame React renders).
 */
export function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const hoveringRef = useRef(false);
  const [label, setLabel] = useState<string | null>(null);

  const fine = useFinePointer();
  const calm = useCalmMotion();
  const enabled = fine && !calm;

  // Tell the stylesheet whether to suppress the native cursor.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.cursor = enabled ? "on" : "off";
    return () => {
      document.documentElement.dataset.cursor = "off";
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    let ringX = pointerState.x;
    let ringY = pointerState.y;
    let visible = false;

    const unsubscribe = onScrollTick(() => {
      const ring = ringRef.current;
      const dot = dotRef.current;
      if (!ring || !dot || !pointerState.active) return;

      if (!visible) {
        visible = true;
        ringX = pointerState.x;
        ringY = pointerState.y;
        ring.style.opacity = "1";
        dot.style.opacity = "1";
      }

      ringX = lerp(ringX, pointerState.x, 0.17);
      ringY = lerp(ringY, pointerState.y, 0.17);

      ring.style.transform = `translate3d(${ringX.toFixed(2)}px, ${ringY.toFixed(2)}px, 0)`;
      dot.style.transform = `translate3d(${pointerState.x.toFixed(2)}px, ${pointerState.y.toFixed(2)}px, 0)`;

      const next = pointerState.down ? "down" : hoveringRef.current ? "hover" : "idle";
      if (ring.dataset.state !== next) ring.dataset.state = next;
    });

    const onOver = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const interactive = target?.closest?.(INTERACTIVE);
      hoveringRef.current = Boolean(interactive);
      setLabel(interactive?.getAttribute("data-cursor-label") ?? null);
    };

    const onLeave = () => {
      hoveringRef.current = false;
      setLabel(null);
    };

    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      unsubscribe();
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[999] hidden lg:block">
      <div ref={ringRef} data-state="idle" className="cursor-ring flex items-center justify-center opacity-0">
        {label ? (
          <span className="hud max-w-[120px] truncate text-center text-[0.5rem] leading-tight tracking-[0.14em] text-volt">
            {label}
          </span>
        ) : null}
      </div>
      <div ref={dotRef} className="cursor-dot opacity-0" />
    </div>
  );
}
