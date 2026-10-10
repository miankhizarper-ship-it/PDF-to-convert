import { seededRandom } from "@/lib/utils";
import { cn } from "@/lib/utils";

type OrbitalFallbackProps = {
  className?: string;
  /** Rendered as a poster behind the WebGL canvas while it boots. */
  poster?: boolean;
};

const R = 188;
const CX = 300;
const CY = 300;

/** Meridians: ellipses of full height with shrinking width. */
const meridians = [-72, -54, -36, -18, 0, 18, 36, 54, 72].map((deg) => ({
  deg,
  rx: Math.max(2, R * Math.cos((deg * Math.PI) / 180)),
}));

/** Parallels: flattened ellipses whose width follows the sphere silhouette. */
const parallels = [-0.78, -0.52, -0.26, 0, 0.26, 0.52, 0.78].map((fraction) => {
  const y = fraction * R;
  const rx = Math.sqrt(Math.max(1, R * R - y * y));
  return { cy: CY + y, rx, ry: rx * 0.21 };
});

const particles = (() => {
  const random = seededRandom(77123);
  return Array.from({ length: 26 }, (_, index) => ({
    id: index,
    cx: 40 + random() * 520,
    cy: 40 + random() * 520,
    r: 0.9 + random() * 2.1,
    delay: random() * 9,
    duration: 7 + random() * 7,
    color: index % 4 === 0 ? "#A855F7" : index % 3 === 0 ? "#39FF88" : "#D9FF63",
    opacity: 0.25 + random() * 0.6,
  }));
})();

/**
 * Non-WebGL fallback (and boot poster): the same orbital composition rendered
 * as pure SVG + CSS animation. No JS at runtime, honours reduced motion via the
 * global stylesheet.
 */
export function OrbitalFallback({ className, poster = false }: OrbitalFallbackProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 grid place-items-center", className)}
      aria-hidden
    >
      <svg
        viewBox="0 0 600 600"
        className={cn(
          "h-[min(78vw,620px)] w-[min(78vw,620px)] transition-opacity duration-700",
          poster && "opacity-70",
        )}
        role="presentation"
        focusable="false"
      >
        <defs>
          <radialGradient id="orbital-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#39FF88" stopOpacity="0.95" />
            <stop offset="42%" stopColor="#D9FF63" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="orbital-halo" cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor="#A855F7" stopOpacity="0" />
            <stop offset="82%" stopColor="#A855F7" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#08090C" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="orbital-ring" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D9FF63" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#D9FF63" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* ambient particles */}
        {particles.map((particle) => (
          <circle
            key={particle.id}
            cx={particle.cx}
            cy={particle.cy}
            r={particle.r}
            fill={particle.color}
            opacity={particle.opacity}
            className="animate-float"
            style={{ animationDelay: `${particle.delay}s`, animationDuration: `${particle.duration}s` }}
          />
        ))}

        {/* halo + core */}
        <circle cx={CX} cy={CY} r={268} fill="url(#orbital-halo)" />
        <circle cx={CX} cy={CY} r={120} fill="url(#orbital-core)" />

        {/* wireframe globe */}
        <g
          className="animate-spin-slower"
          style={{ transformBox: "view-box", transformOrigin: "50% 50%" }}
          stroke="#D9FF63"
          fill="none"
        >
          <circle cx={CX} cy={CY} r={R} strokeOpacity="0.42" strokeWidth="1" />
          {meridians.map((meridian) => (
            <ellipse
              key={meridian.deg}
              cx={CX}
              cy={CY}
              rx={meridian.rx}
              ry={R}
              strokeOpacity={meridian.deg === 0 ? 0.4 : 0.17}
              strokeWidth="1"
            />
          ))}
          {parallels.map((parallel) => (
            <ellipse
              key={parallel.cy}
              cx={CX}
              cy={parallel.cy}
              rx={parallel.rx}
              ry={parallel.ry}
              strokeOpacity={parallel.ry > 38 ? 0.34 : 0.15}
              strokeWidth="1"
              stroke={parallel.ry > 38 ? "#39FF88" : "#D9FF63"}
            />
          ))}
        </g>

        {/* faceted shell */}
        <g
          className="animate-spin-reverse"
          style={{ transformBox: "view-box", transformOrigin: "50% 50%" }}
          stroke="#A855F7"
          strokeOpacity="0.32"
          fill="none"
        >
          <polygon points="300,84 486,192 486,408 300,516 114,408 114,192" strokeWidth="1" />
          <polygon points="300,140 438,220 438,380 300,460 162,380 162,220" strokeWidth="1" />
          <line x1="300" y1="84" x2="300" y2="516" strokeWidth="0.75" />
          <line x1="114" y1="192" x2="486" y2="408" strokeWidth="0.75" />
          <line x1="486" y1="192" x2="114" y2="408" strokeWidth="0.75" />
        </g>

        {/* orbital rings */}
        <g fill="none">
          <ellipse
            cx={CX}
            cy={CY}
            rx={266}
            ry={92}
            stroke="url(#orbital-ring)"
            strokeWidth="1.25"
            transform={`rotate(-19 ${CX} ${CY})`}
            className="animate-spin-slow"
            style={{ transformBox: "view-box", transformOrigin: "50% 50%" }}
          />
          <ellipse
            cx={CX}
            cy={CY}
            rx={228}
            ry={126}
            stroke="#39FF88"
            strokeOpacity="0.3"
            strokeWidth="1"
            strokeDasharray="3 9"
            transform={`rotate(28 ${CX} ${CY})`}
          />
          <circle cx={CX + 246} cy={CY - 74} r={4.5} fill="#D9FF63" />
          <circle cx={CX - 208} cy={CY + 96} r={3} fill="#A855F7" />
          <circle cx={CX + 62} cy={CY - 176} r={2.5} fill="#39FF88" />
        </g>
      </svg>
    </div>
  );
}
