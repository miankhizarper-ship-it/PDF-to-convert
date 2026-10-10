import { availability } from "@/data";
import { cn } from "@/lib/utils";

type AvailabilityBadgeProps = {
  className?: string;
  /** Show the longer detail line next to the status. */
  detailed?: boolean;
  size?: "sm" | "md";
};

const statusStyles = {
  available: { dot: "bg-volt", ring: "shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-volt)_14%,transparent)]", text: "text-volt" },
  limited: { dot: "bg-acid", ring: "shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-acid)_14%,transparent)]", text: "text-acid" },
  unavailable: { dot: "bg-ash", ring: "shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-ash)_14%,transparent)]", text: "text-ash" },
} as const;

/** Animated availability indicator. Data lives in `src/data/site.ts`. */
export function AvailabilityBadge({ className, detailed = false, size = "md" }: AvailabilityBadgeProps) {
  const styles = statusStyles[availability.status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 rounded-full border border-edge/90 bg-panel/70 backdrop-blur-sm",
        size === "sm" ? "px-3 py-1.5" : "px-4 py-2",
        className,
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
        <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-70", styles.dot, "animate-pulse-node")} />
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", styles.dot, styles.ring)} />
      </span>
      <span className="hud">
        <span className={styles.text}>{availability.label}</span>
        {detailed ? <span className="ml-3 normal-case tracking-normal text-ash">{availability.detail}</span> : null}
      </span>
    </div>
  );
}
