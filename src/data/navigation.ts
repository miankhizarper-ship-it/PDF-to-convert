import type { NavItem } from "./types";

/**
 * Primary navigation. The same list drives the header, the mobile
 * overlay menu and the ⌘K command palette, so editing it here
 * updates the whole site.
 */
export const navigation: NavItem[] = [
  { label: "Home", href: "/", index: "01", blurb: "Orbital hero and featured work" },
  { label: "About", href: "/about", index: "02", blurb: "Who is behind the interface" },
  { label: "Services", href: "/services", index: "03", blurb: "Web, backend, APIs and AI" },
  { label: "Skills", href: "/skills", index: "04", blurb: "Toolkit and proficiency map" },
  { label: "Experience", href: "/experience", index: "05", blurb: "Timeline of the journey" },
  { label: "Projects", href: "/projects", index: "06", blurb: "Case studies and builds" },
  { label: "Contact", href: "/contact", index: "07", blurb: "Start a transmission" },
];

/** Extra commands offered inside the ⌘K palette. All are implemented in `CommandPalette.tsx`. */
export const paletteActions = [
  { label: "Copy email address", id: "copy-email", group: "Actions", hint: "clipboard" },
  { label: "Toggle calm mode (disable animation)", id: "toggle-motion", group: "Actions", hint: "a11y" },
  { label: "Check availability status", id: "availability", group: "Actions", hint: "status" },
] as const;
