import type { MetadataRoute } from "next";
import { site } from "@/data";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.brand} — ${site.name}`,
    short_name: site.brand,
    description: site.description,
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#08090C",
    theme_color: "#08090C",
    categories: ["portfolio", "technology", "design"],
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/og.png", sizes: "1200x630", type: "image/png", purpose: "any" },
    ],
  };
}
