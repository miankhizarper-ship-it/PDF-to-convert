import type { Availability, SocialLink } from "./types";

/**
 * ─────────────────────────────────────────────────────────────
 *  SITE IDENTITY  ·  SAMPLE CONTENT
 *  This is the single place to personalise the portfolio.
 *  Everything below is placeholder copy — swap in your own
 *  name, bio, links and availability. Nothing here is a claim
 *  about real clients, employers or achievements.
 * ─────────────────────────────────────────────────────────────
 */
export const site = {
  /** Replace with your name. */
  name: "Your Name",
  /** Short brand used by the nav, loader and metadata. */
  brand: "ORBITAL//CYBER",
  brandSuffix: "//CYBER",
  role: "Full-Stack Developer",
  /** Hero headline is fixed by the design brief: */
  headline: "BUILDING DIGITAL WORLDS",
  headlineAccent: "WORLDS",
  /** Short developer introduction shown under the headline. */
  intro:
    "I design and engineer immersive web experiences — 3D interfaces, resilient backend systems and AI-assisted tooling — built to feel like a place, not a page.",
  /** Second, longer intro used by the About page and metadata. */
  description:
    "Portfolio of Your Name — a full-stack developer building immersive interfaces, backend systems, APIs and AI-powered applications. ORBITAL//CYBER fuses an orbital 3D universe with cybernetic neon design.",
  location: "Remote — Your City",
  timezone: "UTC±00:00",
  email: "you@yourdomain.dev",
  /** Shown in the footer and contact page. */
  legalName: "Your Name",
  keywords: [
    "full-stack developer",
    "creative developer",
    "react developer",
    "three.js",
    "webgl portfolio",
    "node.js",
    "typescript",
    "ai applications",
    "backend systems",
    "api development",
  ],
} as const;

export const availability: Availability = {
  status: "available",
  label: "Available for work",
  detail: "Open to freelance projects, contracts and full-time roles.",
  updatedAt: "2026-10-01",
};

/**
 * Social links — SAMPLE. Point `href` at your real profiles and
 * delete anything you do not use. Icons resolve via `IconKey`.
 */
export const socials: SocialLink[] = [
  { label: "GitHub", handle: "@yourhandle", href: "https://github.com/yourhandle", icon: "github" },
  { label: "LinkedIn", handle: "in/yourhandle", href: "https://www.linkedin.com/in/yourhandle", icon: "linkedin" },
  { label: "X / Twitter", handle: "@yourhandle", href: "https://x.com/yourhandle", icon: "x" },
  { label: "Email", handle: site.email, href: `mailto:${site.email}`, icon: "mail" },
];

/** Rotating status lines for the hero HUD ticker. */
export const hudLines = [
  "ORBITAL RENDER ENGINE :: ONLINE",
  "NEURAL INTERFACE :: CALIBRATED",
  "SIGNAL LATENCY :: 12MS",
  "STACK :: REACT · TYPESCRIPT · THREE.JS · NODE",
  "STATUS :: ACCEPTING NEW MISSIONS",
] as const;
