import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { ExperienceTimeline } from "@/components/sections/ExperienceTimeline";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { OrbitDivider } from "@/components/ui/OrbitDivider";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = buildMetadata({
  title: "Experience",
  description:
    "Flight log: an animated timeline of roles, responsibilities and the stack used in each. Entries ship as clearly labelled sample content until you add your own history.",
  path: "/experience",
});

export default function ExperiencePage() {
  return (
    <>
      <PageHeader
        index="05"
        eyebrow="FLIGHT LOG"
        title="EXPERIENCE"
        description="The route so far, drawn as a timeline. Everything below is labelled sample content: organisation names are placeholders and no client, employer or metric is invented — replace them in src/data/experience.ts."
        meta={["Timeline", "Roles", "Stack per role", "Education"]}
      />
      <ExperienceTimeline />
      <OrbitDivider accent="acid" label="LOG COMPLETE" />
      <ContactCTA />
    </>
  );
}
