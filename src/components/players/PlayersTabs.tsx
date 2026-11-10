import { Search, Trophy } from "lucide-react";
import Link from "next/link";

export type PlayersTab = "leaders" | "search";

const TABS = [
  { id: "leaders", label: "Líderes", href: "/jugadores", icon: Trophy },
  {
    id: "search",
    label: "Buscar",
    href: "/jugadores?tab=buscar",
    icon: Search,
  },
] as const;

/** Decide la pestaña a partir de la URL: una búsqueda siempre es "Buscar". */
export function getPlayersTab(params: {
  tab?: string | string[];
  q?: string | string[];
}): PlayersTab {
  const query = typeof params.q === "string" ? params.q.trim() : "";
  return params.tab === "buscar" || query ? "search" : "leaders";
}

/** Pestañas de /jugadores: son enlaces, así cada una tiene su URL. */
export function PlayersTabs({ active }: { active: PlayersTab }) {
  return (
    <nav
      aria-label="Secciones de jugadores"
      className="grid grid-cols-2 gap-1 rounded-lg bg-surface p-1 sm:inline-grid sm:w-72"
    >
      {TABS.map(({ id, label, href, icon: Icon }) => {
        const isActive = id === active;
        return (
          <Link
            key={id}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`flex h-9 items-center justify-center gap-1.5 rounded-md text-sm font-semibold ${
              isActive ? "bg-accent text-background" : "text-muted hover:text-foreground"
            }`}
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
