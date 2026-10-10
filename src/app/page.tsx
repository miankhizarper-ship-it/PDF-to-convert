import type { Metadata } from "next";
import { site } from "@/data";
import { buildMetadata } from "@/lib/seo";
import { Capabilities } from "@/components/sections/Capabilities";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { FeaturedProjects } from "@/components/sections/FeaturedProjects";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { OrbitDivider } from "@/components/ui/OrbitDivider";

export const metadata: Metadata = buildMetadata({
  title: `${site.headline} — ${site.name}`,
  description: site.description,
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <FeaturedProjects />
      <OrbitDivider accent="iris" label="SERVICE MODULES" />
      <Capabilities />
      <ContactCTA />
    </>
  );
}
