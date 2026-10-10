import type { Metadata } from "next";
import { site } from "@/data";

/** Canonical origin — set `NEXT_PUBLIC_SITE_URL` in production. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function absoluteUrl(path = "/"): string {
  return new URL(path, siteUrl).toString();
}

export type SeoInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  type?: "website" | "article";
  image?: string;
};

/** Builds consistent metadata (Open Graph + Twitter + canonical) for a route. */
export function buildMetadata({
  title,
  description,
  path = "/",
  keywords = [...site.keywords],
  type = "website",
  image = "/og.png",
}: SeoInput): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      siteName: site.brand,
      title: `${title} — ${site.brand}`,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: `${site.brand} — ${site.role} portfolio` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${site.brand}`,
      description,
      images: [imageUrl],
    },
  };
}

/** JSON-LD blocks injected by the root layout / project pages. */
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    jobTitle: site.role,
    description: site.description,
    url: absoluteUrl("/"),
    email: `mailto:${site.email}`,
    knowsAbout: [...site.keywords],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.brand,
    url: absoluteUrl("/"),
    description: site.description,
    inLanguage: "en",
  };
}

export function projectJsonLd(project: {
  slug: string;
  title: string;
  summary: string;
  year: string;
  stack: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary,
    url: absoluteUrl(`/projects/${project.slug}`),
    dateCreated: project.year,
    keywords: project.stack.join(", "),
  };
}
