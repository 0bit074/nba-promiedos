"use client";

import { useState, type ReactNode } from "react";
import { NEWS_CATEGORIES } from "@/lib/news/categories";
import type { NewsCategory } from "@/lib/news/types";

type Filter = NewsCategory | "all";

interface NewsFiltersProps {
  /** Tarjeta ya renderizada de cada noticia, con su categoría. */
  items: { id: string; category: NewsCategory; card: ReactNode }[];
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todas" },
  ...(Object.keys(NEWS_CATEGORIES) as NewsCategory[]).map((id) => ({
    id,
    label: NEWS_CATEGORIES[id].filterLabel,
  })),
];

/** Filtra las noticias por categoría sin volver a pedirlas. */
export function NewsFilters({ items }: NewsFiltersProps) {
  const [active, setActive] = useState<Filter>("all");
  const visible =
    active === "all" ? items : items.filter((item) => item.category === active);

  return (
    <div className="space-y-4">
      <div
        role="group"
        aria-label="Filtrar por categoría"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {FILTERS.map(({ id, label }) => {
          const count =
            id === "all"
              ? items.length
              : items.filter((item) => item.category === id).length;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={id === active}
              onClick={() => setActive(id)}
              className={`h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors ${
                id === active
                  ? "border-accent bg-accent text-background"
                  : "border-line bg-surface text-muted hover:text-foreground"
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-75">{count}</span>
            </button>
          );
        })}
      </div>
      {visible.length > 0 ? (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ id, card }) => (
            <li key={id} className="flex">
              {card}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-line bg-surface px-6 py-12 text-center text-sm text-muted">
          No hay noticias de esta categoría por ahora.
        </p>
      )}
    </div>
  );
}
