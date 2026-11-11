"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  parseFavoriteTeams,
  readFavoriteTeamsRaw,
  subscribeToFavoriteTeams,
  type FavoriteTeam,
} from "@/lib/favorites";

/**
 * Equipos favoritos guardados en el navegador. En el servidor (y al
 * hidratar) la lista está vacía, así el HTML coincide y después se actualiza.
 */
export function useFavoriteTeams(): FavoriteTeam[] {
  const raw = useSyncExternalStore(
    subscribeToFavoriteTeams,
    readFavoriteTeamsRaw,
    () => null,
  );
  return useMemo(() => parseFavoriteTeams(raw), [raw]);
}
