"use client";

import { Star } from "lucide-react";
import { setFavoriteTeam, type FavoriteTeam } from "@/lib/favorites";
import { useFavoriteTeam } from "./useFavoriteTeam";

interface FavoriteTeamButtonProps {
  team: FavoriteTeam;
  /** `compact` para filas de tabla; `default` para encabezados. */
  size?: "compact" | "default";
}

/** Estrella para marcar o desmarcar "Mi Equipo"; hay uno solo a la vez. */
export function FavoriteTeamButton({
  team,
  size = "default",
}: FavoriteTeamButtonProps) {
  const favorite = useFavoriteTeam();
  const isFavorite = favorite?.id === team.id;
  const label = isFavorite
    ? `Quitar a ${team.name} de Mi Equipo`
    : `Marcar a ${team.name} como Mi Equipo`;

  const isCompact = size === "compact";

  return (
    <button
      type="button"
      onClick={() => setFavoriteTeam(isFavorite ? null : team)}
      aria-pressed={isFavorite}
      aria-label={label}
      title={label}
      className={`flex shrink-0 items-center justify-center rounded-md transition-colors ${
        isCompact
          ? "size-7"
          : "size-10 border border-line hover:border-accent"
      } ${isFavorite ? "text-accent" : "text-muted hover:text-accent"}`}
    >
      <Star
        aria-hidden
        className={isCompact ? "size-4" : "size-5"}
        fill={isFavorite ? "currentColor" : "none"}
      />
    </button>
  );
}
