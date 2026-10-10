import { Clock, Mail, MapPin, MessageSquare, Radio } from "lucide-react";
import { availability, site, socials } from "@/data";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";

const nextSteps = [
  {
    icon: MessageSquare,
    title: "I read it myself",
    body: "No autoresponder, no sales funnel. You get a reply from the person who would do the work.",
  },
  {
    icon: Clock,
    title: "Within 48 hours",
    body: "Usually sooner. If it's urgent, say so in the subject line and I'll flag it.",
  },
  {
    icon: Radio,
    title: "Then a short call",
    body: "Thirty minutes to understand the problem, the constraints and whether I'm the right fit.",
  },
];

/** Contact page sidebar: availability, direct channels and what happens next. */
export function ContactPanel() {
  return (
    <div className="space-y-5">
      <Reveal y={24}>
        <div className="panel panel-flat relative overflow-hidden p-7">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-20 -right-16 h-44 w-44 rounded-full bg-volt/12 blur-3xl"
          />
          <p className="hud flex items-center gap-2 text-volt">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-pulse-node rounded-full bg-volt" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-volt" />
            </span>
            CURRENT STATUS
          </p>
          <p className="mt-5 font-display text-2xl leading-tight font-bold tracking-tight uppercase">
            {availability.label}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ash">{availability.detail}</p>

          <dl className="mt-7 space-y-3 border-t border-edge/70 pt-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 shrink-0 text-ash/70" strokeWidth={1.5} aria-hidden />
              <dt className="sr-only">Location</dt>
              <dd className="font-mono text-[0.6875rem] text-ash">{site.location}</dd>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 shrink-0 text-ash/70" strokeWidth={1.5} aria-hidden />
              <dt className="sr-only">Timezone</dt>
              <dd className="font-mono text-[0.6875rem] text-ash">{site.timezone} · replies within 48h</dd>
            </div>
          </dl>

          <p className="hud mt-6 text-[0.5rem] text-ash/50">UPDATED {availability.updatedAt}</p>
        </div>
      </Reveal>

      <Reveal y={24} delay={0.06}>
        <div className="panel panel-flat p-7">
          <h2 className="hud text-acid">DIRECT CHANNELS</h2>

          <a
            href={`mailto:${site.email}`}
            className="group mt-6 flex items-center gap-3 border-b border-edge/70 pb-5 transition-colors"
            data-cursor="hover"
            data-cursor-label="MAIL"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-edge/90 bg-void/60 text-ash transition-colors duration-300 group-hover:border-acid/50 group-hover:text-acid">
              <Mail className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="hud block text-[0.5rem] text-ash/70">EMAIL</span>
              <span className="mt-1 block truncate font-mono text-[0.8125rem] text-frost group-hover:text-acid">
                {site.email}
              </span>
            </span>
          </a>

          <ul className="mt-5 space-y-3">
            {socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel={social.href.startsWith("http") ? "noreferrer noopener" : undefined}
                  className="group flex items-center gap-3 transition-colors"
                  data-cursor="hover"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-edge/80 text-ash transition-colors duration-300 group-hover:border-volt/50 group-hover:text-volt">
                    <Icon name={social.icon} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-frost transition-colors group-hover:text-volt">{social.label}</span>
                    <span className="block truncate font-mono text-[0.625rem] text-ash/70">{social.handle}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal y={24} delay={0.12}>
        <div className="panel panel-flat p-7">
          <h2 className="hud text-iris">WHAT HAPPENS NEXT</h2>
          <ol className="mt-6 space-y-5">
            {nextSteps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="hud mt-0.5 shrink-0 text-[0.5625rem] text-acid/80">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block font-display text-sm font-bold tracking-tight uppercase">{step.title}</span>
                  <span className="mt-1.5 block text-[0.8125rem] leading-relaxed text-ash">{step.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>
    </div>
  );
}
