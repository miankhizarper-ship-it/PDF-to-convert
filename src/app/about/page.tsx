import type { Metadata } from "next";
import { site } from "@/data";
import { buildMetadata } from "@/lib/seo";
import { AboutStory } from "@/components/sections/AboutStory";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { OrbitDivider } from "@/components/ui/OrbitDivider";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description: `About ${site.name} — a ${site.role.toLowerCase()} working across interfaces, backend systems and AI-assisted tooling. Operating principles, profile data and current focus.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <PageHeader
        index="02"
        eyebrow="OPERATOR PROFILE"
        title="ABOUT"
        description="Who is behind the interface: how I work, what I optimise for, and what I'm currently digging into. Sample copy throughout — rewrite src/data/about.ts in your own voice."
        meta={[site.role, site.location, site.timezone, "Remote-first"]}
      />
      <AboutStory />
      <OrbitDivider accent="volt" label="END OF PROFILE" />
      <ContactCTA />
    </>
  );
}
