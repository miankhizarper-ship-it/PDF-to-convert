/**
 * Shared content types for ORBITAL//CYBER.
 * Every editable piece of the site is described here and populated in `src/data/*`.
 */

export type AccentKey = "acid" | "volt" | "iris";

export type SocialLink = {
  /** Human readable platform name. */
  label: string;
  /** Handle shown in the UI, e.g. "@yourhandle". */
  handle: string;
  href: string;
  /** Key resolved by `src/components/ui/SocialIcon.tsx` (lucide icon name). */
  icon: IconKey;
};

export type IconKey =
  | "github"
  | "linkedin"
  | "x"
  | "mail"
  | "globe"
  | "code"
  | "terminal"
  | "fileText";

export type NavItem = {
  label: string;
  href: string;
  /** Two-digit index shown by the cyber HUD, e.g. "01". */
  index: string;
  blurb: string;
};

export type ServiceItem = {
  id: string;
  index: string;
  title: string;
  tagline: string;
  description: string;
  deliverables: string[];
  icon: IconKey;
  accent: AccentKey;
};

export type SkillItem = {
  name: string;
  /** 0–100. Visual indicator only — set it to whatever feels true for you. */
  level: number;
  note?: string;
};

export type SkillGroup = {
  id: string;
  title: string;
  caption: string;
  accent: AccentKey;
  icon: IconKey;
  skills: SkillItem[];
};

export type ExperienceEntry = {
  id: string;
  role: string;
  organisation: string;
  period: string;
  location: string;
  type: "full-time" | "freelance" | "contract" | "personal" | "education";
  summary: string;
  highlights: string[];
  stack: string[];
  /** Marks placeholder content that you should replace with your own history. */
  isSample: boolean;
};

export type ProjectLink = {
  label: string;
  href: string;
  kind: "live" | "source" | "writeup";
};

export type ProjectFeature = {
  title: string;
  description: string;
};

/** Procedural cover variants — rendered as SVG, no raster assets required. */
export type CoverVariant = "orbital" | "lattice" | "waveform" | "aperture" | "constellation" | "circuit";

export type Project = {
  slug: string;
  title: string;
  /** HUD-style identifier, e.g. "ORB-01". */
  codename: string;
  year: string;
  role: string;
  status: "live" | "concept" | "in-progress" | "archive";
  accent: AccentKey;
  cover: CoverVariant;
  summary: string;
  problem: string;
  solution: string;
  outcome: string;
  stack: string[];
  features: ProjectFeature[];
  highlights: string[];
  links: ProjectLink[];
  featured: boolean;
  /** Marks placeholder content — replace with a real project. */
  isSample: boolean;
};

export type Availability = {
  status: "available" | "limited" | "unavailable";
  label: string;
  detail: string;
  updatedAt: string;
};
