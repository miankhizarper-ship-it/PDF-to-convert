import { Code, FileText, Globe, Link2, Mail, Terminal, type LucideIcon } from "lucide-react";
import type { IconKey } from "@/data/types";

/**
 * Icon resolver.
 *
 * lucide-react v1 dropped brand marks (GitHub, LinkedIn, X), so those three are
 * hand-drawn inline SVGs here; everything else delegates to lucide and is
 * tree-shaken by `optimizePackageImports`.
 */

type IconProps = {
  name: IconKey;
  className?: string;
  strokeWidth?: number;
  title?: string;
};

const lucideMap: Partial<Record<IconKey, LucideIcon>> = {
  mail: Mail,
  globe: Globe,
  code: Code,
  terminal: Terminal,
  fileText: FileText,
};

const BRAND_PATHS: Partial<Record<IconKey, string>> = {
  github:
    "M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 2.87-.39c.97 0 1.95.13 2.87.39 2.18-1.49 3.14-1.18 3.14-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.7 5.38-5.26 5.67.41.35.77 1.04.77 2.1 0 1.52-.01 2.74-.01 3.11 0 .31.2.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z",
  linkedin:
    "M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z",
  x: "M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.82-5.97 6.82H1.66l7.73-8.84L1.25 2.25h6.82l4.71 6.23 5.46-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.04l12.04 15.64Z",
};

export function Icon({ name, className, strokeWidth = 1.5, title }: IconProps) {
  const brandPath = BRAND_PATHS[name];

  if (brandPath) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden={title ? undefined : true}
        role={title ? "img" : undefined}
        className={className}
        fill="currentColor"
        focusable="false"
      >
        {title ? <title>{title}</title> : null}
        <path d={brandPath} />
      </svg>
    );
  }

  const LucideComponent = lucideMap[name] ?? Link2;
  return (
    <LucideComponent
      className={className}
      strokeWidth={strokeWidth}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
    </LucideComponent>
  );
}
