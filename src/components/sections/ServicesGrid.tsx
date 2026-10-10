import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { services, site } from "@/data";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const accentText = { acid: "text-acid", volt: "text-volt", iris: "text-iris" } as const;
const accentChip = { acid: "chip-acid", volt: "chip-volt", iris: "chip-iris" } as const;

/** Services page: the full offering, one card per discipline. */
export function ServicesGrid() {
  return (
    <section
      aria-label="Services"
      className="relative mx-auto w-full max-w-[1440px] px-5 pt-8 pb-20 lg:px-10 lg:pb-28"
    >
      <SectionHeading
        index="03"
        eyebrow="SERVICE MODULES"
        title="WHAT I CAN BUILD FOR YOU"
        description="Six modules that can be combined: a marketing site with a headless CMS, an API behind a dashboard, an AI feature inside an existing product. Scope is agreed in writing before anything is built."
        className="max-w-3xl"
        glitch
      />

      <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service, index) => (
          <Reveal key={service.id} y={30} delay={(index % 3) * 0.07} className="h-full">
            <article className="panel panel-hover group relative flex h-full flex-col overflow-hidden p-7">
              <span
                aria-hidden
                className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-30"
                style={{ background: `var(--color-${service.accent})` }}
              />

              <header className="relative flex items-start justify-between gap-4">
                <span
                  className={`flex h-12 w-12 items-center justify-center border border-edge/90 bg-void/60 transition-colors duration-500 ${accentText[service.accent]}`}
                >
                  <Icon name={service.icon} className="h-5 w-5" />
                </span>
                <span
                  aria-hidden
                  className="font-display text-4xl font-bold tracking-tighter text-edge transition-colors duration-500 group-hover:text-acid/40"
                >
                  {service.index}
                </span>
              </header>

              <h2 className="relative mt-7 font-display text-2xl font-bold tracking-tight uppercase">{service.title}</h2>
              <p className={`relative mt-2 font-mono text-[0.6875rem] ${accentText[service.accent]}`}>{service.tagline}</p>
              <p className="relative mt-5 flex-1 text-sm leading-relaxed text-ash">{service.description}</p>

              <ul className="relative mt-7 space-y-2 border-t border-edge/70 pt-5">
                {service.deliverables.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[0.8125rem] text-ash/90">
                    <span aria-hidden className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${service.accent === "iris" ? "bg-iris" : service.accent === "volt" ? "bg-volt" : "bg-acid"}`} />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/contact"
                className={`relative mt-7 inline-flex items-center gap-2 font-mono text-[0.6875rem] tracking-[0.16em] uppercase transition-colors duration-300 ${accentText[service.accent]}`}
                data-cursor="hover"
                data-cursor-label="ASK"
              >
                Enquire about this
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.75} aria-hidden />
              </Link>
            </article>
          </Reveal>
        ))}
      </div>

      {/* Engagement note */}
      <Reveal y={24} className="mt-6">
        <div className="panel panel-flat flex flex-col gap-6 p-7 md:flex-row md:items-center md:justify-between lg:p-9">
          <div className="max-w-2xl">
            <h2 className="hud text-acid">NOT SURE WHICH MODULE YOU NEED?</h2>
            <p className="mt-4 text-sm leading-relaxed text-ash">
              Send the problem instead of the specification. Most engagements start as a short paid
              discovery: architecture sketch, data model, risk list and a build plan you can hand to
              anyone — including another developer.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <span className={`chip ${accentChip.acid}`}>{site.role}</span>
            <Link href="/contact" className="chip" data-cursor="hover">
              Start a conversation
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
