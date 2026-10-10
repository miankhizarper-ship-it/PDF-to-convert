import type { ExperienceEntry } from "./types";

/**
 * ─────────────────────────────────────────────────────────────
 *  EXPERIENCE  ·  SAMPLE CONTENT — REPLACE WITH YOUR OWN
 *  Nothing here describes a real employer, client or achievement.
 *  Organisation names are bracketed placeholders and every entry
 *  is flagged `isSample: true`, which renders a "SAMPLE" chip in
 *  the timeline until you overwrite it with your real history.
 * ─────────────────────────────────────────────────────────────
 */
export const experience: ExperienceEntry[] = [
  {
    id: "independent",
    role: "Full-Stack Developer",
    organisation: "[Independent / Your Practice]",
    period: "20XX — Present",
    location: "Remote",
    type: "freelance",
    summary:
      "End-to-end product work for small teams: design engineering, backend services and the deployment pipeline that connects them.",
    highlights: [
      "Build React + TypeScript front-ends with design-system foundations and motion direction.",
      "Implement Node.js services and APIs with validation, rate limiting and structured logging.",
      "Own delivery: preview environments, CI, monitoring and handover documentation.",
    ],
    stack: ["React", "TypeScript", "Next.js", "Node.js", "MongoDB", "Vercel"],
    isSample: true,
  },
  {
    id: "product-team",
    role: "Frontend Engineer",
    organisation: "[Product Studio / Your Employer]",
    period: "20XX — 20XX",
    location: "[City / Remote]",
    type: "full-time",
    summary:
      "Interface work inside a cross-functional product team, focused on component architecture and perceived performance.",
    highlights: [
      "Maintained and extended a shared component library used across several products.",
      "Improved interaction performance: bundle splitting, image strategy, render profiling.",
      "Paired with designers on prototypes, then hardened them into production components.",
    ],
    stack: ["React", "TypeScript", "Storybook", "Tailwind CSS", "GSAP"],
    isSample: true,
  },
  {
    id: "web-developer",
    role: "Web Developer",
    organisation: "[Agency / Your First Role]",
    period: "20XX — 20XX",
    location: "[City]",
    type: "full-time",
    summary:
      "Shipped marketing sites and small applications across the full stack, from markup to hosting.",
    highlights: [
      "Delivered responsive, accessible sites against tight deadlines.",
      "Integrated third-party APIs: payments, forms, analytics and CMS platforms.",
      "Introduced version control and review habits to a small team.",
    ],
    stack: ["JavaScript", "HTML", "CSS", "Node.js", "REST APIs"],
    isSample: true,
  },
  {
    id: "learning",
    role: "Self-Directed Learning & Open Source",
    organisation: "[Personal Projects]",
    period: "20XX",
    location: "Anywhere",
    type: "personal",
    summary:
      "Deliberate practice: rebuilding the fundamentals, contributing to open source and shipping small experiments in public.",
    highlights: [
      "Studied rendering, networking and data modelling beyond framework defaults.",
      "Published experiments and utilities with documentation and tests.",
      "Kept a build log to track what actually worked.",
    ],
    stack: ["Three.js", "GLSL", "Node.js", "PostgreSQL"],
    isSample: true,
  },
];

/** Education / credentials panel — placeholders, not claims. */
export const education = [
  {
    title: "[Degree / Certification]",
    issuer: "[Institution or Platform]",
    period: "20XX",
    detail: "Replace with your qualification, or delete this panel entirely.",
  },
  {
    title: "[Course / Specialisation]",
    issuer: "[Provider]",
    period: "20XX",
    detail: "Continuous learning entry — edit or remove.",
  },
] as const;
