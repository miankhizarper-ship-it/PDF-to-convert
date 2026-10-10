import { cn } from "@/lib/utils";

/**
 * Marks content that ships as an editable placeholder (see `src/data/*`).
 * Deliberately visible: the brief asks for clearly labelled sample content,
 * never invented experience. Set `isSample: false` in the data file and it
 * disappears.
 */
export function SampleChip({ className, label = "SAMPLE" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "chip border-dashed text-[0.625rem] text-ash/80",
        className,
      )}
      title="Placeholder content — edit this in src/data"
    >
      {label}
    </span>
  );
}
