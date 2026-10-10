import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Link2 } from "lucide-react";
import type { Project } from "@/data/types";
import { ProjectVisual } from "@/components/ui/ProjectVisual";
import { Reveal } from "@/components/ui/Reveal";
import { SampleChip } from "@/components/ui/SampleChip";
import { cn } from "@/lib/utils";

type CaseStudyProps = {
  project: Project;
  prev: Project;
  next: Project;
};

const accentText = { acid: "text-acid", volt: "text-volt", iris: "text-iris" } as const;
const accentChip = { acid: "chip-acid", volt: "chip-volt", iris: "chip-iris" } as const;
const accentBorder = { acid: "border-acid/50", volt: "border-volt/50", iris: "border-iris/55" } as const;

const sections = [
  { id: "problem", index: "01", label: "Problem" },
  { id: "solution", index: "02", label: "Solution" },
  { id: "outcome", index: "03", label: "Outcome" },
  { id: "features", index: "04", label: "Features" },
  { id: "highlights", index: "05", label: "Highlights" },
  { id: "stack", index: "06", label: "Stack" },
  { id: "links", index: "07", label: "Links" },
] as const;

const statusLabel: Record<Project["status"], string> = {
  live: "Live",
  "in-progress": "In progress",
  concept: "Concept build",
  archive: "Archived",
};

/** Full case-study layout for `/projects/[slug]`. */
export function CaseStudy({ project, prev, next }: CaseStudyProps) {
  return (
    <article className="relative mx-auto w-full max-w-[1440px] px-5 pt-6 pb-24 lg:px-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="pt-4">
        <ol className="hud flex flex-wrap items-center gap-2 text-[0.5625rem] text-ash/80">
          <li>
            <Link href="/" className="transition-colors hover:text-acid">
              HOME
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/projects" className="transition-colors hover:text-acid">
              PROJECTS
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className={accentText[project.accent]}>
            {project.codename}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mt-8 grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:gap-14">
        <div>
          <Reveal y={18}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("chip", accentChip[project.accent])}>{project.codename}</span>
              <span className="chip">{statusLabel[project.status]}</span>
              <span className="chip">{project.year}</span>
              {project.isSample ? <SampleChip label="SAMPLE PROJECT" /> : null}
            </div>

            <h1 className="mt-7 font-display text-[clamp(2.4rem,7vw,5.25rem)] leading-[0.9] font-bold tracking-[-0.035em] uppercase">
              {project.title}
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ash sm:text-lg">{project.summary}</p>
          </Reveal>
        </div>

        <Reveal y={22} delay={0.08}>
          <dl className="panel panel-flat divide-y divide-edge/70">
            {[
              { term: "Role", detail: project.role },
              { term: "Status", detail: statusLabel[project.status] },
              { term: "Year", detail: project.year },
              { term: "Stack size", detail: `${project.stack.length} technologies` },
            ].map((row) => (
              <div key={row.term} className="px-5 py-4">
                <dt className="hud text-[0.5625rem] text-ash/70">{row.term}</dt>
                <dd className="mt-1.5 text-sm text-frost">{row.detail}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </header>

      {/* Hero artwork */}
      <Reveal y={30} duration={1.05} className="mt-12">
        <figure className="panel relative overflow-hidden">
          <ProjectVisual
            variant={project.cover}
            accent={project.accent}
            seed={project.slug.length + 11}
            className="h-[260px] w-full sm:h-[380px] lg:h-[460px]"
          />
          <span aria-hidden className="pointer-events-none absolute top-5 left-5 h-7 w-7 border-t border-l border-frost/25" />
          <span aria-hidden className="pointer-events-none absolute top-5 right-5 h-7 w-7 border-t border-r border-frost/25" />
          <span aria-hidden className="pointer-events-none absolute bottom-5 left-5 h-7 w-7 border-b border-l border-frost/25" />
          <span aria-hidden className="pointer-events-none absolute right-5 bottom-5 h-7 w-7 border-r border-b border-frost/25" />
          <figcaption className="hud absolute bottom-5 left-1/2 -translate-x-1/2 border border-edge/80 bg-void/75 px-3 py-1.5 text-[0.5625rem] text-ash backdrop-blur-sm">
            {project.codename} · PROCEDURAL COVER · {project.cover.toUpperCase()}
          </figcaption>
        </figure>
      </Reveal>

      {/* Body: sticky section rail + content */}
      <div className="mt-16 grid gap-12 lg:grid-cols-[210px_1fr] lg:gap-16">
        <aside className="hidden lg:block">
          <nav aria-label="Case study sections" className="sticky top-28">
            <p className="hud text-[0.5625rem] text-ash/60">CASE FILE</p>
            <ol className="mt-5 space-y-1 border-l border-edge/70">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="group flex items-center gap-3 border-l border-transparent py-2 pl-4 -ml-px text-[0.8125rem] text-ash transition-colors duration-300 hover:border-acid hover:text-frost"
                  >
                    <span className="hud text-[0.5625rem] text-ash/60 group-hover:text-acid">{section.index}</span>
                    {section.label}
                  </a>
                </li>
              ))}
            </ol>
            <Link
              href="/projects"
              className="hud mt-8 flex items-center gap-2 text-[0.5625rem] text-ash transition-colors hover:text-acid"
            >
              <ArrowLeft className="h-3 w-3" strokeWidth={2} aria-hidden />
              ALL PROJECTS
            </Link>
          </nav>
        </aside>

        <div className="min-w-0">
          {/* Problem / Solution / Outcome */}
          <div className="space-y-14">
            {[
              { id: "problem", index: "01", title: "The problem", body: project.problem },
              { id: "solution", index: "02", title: "The solution", body: project.solution },
              { id: "outcome", index: "03", title: "The outcome", body: project.outcome },
            ].map((block, blockIndex) => (
              <Reveal key={block.id} y={26} as="section" id={block.id} className="scroll-mt-28">
                <div className="flex items-center gap-4">
                  <span className={cn("hud font-mono text-[0.625rem]", accentText[project.accent])}>{block.index}</span>
                  <span aria-hidden className={cn("h-px flex-1", blockIndex === 1 ? "bg-volt/30" : "bg-edge")} />
                </div>
                <h2 className="mt-5 font-display text-[clamp(1.6rem,3.4vw,2.6rem)] leading-tight font-bold tracking-tight uppercase">
                  {block.title}
                </h2>
                <p
                  className={cn(
                    "mt-6 border-l-2 pl-5 text-[0.9375rem] leading-[1.9] text-ash sm:pl-7 sm:text-base",
                    accentBorder[project.accent],
                  )}
                >
                  {block.body}
                </p>
              </Reveal>
            ))}
          </div>

          {/* Features */}
          <Reveal y={26} as="section" id="features" className="mt-16 scroll-mt-28">
            <div className="flex items-center gap-4">
              <span className={cn("hud text-[0.625rem]", accentText[project.accent])}>04</span>
              <span aria-hidden className="h-px flex-1 bg-edge" />
            </div>
            <h2 className="mt-5 font-display text-[clamp(1.6rem,3.4vw,2.6rem)] font-bold tracking-tight uppercase">
              Key features
            </h2>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {project.features.map((feature, index) => (
                <Reveal key={feature.title} y={22} delay={index * 0.06} className="h-full">
                  <div className="panel panel-hover group h-full p-6">
                    <div className="flex items-center justify-between">
                      <span className={cn("hud text-[0.5625rem]", accentText[project.accent])}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 rounded-full bg-edge transition-colors duration-500 group-hover:bg-acid"
                      />
                    </div>
                    <h3 className="mt-4 font-display text-base font-bold tracking-tight">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-ash">{feature.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* Highlights */}
          <Reveal y={26} as="section" id="highlights" className="mt-16 scroll-mt-28">
            <div className="flex items-center gap-4">
              <span className={cn("hud text-[0.625rem]", accentText[project.accent])}>05</span>
              <span aria-hidden className="h-px flex-1 bg-edge" />
            </div>
            <h2 className="mt-5 font-display text-[clamp(1.6rem,3.4vw,2.6rem)] font-bold tracking-tight uppercase">
              Engineering highlights
            </h2>

            <ul className="panel panel-flat mt-8 divide-y divide-edge/70">
              {project.highlights.map((highlight) => (
                <li key={highlight} className="group flex items-start gap-4 px-6 py-5 transition-colors duration-300 hover:bg-panel/60">
                  <Check className={cn("mt-0.5 h-4 w-4 shrink-0", accentText[project.accent])} strokeWidth={2} aria-hidden />
                  <span className="text-sm leading-relaxed text-ash transition-colors duration-300 group-hover:text-frost">
                    {highlight}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Stack */}
          <Reveal y={22} as="section" id="stack" className="mt-16 scroll-mt-28">
            <div className="flex items-center gap-4">
              <span className={cn("hud text-[0.625rem]", accentText[project.accent])}>06</span>
              <span aria-hidden className="h-px flex-1 bg-edge" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold tracking-tight uppercase">Technology stack</h2>
            <ul className="mt-7 flex flex-wrap gap-2">
              {project.stack.map((tech) => (
                <li key={tech} className="chip text-[0.6875rem]">
                  {tech}
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Links */}
          <Reveal y={22} as="section" id="links" className="mt-16 scroll-mt-28">
            <div className="flex items-center gap-4">
              <span className={cn("hud text-[0.625rem]", accentText[project.accent])}>07</span>
              <span aria-hidden className="h-px flex-1 bg-edge" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold tracking-tight uppercase">Links</h2>

            <div className="mt-7 flex flex-wrap gap-3">
              {project.links.map((link) =>
                link.href ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noreferrer noopener" : undefined}
                    className={cn("btn", link.kind === "live" ? "btn-primary" : "btn-ghost")}
                    data-cursor="hover"
                    data-cursor-label={link.kind === "source" ? "CODE" : "OPEN"}
                  >
                    <span>{link.label}</span>
                    {link.kind === "live" ? (
                      <ExternalLink className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    ) : (
                      <Link2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    )}
                  </a>
                ) : (
                  <span
                    key={link.label}
                    className="btn btn-ghost cursor-not-allowed opacity-45"
                    title="Add a URL for this project in src/data/projects.ts"
                  >
                    <span>{link.label}</span>
                    <span className="font-mono text-[0.5625rem] tracking-[0.14em]">PENDING</span>
                  </span>
                ),
              )}
            </div>

            {project.links.every((link) => !link.href) ? (
              <p className="hud mt-5 text-[0.5625rem] text-ash/70">
                LINKS ARE EMPTY IN THE SAMPLE DATA — ADD LIVE/SOURCE URLS IN{" "}
                <span className="text-frost">SRC/DATA/PROJECTS.TS</span>
              </p>
            ) : null}
          </Reveal>
        </div>
      </div>

      {/* Prev / next */}
      <nav aria-label="Project navigation" className="mt-20 grid gap-4 border-t border-edge/70 pt-10 sm:grid-cols-2">
        <Link
          href={`/projects/${prev.slug}`}
          className="panel panel-hover group flex items-center gap-4 p-6 transition-colors"
          data-cursor="hover"
          data-cursor-label="PREV"
        >
          <ArrowLeft
            className="h-5 w-5 shrink-0 text-ash transition-all duration-400 group-hover:-translate-x-1 group-hover:text-acid"
            strokeWidth={1.5}
            aria-hidden
          />
          <span className="min-w-0">
            <span className="hud block text-[0.5625rem] text-ash/70">PREVIOUS · {prev.codename}</span>
            <span className="mt-1.5 block truncate font-display text-lg font-bold tracking-tight uppercase group-hover:text-acid">
              {prev.title}
            </span>
          </span>
        </Link>

        <Link
          href={`/projects/${next.slug}`}
          className="panel panel-hover group flex items-center justify-end gap-4 p-6 text-right transition-colors"
          data-cursor="hover"
          data-cursor-label="NEXT"
        >
          <span className="min-w-0">
            <span className="hud block text-[0.5625rem] text-ash/70">NEXT · {next.codename}</span>
            <span className="mt-1.5 block truncate font-display text-lg font-bold tracking-tight uppercase group-hover:text-acid">
              {next.title}
            </span>
          </span>
          <ArrowRight
            className="h-5 w-5 shrink-0 text-ash transition-all duration-400 group-hover:translate-x-1 group-hover:text-acid"
            strokeWidth={1.5}
            aria-hidden
          />
        </Link>
      </nav>
    </article>
  );
}
