import { ArrowRight } from "lucide-react";
import { getFeaturedProjects, getProjects } from "@/data";
import { ProjectCard } from "./ProjectCard";
import { ButtonLink } from "@/components/ui/NeonButton";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/** Home page: the strongest work, one feature card plus supporting projects. */
export function FeaturedProjects() {
  const featured = getFeaturedProjects();
  const [lead, ...rest] = featured.length > 0 ? featured : getProjects();
  const supporting = rest.slice(0, 2);

  if (!lead) return null;

  return (
    <section
      id="featured"
      aria-label="Featured work"
      className="relative mx-auto w-full max-w-[1440px] px-5 py-24 lg:px-10 lg:py-32"
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          index="02"
          eyebrow="SELECTED TRANSMISSIONS"
          title="FEATURED WORK"
          description="Case studies with the reasoning attached — the problem, the architecture chosen, and what it took to ship. Sample projects for now; drop your own into src/data/projects.ts."
          className="max-w-2xl"
        />
        <Reveal delay={0.15} className="shrink-0">
          <ButtonLink
            href="/projects"
            variant="ghost"
            icon={<ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
            cursorLabel="ALL"
          >
            All projects
          </ButtonLink>
        </Reveal>
      </div>

      <div className="mt-14 grid gap-6">
        <Reveal y={36} duration={1}>
          <ProjectCard project={lead} size="feature" index={0} />
        </Reveal>

        {supporting.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {supporting.map((project, index) => (
              <Reveal key={project.slug} y={30} delay={index * 0.09} className="h-full">
                <ProjectCard project={project} index={index + 1} className="h-full" />
              </Reveal>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
