"use client";

import { useEffect, useRef } from "react";
import { CircleDot, Compass, Crosshair, Telescope } from "lucide-react";
import { about, availability, site } from "@/data";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ensureGsap, gsap } from "@/lib/gsap";
import { useCalmMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const SIZE = 520;
const CENTER = SIZE / 2;

/** Labels placed around the orbit, derived from `about.orbitLabels`. */
const orbitNodes = about.orbitLabels.map((label, index, all) => {
  const angle = (index / all.length) * Math.PI * 2 - Math.PI / 2;
  return {
    label,
    x: CENTER + Math.cos(angle) * 208,
    y: CENTER + Math.sin(angle) * 208,
    anchorX: CENTER + Math.cos(angle) * 132,
    anchorY: CENTER + Math.sin(angle) * 132,
    angle,
  };
});

const factIcons = [Crosshair, Compass, Telescope, CircleDot, Compass, Telescope];

/**
 * Animated visual profile: an orbital "operator" diagram whose rings, wireframe
 * globe and leader lines draw themselves as the section scrolls into view.
 */
export function AboutStory() {
  const visualRef = useRef<HTMLDivElement>(null);
  const calm = useCalmMotion();

  useEffect(() => {
    const node = visualRef.current;
    if (!node) return;

    const drawn = gsap.utils.toArray<SVGGeometryElement>("[data-draw]", node);
    const faded = gsap.utils.toArray<SVGElement>("[data-fade]", node);
    const nodes = gsap.utils.toArray<SVGElement>("[data-node]", node);

    if (calm) {
      gsap.set(drawn, { strokeDashoffset: 0 });
      gsap.set([...faded, ...nodes], { autoAlpha: 1, scale: 1 });
      return;
    }

    ensureGsap();
    const context = gsap.context(() => {
      gsap.set(drawn, { strokeDashoffset: 1 });
      gsap.set(faded, { autoAlpha: 0 });
      gsap.set(nodes, { autoAlpha: 0, scale: 0.4, transformOrigin: "50% 50%" });

      gsap.to(faded, {
        autoAlpha: 1,
        duration: 0.9,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: node, start: "top 80%", once: true },
      });

      gsap.to(drawn, {
        strokeDashoffset: 0,
        ease: "none",
        duration: 1,
        stagger: 0.09,
        scrollTrigger: { trigger: node, start: "top 82%", end: "bottom 62%", scrub: 0.65 },
      });

      gsap.to(nodes, {
        autoAlpha: 1,
        scale: 1,
        duration: 0.55,
        ease: "back.out(2.2)",
        stagger: 0.07,
        scrollTrigger: { trigger: node, start: "top 70%", once: true },
      });

      gsap.to("[data-orbit-spin]", {
        rotation: 360,
        ease: "none",
        duration: 22,
        repeat: -1,
        transformOrigin: "50% 50%",
      });
    }, node);

    return () => context.revert();
  }, [calm]);

  return (
    <>
      {/* Intro + animated profile */}
      <section
        aria-labelledby="about-heading"
        className="relative mx-auto w-full max-w-[1440px] px-5 pt-10 pb-20 lg:px-10 lg:pb-28"
      >
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <SectionHeading index="02" eyebrow={about.eyebrow} title={about.title} className="max-w-xl" />

            <Reveal y={24} delay={0.1} className="mt-8 max-w-xl">
              <p className="border-l-2 border-acid/60 pl-5 font-display text-lg leading-relaxed text-frost sm:text-xl">
                {about.lede}
              </p>
            </Reveal>

            <div className="mt-9 space-y-5">
              {about.bio.map((paragraph, index) => (
                <Reveal key={paragraph.slice(0, 24)} y={20} delay={0.05 * index}>
                  <p className="max-w-xl text-[0.9375rem] leading-[1.85] text-ash">{paragraph}</p>
                </Reveal>
              ))}
            </div>

            <Reveal y={18} delay={0.1} className="mt-10 flex flex-wrap items-center gap-3">
              <span className="chip chip-volt">
                <span aria-hidden>●</span> {availability.label}
              </span>
              <span className="chip">{site.location}</span>
              <span className="chip">{site.timezone}</span>
            </Reveal>
          </div>

          {/* Orbital profile diagram */}
          <Reveal y={30} duration={1.1} className="relative">
            <div ref={visualRef} className="relative mx-auto w-full max-w-[520px]">
              <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full" aria-hidden focusable="false">
                <defs>
                  <radialGradient id="about-core" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#39FF88" stopOpacity="0.95" />
                    <stop offset="55%" stopColor="#D9FF63" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* outer boundary */}
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={236}
                  fill="none"
                  stroke="var(--color-edge)"
                  strokeWidth="1"
                  strokeDasharray="2 8"
                  data-fade
                />

                {/* orbit rings */}
                <g data-orbit-spin>
                  <ellipse
                    cx={CENTER}
                    cy={CENTER}
                    rx={208}
                    ry={78}
                    fill="none"
                    stroke="var(--color-acid)"
                    strokeOpacity="0.5"
                    strokeWidth="1"
                    transform={`rotate(-22 ${CENTER} ${CENTER})`}
                    data-draw
                    pathLength={1}
                    strokeDasharray={1}
                  />
                  <ellipse
                    cx={CENTER}
                    cy={CENTER}
                    rx={168}
                    ry={168}
                    fill="none"
                    stroke="var(--color-iris)"
                    strokeOpacity="0.35"
                    strokeWidth="1"
                    strokeDasharray="4 10"
                    data-fade
                  />
                </g>

                {/* wireframe globe */}
                <g fill="none" stroke="var(--color-volt)">
                  <circle cx={CENTER} cy={CENTER} r={118} strokeOpacity="0.4" strokeWidth="1" data-draw pathLength={1} strokeDasharray={1} />
                  {[92, 62, 30].map((rx) => (
                    <ellipse
                      key={rx}
                      cx={CENTER}
                      cy={CENTER}
                      rx={rx}
                      ry={118}
                      strokeOpacity="0.18"
                      strokeWidth="1"
                      data-draw
                      pathLength={1}
                      strokeDasharray={1}
                    />
                  ))}
                  {[-0.66, -0.33, 0, 0.33, 0.66].map((fraction) => {
                    const y = fraction * 118;
                    const rx = Math.sqrt(Math.max(1, 118 * 118 - y * y));
                    return (
                      <ellipse
                        key={fraction}
                        cx={CENTER}
                        cy={CENTER + y}
                        rx={rx}
                        ry={rx * 0.17}
                        strokeOpacity={fraction === 0 ? 0.42 : 0.18}
                        strokeWidth="1"
                        data-draw
                        pathLength={1}
                        strokeDasharray={1}
                      />
                    );
                  })}
                </g>

                {/* core */}
                <circle cx={CENTER} cy={CENTER} r={92} fill="url(#about-core)" data-node />
                <circle cx={CENTER} cy={CENTER} r={9} fill="var(--color-volt)" data-node />

                {/* leader lines + labels */}
                {orbitNodes.map((node) => (
                  <g key={node.label}>
                    <line
                      x1={node.anchorX}
                      y1={node.anchorY}
                      x2={node.x}
                      y2={node.y}
                      stroke="var(--color-acid)"
                      strokeOpacity="0.35"
                      strokeWidth="1"
                      data-draw
                      pathLength={1}
                      strokeDasharray={1}
                    />
                    <circle cx={node.x} cy={node.y} r={4} fill="var(--color-acid)" data-node />
                    <text
                      x={node.x + Math.cos(node.angle) * 16}
                      y={node.y + Math.sin(node.angle) * 16}
                      fill="var(--color-ash)"
                      fontSize="11"
                      letterSpacing="2.4"
                      fontFamily="var(--font-mono)"
                      textAnchor={Math.cos(node.angle) > 0.3 ? "start" : Math.cos(node.angle) < -0.3 ? "end" : "middle"}
                      dominantBaseline="middle"
                      data-node
                    >
                      {node.label}
                    </text>
                  </g>
                ))}
              </svg>

              <div className="hud pointer-events-none absolute inset-x-0 -bottom-2 flex items-center justify-center gap-3 text-[0.5625rem] text-ash/70">
                <span aria-hidden>◇</span> OPERATOR DIAGRAM · {site.brand}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Principles */}
      <section aria-label="Operating principles" className="relative border-y border-edge/60 bg-panel/20">
        <div className="backdrop-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto w-full max-w-[1440px] px-5 py-20 lg:px-10 lg:py-24">
          <SectionHeading
            index="02.1"
            eyebrow="OPERATING PRINCIPLES"
            title="HOW I WORK"
            description="Four rules that decide how a project runs — before any framework is chosen."
            className="max-w-2xl"
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {about.principles.map((principle, index) => (
              <Reveal key={principle.title} y={26} delay={index * 0.06} className="h-full">
                <article className="panel panel-hover group h-full p-7">
                  <div className="flex items-start justify-between gap-4">
                    <span className="hud text-[0.625rem] text-acid">{String(index + 1).padStart(2, "0")}</span>
                    <span
                      aria-hidden
                      className="h-8 w-8 border border-edge/90 opacity-40 transition-opacity duration-500 group-hover:opacity-100"
                      style={{
                        background:
                          "conic-gradient(from 210deg, color-mix(in srgb, var(--color-acid) 60%, transparent), transparent 62%)",
                      }}
                    />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold tracking-tight">{principle.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ash">{principle.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Facts + focus */}
      <section aria-label="Profile details" className="relative mx-auto w-full max-w-[1440px] px-5 py-20 lg:px-10 lg:py-24">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal y={26}>
            <div className="panel h-full p-7 lg:p-9">
              <h2 className="hud text-acid">PROFILE DATA</h2>
              <dl className="mt-7 grid gap-x-8 gap-y-0 sm:grid-cols-2">
                {about.facts.map((fact, index) => {
                  const FactIcon = factIcons[index % factIcons.length] ?? Crosshair;
                  return (
                    <div
                      key={fact.label}
                      className="flex items-center gap-3 border-b border-edge/60 py-4 last:border-b-0"
                    >
                      <FactIcon className="h-4 w-4 shrink-0 text-ash/60" strokeWidth={1.25} aria-hidden />
                      <dt className="hud w-28 shrink-0 text-[0.5625rem] text-ash">{fact.label}</dt>
                      <dd className={cn("text-sm text-frost")}>{fact.value}</dd>
                    </div>
                  );
                })}
              </dl>
              <p className="hud mt-7 text-[0.5625rem] text-ash/60">
                <Icon name="fileText" className="mr-2 inline h-3.5 w-3.5" />
                Values above are placeholders — edit <span className="text-frost">src/data/about.ts</span>
              </p>
            </div>
          </Reveal>

          <Reveal y={26} delay={0.08}>
            <div className="panel h-full p-7 lg:p-9">
              <h2 className="hud text-volt">CURRENT FOCUS</h2>
              <ul className="mt-7 space-y-4">
                {about.currentFocus.map((item, index) => (
                  <li key={item} className="group flex items-start gap-4">
                    <span className="hud mt-1 text-[0.5625rem] text-acid/80">{String(index + 1).padStart(2, "0")}</span>
                    <span className="text-sm leading-relaxed text-ash transition-colors duration-300 group-hover:text-frost">
                      {item}
                    </span>
                    <span
                      aria-hidden
                      className="mt-2 h-px flex-1 bg-linear-to-r from-edge to-transparent transition-all duration-500 group-hover:from-acid/50"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
