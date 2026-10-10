import type { ReactNode } from "react";
import { GlitchText } from "./GlitchText";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  index: string;
  eyebrow: string;
  title: string;
  description?: string;
  glitch?: boolean;
  /** Small HUD facts rendered under the description. */
  meta?: string[];
  children?: ReactNode;
};

/** Consistent header for every inner route: HUD eyebrow, oversized title, orbital art. */
export function PageHeader({ index, eyebrow, title, description, glitch = true, meta, children }: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden px-5 pt-32 pb-14 lg:px-10 lg:pt-44 lg:pb-20">
      {/* Orbital decoration */}
      <svg
        viewBox="0 0 600 600"
        className="pointer-events-none absolute -top-52 -right-40 h-[560px] w-[560px] opacity-35 lg:-right-24"
        aria-hidden
      >
        <g fill="none" transform="rotate(-14 300 300)">
          <circle cx="300" cy="300" r="128" stroke="var(--color-acid)" strokeOpacity="0.4" />
          <circle cx="300" cy="300" r="212" stroke="var(--color-iris)" strokeOpacity="0.3" strokeDasharray="3 9" />
          <ellipse cx="300" cy="300" rx="272" ry="98" stroke="var(--color-volt)" strokeOpacity="0.28" />
          <ellipse cx="300" cy="300" rx="98" ry="272" stroke="var(--color-acid)" strokeOpacity="0.16" />
          <circle cx="300" cy="300" r="8" fill="var(--color-volt)" stroke="none" />
          <circle cx="428" cy="300" r="4.5" fill="var(--color-acid)" stroke="none" />
        </g>
      </svg>

      <div className="relative mx-auto w-full max-w-[1440px]">
        <Reveal y={16} duration={0.8}>
          <div className="hud flex items-center gap-3">
            <span className="text-acid">{index}</span>
            <span aria-hidden className="h-px w-12 bg-linear-to-r from-acid/70 to-transparent" />
            <span>{eyebrow}</span>
          </div>
        </Reveal>

        {glitch ? (
          <GlitchText
            as="h1"
            className="mt-6 font-display text-[clamp(2.6rem,9vw,6.5rem)] leading-[0.88] font-bold tracking-[-0.04em] uppercase"
          >
            {title}
          </GlitchText>
        ) : (
          <h1 className="mt-6 font-display text-[clamp(2.6rem,9vw,6.5rem)] leading-[0.88] font-bold tracking-[-0.04em] uppercase">
            {title}
          </h1>
        )}

        {description ? (
          <Reveal y={20} delay={0.08}>
            <p className={cn("mt-7 max-w-2xl text-[0.9375rem] leading-relaxed text-ash sm:text-base")}>{description}</p>
          </Reveal>
        ) : null}

        {meta && meta.length > 0 ? (
          <Reveal y={16} delay={0.14}>
            <ul className="mt-8 flex flex-wrap items-center gap-2">
              {meta.map((item) => (
                <li key={item} className="chip text-[0.625rem]">
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}

        {children}
      </div>

      <span aria-hidden className="pointer-events-none absolute inset-x-5 bottom-0 h-px bg-linear-to-r from-transparent via-edge to-transparent lg:inset-x-10" />
    </header>
  );
}
