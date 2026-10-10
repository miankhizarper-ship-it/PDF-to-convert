"use client";

import { useEffect, useRef } from "react";
import { processSteps } from "@/data";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ensureGsap, gsap } from "@/lib/gsap";
import { useCalmMotion } from "@/lib/motion";

/**
 * Delivery process rail. The connecting trace draws itself on scroll
 * (`pathLength={1}` normalisation) and each station lights up as it is reached.
 */
export function ProcessRail() {
  const railRef = useRef<HTMLDivElement>(null);
  const calm = useCalmMotion();

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const trace = rail.querySelector<SVGGeometryElement>("[data-trace]");
    const stations = gsap.utils.toArray<HTMLElement>("[data-station]", rail);

    if (calm || !trace) {
      if (trace) gsap.set(trace, { strokeDashoffset: 0 });
      gsap.set(stations, { autoAlpha: 1, scale: 1 });
      return;
    }

    ensureGsap();
    const context = gsap.context(() => {
      gsap.set(trace, { strokeDashoffset: 1 });
      gsap.to(trace, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: { trigger: rail, start: "top 78%", end: "bottom 72%", scrub: 0.6 },
      });
      gsap.fromTo(
        stations,
        { autoAlpha: 0.35, scale: 0.82 },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.5,
          ease: "back.out(2)",
          stagger: 0.1,
          scrollTrigger: { trigger: rail, start: "top 74%", once: true },
        },
      );
    }, rail);

    return () => context.revert();
  }, [calm]);

  return (
    <section aria-label="How engagements run" className="relative border-t border-edge/60 bg-panel/20">
      <div className="backdrop-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />

      <div className="relative mx-auto w-full max-w-[1440px] px-5 py-20 lg:px-10 lg:py-24">
        <SectionHeading
          index="03.1"
          eyebrow="DELIVERY PROTOCOL"
          title="HOW IT RUNS"
          description="Five stages, each with something you can look at. No black-box months, no surprise invoices."
          className="max-w-2xl"
        />

        <div ref={railRef} className="relative mt-16">
          {/* Connecting trace: horizontal on desktop, vertical on mobile */}
          <svg
            className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
            viewBox="0 0 1200 40"
            preserveAspectRatio="none"
            aria-hidden
          >
            <line
              x1="0"
              y1="20"
              x2="1200"
              y2="20"
              stroke="var(--color-edge)"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1="20"
              x2="1200"
              y2="20"
              stroke="var(--color-acid)"
              strokeOpacity="0.75"
              strokeWidth="1.5"
              data-trace
              pathLength={1}
              strokeDasharray={1}
            />
          </svg>

          <ol className="relative grid gap-8 lg:grid-cols-5 lg:gap-5">
            {processSteps.map((step) => (
              <li key={step.index} className="relative">
                <Reveal y={22} delay={Number(step.index) * 0.05}>
                  <div data-station className="flex items-center gap-4 lg:block">
                    <span
                      className="relative flex h-10 w-10 shrink-0 items-center justify-center border border-acid/45 bg-void font-mono text-[0.6875rem] text-acid lg:mb-6"
                      style={{ boxShadow: "0 0 22px -10px color-mix(in srgb, var(--color-acid) 80%, transparent)" }}
                    >
                      {step.index}
                      <span aria-hidden className="absolute -inset-1 border border-edge/70" />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold tracking-tight uppercase">{step.title}</h3>
                      <p className="mt-2.5 text-sm leading-relaxed text-ash">{step.body}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
