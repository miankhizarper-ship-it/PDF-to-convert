import type { MetadataRoute } from "next";
import { allProjectSlugs, navigation } from "@/data";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes = navigation.map((item, index) => ({
    url: absoluteUrl(item.href),
    lastModified,
    changeFrequency: (index === 0 ? "weekly" : "monthly") as "weekly" | "monthly",
    priority: index === 0 ? 1 : 0.8,
  }));

  const projectRoutes = allProjectSlugs().map((slug) => ({
    url: absoluteUrl(`/projects/${slug}`),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...projectRoutes];
}
