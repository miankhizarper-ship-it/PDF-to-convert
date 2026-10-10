"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/data/types";
import { ProjectVisual } from "@/components/ui/ProjectVisual";
import { SampleChip } from "@/components/ui/SampleChip";
import { ensureGsap, gsap } from "@/lib/gsap";
import { useCalmMotion, useFinePointer } from "@/lib/motion";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  project: Project;
  index?: number;
  /** `feature` renders a larger, two-column card. */
  size?: "default" | "feature";
  className?: string;
};

const statusStyle: Record<Project["status"], string> = {
  live: "chip-volt",
  "in-progress": "chip-acid",
  concept: "chip-iris",
  archive: "",
};

/**
 * Project card with a layered 3D hover: the artwork, copy and meta sit on
 * different Z planes inside a perspective container, so pointer movement
 * produces real parallax rather than a flat lift. Neon border + glow and a scan
 * sweep handle the "cybernetic" side.
 */
export function ProjectCard({ project, index = 0, size = "default", className }: ProjectCardProps) {
  const tiltRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const fine = useFinePointer();
  const calm = useCalmMotion();
  const tiltEnabled = fine && !calm;

  useEffect(() => {
    const node = tiltRef.current;
    if (!node || !tiltEnabled) return;

    ensureGsap();
    const rotateX = gsap.quickTo(node, "rotationX", { duration: 0.75, ease: "power3.out" });
    const rotateY = gsap.quickTo(node, "rotationY", { duration: 0.75, ease: "power3.out" });

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      rotateY(px * 11);
      rotateX(-py * 9);
      node.style.setProperty("--pointer-x", `${(px + 0.5) * 100}%`);
      node.style.setProperty("--pointer-y", `${(py + 0.5) * 100}%`);
    };

    const onLeave = () => {
      rotateX(0);
      rotateY(0);
    };

    const card = cardRef.current;
    card?.addEventListener("pointermove", onMove);
    card?.addEventListener("pointerleave", onLeave);
    return () => {
      card?.removeEventListener("pointermove", onMove);
      card?.removeEventListener("pointerleave", onLeave);
      gsap.set(node, { rotationX: 0, rotationY: 0 });
    };
  }, [tiltEnabled]);

  const onDragStart = useCallback((event: React.DragEvent) => event.preventDefault(), []);

  const feature = size === "feature";

  return (
    <Link
      ref={cardRef}
      href={`/projects/${project.slug}`}
      onDragStart={onDragStart}
      data-cursor="hover"
      data-cursor-label="OPEN"
      aria-label={`${project.title} — open case study`}
      className={cn(
        "panel panel-hover group relative block overflow-hidden",
        className,
      )}
      style={{ perspective: "1200px" }}
    >
      <div ref={tiltRef} className="tilt-layer relative">
        {/* Spotlight that follows the pointer */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(340px circle at var(--pointer-x, 50%) var(--pointer-y, 50%), color-mix(in srgb, var(--color-acid) 9%, transparent), transparent 68%)",
          }}
        />

        <div className={cn("grid", feature && "lg:grid-cols-[1.15fr_1fr]")}>
          {/* Artwork */}
          <div
            className={cn(
              "relative overflow-hidden border-b border-edge/70 lg:border-b-0",
              feature ? "min-h-[280px] lg:min-h-[440px]" : "min-h-[210px]",
              feature && "lg:border-r",
            )}
            style={{ transform: "translateZ(0px)" }}
          >
            <ProjectVisual
              variant={project.cover}
              accent={project.accent}
              seed={index + 3}
              className={cn(
                "h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]",
                "opacity-90 group-hover:opacity-100",
              )}
            />

            {/* Scan sweep on hover */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -top-full h-full bg-linear-to-b from-transparent via-acid/10 to-transparent opacity-0 transition-all duration-[900ms] group-hover:top-full group-hover:opacity-100"
            />

            <span className="hud absolute top-4 left-4 border border-edge/80 bg-void/70 px-2 py-1 text-[0.5625rem] text-acid backdrop-blur-sm">
              {project.codename}
            </span>

            <span
              className={cn(
                "chip absolute top-4 right-4 text-[0.5625rem] backdrop-blur-sm",
                statusStyle[project.status],
              )}
            >
              {project.status.replace("-", " ")}
            </span>

            {/* Hover preview: key highlights lift over the artwork */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-4 p-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
              <ul className="space-y-1.5">
                {project.highlights.slice(0, 2).map((highlight) => (
                  <li
                    key={highlight}
                    className="border-l border-acid/60 bg-void/78 py-1.5 pl-3 font-mono text-[0.625rem] leading-relaxed text-frost/90 backdrop-blur-sm"
                  >
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Copy */}
          <div
            className={cn("relative flex flex-col p-6 lg:p-7", feature && "lg:justify-center lg:p-10")}
            style={{ transform: "translateZ(34px)" }}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="hud text-[0.5625rem] text-ash/70">
                {String(index + 1).padStart(2, "0")} / {project.year}
              </span>
              <div className="flex items-center gap-2">
                {project.isSample ? <SampleChip /> : null}
              </div>
            </div>

            <h3
              className={cn(
                "mt-4 font-display font-bold tracking-tight uppercase transition-colors duration-300 group-hover:text-acid",
                feature ? "text-[clamp(1.9rem,3.4vw,3rem)] leading-[0.95]" : "text-2xl leading-tight",
              )}
            >
              {project.title}
            </h3>

            <p className={cn("mt-3 text-sm leading-relaxed text-ash", feature && "text-base")}>{project.summary}</p>

            {feature ? (
              <p className="hud mt-5 text-[0.625rem] text-ash/70">ROLE · {project.role}</p>
            ) : null}

            <ul className="mt-6 flex flex-wrap gap-2" style={{ transform: "translateZ(58px)" }}>
              {project.stack.slice(0, feature ? 6 : 4).map((tech) => (
                <li key={tech} className="chip text-[0.625rem]">
                  {tech}
                </li>
              ))}
              {project.stack.length > (feature ? 6 : 4) ? (
                <li className="chip text-[0.625rem] text-ash/70">+{project.stack.length - (feature ? 6 : 4)}</li>
              ) : null}
            </ul>

            <span className="mt-7 flex items-center gap-2 border-t border-edge/70 pt-5 font-mono text-[0.6875rem] tracking-[0.16em] text-frost uppercase transition-colors duration-300 group-hover:text-acid">
              View case study
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={1.5}
                aria-hidden
              />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
