import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { navigation, site, socials } from "@/data";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { Icon } from "./Icon";

/** Site footer: wordmark, sitemap, socials and colophon. */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-edge/70 bg-panel/30">
      <div className="backdrop-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />

      <div className="relative mx-auto w-full max-w-[1440px] px-5 py-16 lg:px-10 lg:py-20">
        {/* Oversized wordmark */}
        <div className="flex flex-col gap-8 border-b border-edge/60 pb-12 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="hud text-acid">{site.brand} · PORTFOLIO SYSTEM</p>
            <p className="mt-5 font-display text-[clamp(2.5rem,10vw,7rem)] leading-[0.85] font-bold tracking-tighter uppercase">
              ORBITAL
              <span className="type-outline block">CYBER</span>
            </p>
          </div>

          <div className="flex flex-col items-start gap-5">
            <AvailabilityBadge detailed size="sm" />
            <a
              href={`mailto:${site.email}`}
              className="group flex items-center gap-2 font-display text-lg font-medium text-frost transition-colors hover:text-acid sm:text-xl"
              data-cursor="hover"
              data-cursor-label="EMAIL"
            >
              {site.email}
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={1.5}
                aria-hidden
              />
            </a>
          </div>
        </div>

        {/* Sitemap + socials */}
        <div className="grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
          <nav aria-label="Footer">
            <p className="hud mb-5">Sitemap</p>
            <ul className="space-y-2.5">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-3 text-sm text-ash transition-colors hover:text-acid"
                  >
                    <span className="font-mono text-[0.625rem] text-ash/60">{item.index}</span>
                    {item.label}
                    <span className="h-px w-0 bg-acid transition-all duration-300 group-hover:w-6" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="hud mb-5">Elsewhere</p>
            <ul className="space-y-2.5">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target={social.href.startsWith("http") ? "_blank" : undefined}
                    rel={social.href.startsWith("http") ? "noreferrer noopener" : undefined}
                    className="group flex items-center gap-3 text-sm text-ash transition-colors hover:text-volt"
                  >
                    <Icon name={social.icon} className="h-4 w-4" />
                    <span>{social.label}</span>
                    <span className="font-mono text-[0.625rem] text-ash/50">{social.handle}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="hud mb-5">Colophon</p>
            <p className="max-w-md text-sm leading-relaxed text-ash">
              Built with Next.js, React Three Fiber, GSAP + ScrollTrigger and Tailwind CSS. The orbital
              scene is WebGL with an SVG fallback; animation honours{" "}
              <span className="font-mono text-[0.8125rem] text-frost">prefers-reduced-motion</span> and a
              user-toggled calm mode.
            </p>
            <p className="mt-4 max-w-md text-xs leading-relaxed text-ash/70">
              Names, employers and project outcomes in this build are labelled sample placeholders —
              edit <span className="font-mono text-frost">src/data/*</span> to make it yours.
            </p>
          </div>
        </div>

        {/* Base line */}
        <div className="flex flex-col gap-4 border-t border-edge/60 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="hud text-[0.625rem] text-ash/80">
            © {year} {site.legalName} · ALL SYSTEMS NOMINAL
          </p>
          <div className="flex items-center gap-5">
            <span className="hud text-[0.625rem] text-ash/60">{site.timezone}</span>
            <a
              href="#top"
              className="hud group flex items-center gap-2 border border-edge/80 px-3 py-2 text-[0.625rem] text-ash transition-colors hover:border-acid/50 hover:text-acid"
              data-cursor="hover"
            >
              <ArrowUp className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-0.5" strokeWidth={2} aria-hidden />
              Back to orbit
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
