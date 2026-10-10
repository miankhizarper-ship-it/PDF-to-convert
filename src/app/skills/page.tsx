import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { SkillsPanel } from "@/components/sections/SkillsPanel";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Marquee } from "@/components/sections/Marquee";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = buildMetadata({
  title: "Skills",
  description:
    "Interactive capability matrix: frontend engineering, 3D and motion, backend and data, AI and automation, platform and tooling — with self-assessed working levels.",
  path: "/skills",
  keywords: ["react skills", "typescript", "three.js", "gsap", "node.js", "mongodb", "llm integration"],
});

export default function SkillsPage() {
  return (
    <>
      <PageHeader
        index="04"
        eyebrow="CAPABILITY MATRIX"
        title="SKILLS"
        description="Grouped by discipline, with an honest self-assessed level for each technology. Switch groups with the arrow keys — the whole matrix is keyboard operable."
        meta={["Frontend", "3D & motion", "Backend & data", "AI", "Platform"]}
      />
      <SkillsPanel />
      <Marquee />
      <ContactCTA />
    </>
  );
}
