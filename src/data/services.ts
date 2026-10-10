import type { ServiceItem } from "./types";

/**
 * ─────────────────────────────────────────────────────────────
 *  SERVICES  ·  SAMPLE CONTENT
 *  Four core offerings from the brief plus two supporting ones.
 *  Edit titles, copy and deliverables to match what you sell.
 * ─────────────────────────────────────────────────────────────
 */
export const services: ServiceItem[] = [
  {
    id: "web-development",
    index: "01",
    title: "Web Development",
    tagline: "Interfaces that feel engineered, not assembled.",
    description:
      "Production React applications with TypeScript, design-system thinking and motion that explains state. Marketing sites, dashboards and product UIs — responsive, accessible and fast on a mid-range phone.",
    deliverables: [
      "React + TypeScript applications",
      "Component & design systems",
      "Motion, 3D and WebGL front-ends",
      "Core Web Vitals optimisation",
      "Accessibility (WCAG 2.2 AA) audits",
    ],
    icon: "code",
    accent: "acid",
  },
  {
    id: "backend-systems",
    index: "02",
    title: "Backend Systems",
    tagline: "Services that stay boring under load.",
    description:
      "Node.js services and serverless functions with typed contracts, proper validation and observable failure modes. Data modelling in MongoDB or Postgres, background jobs, caching and the deployment pipeline that ships them.",
    deliverables: [
      "Node.js / serverless services",
      "MongoDB & Postgres data modelling",
      "Auth, sessions and permissions",
      "Queues, jobs and cron workloads",
      "Logging, metrics and alerting",
    ],
    icon: "terminal",
    accent: "volt",
  },
  {
    id: "api-development",
    index: "03",
    title: "API Development",
    tagline: "Contracts first, endpoints second.",
    description:
      "REST and webhook APIs designed around the clients that use them: versioned routes, validation at the edge, rate limiting, idempotency and documentation that a teammate can build against without asking questions.",
    deliverables: [
      "REST API design & implementation",
      "Schema validation (Zod / JSON Schema)",
      "Rate limiting & abuse protection",
      "Third-party integrations & webhooks",
      "OpenAPI documentation",
    ],
    icon: "fileText",
    accent: "iris",
  },
  {
    id: "ai-applications",
    index: "04",
    title: "AI-Powered Applications",
    tagline: "Model features you can defend in production.",
    description:
      "LLM interfaces, retrieval pipelines and agent tooling built with the unglamorous parts included — prompt versioning, evaluation sets, token budgets, guardrails, streaming UI and fallbacks for when the model is wrong.",
    deliverables: [
      "LLM chat & copilot interfaces",
      "Retrieval (RAG) pipelines",
      "Agent tooling and function calling",
      "Evaluation sets & quality monitoring",
      "Cost, latency and safety guardrails",
    ],
    icon: "globe",
    accent: "acid",
  },
  {
    id: "creative-3d",
    index: "05",
    title: "Creative 3D & Motion",
    tagline: "Real-time scenes that ship under budget.",
    description:
      "Three.js and React Three Fiber experiences — wireframe geometry, shaders, particles and scroll-driven camera work — with fallbacks for low-power devices and reduced-motion settings.",
    deliverables: [
      "Three.js / R3F experiences",
      "Custom GLSL shaders",
      "GSAP scroll choreography",
      "Non-WebGL fallbacks",
      "Draw-call and payload budgets",
    ],
    icon: "code",
    accent: "volt",
  },
  {
    id: "platform-devops",
    index: "06",
    title: "Platform & Delivery",
    tagline: "From repository to production, repeatably.",
    description:
      "CI/CD, preview environments, environment hygiene and deployment strategy on Vercel and container hosts — so releases are a routine event instead of a scheduled crisis.",
    deliverables: [
      "Vercel / Node deployment setup",
      "CI pipelines & preview environments",
      "Environment & secrets management",
      "Monitoring and error tracking",
      "Technical documentation",
    ],
    icon: "terminal",
    accent: "iris",
  },
];

/** Process steps shown beneath the services grid. */
export const processSteps = [
  {
    index: "01",
    title: "Signal",
    body: "A short call and a written brief. We agree the problem, the constraints and what 'done' looks like.",
  },
  {
    index: "02",
    title: "Blueprint",
    body: "Architecture, data model, routes and a design direction — reviewed before anything is built.",
  },
  {
    index: "03",
    title: "Build",
    body: "Weekly slices on a preview URL, typed and tested as they land. You see progress, not promises.",
  },
  {
    index: "04",
    title: "Launch",
    body: "Performance pass, accessibility pass, deployment, monitoring, and handover documentation.",
  },
  {
    index: "05",
    title: "Orbit",
    body: "Post-launch support: iterate on feedback, watch the metrics, keep dependencies and infra healthy.",
  },
] as const;
