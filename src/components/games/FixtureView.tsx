"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useFavoriteTeam } from "@/components/teams/useFavoriteTeam";

export type FixtureSection = "live" | "upcoming" | "finished";

export interface FixtureItem {
  id: string;
  section: FixtureSection;
  /** Ids del local y el visitante. */
  teamIds: [string, string];
  /** Tarjeta del partido, ya renderizada en el servidor. */
  card: ReactNode;
}

const SECTION_TITLES: Record<FixtureSection, string> = {
  live: "En vivo",
  upcoming: "Próximos",
  finished: "Finalizados",
};

const SECTIONS = Object.keys(SECTION_TITLES) as FixtureSection[];

type Filter = "all" | "favorite";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "favorite", label: "Mi Equipo" },
];

function GameSection({
  title,
  icon,
  items,
  isHighlighted = false,
}: {
  title: string;
  icon?: ReactNode;
  items: FixtureItem[];
  isHighlighted?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
        {icon}
        {title} ({items.length})
      </h2>
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {items.map(({ id, card }) => (
          <div
            key={id}
            className={
              isHighlighted
                ? "rounded-lg ring-1 ring-accent/60 ring-offset-2 ring-offset-background"
                : undefined
            }
          >
            {card}
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyFavorite({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-6 py-12 text-center">
      <Star aria-hidden className="mx-auto mb-2 size-6 text-accent" />
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted">{children}</p>
    </div>
  );
}

/** Fixture con "Mi Equipo" fijado arriba y el filtro Todos / Mi Equipo. */
export function FixtureView({ items }: { items: FixtureItem[] }) {
  const favorite = useFavoriteTeam();
  const [filter, setFilter] = useState<Filter>("all");

  const isFavoriteGame = (item: FixtureItem) =>
    favorite !== null && item.teamIds.includes(favorite.id);
  const favoriteItems = items.filter(isFavoriteGame);
  const otherItems = items.filter((item) => !isFavoriteGame(item));

  const favoriteSection = (
    <GameSection
      title={favorite ? `Mi equipo · ${favorite.name}` : "Mi equipo"}
      icon={<Star aria-hidden className="size-3.5 text-accent" fill="currentColor" />}
      items={favoriteItems}
      isHighlighted
    />
  );

  return (
    <div className="space-y-6">
      <div
        role="group"
        aria-label="Filtrar partidos"
        className="grid grid-cols-2 gap-1 rounded-lg bg-surface p-1 sm:inline-grid sm:w-72"
      >
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={id === filter}
            onClick={() => setFilter(id)}
            className={`flex h-9 items-center justify-center gap-1.5 rounded-md text-sm font-semibold ${
              id === filter ? "bg-accent text-background" : "text-muted"
            }`}
          >
            {id === "favorite" && (
              <Star
                aria-hidden
                className="size-3.5"
                fill={id === filter ? "currentColor" : "none"}
              />
            )}
            {label}
          </button>
        ))}
      </div>

      {filter === "favorite" ? (
        favorite === null ? (
          <EmptyFavorite title="Todavía no elegiste tu equipo">
            Márcalo con la ⭐ en{" "}
            <Link href="/posiciones" className="font-medium text-accent">
              Posiciones
            </Link>{" "}
            o en la página del equipo.
          </EmptyFavorite>
        ) : favoriteItems.length === 0 ? (
          <EmptyFavorite title={`${favorite.name} no juega este día`}>
            Elige otra fecha para ver sus partidos.
          </EmptyFavorite>
        ) : (
          favoriteSection
        )
      ) : (
        <>
          {favoriteSection}
          {SECTIONS.map((section) => (
            <GameSection
              key={section}
              title={SECTION_TITLES[section]}
              items={otherItems.filter((item) => item.section === section)}
            />
          ))}
        </>
      )}
    </div>
  );
}
