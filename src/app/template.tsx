import { PageShell } from "@/components/ui/PageShell";

/** Remounts on every navigation, so the entrance animation replays per route. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageShell>{children}</PageShell>;
}
