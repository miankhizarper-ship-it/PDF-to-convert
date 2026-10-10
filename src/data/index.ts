/**
 * Barrel for all site content. Import from `@/data` inside components so the
 * whole portfolio stays editable from `src/data/*` alone.
 */
export * from "./types";
export { site, availability, socials, hudLines } from "./site";
export { navigation, paletteActions } from "./navigation";
export { about } from "./about";
export { services, processSteps } from "./services";
export { skillGroups, techMarquee } from "./skills";
export { experience, education } from "./experience";
export {
  projects,
  getProjects,
  getFeaturedProjects,
  getProjectBySlug,
  getAdjacentProjects,
  allProjectSlugs,
  projectStackIndex,
} from "./projects";
