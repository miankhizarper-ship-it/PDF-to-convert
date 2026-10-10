/**
 * ─────────────────────────────────────────────────────────────
 *  ABOUT  ·  SAMPLE CONTENT
 *  First-person copy written as a template. Rewrite it in your
 *  own voice — no real clients, employers or metrics are claimed.
 * ─────────────────────────────────────────────────────────────
 */
export const about = {
  eyebrow: "02 // OPERATOR PROFILE",
  title: "A developer building at the edge of interface and engine.",
  lede:
    "I'm Your Name — a full-stack developer who treats the browser as a runtime for small worlds. My work sits between design engineering and systems work: reactive interfaces on the surface, typed and observable services underneath.",
  /** Long-form bio. Each string is rendered as its own paragraph. */
  bio: [
    "I started with markup and CSS, fell into JavaScript, and never really left the render loop. Today I build products end to end — component systems in React and TypeScript, 3D and motion work with Three.js and GSAP, and the Node services, databases and APIs that keep them honest under load.",
    "The part I care about most is feel. An interface should respond before you finish asking: motion that explains state, latency you can't perceive, and details that reward attention. That's why this portfolio is an orbital system rather than a stack of cards — the whole page reacts to your cursor, your scroll and your keyboard.",
    "I like working in small teams where design and engineering share a language. I write tests for the things that break quietly, document the things other people will maintain, and ship in slices small enough to review properly.",
    "Right now I'm exploring AI-assisted tooling — retrieval pipelines, agent interfaces and the unglamorous evaluation work that makes them trustworthy — alongside the 3D web, where GPUs keep making richer experiences possible without heavy downloads.",
  ],
  /** Operating principles — the "how I work" panel. */
  principles: [
    {
      title: "Performance is a feature",
      body: "Budgets for JavaScript, frame time and layout shift are decided before the first component is written.",
    },
    {
      title: "Interfaces should answer back",
      body: "Every state — loading, empty, error, success — is designed, not discovered by the user at the worst moment.",
    },
    {
      title: "Accessible by default",
      body: "Semantic HTML first, keyboard paths for everything, reduced-motion respected, contrast that survives a bright room.",
    },
    {
      title: "Boring infrastructure",
      body: "Typed APIs, idempotent writes, real logs and rollback plans. Novelty belongs in the product, not the plumbing.",
    },
  ],
  /** Quick facts rendered in the HUD panel. Editable placeholders. */
  facts: [
    { label: "Based in", value: "Remote — Your City" },
    { label: "Timezone", value: "UTC±00:00" },
    { label: "Focus", value: "Interfaces · APIs · AI tooling" },
    { label: "Languages", value: "English (edit me)" },
    { label: "Work model", value: "Freelance · Contract · Full-time" },
    { label: "Response time", value: "Within 48 hours" },
  ],
  /** Currently learning / experimenting with. */
  currentFocus: [
    "Real-time 3D on the web without heavy payloads",
    "Evaluation harnesses for LLM features",
    "Edge-rendered interfaces with streaming data",
    "Design systems that survive a redesign",
  ],
  /** Timeline of the "profile visual" — abstract, not a CV. */
  orbitLabels: ["DESIGN", "ENGINEER", "SHIP", "MEASURE", "REFINE"],
} as const;
