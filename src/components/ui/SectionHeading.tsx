import type { ReactNode } from "react";
import { GlitchText } from "./GlitchText";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  /** HUD index, e.g. "06". */
  index?: string;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  /** Apply the restrained glitch effect to the title. */
  glitch?: boolean;
  /** Render an accent word in the title using `[accent]word[/accent]` markers. */
  id?: string;
};

/**
 * Shared section header: mono eyebrow with a rule, oversized display title and
 * a muted description. Scroll-revealed as one unit.
 */
export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  align = "left",
  className,
  glitch = false,
  id,
}: SectionHeadingProps) {
  return (
    <Reveal
      id={id}
      className={cn("relative", align === "center" && "text-center", className)}
      y={22}
      duration={1}
    >
      <div
        className={cn(
          "hud flex items-center gap-3",
          align === "center" && "justify-center",
        )}
      >
        {index ? <span className="text-acid">{index}</span> : null}
        <span aria-hidden className="h-px w-10 bg-linear-to-r from-acid/70 to-transparent sm:w-16" />
        <span>{eyebrow}</span>
      </div>

      {glitch && typeof title === "string" ? (
        <GlitchText
          as="h2"
          className="mt-5 text-[clamp(2rem,5.4vw,4.25rem)] font-bold uppercase leading-[0.98]"
        >
          {title}
        </GlitchText>
      ) : (
        <h2 className="mt-5 text-[clamp(2rem,5.4vw,4.25rem)] font-bold uppercase leading-[0.98]">{title}</h2>
      )}

      {description ? (
        <p
          className={cn(
            "mt-5 max-w-2xl text-[0.975rem] leading-relaxed text-ash sm:text-base",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
