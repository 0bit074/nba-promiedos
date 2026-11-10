"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PlayerSummary } from "@/lib/nba";
import { getPositionName } from "@/lib/nba/format";
import { PlayerAvatar } from "./PlayerAvatar";

/** La búsqueda de ESPN no devuelve nada con una sola letra. */
export const MIN_SUGGESTION_LENGTH = 2;

/** Pausa al escribir antes de buscar, para no pedir en cada tecla. */
const DEBOUNCE_MS = 250;

/** Resultados ya pedidos en esta visita, por texto normalizado. */
const resultsCache = new Map<string, PlayerSummary[]>();

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** 0: el nombre empieza así; 1: alguna palabra; 2: lo contiene; 3: aproximado. */
function getMatchRank(name: string, query: string) {
  const normalizedName = normalize(name);
  if (normalizedName.startsWith(query)) return 0;
  if (normalizedName.split(/[\s.'-]+/).some((word) => word.startsWith(query))) {
    return 1;
  }
  return normalizedName.includes(query) ? 2 : 3;
}

/** ESPN mezcla coincidencias aproximadas: primero van las más directas. */
function rankPlayers(players: PlayerSummary[], query: string) {
  return players
    .map((player, index) => ({
      player,
      index,
      rank: getMatchRank(player.name, query),
    }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ player }) => player);
}

export type SuggestionsStatus = "short" | "loading" | "ready" | "error";

interface FetchedResults {
  query: string;
  players: PlayerSummary[];
  failed: boolean;
}

/** Jugadores que coinciden con lo que se va escribiendo. */
export function usePlayerSuggestions(text: string): {
  status: SuggestionsStatus;
  players: PlayerSummary[];
} {
  const query = normalize(text);
  const isShort = query.length < MIN_SUGGESTION_LENGTH;
  const [fetched, setFetched] = useState<FetchedResults | null>(null);

  useEffect(() => {
    if (isShort || resultsCache.has(query)) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query });
        const response = await fetch(`/api/jugadores/buscar?${params}`, {
          signal: controller.signal,
        });
        const players = (await response.json()) as PlayerSummary[];
        if (response.ok) resultsCache.set(query, players);
        setFetched({ query, players, failed: !response.ok });
      } catch {
        // Un pedido cancelado porque se siguió escribiendo no es un error.
        if (!controller.signal.aborted) {
          setFetched({ query, players: [], failed: true });
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, isShort]);

  if (isShort) return { status: "short", players: [] };

  const cached = resultsCache.get(query);
  if (cached) return { status: "ready", players: rankPlayers(cached, query) };

  if (fetched?.query === query) {
    return fetched.failed
      ? { status: "error", players: [] }
      : { status: "ready", players: rankPlayers(fetched.players, query) };
  }

  // Mientras llega la respuesta, se mantienen los resultados anteriores.
  return {
    status: "loading",
    players: fetched ? rankPlayers(fetched.players, query) : [],
  };
}

/** Resalta la parte del nombre que coincide con lo escrito. */
function HighlightedName({ name, query }: { name: string; query: string }) {
  const normalizedName = normalize(name);
  const normalizedQuery = normalize(query);
  // `normalize` sólo quita tildes, así que las posiciones coinciden.
  const start =
    normalizedName.length === name.length && normalizedQuery
      ? normalizedName.indexOf(normalizedQuery)
      : -1;

  if (start === -1) return <>{name}</>;

  const end = start + normalizedQuery.length;
  return (
    <>
      {name.slice(0, start)}
      <mark className="bg-transparent text-accent">{name.slice(start, end)}</mark>
      {name.slice(end)}
    </>
  );
}

interface SuggestionsListProps {
  id: string;
  query: string;
  status: SuggestionsStatus;
  players: PlayerSummary[];
  activeIndex: number;
  getOptionId: (index: number) => string;
  /** Se llama al elegir un jugador, para cerrar la lista. */
  onSelect: () => void;
}

const MESSAGES: Partial<Record<SuggestionsStatus, string>> = {
  short: "Escribe al menos 2 letras",
  error: "No pudimos buscar jugadores",
};

/** Panel desplegable con las coincidencias, debajo del campo de búsqueda. */
export function SuggestionsList({
  id,
  query,
  status,
  players,
  activeIndex,
  getOptionId,
  onSelect,
}: SuggestionsListProps) {
  const message =
    MESSAGES[status] ??
    (players.length === 0
      ? status === "loading"
        ? "Buscando…"
        : "Sin coincidencias"
      : null);

  return (
    <div
      // Evita que el campo pierda el foco (y cierre la lista) antes del clic.
      onMouseDown={(event) => event.preventDefault()}
      className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-line bg-surface shadow-lg shadow-black/20"
    >
      <ul
        id={id}
        role="listbox"
        aria-label="Jugadores sugeridos"
        aria-busy={status === "loading"}
        className={`max-h-[min(24rem,60dvh)] overflow-y-auto ${
          status === "loading" && players.length > 0 ? "opacity-70" : ""
        }`}
      >
        {players.map((player, index) => {
          const details = [player.teamName, getPositionName(player.position)]
            .filter(Boolean)
            .join(" · ");
          const isActive = index === activeIndex;

          return (
            <li key={player.id} role="presentation">
              <Link
                id={getOptionId(index)}
                role="option"
                aria-selected={isActive}
                href={`/jugadores/${player.id}`}
                onClick={onSelect}
                className={`flex h-14 items-center gap-3 px-3 transition-colors hover:bg-surface-raised ${
                  isActive ? "bg-surface-raised" : ""
                }`}
              >
                <PlayerAvatar
                  name={player.name}
                  url={player.headshotUrl}
                  size={32}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    <HighlightedName name={player.name} query={query} />
                  </span>
                  {details && (
                    <span className="block truncate text-xs text-muted">
                      {details}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {message && (
        <p role="status" className="px-3 py-3 text-sm text-muted">
          {message}
        </p>
      )}
      {status !== "short" && players.length > 0 && (
        <button
          type="submit"
          className="block w-full border-t border-line px-3 py-2.5 text-left text-xs font-medium text-accent hover:bg-surface-raised"
        >
          Ver todos los resultados para “{query.trim()}”
        </button>
      )}
    </div>
  );
}
