/**
 * Fixed ambient backdrop: orbital colour wash, technical grid, film grain,
 * vignette and a slow scan line. Pure CSS/SVG — zero JS at runtime.
 */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="backdrop-wash absolute inset-0" />
      <div className="backdrop-grid absolute inset-0 opacity-80" />
      <div className="noise absolute inset-0" />
      <div className="vignette absolute inset-0" />
      <div className="scanline absolute inset-x-0 top-0 hidden h-40 animate-scan bg-linear-to-b from-transparent via-acid/[0.035] to-transparent lg:block" />
    </div>
  );
}
