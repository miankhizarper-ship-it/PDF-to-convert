import type { Project } from "./types";

/**
 * ─────────────────────────────────────────────────────────────
 *  PROJECTS  ·  SAMPLE CONTENT — REPLACE WITH YOUR REAL WORK
 *  Each entry powers both the grid card and the case-study page
 *  at /projects/[slug]. Nothing below describes a real client,
 *  product or result; the copy is a template that shows the level
 *  of detail a strong case study needs.
 *
 *  To add a project: copy one object, change `slug`, `title` and
 *  the copy, and set `isSample: false` once it describes real work.
 *  Leave `links[].href` as "" to render a disabled "LINK PENDING"
 *  chip instead of a dead URL.
 * ─────────────────────────────────────────────────────────────
 */
export const projects: Project[] = [
  {
    slug: "nebula-commerce",
    title: "Nebula Commerce",
    codename: "ORB-01",
    year: "20XX",
    role: "Design engineer · Frontend architecture",
    status: "concept",
    accent: "acid",
    cover: "orbital",
    summary:
      "A headless storefront concept with a 3D product configurator, streaming cart state and a checkout that survives flaky networks.",
    problem:
      "Traditional storefront templates treat product pages as static brochures: a grid of images, a variant dropdown and a cart that forgets context between pages. Shoppers can't inspect what they're buying, and the experience collapses on slow connections.",
    solution:
      "A Next.js App Router storefront where the product surface is a real-time Three.js configurator — materials, lighting and variants update without a page transition. Cart and inventory state stream from server components, and every mutation is optimistic with a rollback path, so the UI never waits on a spinner for something it can already show.",
    outcome:
      "A reference implementation for interactive commerce: configurable products rendered client-side, server-authoritative pricing, and an offline-tolerant cart. Replace this paragraph with the results you actually measured.",
    stack: ["Next.js", "React", "TypeScript", "Three.js", "R3F", "Tailwind CSS", "Node.js", "Stripe"],
    features: [
      {
        title: "Real-time 3D configurator",
        description:
          "Variant, material and finish changes are applied to a single GLTF scene with instanced meshes, keeping draw calls flat while options multiply.",
      },
      {
        title: "Optimistic cart with rollback",
        description:
          "Mutations update local state first, reconcile against the server response, and surface a retry affordance when the network disagrees.",
      },
      {
        title: "Streaming product pages",
        description:
          "Server components render the shell and price immediately; imagery, reviews and recommendations arrive in Suspense boundaries.",
      },
      {
        title: "Graceful non-WebGL fallback",
        description:
          "Devices without hardware acceleration get a high-resolution image sequence with the same interaction model.",
      },
    ],
    highlights: [
      "Single-scene configurator: one GLTF, instanced variants, no re-mount cost",
      "Cart state reconciled by a typed reducer shared between server and client",
      "Lighthouse performance budget enforced in CI",
      "Reduced-motion and keyboard paths for every configurator control",
    ],
    links: [
      { label: "Live demo", href: "", kind: "live" },
      { label: "Source", href: "", kind: "source" },
    ],
    featured: true,
    isSample: true,
  },
  {
    slug: "atlas-pulse",
    title: "Atlas Pulse",
    codename: "ORB-02",
    year: "20XX",
    role: "Full-stack developer",
    status: "concept",
    accent: "volt",
    cover: "waveform",
    summary:
      "A real-time operations dashboard that turns noisy event streams into a readable signal — charts, alerts and drill-downs on one canvas.",
    problem:
      "Operational data usually arrives as a wall of tables and dashboards nobody trusts. Teams end up stitching screenshots into chat because the tooling can't answer the question they're actually asking: is this normal?",
    solution:
      "An event ingestion API with a WebSocket fan-out layer, feeding a React dashboard built around comparison rather than raw values. Every metric renders against its own baseline, anomalies are annotated in place, and any chart can be pinned into a custom board that persists per user.",
    outcome:
      "A dashboard architecture where the expensive question — 'compared to what?' — is answered by default. Replace with the operational impact you observed in a real deployment.",
    stack: ["Next.js", "TypeScript", "Node.js", "WebSockets", "MongoDB", "D3", "Tailwind CSS"],
    features: [
      {
        title: "Baseline-relative charts",
        description:
          "Each series is normalised against a rolling window, so a spike reads as a deviation instead of a number needing interpretation.",
      },
      {
        title: "Streaming ingestion",
        description:
          "Events are validated, batched and written with an idempotency key; the socket layer replays missed frames on reconnect.",
      },
      {
        title: "Pinnable boards",
        description:
          "Any panel can be pinned, resized and reordered into a saved layout — stored server-side per user.",
      },
      {
        title: "Alert annotations",
        description:
          "Threshold breaches appear on the chart at the exact timestamp, with a link to the underlying query.",
      },
    ],
    highlights: [
      "Backpressure handling on the socket layer prevents UI lockups during bursts",
      "Aggregation pipelines pre-compute baselines instead of querying raw events",
      "Canvas rendering for dense series, DOM for interactive overlays",
      "Keyboard-navigable charts with screen-reader summaries",
    ],
    links: [
      { label: "Live demo", href: "", kind: "live" },
      { label: "Source", href: "", kind: "source" },
    ],
    featured: true,
    isSample: true,
  },
  {
    slug: "synapse-copilot",
    title: "Synapse Copilot",
    codename: "ORB-03",
    year: "20XX",
    role: "AI engineer · Full-stack developer",
    status: "concept",
    accent: "iris",
    cover: "constellation",
    summary:
      "A retrieval-augmented support assistant with citation-first answers, an evaluation harness and a human escalation path baked into the UI.",
    problem:
      "Support teams are being sold chatbots that answer confidently and cite nothing. Without retrieval quality, evaluation and a clean handoff to a human, an LLM feature becomes a liability the moment it meets an angry customer.",
    solution:
      "A RAG pipeline over versioned documentation: chunking tuned per document type, hybrid retrieval with re-ranking, and answers that must attach sources or say they don't know. Every prompt revision runs against a golden-set evaluation before it ships, and the interface exposes confidence plus a one-click escalation to a human agent.",
    outcome:
      "A defensible pattern for shipping LLM features: measurable retrieval quality, visible provenance and an explicit failure mode. Replace with your own evaluation numbers.",
    stack: ["Next.js", "TypeScript", "Node.js", "OpenAI API", "Vector DB", "MongoDB", "Zod"],
    features: [
      {
        title: "Citation-first answers",
        description:
          "Responses are only rendered when retrieval returns sufficient evidence; otherwise the assistant declines and offers escalation.",
      },
      {
        title: "Evaluation harness",
        description:
          "A golden set of questions runs on every prompt or chunking change, reporting retrieval hit-rate and answer drift.",
      },
      {
        title: "Streaming with cancellation",
        description:
          "Tokens stream into the UI with a stop control, and partial answers are never persisted as complete.",
      },
      {
        title: "Human handoff",
        description:
          "A conversation can be escalated with full context — retrieved chunks, confidence and transcript — attached.",
      },
    ],
    highlights: [
      "Prompt versions stored alongside evaluations for reproducible comparisons",
      "Token budgets and cost ceilings enforced server-side",
      "PII scrubbing before content reaches the model provider",
      "Fallback model route when the primary provider degrades",
    ],
    links: [
      { label: "Live demo", href: "", kind: "live" },
      { label: "Source", href: "", kind: "source" },
      { label: "Write-up", href: "", kind: "writeup" },
    ],
    featured: true,
    isSample: true,
  },
  {
    slug: "vector-field",
    title: "Vector Field",
    codename: "ORB-04",
    year: "20XX",
    role: "Creative developer",
    status: "concept",
    accent: "acid",
    cover: "lattice",
    summary:
      "A generative visual engine: GPU particle systems driven by noise fields, exported as loops for the web and for large-format displays.",
    problem:
      "Generative visuals usually live in a sketch tool and die there — no controls, no consistent frame budget, no way to reuse a look across a site or an installation without rebuilding it.",
    solution:
      "A parameterised WebGL engine where flow fields, palettes and emission rules are data. Scenes are described by a JSON preset, rendered through instanced particle systems with custom GLSL, and captured deterministically so a preset always produces the same loop. The same engine drives a browser widget and an export pipeline.",
    outcome:
      "A reusable motion identity instead of one-off animations — one engine, many presets, predictable frame times. Replace with where you actually used it.",
    stack: ["Three.js", "GLSL", "TypeScript", "Vite", "Web Workers", "Canvas API"],
    features: [
      {
        title: "Preset-driven scenes",
        description:
          "A scene is a serialisable preset: field parameters, palette, emission and camera. Presets diff cleanly in version control.",
      },
      {
        title: "Instanced GPU particles",
        description:
          "Hundreds of thousands of particles in a single draw call, with simulation work moved into shaders and workers.",
      },
      {
        title: "Deterministic capture",
        description:
          "Seeded noise and a fixed timestep mean an export matches the preview exactly, frame for frame.",
      },
      {
        title: "Adaptive quality",
        description:
          "Particle count and DPR scale to measured frame time, so low-power devices get the same composition at lower density.",
      },
    ],
    highlights: [
      "Custom noise implementation shared between GLSL and TypeScript for parity",
      "Frame-time governor prevents thermal throttling on laptops",
      "Preset editor built as a reusable React control surface",
      "No raster assets — the entire library ships as code",
    ],
    links: [
      { label: "Live demo", href: "", kind: "live" },
      { label: "Source", href: "", kind: "source" },
    ],
    featured: false,
    isSample: true,
  },
  {
    slug: "orbit-api",
    title: "Orbit API",
    codename: "ORB-05",
    year: "20XX",
    role: "Backend engineer",
    status: "concept",
    accent: "volt",
    cover: "circuit",
    summary:
      "A public REST API with a developer portal: versioned routes, generated docs, sandboxed keys and abuse protection designed in from day one.",
    problem:
      "Internal APIs tend to go public by accident — undocumented routes, no rate limits, keys that can't be rotated and integrators who learn the contract by reading source code.",
    solution:
      "A Node.js API layer with schema validation at the edge, URL-prefixed versioning and a documented deprecation window. Keys are scoped and rotatable, rate limits are tiered per key, and the developer portal renders OpenAPI docs with a try-it console that uses a real sandbox key.",
    outcome:
      "An API surface that integrators can adopt without a call, and an operator can throttle without a redeploy. Replace with your own adoption numbers.",
    stack: ["Node.js", "TypeScript", "Fastify", "OpenAPI", "MongoDB", "Redis", "Docker"],
    features: [
      {
        title: "Contract-first routes",
        description:
          "OpenAPI documents are the source of truth; handlers, validation and client types are generated from them.",
      },
      {
        title: "Scoped, rotatable keys",
        description:
          "Keys carry scopes and expiry, with dual-key rotation so integrators never hit a hard cutover.",
      },
      {
        title: "Tiered rate limiting",
        description:
          "Sliding-window limits per key and per IP, with Retry-After headers and a visible usage endpoint.",
      },
      {
        title: "Sandbox console",
        description:
          "The docs portal executes real requests against a sandbox dataset, so examples are never stale.",
      },
    ],
    highlights: [
      "Idempotency keys on every mutating endpoint",
      "Structured request IDs threaded through logs and error responses",
      "Contract tests block deploys when the schema changes unexpectedly",
      "Zero-downtime migration path between API versions",
    ],
    links: [
      { label: "Docs", href: "", kind: "writeup" },
      { label: "Source", href: "", kind: "source" },
    ],
    featured: false,
    isSample: true,
  },
  {
    slug: "nocturne-system",
    title: "Nocturne System",
    codename: "ORB-06",
    year: "20XX",
    role: "Design systems engineer",
    status: "concept",
    accent: "iris",
    cover: "aperture",
    summary:
      "A dark-first design system: tokens, accessible primitives, motion guidelines and documentation that ships with the components.",
    problem:
      "Design systems usually fail on maintenance, not aesthetics — tokens drift from code, components grow variants nobody documented, and teams fork the button instead of filing an issue.",
    solution:
      "A token pipeline where design values compile into CSS variables, TypeScript types and Tailwind theme extensions from one source. Primitives are built on accessible patterns with keyboard behaviour tested, motion is expressed as named transitions rather than ad-hoc durations, and every component ships with docs, do/don't examples and a changelog generated from commit history.",
    outcome:
      "A system that stays true as products change: single-source tokens, tested accessibility, and documentation that's generated rather than remembered. Replace with your adoption story.",
    stack: ["React", "TypeScript", "Tailwind CSS", "Style Dictionary", "Vitest", "Playwright"],
    features: [
      {
        title: "Single-source tokens",
        description:
          "One token file compiles to CSS custom properties, TypeScript types and Tailwind theme values — drift is a build error.",
      },
      {
        title: "Accessible primitives",
        description:
          "Focus management, ARIA states and keyboard maps are implemented once and verified with automated tests.",
      },
      {
        title: "Named motion",
        description:
          "Transitions are tokens with intent (enter, exit, emphasise) and all honour prefers-reduced-motion.",
      },
      {
        title: "Generated documentation",
        description:
          "Props tables, examples and changelogs are derived from source, so docs can't fall behind the code.",
      },
    ],
    highlights: [
      "Dark-first palette with verified contrast ratios across every surface",
      "Component tests cover keyboard interaction, not just rendering",
      "Bundle-size budget per primitive, enforced in CI",
      "Migration codemods for breaking token changes",
    ],
    links: [
      { label: "Docs", href: "", kind: "writeup" },
      { label: "Source", href: "", kind: "source" },
    ],
    featured: false,
    isSample: true,
  },
];

/* ── helpers (server + client safe) ─────────────────────────── */

export const getProjects = (): Project[] => projects;

export const getFeaturedProjects = (): Project[] => projects.filter((p) => p.featured);

export const getProjectBySlug = (slug: string): Project | undefined =>
  projects.find((project) => project.slug === slug);

/** Previous / next project for case-study navigation, wrapping around the list. */
export const getAdjacentProjects = (slug: string): { prev: Project; next: Project } | null => {
  const index = projects.findIndex((project) => project.slug === slug);
  if (index === -1) return null;
  const prev = projects[(index - 1 + projects.length) % projects.length] as Project;
  const next = projects[(index + 1) % projects.length] as Project;
  return { prev, next };
};

export const allProjectSlugs = (): string[] => projects.map((project) => project.slug);

export const projectStackIndex = (): { name: string; count: number }[] => {
  const counts = new Map<string, number>();
  for (const project of projects) {
    for (const item of project.stack) counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};
