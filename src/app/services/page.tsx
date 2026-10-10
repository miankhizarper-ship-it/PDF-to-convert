import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { ProcessRail } from "@/components/sections/ProcessRail";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = buildMetadata({
  title: "Services",
  description:
    "Web development, backend systems, API development and AI-powered applications — plus creative 3D and platform work. Six modules with a written, five-stage delivery process.",
  path: "/services",
  keywords: [
    "web development services",
    "backend development",
    "api development",
    "ai application development",
    "three.js developer",
    "freelance developer",
  ],
});

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        index="03"
        eyebrow="SERVICE MODULES"
        title="SERVICES"
        description="Six modules that combine into whatever you're actually building: a product front-end, the API behind it, an AI feature inside an existing system, or the whole thing from an empty repository."
        meta={["Web development", "Backend systems", "APIs", "AI applications", "3D & motion", "Platform"]}
      />
      <ServicesGrid />
      <ProcessRail />
      <ContactCTA />
    </>
  );
}
