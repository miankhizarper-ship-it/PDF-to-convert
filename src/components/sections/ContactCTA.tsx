import { ArrowRight, Mail } from "lucide-react";
import { availability, site } from "@/data";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";
import { GlitchText } from "@/components/ui/GlitchText";
import { ButtonLink } from "@/components/ui/NeonButton";
import { Reveal } from "@/components/ui/Reveal";

/** Closing call to action used at the bottom of the home page. */
export function ContactCTA() {
  return (
    <section aria-label="Contact call to action" className="relative mx-auto w-full max-w-[1440px] px-5 py-24 lg:px-10 lg:py-32">
      <Reveal y={34} duration={1.05}>
        <div className="panel relative overflow-hidden px-6 py-16 sm:px-12 lg:px-16 lg:py-20">
          {/* Orbital decoration */}
          <svg
            viewBox="0 0 600 600"
            className="pointer-events-none absolute -top-40 -right-40 h-[520px] w-[520px] opacity-45"
            aria-hidden
          >
            <g fill="none" transform="rotate(-18 300 300)">
              <circle cx="300" cy="300" r="120" stroke="var(--color-acid)" strokeOpacity="0.45" />
              <ellipse cx="300" cy="300" rx="200" ry="72" stroke="var(--color-iris)" strokeOpacity="0.4" />
              <ellipse cx="300" cy="300" rx="72" ry="200" stroke="var(--color-volt)" strokeOpacity="0.3" />
              <circle cx="300" cy="300" r="268" stroke="var(--color-edge)" strokeDasharray="2 10" />
              <circle cx="420" cy="300" r="5" fill="var(--color-acid)" stroke="none" />
              <circle cx="300" cy="100" r="4" fill="var(--color-volt)" stroke="none" />
            </g>
          </svg>

          <div className="relative max-w-2xl">
            <p className="hud flex items-center gap-3 text-acid">
              <span aria-hidden>07 //</span> TRANSMISSION CHANNEL
            </p>

            <GlitchText
              as="h2"
              className="mt-6 font-display text-[clamp(2.25rem,6.5vw,4.75rem)] leading-[0.92] font-bold tracking-[-0.03em] uppercase"
            >
              LET’S BUILD A WORLD
            </GlitchText>

            <p className="mt-6 text-base leading-relaxed text-ash sm:text-lg">
              {availability.detail} Tell me what you are making — the constraints, the deadline and the
              part that feels hard. You will get a real reply, not an autoresponder.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink
                href="/contact"
                icon={<ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />}
                cursorLabel="SEND"
              >
                Contact Me
              </ButtonLink>
              <ButtonLink
                href={`mailto:${site.email}`}
                variant="ghost"
                icon={<Mail className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
                cursorLabel="MAIL"
              >
                {site.email}
              </ButtonLink>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-4 border-t border-edge/70 pt-7">
              <AvailabilityBadge size="sm" />
              <span className="hud text-[0.5625rem] text-ash/70">
                {site.location} · {site.timezone}
              </span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
