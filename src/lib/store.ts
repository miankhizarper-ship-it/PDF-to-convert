import { create } from "zustand";

/**
 * Discrete UI state only. Anything that changes per frame (scroll progress,
 * pointer position) lives outside React — see `src/lib/scroll-bus.ts`.
 */
export type UiState = {
  /** Boot/loader sequence finished; the hero timeline may run. */
  booted: boolean;
  setBooted: (value: boolean) => void;
  /** ⌘K command palette. */
  paletteOpen: boolean;
  setPaletteOpen: (value: boolean) => void;
  /** Mobile navigation overlay. */
  navOpen: boolean;
  setNavOpen: (value: boolean) => void;
  /** User-toggled calm mode: disables animation regardless of OS setting. */
  calm: boolean;
  setCalm: (value: boolean) => void;
  /** Label currently shown inside the custom cursor ring. */
  cursorLabel: string | null;
  setCursorLabel: (value: string | null) => void;
};

export const useUiStore = create<UiState>((set) => ({
  booted: false,
  setBooted: (booted) => set({ booted }),
  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  navOpen: false,
  setNavOpen: (navOpen) => set({ navOpen }),
  calm: false,
  setCalm: (calm) => set({ calm }),
  cursorLabel: null,
  setCursorLabel: (cursorLabel) => set({ cursorLabel }),
}));
