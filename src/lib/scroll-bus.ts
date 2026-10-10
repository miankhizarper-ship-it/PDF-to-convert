/**
 * Frame-level bus for scroll + pointer values.
 *
 * These change 60×/second, so they deliberately live *outside* React state:
 * components (including the WebGL scene) read the mutable objects inside their
 * own animation frames instead of re-rendering. One rAF loop writes them.
 */

export type ScrollState = {
  /** Document scroll offset in px. */
  y: number;
  /** 0 → 1 across the whole document. */
  progress: number;
  /** 0 → 1 across the first viewport height (drives the hero transform). */
  heroProgress: number;
  /** Viewport height, cached to avoid layout thrash. */
  vh: number;
};

export type PointerState = {
  x: number;
  y: number;
  /** Normalised −1 → 1 from the viewport centre. */
  nx: number;
  ny: number;
  /** True while any pointer button is down. */
  down: boolean;
  active: boolean;
};

export const scrollState: ScrollState = { y: 0, progress: 0, heroProgress: 0, vh: 1 };
export const pointerState: PointerState = { x: 0, y: 0, nx: 0, ny: 0, down: false, active: false };

type Listener = () => void;
const listeners = new Set<Listener>();
let running = false;

function measure(): void {
  const vh = typeof window === "undefined" ? 1 : window.innerHeight || 1;
  scrollState.vh = vh;
  scrollState.y = window.scrollY;
  const max = Math.max(1, document.documentElement.scrollHeight - vh);
  scrollState.progress = Math.min(1, Math.max(0, scrollState.y / max));
  scrollState.heroProgress = Math.min(1, Math.max(0, scrollState.y / vh));
}

function frame(): void {
  measure();
  for (const listener of listeners) listener();
  requestAnimationFrame(frame);
}

/** Idempotent: call from any client component that needs the bus. */
export function startScrollBus(): () => void {
  if (typeof window === "undefined") return () => {};

  if (!running) {
    running = true;
    measure();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    requestAnimationFrame(frame);
  }

  return () => {
    /* The loop is intentionally never torn down — it is a single global rAF. */
  };
}

function onPointerMove(event: PointerEvent): void {
  pointerState.x = event.clientX;
  pointerState.y = event.clientY;
  pointerState.nx = (event.clientX / window.innerWidth) * 2 - 1;
  pointerState.ny = -((event.clientY / window.innerHeight) * 2 - 1);
  pointerState.active = true;
}

function onPointerDown(): void {
  pointerState.down = true;
}

function onPointerUp(): void {
  pointerState.down = false;
}

/** Subscribe to every bus tick (used by the progress bar). Returns an unsubscribe fn. */
export function onScrollTick(listener: Listener): () => void {
  listeners.add(listener);
  startScrollBus();
  return () => listeners.delete(listener);
}
