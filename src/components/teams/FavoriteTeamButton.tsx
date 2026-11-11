"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import {
  countFavoritesInConference,
  MAX_FAVORITES_PER_CONFERENCE,
  toggleFavoriteTeam,
  type FavoriteTeam,
} from "@/lib/favorites";
import { CONFERENCE_NAMES, getTeamConference } from "@/lib/nba/conferences";
import { useFavoriteTeams } from "./useFavoriteTeams";

const NOTICE_DURATION_MS = 4_000;

interface FavoriteTeamButtonProps {
  team: FavoriteTeam;
  /** `compact` para filas de tabla; `default` para encabezados. */
  size?: "compact" | "default";
}

/** Estrella para sumar o quitar un equipo de "Mis equipos". */
export function FavoriteTeamButton({
  team,
  size = "default",
}: FavoriteTeamButtonProps) {
  const favorites = useFavoriteTeams();
  const [notice, setNotice] = useState<string | null>(null);

  const isFavorite = favorites.some(({ id }) => id === team.id);
  const conference = getTeamConference(team.abbreviation);
  const isConferenceFull =
    !isFavorite &&
    conference !== null &&
    countFavoritesInConference(favorites, conference) >=
      MAX_FAVORITES_PER_CONFERENCE;

  const label = isFavorite
    ? `Quitar a ${team.name} de Mis equipos`
    : `Sumar a ${team.name} a Mis equipos`;

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  function handleClick() {
    const result = toggleFavoriteTeam(team);
    if (result === "full" && conference) {
      setNotice(
        `Ya tienes ${MAX_FAVORITES_PER_CONFERENCE} favoritos del ${CONFERENCE_NAMES[conference]}. Quita uno para sumar a ${team.name}.`,
      );
    } else {
      setNotice(null);
    }
  }

  const isCompact = size === "compact";

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isFavorite}
        aria-label={label}
        title={
          isConferenceFull
            ? `Máximo ${MAX_FAVORITES_PER_CONFERENCE} favoritos por conferencia`
            : label
        }
        className={`flex shrink-0 items-center justify-center rounded-md transition-colors ${
          isCompact
            ? "size-7"
            : "size-10 border border-line hover:border-accent"
        } ${
          isFavorite
            ? "text-accent"
            : isConferenceFull
              ? "text-muted/40"
              : "text-muted hover:text-accent"
        }`}
      >
        <Star
          aria-hidden
          className={isCompact ? "size-4" : "size-5"}
          fill={isFavorite ? "currentColor" : "none"}
        />
      </button>
      {notice && (
        <p
          role="status"
          className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-sm rounded-lg border border-line bg-surface-raised px-4 py-3 text-center text-sm font-normal shadow-lg shadow-black/25 md:bottom-6"
        >
          {notice}
        </p>
      )}
    </>
  );
}
