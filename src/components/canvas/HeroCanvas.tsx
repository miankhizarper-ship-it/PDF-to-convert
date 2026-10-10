"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { OrbitalScene } from "./OrbitalScene";
import { useCalmMotion } from "@/lib/motion";

type HeroCanvasProps = {
  /** Fired once the WebGL context is ready (drives the poster crossfade). */
  onReady?: () => void;
};

/**
 * Adaptive resolution: samples frame times and steps the render scale down on
 * decline, back up on incline, with a hard fallback after repeated flip-flops.
 */
function DprGovernor() {
  const setDpr = useThree((state) => state.setDpr);

  return (
    <PerformanceMonitor
      onDecline={() => setDpr(0.9)}
      onIncline={() =>
        setDpr(Math.min(1.75, typeof window !== "undefined" ? window.devicePixelRatio : 1))
      }
      flipflops={3}
      onFallback={() => setDpr(0.75)}
    />
  );
}

/** Forces a single render when R3F is in `demand` mode (calm / reduced motion). */
function DemandRender() {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [invalidate]);
  return null;
}

/**
 * WebGL canvas for the hero. Rendering pauses entirely when the hero scrolls
 * out of view, so a 3D scene never costs frames on sections that don't show it.
 */
export function HeroCanvas({ onReady }: HeroCanvasProps) {
  const calm = useCalmMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setInView(entry ? entry.isIntersecting : true);
      },
      { rootMargin: "160px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const frameloop: "always" | "demand" | "never" = calm ? "demand" : inView ? "always" : "never";

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <Canvas
        flat
        performance={{ min: 0.5 }}
        dpr={[1, 1.75]}
        frameloop={frameloop}
        camera={{ position: [0, 0.15, 7.4], fov: 42, near: 0.1, far: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          onReady?.();
        }}
      >
        <OrbitalScene calm={calm} />
        <DprGovernor />
        {calm ? <DemandRender /> : null}
      </Canvas>
    </div>
  );
}
