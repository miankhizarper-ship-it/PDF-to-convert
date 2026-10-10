import { techMarquee } from "@/data";

/** Seamless technology ticker. Decorative, so it is hidden from screen readers. */
export function Marquee() {
  const items = [...techMarquee, ...techMarquee];

  return (
    <div className="relative border-y border-edge/70 bg-panel/25 py-4" aria-hidden>
      <div className="mask-fade-x overflow-hidden">
        <div className="marquee-track gap-8">
          {items.map((item, index) => (
            <span key={`${item}-${index}`} className="hud flex shrink-0 items-center gap-8 text-[0.625rem] whitespace-nowrap">
              <span className={index % 3 === 0 ? "text-acid" : "text-ash"}>{item}</span>
              <span className="text-edge">◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
