import Link from "next/link";
import { ArrowRight, Radar } from "lucide-react";
import { OrbitalFallback } from "@/components/canvas/OrbitalFallback";
import { GlitchText } from "@/components/ui/GlitchText";
import { ButtonLink } from "@/components/ui/NeonButton";
import { navigation } from "@/data";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[86svh] items-center justify-center overflow-hidden px-5 pt-32 pb-20">
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
        <OrbitalFallback />
      </div>

      <div className="relative max-w-xl text-center">
        <p className="hud flex items-center justify-center gap-3 text-acid">
          <Radar className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          ERROR 404 // SIGNAL LOST
        </p>

        <GlitchText
          as="h1"
          className="mt-6 font-display text-[clamp(3.5rem,14vw,8rem)] leading-[0.85] font-bold tracking-[-0.04em] uppercase"
        >
          OFF ORBIT
        </GlitchText>

        <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-ash sm:text-base">
          This coordinate doesn’t exist in the system. The page may have been moved, renamed, or it
          never launched at all.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/" icon={<ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />} cursorLabel="HOME">
            Return to base
          </ButtonLink>
          <ButtonLink href="/projects" variant="ghost">
            Browse projects
          </ButtonLink>
        </div>

        <nav aria-label="Suggested sections" className="mt-12 border-t border-edge/70 pt-7">
          <p className="hud text-[0.5625rem] text-ash/70">JUMP TO</p>
          <ul className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="chip text-[0.625rem] hover:text-acid">
                  <span className="text-acid/70">{item.index}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
