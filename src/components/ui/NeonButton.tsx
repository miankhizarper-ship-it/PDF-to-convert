"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Magnetic } from "./Magnetic";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost";

type BaseProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  /** Wrap in the magnetic effect (desktop pointers only). */
  magnetic?: boolean;
  icon?: ReactNode;
  /** Text shown inside the custom cursor ring while hovering. */
  cursorLabel?: string;
};

type ButtonLinkProps = BaseProps & {
  href: string;
  external?: boolean;
  ariaLabel?: string;
};

/** Navigation button — renders a Next `<Link>` (or an anchor for external URLs). */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
  magnetic = true,
  icon,
  cursorLabel,
  external,
  ariaLabel,
}: ButtonLinkProps) {
  const classes = cn("btn", variant === "primary" ? "btn-primary" : "btn-ghost", className);
  const isExternal = external ?? /^(https?:|mailto:)/.test(href);

  const inner = (
    <>
      <span>{children}</span>
      {icon ? <span className="shrink-0">{icon}</span> : null}
    </>
  );

  const node = isExternal ? (
    <a
      href={href}
      className={classes}
      data-cursor="hover"
      data-cursor-label={cursorLabel}
      aria-label={ariaLabel}
      {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer noopener" } : {})}
    >
      {inner}
    </a>
  ) : (
    <Link href={href} className={classes} data-cursor="hover" data-cursor-label={cursorLabel} aria-label={ariaLabel}>
      {inner}
    </Link>
  );

  return magnetic ? <Magnetic>{node}</Magnetic> : node;
}

type ActionButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;

/** Action button — for forms, palette toggles and anything that isn't navigation. */
export function Button({
  children,
  variant = "primary",
  className,
  magnetic = false,
  icon,
  cursorLabel,
  ...rest
}: ActionButtonProps) {
  const node = (
    <button
      type={rest.type ?? "button"}
      {...rest}
      className={cn("btn", variant === "primary" ? "btn-primary" : "btn-ghost", className)}
      data-cursor="hover"
      data-cursor-label={cursorLabel}
    >
      <span>{children}</span>
      {icon ? <span className="shrink-0">{icon}</span> : null}
    </button>
  );

  return magnetic ? <Magnetic>{node}</Magnetic> : node;
}
