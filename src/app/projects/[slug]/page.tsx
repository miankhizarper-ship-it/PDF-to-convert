import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { allProjectSlugs, getAdjacentProjects, getProjectBySlug } from "@/data";
import { buildMetadata, projectJsonLd } from "@/lib/seo";
import { CaseStudy } from "@/components/sections/CaseStudy";

type RouteProps = { params: Promise<{ slug: string }> };

/** All case studies are known at build time, so they prerender as static pages. */
export function generateStaticParams() {
  return allProjectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return buildMetadata({ title: "Project not found", description: "This case file does not exist.", path: `/projects/${slug}` });

  return buildMetadata({
    title: project.title,
    description: project.summary,
    path: `/projects/${project.slug}`,
    type: "article",
    keywords: [project.title, ...project.stack, "case study", project.role],
  });
}

export default async function ProjectPage({ params }: RouteProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  const adjacent = getAdjacentProjects(slug);

  if (!project || !adjacent) notFound();

  return (
    <>
      <div className="mx-auto w-full max-w-[1440px] px-5 pt-28 lg:px-10 lg:pt-32">
        <Link
          href="/projects"
          className="hud inline-flex items-center gap-2 text-[0.5625rem] text-ash transition-colors hover:text-acid"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={2} aria-hidden />
          BACK TO ARCHIVE
        </Link>
      </div>

      <CaseStudy project={project} prev={adjacent.prev} next={adjacent.next} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            projectJsonLd({
              slug: project.slug,
              title: project.title,
              summary: project.summary,
              year: project.year,
              stack: project.stack,
            }),
          ),
        }}
      />
    </>
  );
}
