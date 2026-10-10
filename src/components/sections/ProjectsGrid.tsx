"use client";

import { useMemo, useState } from "react";
import { Radar, RotateCcw } from "lucide-react";
import { getProjects, projectStackIndex } from "@/data";
import type { Project } from "@/data/types";
import { ProjectCard } from "./ProjectCard";
import { Button } from "@/components/ui/NeonButton";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

const statusFilters: Array<Project["status"] | "all"> = ["all", "live", "in-progress", "concept", "archive"];

/** Projects index with technology + status filtering. */
export function ProjectsGrid() {
  const projects = getProjects();
  const stackIndex = useMemo(() => projectStackIndex().slice(0, 8), []);

  const [tech, setTech] = useState<string | null>(null);
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("all");

  const filtered = useMemo(
    () =>
      projects.filter((project) => {
        const matchesTech = !tech || project.stack.includes(tech);
        const matchesStatus = status === "all" || project.status === status;
        return matchesTech && matchesStatus;
      }),
    [projects, tech, status],
  );

  const isFiltered = Boolean(tech) || status !== "all";
  const maxCount = stackIndex[0]?.count ?? 1;

  return (
    <section aria-label="All projects" className="relative mx-auto w-full max-w-[1440px] px-5 pt-8 pb-20 lg:px-10 lg:pb-28">
      <SectionHeading
        index="06"
        eyebrow="PROJECT ARCHIVE"
        title="CASE FILES"
        description="Every build with its reasoning attached. Filter by technology or status — each card opens a full case study covering the problem, the solution and the stack."
        className="max-w-3xl"
        glitch
      />

      {/* Filters */}
      <Reveal y={20} className="mt-12">
        <div className="panel panel-flat flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
          <div className="min-w-0">
            <p className="hud text-[0.5625rem] text-ash/70">FILTER BY TECHNOLOGY</p>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by technology">
              <button
                type="button"
                onClick={() => setTech(null)}
                aria-pressed={tech === null}
                className={cn("chip transition-colors", tech === null && "chip-acid text-acid")}
              >
                ALL
              </button>
              {stackIndex.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setTech((current) => (current === item.name ? null : item.name))}
                  aria-pressed={tech === item.name}
                  className={cn("chip transition-colors", tech === item.name && "chip-acid text-acid")}
                >
                  {item.name}
                  <span className="text-ash/60">{item.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="shrink-0">
            <p className="hud text-[0.5625rem] text-ash/70">STATUS</p>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
              {statusFilters.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStatus(option)}
                  aria-pressed={status === option}
                  className={cn("chip transition-colors", status === option && "chip-volt text-volt")}
                >
                  {option === "all" ? "ANY" : option.replace("-", " ").toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {/* Result count */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4" aria-live="polite">
        <p className="hud text-[0.625rem] text-ash">
          <span className="text-acid">{String(filtered.length).padStart(2, "0")}</span>
          <span className="mx-2">/</span>
          {String(projects.length).padStart(2, "0")} CASE FILES
          {isFiltered ? <span className="ml-3 text-volt">FILTERED</span> : null}
        </p>
        {isFiltered ? (
          <button
            type="button"
            onClick={() => {
              setTech(null);
              setStatus("all");
            }}
            className="hud flex items-center gap-2 text-[0.5625rem] text-ash transition-colors hover:text-acid"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={1.75} aria-hidden />
            RESET FILTERS
          </button>
        ) : null}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project, index) => (
            <Reveal
              key={project.slug}
              y={30}
              delay={(index % 3) * 0.07}
              className={cn("h-full", index === 0 && !isFiltered && "xl:col-span-2")}
            >
              <ProjectCard
                project={project}
                index={index}
                size={index === 0 && !isFiltered ? "feature" : "default"}
                className="h-full"
              />
            </Reveal>
          ))}
        </div>
      ) : (
        <Reveal y={18} className="mt-8">
          <div className="panel panel-flat flex flex-col items-center gap-5 px-6 py-20 text-center">
            <Radar className="h-8 w-8 text-ash/60" strokeWidth={1.25} aria-hidden />
            <div>
              <p className="font-display text-xl font-bold tracking-tight uppercase">No case files match</p>
              <p className="mt-3 max-w-sm text-sm text-ash">
                Nothing in the archive uses that combination yet. Clear the filters or add the project
                to <span className="font-mono text-frost">src/data/projects.ts</span>.
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setTech(null);
                setStatus("all");
              }}
            >
              Reset filters
            </Button>
          </div>
        </Reveal>
      )}

      {/* Stack frequency */}
      <Reveal y={24} className="mt-16">
        <div className="panel panel-flat p-7 lg:p-9">
          <h2 className="hud text-acid">STACK FREQUENCY ACROSS THE ARCHIVE</h2>
          <ul className="mt-7 grid gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {projectStackIndex().map((item) => (
              <li key={item.name} className="group">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[0.6875rem] text-ash transition-colors group-hover:text-frost">
                    {item.name}
                  </span>
                  <span className="font-mono text-[0.625rem] text-acid/80">{String(item.count).padStart(2, "0")}</span>
                </div>
                <span className="mt-2 block h-[2px] w-full bg-edge/80">
                  <span
                    className="block h-full origin-left bg-linear-to-r from-acid/60 to-volt transition-transform duration-500 group-hover:scale-x-105"
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
