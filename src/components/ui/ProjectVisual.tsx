import type { AccentKey, CoverVariant } from "@/data/types";
import { seededRandom } from "@/lib/utils";

type ProjectVisualProps = {
  variant: CoverVariant;
  accent: AccentKey;
  seed?: number;
  className?: string;
};

const W = 800;
const H = 500;

const ACCENTS: Record<AccentKey, { main: string; soft: string }> = {
  acid: { main: "#D9FF63", soft: "#39FF88" },
  volt: { main: "#39FF88", soft: "#A855F7" },
  iris: { main: "#A855F7", soft: "#D9FF63" },
};

function sinePath(y0: number, amplitude: number, frequency: number, phase: number, steps = 72): string {
  let d = "";
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = t * W;
    const y = y0 + Math.sin(t * Math.PI * 2 * frequency + phase) * amplitude;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d.trim();
}

function circuitTrace(random: () => number, startY: number): { d: string; endX: number; endY: number } {
  let x = -10;
  let y = startY;
  let d = `M${x} ${y}`;

  while (x < W) {
    x = Math.min(W + 10, x + 45 + Math.floor(random() * 120));
    d += ` L${x} ${y}`;
    if (x >= W) break;
    const dy = (random() > 0.5 ? 1 : -1) * (26 + Math.floor(random() * 54));
    y = Math.max(46, Math.min(H - 46, y + dy));
    d += ` L${x} ${y}`;
  }

  return { d, endX: x, endY: y };
}

/**
 * Procedural project artwork.
 *
 * Every cover is generated SVG from a seed — no raster assets, no network
 * requests, a few hundred bytes each, and crisp at any size. The six variants
 * keep the project grid visually rich without shipping imagery.
 */
export function ProjectVisual({ variant, accent, seed = 7, className }: ProjectVisualProps) {
  const { main, soft } = ACCENTS[accent];
  const random = seededRandom(seed * 31 + variant.length * 977 + accent.length * 13);
  const uid = `${variant}-${accent}-${seed}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      focusable="false"
      role="presentation"
    >
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B0D12" />
          <stop offset="58%" stopColor="#0E1117" />
          <stop offset="100%" stopColor="#08090C" />
        </linearGradient>
        <radialGradient id={`glow-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={main} stopOpacity="0.34" />
          <stop offset="55%" stopColor={soft} stopOpacity="0.08" />
          <stop offset="100%" stopColor="#08090C" stopOpacity="0" />
        </radialGradient>
        <pattern id={`grid-${uid}`} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0 L0 0 0 40" fill="none" stroke={main} strokeOpacity="0.07" strokeWidth="1" />
        </pattern>
        <radialGradient id={`vignette-${uid}`} cx="50%" cy="50%" r="72%">
          <stop offset="55%" stopColor="#08090C" stopOpacity="0" />
          <stop offset="100%" stopColor="#08090C" stopOpacity="0.86" />
        </radialGradient>
      </defs>

      <rect width={W} height={H} fill={`url(#bg-${uid})`} />
      <rect width={W} height={H} fill={`url(#grid-${uid})`} />
      <ellipse cx={W / 2} cy={H / 2} rx={330} ry={230} fill={`url(#glow-${uid})`} />

      {variant === "orbital" ? (
        <g transform={`rotate(-16 ${W / 2} ${H / 2})`} fill="none">
          {[92, 148, 208, 272, 336].map((rx, index) => (
            <ellipse
              key={rx}
              cx={W / 2}
              cy={H / 2}
              rx={rx}
              ry={rx * 0.4}
              stroke={index % 2 === 0 ? main : soft}
              strokeOpacity={0.5 - index * 0.07}
              strokeWidth={index === 2 ? 1.4 : 1}
              strokeDasharray={index === 4 ? "4 10" : undefined}
            />
          ))}
          <circle cx={W / 2} cy={H / 2} r="26" fill={main} fillOpacity="0.9" stroke="none" />
          <circle cx={W / 2} cy={H / 2} r="52" stroke={soft} strokeOpacity="0.5" strokeWidth="1" />
          {[
            [W / 2 + 208, H / 2],
            [W / 2 - 148, H / 2],
            [W / 2 + 70, H / 2 - 96],
          ].map(([cx, cy], index) => (
            <circle key={index} cx={cx} cy={cy} r={5 - index} fill={index === 1 ? soft : main} stroke="none" />
          ))}
        </g>
      ) : null}

      {variant === "lattice" ? (
        <g>
          {Array.from({ length: 10 }, (_, column) =>
            Array.from({ length: 6 }, (_, row) => {
              const cx = 70 + column * 73;
              const cy = 70 + row * 72;
              const distance = Math.hypot(cx - W / 2, cy - H / 2);
              const intensity = Math.max(0, 1 - distance / 420);
              return (
                <circle
                  key={`${column}-${row}`}
                  cx={cx}
                  cy={cy}
                  r={1 + intensity * 2.6}
                  fill={intensity > 0.55 ? main : soft}
                  fillOpacity={0.18 + intensity * 0.7}
                />
              );
            }),
          )}
          <path
            d={`M60 ${H - 90} L228 ${H - 90} L284 190 L452 190 L508 ${H - 150} L740 ${H - 150}`}
            fill="none"
            stroke={main}
            strokeWidth="1.6"
            strokeOpacity="0.85"
          />
          <rect x="196" y="96" width="112" height="72" fill="none" stroke={soft} strokeOpacity="0.45" />
          <rect x="536" y="286" width="140" height="88" fill="none" stroke={main} strokeOpacity="0.3" strokeDasharray="3 7" />
        </g>
      ) : null}

      {variant === "waveform" ? (
        <g fill="none">
          {[0, 1, 2, 3, 4, 5, 6].map((index) => {
            const offset = index - 3;
            const y0 = H / 2 + offset * 46;
            const amplitude = 26 + Math.abs(offset) * 6;
            return (
              <path
                key={index}
                d={sinePath(y0, amplitude, 1.6 + index * 0.22, index * 0.7)}
                stroke={index === 3 ? main : soft}
                strokeOpacity={index === 3 ? 0.95 : 0.3 - Math.abs(offset) * 0.03}
                strokeWidth={index === 3 ? 1.8 : 1}
              />
            );
          })}
          {Array.from({ length: 24 }, (_, index) => {
            const x = 32 + index * 32;
            const height = 8 + random() * 62;
            return (
              <line
                key={x}
                x1={x}
                y1={H - 40}
                x2={x}
                y2={H - 40 - height}
                stroke={index % 5 === 0 ? main : soft}
                strokeOpacity={0.16 + random() * 0.4}
                strokeWidth="2"
              />
            );
          })}
        </g>
      ) : null}

      {variant === "aperture" ? (
        <g transform={`translate(${W / 2} ${H / 2})`} fill="none">
          {Array.from({ length: 10 }, (_, index) => {
            const angle = (index / 10) * Math.PI * 2;
            return (
              <g key={index} transform={`rotate(${(angle * 180) / Math.PI})`}>
                <path
                  d="M28 -7 L150 -34 L150 34 L28 7 Z"
                  stroke={index % 3 === 0 ? main : soft}
                  strokeOpacity={index % 3 === 0 ? 0.55 : 0.24}
                  strokeWidth="1"
                />
              </g>
            );
          })}
          <circle r="28" stroke={main} strokeOpacity="0.85" strokeWidth="1.4" />
          <circle r="168" stroke={soft} strokeOpacity="0.28" strokeDasharray="2 8" />
          <circle r="12" fill={main} fillOpacity="0.9" stroke="none" />
        </g>
      ) : null}

      {variant === "constellation" ? (
        <g>
          {(() => {
            const nodes = Array.from({ length: 16 }, (_, index) => ({
              id: index,
              x: 50 + random() * (W - 100),
              y: 44 + random() * (H - 88),
              r: 1.6 + random() * 3.4,
            }));

            const edges = nodes.flatMap((node) =>
              nodes
                .filter((other) => other.id !== node.id)
                .map((other) => ({ node, other, distance: Math.hypot(node.x - other.x, node.y - other.y) }))
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 2)
                .filter((edge) => edge.distance < 210),
            );

            return (
              <>
                {edges.map((edge, index) => (
                  <line
                    key={index}
                    x1={edge.node.x}
                    y1={edge.node.y}
                    x2={edge.other.x}
                    y2={edge.other.y}
                    stroke={index % 4 === 0 ? main : soft}
                    strokeOpacity={Math.max(0.06, 0.4 - edge.distance / 620)}
                    strokeWidth="1"
                  />
                ))}
                {nodes.map((node) => (
                  <g key={node.id}>
                    <circle cx={node.x} cy={node.y} r={node.r * 3.2} fill={main} fillOpacity="0.07" />
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r}
                      fill={node.id % 5 === 0 ? soft : main}
                      fillOpacity={0.55 + node.r / 8}
                    />
                  </g>
                ))}
              </>
            );
          })()}
        </g>
      ) : null}

      {variant === "circuit" ? (
        <g fill="none">
          {[64, 132, 196, 258, 320, 388, 444].map((startY, index) => {
            const trace = circuitTrace(random, startY);
            return (
              <g key={startY}>
                <path
                  d={trace.d}
                  stroke={index % 3 === 0 ? main : soft}
                  strokeOpacity={index % 3 === 0 ? 0.6 : 0.26}
                  strokeWidth={index % 3 === 0 ? 1.4 : 1}
                />
                <rect
                  x={Math.min(W - 22, trace.endX - 14)}
                  y={trace.endY - 6}
                  width="12"
                  height="12"
                  fill={index % 3 === 0 ? main : soft}
                  fillOpacity="0.6"
                  stroke="none"
                />
              </g>
            );
          })}
          <rect x="330" y="188" width="140" height="124" stroke={main} strokeOpacity="0.5" strokeWidth="1.2" />
          <rect x="352" y="210" width="96" height="80" stroke={soft} strokeOpacity="0.3" strokeDasharray="3 6" />
          <circle cx="400" cy="250" r="7" fill={main} fillOpacity="0.85" stroke="none" />
        </g>
      ) : null}

      {/* HUD marks + vignette so covers sit consistently in the grid */}
      <g stroke={main} strokeOpacity="0.45" fill="none">
        <path d="M24 46 L24 24 L46 24" />
        <path d={`M${W - 46} 24 L${W - 24} 24 L${W - 24} 46`} />
        <path d={`M24 ${H - 46} L24 ${H - 24} L46 ${H - 24}`} />
        <path d={`M${W - 46} ${H - 24} L${W - 24} ${H - 24} L${W - 24} ${H - 46}`} />
      </g>
      <rect width={W} height={H} fill={`url(#vignette-${uid})`} />
    </svg>
  );
}
