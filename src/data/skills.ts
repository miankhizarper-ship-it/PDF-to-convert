import type { SkillGroup } from "./types";

/**
 * ─────────────────────────────────────────────────────────────
 *  SKILLS  ·  SAMPLE CONTENT
 *  Levels are visual indicators, not certifications.
 *  Set each `level` (0–100) to whatever is honestly true for you.
 * ─────────────────────────────────────────────────────────────
 */
export const skillGroups: SkillGroup[] = [
  {
    id: "frontend",
    title: "Frontend Engineering",
    caption: "Interfaces, state and the render loop.",
    accent: "acid",
    icon: "code",
    skills: [
      { name: "React", level: 92, note: "App Router, Server Components, Suspense" },
      { name: "TypeScript", level: 90, note: "Strict mode, generics, inference-first APIs" },
      { name: "Next.js", level: 88, note: "Routing, streaming, serverless functions" },
      { name: "Tailwind CSS", level: 90, note: "Design tokens, v4 CSS-first theming" },
      { name: "HTML / CSS", level: 94, note: "Semantic markup, grid, container queries" },
      { name: "Accessibility", level: 82, note: "ARIA patterns, keyboard, screen readers" },
    ],
  },
  {
    id: "creative",
    title: "3D, Motion & Shaders",
    caption: "Real-time graphics and choreographed scroll.",
    accent: "iris",
    icon: "globe",
    skills: [
      { name: "Three.js", level: 80, note: "Geometry, materials, render targets" },
      { name: "React Three Fiber", level: 78, note: "Declarative scenes, perf budgets" },
      { name: "GLSL Shaders", level: 68, note: "Fresnel, noise, instanced particles" },
      { name: "GSAP", level: 86, note: "Timelines, ScrollTrigger, SVG morphing" },
      { name: "Canvas / SVG", level: 84, note: "Procedural art, path animation" },
    ],
  },
  {
    id: "backend",
    title: "Backend & Data",
    caption: "Services, storage and contracts.",
    accent: "volt",
    icon: "terminal",
    skills: [
      { name: "Node.js", level: 86, note: "HTTP services, streams, worker tasks" },
      { name: "MongoDB", level: 76, note: "Schema design, indexes, aggregation" },
      { name: "PostgreSQL", level: 72, note: "Relational modelling, migrations" },
      { name: "REST & Webhooks", level: 88, note: "Versioning, idempotency, validation" },
      { name: "Authentication", level: 78, note: "Sessions, OAuth, token handling" },
    ],
  },
  {
    id: "ai",
    title: "AI & Automation",
    caption: "Model features with guardrails attached.",
    accent: "acid",
    icon: "globe",
    skills: [
      { name: "LLM Integration", level: 74, note: "Streaming, tool calling, prompt versioning" },
      { name: "Retrieval / RAG", level: 70, note: "Chunking, embeddings, re-ranking" },
      { name: "Evaluation", level: 66, note: "Golden sets, regression harnesses" },
      { name: "Vector Databases", level: 64, note: "Index selection, hybrid search" },
    ],
  },
  {
    id: "platform",
    title: "Platform & Tooling",
    caption: "Shipping, observing and keeping it healthy.",
    accent: "iris",
    icon: "terminal",
    skills: [
      { name: "Git & GitHub", level: 90, note: "Trunk-based flow, review, Actions" },
      { name: "Vercel", level: 84, note: "Preview deploys, edge config, analytics" },
      { name: "Testing", level: 74, note: "Vitest, Playwright, contract tests" },
      { name: "CI / CD", level: 78, note: "Pipelines, caching, release gates" },
      { name: "Observability", level: 70, note: "Structured logs, traces, alerting" },
    ],
  },
];

/** Marquee of technologies that scrolls across the skills page. */
export const techMarquee = [
  "REACT",
  "TYPESCRIPT",
  "NEXT.JS",
  "THREE.JS",
  "R3F",
  "GSAP",
  "TAILWIND",
  "NODE.JS",
  "MONGODB",
  "POSTGRES",
  "GLSL",
  "VERCEL",
  "ZOD",
  "VITEST",
  "PLAYWRIGHT",
] as const;
