import type { Metadata } from "next";
import { getProjects } from "@/data";
import { buildMetadata } from "@/lib/seo";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { ProjectsGrid } from "@/components/sections/ProjectsGrid";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = buildMetadata({
  title: "Projects",
  description: `Project archive — ${getProjects().length} case studies covering the problem, the solution, the stack and the engineering highlights of each build.`,
  path: "/projects",
  keywords: ["developer projects", "case studies", "react projects", "three.js projects", "api projects", "ai projects"],
});

export default function ProjectsPage() {
  const projects = getProjects();
  const technologies = new Set(projects.flatMap((project) => project.stack));

  return (
    <>
      <PageHeader
        index="06"
        eyebrow="PROJECT ARCHIVE"
        title="PROJECTS"
        description="Each card opens a full case study: the problem, the solution chosen, what it took to build, and the technology behind it. Filter the archive by technology or status."
        meta={[`${projects.length} case files`, `${technologies.size} technologies`, "Problem → solution → outcome"]}
      />
      <ProjectsGrid />
      <ContactCTA />
    </>
  );
}
