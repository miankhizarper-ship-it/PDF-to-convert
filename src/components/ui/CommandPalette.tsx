"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, CornerDownLeft, Copy, Orbit, Radar, Search } from "lucide-react";
import { navigation, paletteActions, projects, site } from "@/data";
import { useUiStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Command = {
  id: string;
  label: string;
  group: "Navigate" | "Projects" | "Actions";
  hint?: string;
  keywords?: string;
  run: () => void;
};

/** Simple subsequence score — no dependency, good enough for ~20 entries. */
function score(query: string, text: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return 100 - t.indexOf(q);

  let index = 0;
  let hits = 0;
  for (const char of t) {
    if (char === q[index]) {
      index += 1;
      hits += 1;
      if (index === q.length) break;
    }
  }
  return index === q.length ? hits : 0;
}

/**
 * ⌘K command palette — keyboard-first navigation across routes, project case
 * studies and site actions. Fully operable without a mouse.
 */
export function CommandPalette() {
  const router = useRouter();
  const open = useUiStore((state) => state.paletteOpen);
  const setOpen = useUiStore((state) => state.setPaletteOpen);
  const calm = useUiStore((state) => state.calm);
  const setCalm = useUiStore((state) => state.setCalm);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const commands = useMemo<Command[]>(() => {
    const navCommands: Command[] = navigation.map((item) => ({
      id: `nav-${item.href}`,
      label: item.label,
      group: "Navigate",
      hint: item.blurb,
      keywords: `${item.index} ${item.blurb}`,
      run: () => router.push(item.href),
    }));

    const projectCommands: Command[] = projects.map((project) => ({
      id: `project-${project.slug}`,
      label: project.title,
      group: "Projects",
      hint: `${project.codename} · ${project.stack.slice(0, 3).join(" / ")}`,
      keywords: project.stack.join(" ") + " " + project.summary,
      run: () => router.push(`/projects/${project.slug}`),
    }));

    const actionCommands: Command[] = paletteActions.map((action) => ({
      id: `action-${action.id}`,
      label: action.label,
      group: "Actions",
      hint: action.hint,
      run: () => {
        if (action.id === "copy-email") {
          navigator.clipboard
            ?.writeText(site.email)
            .then(() => setFlash(`Copied ${site.email}`))
            .catch(() => setFlash("Clipboard blocked by the browser"));
          return;
        }
        if (action.id === "toggle-motion") {
          setCalm(!calm);
          setFlash(calm ? "Animation enabled" : "Calm mode on — animation disabled");
          return;
        }
        if (action.id === "availability") {
          setFlash(`${site.name} — ${site.location}`);
          router.push("/contact");
        }
      },
    }));

    return [...navCommands, ...projectCommands, ...actionCommands];
  }, [router, calm, setCalm]);

  const results = useMemo(() => {
    if (!query.trim()) return commands;
    return commands
      .map((command) => ({ command, value: score(query, `${command.label} ${command.keywords ?? ""} ${command.hint ?? ""}`) }))
      .filter((entry) => entry.value > 0)
      .sort((a, b) => b.value - a.value)
      .map((entry) => entry.command);
  }, [commands, query]);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, [setOpen]);

  /* Global hotkeys: ⌘K / Ctrl+K to toggle, Escape to close. */
  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      const isToggle = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isToggle) {
        event.preventDefault();
        if (!open) triggerRef.current = document.activeElement as HTMLElement | null;
        setOpen(!open);
        return;
      }
      if (event.key === "Escape" && open) {
        event.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [open, setOpen, close]);

  /* Reset + focus when opened; lock body scroll. */
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    setFlash(null);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(raf);
      document.body.style.overflow = previous;
    };
  }, [open]);

  /* Keep the active option in view. */
  useEffect(() => {
    const list = listRef.current;
    const node = list?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [active, results.length]);

  useEffect(() => {
    if (active > results.length - 1) setActive(0);
  }, [active, results.length]);

  if (!open) return null;

  const runAt = (index: number) => {
    const command = results[index];
    if (!command) return;
    command.run();
    if (command.group !== "Actions") close();
    else window.setTimeout(close, 900);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((value) => (value + 1) % Math.max(1, results.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((value) => (value - 1 + results.length) % Math.max(1, results.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      runAt(active);
    } else if (event.key === "Tab") {
      // Simple focus trap: only the input and close button are focusable.
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>("button, input");
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0] as HTMLElement;
      const last = focusables[focusables.length - 1] as HTMLElement;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const grouped = results.reduce<Record<string, Command[]>>((accumulator, command) => {
    (accumulator[command.group] ??= []).push(command);
    return accumulator;
  }, {});

  let renderedIndex = -1;

  return (
    <div className="fixed inset-0 z-[180] flex items-start justify-center px-4 pt-[14vh] sm:pt-[18vh]">
      <div
        className="absolute inset-0 bg-void/80 backdrop-blur-md"
        onClick={close}
        aria-hidden
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className={cn(
          "panel relative w-full max-w-xl overflow-hidden border-acid/25 shadow-[0_40px_120px_-40px_rgba(217,255,99,0.25)]",
        )}
      >
        {/* Search row */}
        <div className="flex items-center gap-3 border-b border-edge/80 px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-acid" strokeWidth={1.5} aria-hidden />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-autocomplete="list"
            aria-activedescendant={results[active] ? `palette-option-${results[active].id}` : undefined}
            autoComplete="off"
            spellCheck={false}
            placeholder="Jump to a section, project or action…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            className="w-full bg-transparent font-mono text-sm text-frost placeholder:text-ash/70 focus:outline-none"
          />
          <button
            type="button"
            onClick={close}
            className="hud shrink-0 border border-edge/80 px-2 py-1 text-[0.5625rem] text-ash transition-colors hover:border-acid/50 hover:text-acid"
            aria-label="Close command palette"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div
          id="palette-results"
          ref={listRef}
          role="listbox"
          aria-label="Results"
          className="max-h-[46vh] overflow-y-auto px-2 py-2"
        >
          {results.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="font-display text-sm text-frost">No match for &ldquo;{query}&rdquo;</p>
              <p className="hud mt-2 text-[0.625rem] text-ash">Try &ldquo;projects&rdquo;, &ldquo;contact&rdquo; or &ldquo;calm&rdquo;</p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div role="group" aria-label={group} key={group} className="mb-1">
                <p aria-hidden className="hud px-3 pt-3 pb-2 text-[0.5625rem] text-ash/70">
                  {group}
                </p>
                {items.map((command) => {
                  renderedIndex += 1;
                  const index = renderedIndex;
                  const isActive = index === active;
                  return (
                    <button
                      key={command.id}
                      type="button"
                      id={`palette-option-${command.id}`}
                      data-index={index}
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => runAt(index)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150",
                        isActive ? "bg-acid/10 text-frost" : "text-ash hover:text-frost",
                      )}
                    >
                      <span className="shrink-0" aria-hidden>
                        {command.group === "Projects" ? (
                          <Orbit className={cn("h-4 w-4", isActive && "text-acid")} strokeWidth={1.5} />
                        ) : command.group === "Actions" ? (
                          <Radar className={cn("h-4 w-4", isActive && "text-volt")} strokeWidth={1.5} />
                        ) : (
                          <ArrowRight className={cn("h-4 w-4", isActive && "text-acid")} strokeWidth={1.5} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{command.label}</span>
                        {command.hint ? (
                          <span className="mt-0.5 block truncate font-mono text-[0.625rem] text-ash/70">
                            {command.hint}
                          </span>
                        ) : null}
                      </span>
                      {isActive ? (
                        <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-acid" strokeWidth={1.5} aria-hidden />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between gap-3 border-t border-edge/80 bg-void/60 px-4 py-2.5">
          <p className="hud text-[0.5625rem] text-ash" aria-live="polite">
            {flash ? (
              <span className="inline-flex items-center gap-1.5 text-volt">
                <Check className="h-3 w-3" strokeWidth={2} aria-hidden /> {flash}
              </span>
            ) : (
              <>
                <span className="text-frost">↑↓</span> NAVIGATE · <span className="text-frost">↵</span> SELECT ·{" "}
                <span className="text-frost">ESC</span> CLOSE
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(site.email).then(
                () => setFlash(`Copied ${site.email}`),
                () => setFlash("Clipboard blocked"),
              );
            }}
            className="hud flex items-center gap-1.5 text-[0.5625rem] text-ash transition-colors hover:text-acid"
          >
            <Copy className="h-3 w-3" strokeWidth={1.5} aria-hidden />
            COPY EMAIL
          </button>
        </div>
      </div>
    </div>
  );
}
