"use client";

import { useEffect } from "react";
import { useCalmAttribute } from "@/lib/motion";
import { startScrollBus } from "@/lib/scroll-bus";

/**
 * Client-side host for global behaviours: the shared frame bus (scroll +
 * pointer) and the `data-calm` attribute that neutralises animation when the
 * user asks for it. Renders nothing.
 */
export function AppShell() {
  useCalmAttribute();

  useEffect(() => {
    return startScrollBus();
  }, []);

  return null;
}
