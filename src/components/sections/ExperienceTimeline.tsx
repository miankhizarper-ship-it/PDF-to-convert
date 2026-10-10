"use client";

import { useEffect, useRef } from "react";
import { Briefcase, GraduationCap, Rocket, Wrench } from "lucide-react";
import { education, experience } from "@/data";
import type { ExperienceEntry } from "@/data/types";
import { Reveal } from "@/components/ui/Reveal";
import { SampleChip } from "@/components/ui/SampleChip";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ensureGsap, gsap } from "@/lib/gsap";
import { useCalmMotion } from "@/lib/motion";

const typeMeta: Record<ExperienceEntry["type"], { label: string; icon: typeof Briefcase; chip: string }> = {
  "full-time": { label: "Full-time", icon: Briefcase, chip: "chip-volt" },
  freelance: { label: "Freelance", icon: Rocket, chip: "chip-acid" },
  contract: { label: "Contract", icon: Wrench, chip: "chip-iris" },
  personal: { label: "Self-directed", icon: Rocket, chip: "chip-iris" },
  education: { label: "Education", icon: GraduationCap, chip: "chip-acid" },
};

/**
 * Experience timeline: the spine draws as you scroll and each station's node
 * ignites when it enters the viewport.
 */
export function ExperienceTimeline() {
  const railRef = useRef<HTMLOListElement>(null);
  const calm = useCalmMotion();

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const spine = rail.querySelector<SVGLineElement>("[data-spine]");
    const nodes = gsap.utils.toArray<HTMLElement>("[data-node]", rail);

    if (calm) {
      if (spine) gsap.set(spine, { strokeDashoffset: 0 });
      gsap.set(nodes, { autoAlpha: 1, scale: 1 });
      return;
    }

    ensureGsap();
    const context = gsap.context(() => {
      if (spine) {
        gsap.set(spine, { strokeDashoffset: 1 });
        gsap.to(spine, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: { trigger: rail, start: "top 76%", end: "bottom 82%", scrub: 0.55 },
        });
      }

      nodes.forEach((node) => {
        gsap.fromTo(
          node,
          { autoAlpha: 0.25, scale: 0.5 },
          {
            autoAlpha: 1,
            scale: 1,
            duration: 0.5,
            ease: "back.out(2.4)",
            scrollTrigger: { trigger: node, start: "top 86%", once: true },
          },
        );
      });
    }, rail);

    return () => context.revert();
  }, [calm]);

  return (
    <section aria-label="Experience" className="relative mx-auto w-full max-w-[1440px] px-5 pt-8 pb-20 lg:px-10 lg:pb-28">
      <SectionHeading
        index="05"
        eyebrow="FLIGHT LOG"
        title="EXPERIENCE"
        description="The route so far. Every entry below ships as labelled sample content — replace it with your real roles in src/data/experience.ts and the SAMPLE tags disappear."
        className="max-w-3xl"
        glitch
      />

      <div className="relative mt-16">
        {/* Spine */}
        <svg
          className="pointer-events-none absolute top-0 left-0 h-full w-7 lg:left-1/2 lg:-translate-x-1/2"
          viewBox="0 0 32 1000"
          preserveAspectRatio="none"
          aria-hidden
        >
          <line x1="16" y1="0" x2="16" y2="1000" stroke="var(--color-edge)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <line
            x1="16"
            y1="0"
            x2="16"
            y2="1000"
            stroke="var(--color-acid)"
            strokeOpacity="0.65"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            data-spine
            pathLength={1}
            strokeDasharray={1}
          />
        </svg>

        <ol ref={railRef} className="relative space-y-10 lg:space-y-14">
          {experience.map((entry, index) => {
            const meta = typeMeta[entry.type];
            const EntryIcon = meta.icon;
            const rightSide = index % 2 === 1;

            return (
              <li
                key={entry.id}
                className={cnLayout(rightSide)}
              >
                <Reveal y={26} x={rightSide ? 18 : -18} delay={0.04} className="h-full">
                  <article className="panel panel-hover group relative h-full p-6 lg:p-8">
                    <header className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center border border-edge/90 bg-void/70 text-acid">
                          <EntryIcon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                        </span>
                        <div>
                          <p className="hud text-[0.5625rem] text-ash/70">{String(index + 1).padStart(2, "0")} // {meta.label}</p>
                          <p className="mt-1 font-mono text-[0.6875rem] text-volt">{entry.period}</p>
                        </div>
                      </div>
                      {entry.isSample ? <SampleChip /> : null}
                    </header>

                    <h3 className="mt-6 font-display text-xl font-bold tracking-tight uppercase lg:text-2xl">{entry.role}</h3>
                    <p className="mt-1.5 text-sm text-acid/90">{entry.organisation}</p>
                    <p className="hud mt-2 text-[0.5625rem] text-ash/70">{entry.location}</p>

                    <p className="mt-5 text-sm leading-relaxed text-ash">{entry.summary}</p>

                    <ul className="mt-6 space-y-2.5">
                      {entry.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-start gap-3 text-[0.8125rem] leading-relaxed text-ash/90">
                          <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-volt" />
                          {highlight}
                        </li>
                      ))}
                    </ul>

                    <ul className="mt-6 flex flex-wrap gap-2 border-t border-edge/70 pt-5">
                      {entry.stack.map((tech) => (
                        <li key={tech} className="chip text-[0.625rem]">
                          {tech}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>

                {/* Node on the spine */}
                <span
                  data-node
                  aria-hidden
                  className={cnNode(rightSide)}
                >
                  <span className="absolute inset-0 rounded-full bg-acid/25 blur-[6px]" />
                  <span className="relative block h-2.5 w-2.5 rounded-full bg-acid ring-2 ring-void" />
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Education */}
      <Reveal y={24} className="mt-16">
        <div className="panel panel-flat p-7 lg:p-9">
          <h2 className="hud flex items-center gap-3 text-iris">
            <GraduationCap className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            EDUCATION & CREDENTIALS
          </h2>
          <div className="mt-7 grid gap-6 md:grid-cols-2">
            {education.map((item) => (
              <div key={item.title} className="border-l border-edge/80 pl-5">
                <p className="font-display text-base font-bold tracking-tight">{item.title}</p>
                <p className="mt-1.5 font-mono text-[0.6875rem] text-ash">
                  {item.issuer} · {item.period}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ash/80">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function cnLayout(rightSide: boolean): string {
  return [
    "relative pl-10 lg:w-1/2 lg:pl-0",
    rightSide ? "lg:ml-auto lg:pl-14" : "lg:pr-14",
  ].join(" ");
}

function cnNode(rightSide: boolean): string {
  return [
    "absolute top-8 left-0 flex h-7 w-7 items-center justify-center lg:top-10",
    rightSide ? "lg:-left-3.5 lg:translate-x-0" : "lg:left-auto lg:-right-3.5 lg:translate-x-0",
  ].join(" ");
}
