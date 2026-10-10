"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Command, Menu, X } from "lucide-react";
import { navigation, site, socials } from "@/data";
import { Icon } from "./Icon";
import { ensureGsap, gsap } from "@/lib/gsap";
import { useCalmMotion } from "@/lib/motion";
import { onScrollTick, scrollState } from "@/lib/scroll-bus";
import { useUiStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Fixed HUD header: brand mark, route index, ⌘K trigger and CTA. */
export function Navigation() {
  const pathname = usePathname();
  const calm = useCalmMotion();

  const headerRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  // zustand v5: one selector per value — array selectors break snapshot caching.
  const navOpen = useUiStore((state) => state.navOpen);
  const setNavOpen = useUiStore((state) => state.setNavOpen);
  const setPaletteOpen = useUiStore((state) => state.setPaletteOpen);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  /* Condense the header once the page scrolls. */
  useEffect(() => {
    let last = false;
    return onScrollTick(() => {
      const next = scrollState.y > 28;
      if (next !== last) {
        last = next;
        setScrolled(next);
      }
    });
  }, []);

  /* Mobile overlay: open/close choreography, ESC, scroll lock, focus move. */
  useEffect(() => {
    if (!navOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!calm) {
      ensureGsap();
      gsap.fromTo(
        "[data-menu-item]",
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 0.55, ease: "power3.out", stagger: 0.055, delay: 0.08 },
      );
    }
    window.requestAnimationFrame(() => firstLinkRef.current?.focus());

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNavOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      gsap.set("[data-menu-item]", { clearProps: "all" });
    };
  }, [navOpen, calm, setNavOpen]);

  /* Close the overlay when the route changes. */
  useEffect(() => {
    setNavOpen(false);
  }, [pathname, setNavOpen]);

  return (
    <>
      <a
        href="#main"
        className="skip-link btn btn-ghost z-[210] px-4 py-2 text-[0.6875rem]"
      >
        Skip to content
      </a>

      <header
        ref={headerRef}
        className={cn(
          "fixed inset-x-0 top-0 z-[150] transition-[background-color,border-color,backdrop-filter,height] duration-500",
          scrolled || navOpen
            ? "border-b border-edge/80 bg-void/82 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div
          className={cn(
            "mx-auto flex w-full max-w-[1440px] items-center justify-between gap-6 px-5 transition-all duration-500 lg:px-10",
            scrolled ? "h-[62px]" : "h-[76px]",
          )}
        >
          {/* Brand */}
          <Link
            href="/"
            className="group flex items-center gap-3"
            data-cursor="hover"
            data-cursor-label="HOME"
            aria-label={`${site.brand} — home`}
          >
            <svg viewBox="0 0 40 40" className="h-8 w-8 shrink-0" aria-hidden>
              <circle cx="20" cy="20" r="18" fill="none" stroke="var(--color-edge)" strokeWidth="1" />
              <ellipse
                cx="20"
                cy="20"
                rx="18"
                ry="7"
                fill="none"
                stroke="var(--color-acid)"
                strokeOpacity="0.85"
                strokeWidth="1"
                className="origin-center transition-transform duration-700 group-hover:rotate-45"
              />
              <ellipse
                cx="20"
                cy="20"
                rx="7"
                ry="18"
                fill="none"
                stroke="var(--color-iris)"
                strokeOpacity="0.7"
                strokeWidth="1"
                className="origin-center transition-transform duration-700 group-hover:-rotate-45"
              />
              <circle cx="20" cy="20" r="3" fill="var(--color-volt)" />
            </svg>
            <span className="flex flex-col leading-none">
              <span className="font-display text-[0.95rem] font-bold tracking-tight text-frost">
                ORBITAL<span className="text-acid">//CYBER</span>
              </span>
              <span className="hud mt-1 text-[0.5625rem] text-ash">{site.role}</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {navigation.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-cursor="hover"
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-baseline gap-1.5 px-3 py-2 text-[0.8125rem] font-medium tracking-tight transition-colors duration-300",
                    active ? "text-acid" : "text-ash hover:text-frost",
                  )}
                >
                  <span className="font-mono text-[0.5625rem] tracking-[0.18em] opacity-60 transition-opacity group-hover:opacity-100">
                    {item.index}
                  </span>
                  {item.label}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-3 bottom-1 h-px origin-left bg-acid transition-transform duration-400",
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hud hidden items-center gap-2 border border-edge/90 bg-panel/60 px-3 py-2 text-ash transition-colors duration-300 hover:border-acid/50 hover:text-acid md:flex"
              data-cursor="hover"
              aria-label="Open command palette"
            >
              <Command className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              <span className="text-[0.625rem]">K</span>
            </button>

            <Link
              href="/contact"
              className="btn btn-primary hidden !px-4 !py-2 text-[0.6875rem] sm:inline-flex"
              data-cursor="hover"
              data-cursor-label="SEND"
            >
              <span>Contact</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </Link>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setNavOpen(!navOpen)}
              className="flex h-10 w-10 items-center justify-center border border-edge/90 bg-panel/60 text-frost transition-colors duration-300 hover:border-acid/50 hover:text-acid lg:hidden"
              aria-expanded={navOpen}
              aria-controls="mobile-menu"
              aria-label={navOpen ? "Close menu" : "Open menu"}
            >
              {navOpen ? <X className="h-4.5 w-4.5" strokeWidth={1.5} aria-hidden /> : <Menu className="h-4.5 w-4.5" strokeWidth={1.5} aria-hidden />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-0 z-[140] lg:hidden",
          navOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!navOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-void/96 backdrop-blur-xl transition-opacity duration-400",
            navOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setNavOpen(false)}
        />
        <div className="backdrop-grid absolute inset-0 opacity-60" aria-hidden />

        <nav
          aria-label="Mobile"
          className={cn(
            "relative flex h-full flex-col justify-between px-6 pt-28 pb-10 transition-opacity duration-300",
            navOpen ? "opacity-100" : "opacity-0",
          )}
        >
          <ul className="space-y-1">
            {navigation.map((item, index) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <li key={item.href} data-menu-item>
                  <Link
                    ref={index === 0 ? firstLinkRef : undefined}
                    href={item.href}
                    onClick={() => setNavOpen(false)}
                    className={cn(
                      "group flex items-center gap-4 border-b border-edge/60 py-4 transition-colors duration-300",
                      active ? "text-acid" : "text-frost",
                    )}
                  >
                    <span className="hud w-8 text-[0.625rem] text-ash group-hover:text-acid">{item.index}</span>
                    <span className="font-display text-[1.75rem] font-bold tracking-tight uppercase">{item.label}</span>
                    <ArrowUpRight
                      className="ml-auto h-4 w-4 text-ash transition-transform duration-300 group-hover:translate-x-1 group-hover:text-acid"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </Link>
                  <span className="hud mt-2 block text-[0.5625rem] normal-case tracking-normal text-ash/70">
                    {item.blurb}
                  </span>
                </li>
              );
            })}
          </ul>

          <div data-menu-item className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel={social.href.startsWith("http") ? "noreferrer noopener" : undefined}
                  className="chip"
                >
                  <Icon name={social.icon} className="h-3.5 w-3.5" />
                  {social.label}
                </a>
              ))}
            </div>
            <p className="hud text-[0.625rem] text-ash">
              <span className="text-volt">●</span> {site.name} — {site.location}
            </p>
          </div>
        </nav>
      </div>
    </>
  );
}
