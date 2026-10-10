import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { services } from "@/data";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const accentText = {
  acid: "text-acid",
  volt: "text-volt",
  iris: "text-iris",
} as const;

const accentBorder = {
  acid: "group-hover:border-acid/45",
  volt: "group-hover:border-volt/45",
  iris: "group-hover:border-iris/50",
} as const;

/** Home page capability strip — the four core services from the brief. */
export function Capabilities() {
  const core = services.slice(0, 4);

  return (
    <section
      aria-label="Capabilities"
      className="relative border-y border-edge/60 bg-panel/20"
    >
      <div className="backdrop-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden />

      <div className="relative mx-auto w-full max-w-[1440px] px-5 py-24 lg:px-10 lg:py-28">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            index="03"
            eyebrow="SERVICE MODULES"
            title="WHAT I BUILD"
            description="Four disciplines that cover the whole stack — from the interface people touch to the services running underneath it."
            className="max-w-2xl"
          />
          <Reveal delay={0.12}>
            <Link
              href="/services"
              className="hud group flex items-center gap-2 border border-edge/90 px-4 py-3 text-[0.625rem] text-ash transition-colors duration-300 hover:border-acid/50 hover:text-acid"
              data-cursor="hover"
            >
              ALL SERVICES
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.5} aria-hidden />
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {core.map((service, index) => (
            <Reveal key={service.id} y={28} delay={index * 0.07} className="h-full">
              <article
                className={`panel panel-hover group relative flex h-full flex-col overflow-hidden p-6 ${accentBorder[service.accent]}`}
              >
                <span
                  aria-hidden
                  className="absolute -top-16 -right-16 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
                  style={{ background: `var(--color-${service.accent})` }}
                />

                <div className="flex items-start justify-between">
                  <span className={`flex h-11 w-11 items-center justify-center border border-edge/90 bg-void/60 ${accentText[service.accent]}`}>
                    <Icon name={service.icon} className="h-5 w-5" />
                  </span>
                  <span className="hud text-[0.625rem] text-ash/60">{service.index}</span>
                </div>

                <h3 className="mt-6 font-display text-lg font-bold tracking-tight uppercase">{service.title}</h3>
                <p className={`mt-2 font-mono text-[0.6875rem] ${accentText[service.accent]}`}>{service.tagline}</p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-ash">{service.description}</p>

                <ul className="mt-6 space-y-1.5 border-t border-edge/70 pt-4">
                  {service.deliverables.slice(0, 3).map((item) => (
                    <li key={item} className="flex items-start gap-2 font-mono text-[0.6875rem] text-ash/85">
                      <span aria-hidden className={`mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current ${accentText[service.accent]}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
