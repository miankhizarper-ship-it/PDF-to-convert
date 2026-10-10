import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type GlitchTextProps = {
  children: string;
  className?: string;
  /**
   * `always` keeps the slow ambient flicker, `hover` only glitches on
   * interaction. Both are neutralised by prefers-reduced-motion / calm mode.
   */
  mode?: "always" | "hover";
  as?: "h1" | "h2" | "h3" | "h4" | "span" | "p";
  /** Accessible label when the visible text is stylised or split. */
  label?: ReactNode;
};

/**
 * Restrained glitch typography. The effect is pure CSS (`data-text` clones in
 * ::before / ::after) so it costs nothing at runtime and never shifts layout.
 */
export function GlitchText({ children, className, mode = "always", as: Tag = "span", label }: GlitchTextProps) {
  return (
    <Tag
      className={cn("glitch", mode === "hover" && "glitch-hover-only", className)}
      data-text={children}
      aria-label={typeof label === "string" ? label : undefined}
    >
      {children}
    </Tag>
  );
}
