"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowDown, ArrowRight, Mail } from "lucide-react";
import { site } from "@/data";
import { HeroScene } from "@/components/canvas/HeroScene";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";
import { ButtonLink } from "@/components/ui/NeonButton";
import { HudTicker } from "@/components/ui/HudTicker";
import { ensureGsap, gsap } from "@/lib/gsap";
import { useCalmMotion, useFinePointer } from "@/lib/motion";
import { onScrollTick, pointerState, scrollState } from "@/lib/scroll-bus";
import { useUiStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const HEADLINE = ["BUILDING", "DIGITAL", "WORLDS."];

/**
 * Full-screen immersive hero: WebGL orbital system behind an editorial HUD
 * layout. Entrance runs after the loader reports `booted`; scroll and pointer
 * parallax are driven by the shared frame bus (no React re-renders).
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);

  const booted = useUiStore((state) => state.booted);
  const calm = useCalmMotion();
  const fine = useFinePointer();

  /* Entrance timeline — waits for the loader so the two never overlap. */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !booted) return;
    if (calm) {
      gsap.set(section.querySelectorAll("[data-hero-anim]"), { clearProps: "all" });
      return;
    }

    ensureGsap();
    const context = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "expo.out" } })
        .fromTo(
          "[data-hero-line]",
          { yPercent: 118, rotate: 2.5 },
          { yPercent: 0, rotate: 0, duration: 1.25, stagger: 0.09 },
          0,
        )
        .fromTo("[data-hero-fade]", { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 }, 0.42)
        .fromTo("[data-hero-frame]", { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 1.1 }, 0.1)
        .fromTo("[data-hero-rule]", { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "power3.inOut", stagger: 0.06 }, 0.2);

      // Scroll-linked: content drifts up and fades as the hero leaves.
      gsap.to("[data-hero-scroll]", {
        yPercent: -18,
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top top", end: "bottom 42%", scrub: 0.6 },
      });
      gsap.to(scrollCueRef.current, {
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top top", end: "22% top", scrub: true },
      });
    }, section);

    return () => context.revert();
  }, [booted, calm]);

  /* Pointer parallax on the content layer + scroll cue fade. */
  useEffect(() => {
    if (calm || !fine) return;

    let x = 0;
    let y = 0;

    return onScrollTick(() => {
      const content = contentRef.current;
      if (!content || !pointerState.active) return;

      x += (pointerState.nx * 12 - x) * 0.06;
      y += (-pointerState.ny * 9 - y) * 0.06;
      content.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;

      if (scrollCueRef.current) {
        scrollCueRef.current.style.opacity = String(Math.max(0, 1 - scrollState.heroProgress * 4));
      }
    });
  }, [calm, fine]);

  return (
    <section
      ref={sectionRef}
      id="top"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] w-full flex-col overflow-hidden pt-[76px]"
    >
      {/* 3D orbital system (WebGL with SVG poster + fallback) */}
      <div className="absolute inset-0 -z-10" data-hero-anim>
        <HeroScene className="opacity-95" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-void via-void/70 to-transparent" aria-hidden />
        <div className="absolute inset-y-0 left-0 w-40 bg-linear-to-r from-void/70 to-transparent lg:w-72" aria-hidden />
      </div>

      {/* HUD frame */}
      <div className="pointer-events-none absolute inset-x-4 inset-y-24 hidden lg:block" aria-hidden>
        <span data-hero-frame className="absolute top-0 left-0 h-8 w-8 border-t border-l border-acid/35" />
        <span data-hero-frame className="absolute top-0 right-0 h-8 w-8 border-t border-r border-acid/35" />
        <span data-hero-frame className="absolute bottom-0 left-0 h-8 w-8 border-b border-l border-iris/35" />
        <span data-hero-frame className="absolute right-0 bottom-0 h-8 w-8 border-r border-b border-iris/35" />
      </div>

      {/* Top HUD strip */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 pt-6 lg:px-10">
        <div data-hero-fade className="flex items-center gap-3">
          <span className="hud text-acid">01 // ORBITAL SYSTEM</span>
          <span data-hero-rule className="hidden h-px w-16 origin-left bg-linear-to-r from-acid/60 to-transparent sm:block" />
        </div>
        <HudTicker className="hidden w-64 md:block" />
        <span data-hero-fade className="hud hidden text-[0.5625rem] text-ash/70 sm:block">
          {site.timezone} · {site.location.split("—")[1]?.trim() ?? "REMOTE"}
        </span>
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 items-center px-5 py-14 lg:px-10">
        {/* Outer layer: GSAP scroll parallax. Inner layer: pointer parallax.
            Kept separate so the two transforms never fight over `style.transform`. */}
        <div data-hero-scroll className="w-full will-change-transform">
          <div ref={contentRef} className="max-w-4xl will-change-transform">
            <p data-hero-fade className="hud mb-6 flex items-center gap-3 text-volt">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-volt shadow-[0_0_10px_var(--color-volt)]" aria-hidden />
              {site.role} · PORTFOLIO v1.0
            </p>

            <h1
              id="hero-title"
              className="font-display text-[clamp(2.75rem,11.5vw,9.5rem)] leading-[0.86] font-bold tracking-[-0.035em] uppercase"
            >
              {HEADLINE.map((word, index) => (
                <span key={word} className="block overflow-hidden pb-[0.06em]">
                  <span
                    data-hero-line
                    className={cn(
                      "block will-change-transform",
                      index === 2 && "text-acid glow-acid",
                    )}
                  >
                    {word}
                  </span>
                </span>
              ))}
            </h1>

            <div data-hero-fade className="mt-9 flex max-w-xl flex-col gap-7 border-l border-edge/80 pl-5 sm:pl-7">
              <p className="text-[0.975rem] leading-relaxed text-ash sm:text-lg">{site.intro}</p>

              <div className="flex flex-wrap items-center gap-3">
                <ButtonLink href="/projects" icon={<ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />} cursorLabel="WORK">
                  Explore Projects
                </ButtonLink>
                <ButtonLink
                  href="/contact"
                  variant="ghost"
                  icon={<Mail className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
                  cursorLabel="HELLO"
                >
                  Contact Me
                </ButtonLink>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <AvailabilityBadge size="sm" />
                <span className="hud text-[0.5625rem] text-ash/70">
                  <Link href="/about" className="underline decoration-edge underline-offset-4 transition-colors hover:text-acid hover:decoration-acid/60">
                    WHO IS OPERATING THIS →
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom HUD + scroll cue */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] items-end justify-between gap-6 px-5 pb-7 lg:px-10">
        <div ref={scrollCueRef} data-hero-fade className="flex items-center gap-3">
          <span className="relative flex h-11 w-6 items-start justify-center rounded-full border border-edge/90 pt-1.5">
            <span className="h-2 w-px animate-[float_2.4s_ease-in-out_infinite] bg-acid" aria-hidden />
          </span>
          <span className="hud text-[0.5625rem] text-ash">
            SCROLL
            <span className="mt-1 block text-ash/60">TO ENTER THE SYSTEM</span>
          </span>
        </div>

        <div data-hero-fade className="hidden items-center gap-6 md:flex">
          {[
            { label: "REACT + TS", value: "FRONTEND" },
            { label: "THREE.JS", value: "REALTIME 3D" },
            { label: "NODE + MONGO", value: "BACKEND" },
          ].map((item) => (
            <span key={item.label} className="hud text-right text-[0.5625rem] text-ash/70">
              <span className="block text-frost">{item.value}</span>
              {item.label}
            </span>
          ))}
          <ArrowDown className="h-4 w-4 animate-bounce text-acid" strokeWidth={1.5} aria-hidden />
        </div>
      </div>
    </section>
  );
}
