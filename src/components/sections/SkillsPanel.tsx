"use client";

import { useEffect, useRef, useState } from "react";
import { Layers } from "lucide-react";
import { skillGroups } from "@/data";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ensureGsap, gsap } from "@/lib/gsap";
import { useCalmMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const accentText = { acid: "text-acid", volt: "text-volt", iris: "text-iris" } as const;
const accentBar = {
  acid: "bg-linear-to-r from-acid/70 via-acid to-volt",
  volt: "bg-linear-to-r from-volt/70 via-volt to-acid",
  iris: "bg-linear-to-r from-iris/70 via-iris to-volt",
} as const;
const accentRule = { acid: "bg-acid", volt: "bg-volt", iris: "bg-iris" } as const;

/**
 * Interactive skill map: a keyboard-operable tab list of groups, with bars that
 * redraw each time a group is selected. Levels are self-assessed indicators —
 * edit `src/data/skills.ts`.
 */
export function SkillsPanel() {
  const [activeId, setActiveId] = useState<string>(skillGroups[0]?.id ?? "");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const calm = useCalmMotion();

  const activeIndex = Math.max(
    0,
    skillGroups.findIndex((group) => group.id === activeId),
  );
  const activeGroup = skillGroups[activeIndex] ?? skillGroups[0];

  /* Redraw bars whenever the visible group changes. */
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const bars = gsap.utils.toArray<HTMLElement>("[data-bar]", panel);
    const values = gsap.utils.toArray<HTMLElement>("[data-value]", panel);

    if (calm || !activeGroup) {
      gsap.set(bars, { scaleX: 1 });
      return;
    }

    ensureGsap();
    const context = gsap.context(() => {
      gsap.fromTo(
        bars,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.95, ease: "power3.out", stagger: 0.06, transformOrigin: "left center" },
      );
      values.forEach((node, index) => {
        const skill = activeGroup.skills[index];
        if (!skill) return;
        const counter = { value: 0 };
        gsap.to(counter, {
          value: skill.level,
          duration: 0.95,
          ease: "power3.out",
          delay: index * 0.06,
          onUpdate: () => {
            node.textContent = String(Math.round(counter.value)).padStart(2, "0");
          },
        });
      });
    }, panel);

    return () => context.revert();
  }, [activeId, calm, activeGroup]);

  const selectAt = (index: number, focus = true) => {
    const next = skillGroups[(index + skillGroups.length) % skillGroups.length];
    if (!next) return;
    setActiveId(next.id);
    if (focus) tabRefs.current[(index + skillGroups.length) % skillGroups.length]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        event.preventDefault();
        selectAt(index + 1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        event.preventDefault();
        selectAt(index - 1);
        break;
      case "Home":
        event.preventDefault();
        selectAt(0);
        break;
      case "End":
        event.preventDefault();
        selectAt(skillGroups.length - 1);
        break;
      default:
        break;
    }
  };

  if (!activeGroup) return null;

  const totalSkills = skillGroups.reduce((sum, group) => sum + group.skills.length, 0);
  const average = Math.round(
    skillGroups.reduce((sum, group) => sum + group.skills.reduce((a, b) => a + b.level, 0), 0) / Math.max(1, totalSkills),
  );

  return (
    <section aria-label="Skills" className="relative mx-auto w-full max-w-[1440px] px-5 pt-8 pb-20 lg:px-10 lg:pb-28">
      <SectionHeading
        index="04"
        eyebrow="CAPABILITY MATRIX"
        title="THE TOOLKIT"
        description="Grouped by discipline rather than alphabetically. Percentages are a self-assessed working level — how much of a project I can carry in that area without supervision."
        className="max-w-3xl"
        glitch
      />

      <Reveal y={26} className="mt-12">
        <div className="panel panel-flat grid gap-0 lg:grid-cols-[300px_1fr]">
          {/* Tab list */}
          <div
            role="tablist"
            aria-label="Skill groups"
            aria-orientation="vertical"
            className="flex gap-1 overflow-x-auto border-b border-edge/70 p-3 lg:flex-col lg:overflow-visible lg:border-r lg:border-b-0"
          >
            {skillGroups.map((group, index) => {
              const selected = group.id === activeGroup.id;
              return (
                <button
                  key={group.id}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  role="tab"
                  id={`skill-tab-${group.id}`}
                  aria-controls={`skill-panel-${group.id}`}
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveId(group.id)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                  className={cn(
                    "group relative flex min-w-[190px] shrink-0 items-center gap-3 border px-4 py-3.5 text-left transition-colors duration-300 lg:min-w-0",
                    selected
                      ? "border-acid/45 bg-acid/8 text-frost"
                      : "border-transparent text-ash hover:border-edge hover:bg-panel/60 hover:text-frost",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-y-0 left-0 w-px transition-all duration-400",
                      selected ? accentRule[group.accent] : "bg-transparent",
                    )}
                  />
                  <Icon
                    name={group.icon}
                    className={cn("h-4 w-4 shrink-0 transition-colors duration-300", selected ? accentText[group.accent] : "text-ash/70")}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[0.8125rem] font-bold tracking-tight uppercase">
                      {group.title}
                    </span>
                    <span className="hud mt-1 block truncate text-[0.5rem] text-ash/70">{group.skills.length} ITEMS</span>
                  </span>
                  <span className={cn("hud text-[0.5625rem]", selected ? accentText[group.accent] : "text-ash/50")}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab panel */}
          <div
            ref={panelRef}
            role="tabpanel"
            id={`skill-panel-${activeGroup.id}`}
            aria-labelledby={`skill-tab-${activeGroup.id}`}
            tabIndex={0}
            className="p-6 focus-visible:outline-offset-[-2px] lg:p-9"
          >
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-edge/70 pb-6">
              <div>
                <h3 className="font-display text-2xl font-bold tracking-tight uppercase">{activeGroup.title}</h3>
                <p className="mt-2 text-sm text-ash">{activeGroup.caption}</p>
              </div>
              <span className={cn("chip", `chip-${activeGroup.accent === "iris" ? "iris" : activeGroup.accent === "volt" ? "volt" : "acid"}`)}>
                <Layers className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                {activeGroup.skills.length} technologies
              </span>
            </div>

            <ul className="mt-7 space-y-6">
              {activeGroup.skills.map((skill) => (
                <li key={skill.name} className="group">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="font-display text-[0.9375rem] font-medium tracking-tight text-frost transition-colors duration-300 group-hover:text-acid">
                      {skill.name}
                    </span>
                    <span className="flex items-baseline gap-1 font-mono text-[0.6875rem] text-ash">
                      <span data-value className={accentText[activeGroup.accent]}>
                        {String(skill.level).padStart(2, "0")}
                      </span>
                      <span className="text-ash/60">%</span>
                    </span>
                  </div>

                  <div className="relative mt-2.5 h-[3px] w-full overflow-hidden bg-edge/80">
                    <span
                      data-bar
                      className={cn("absolute inset-y-0 left-0 block origin-left", accentBar[activeGroup.accent])}
                      style={{ width: `${skill.level}%` }}
                    />
                    <span aria-hidden className="absolute inset-0 opacity-40">
                      <span className="absolute inset-y-0 left-1/4 w-px bg-void/70" />
                      <span className="absolute inset-y-0 left-1/2 w-px bg-void/70" />
                      <span className="absolute inset-y-0 left-3/4 w-px bg-void/70" />
                    </span>
                  </div>

                  {skill.note ? (
                    <p className="mt-2 font-mono text-[0.625rem] leading-relaxed text-ash/70">{skill.note}</p>
                  ) : null}

                  <span className="sr-only">
                    {skill.name}: working level {skill.level} out of 100
                  </span>
                </li>
              ))}
            </ul>

            <p className="hud mt-9 border-t border-edge/70 pt-5 text-[0.5625rem] text-ash/60">
              MATRIX SUMMARY · {totalSkills} TECHNOLOGIES · GROUP AVERAGE {average}% · SELF-ASSESSED
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
