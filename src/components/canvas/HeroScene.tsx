"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { detectWebGL } from "@/lib/gl";
import { cn } from "@/lib/utils";
import { OrbitalFallback } from "./OrbitalFallback";

/**
 * The WebGL bundle (three + R3F + drei) is the heaviest thing on the page, so
 * it is code-split and only fetched in the browser — never during SSR.
 */
const HeroCanvas = dynamic(() => import("./HeroCanvas").then((module) => module.HeroCanvas), {
  ssr: false,
  loading: () => <OrbitalFallback poster />,
});

type HeroSceneProps = {
  className?: string;
};

/**
 * Capability-gated 3D hero:
 *  · no WebGL  → SVG/CSS orbital fallback
 *  · WebGL     → poster fallback crossfades into the live canvas
 */
export function HeroScene({ className }: HeroSceneProps) {
  const [support, setSupport] = useState<"unknown" | "yes" | "no">("unknown");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSupport(detectWebGL() === "none" ? "no" : "yes");
  }, []);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {support === "no" ? (
        <OrbitalFallback />
      ) : (
        <>
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-[900ms]",
              ready ? "opacity-0" : "opacity-100",
            )}
          >
            <OrbitalFallback poster />
          </div>
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-[900ms]",
              ready ? "opacity-100" : "opacity-0",
            )}
          >
            <HeroCanvas onReady={() => setReady(true)} />
          </div>
        </>
      )}
    </div>
  );
}
