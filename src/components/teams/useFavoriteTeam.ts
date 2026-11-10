"use client";

import { useSyncExternalStore } from "react";
import {
  parseFavoriteTeam,
  readFavoriteTeamRaw,
  subscribeToFavoriteTeam,
  type FavoriteTeam,
} from "@/lib/favorites";

/**
 * Equipo favorito guardado en el navegador. En el servidor (y al hidratar)
 * vale `null`, así el HTML coincide y después se actualiza.
 */
export function useFavoriteTeam(): FavoriteTeam | null {
  const raw = useSyncExternalStore(
    subscribeToFavoriteTeam,
    readFavoriteTeamRaw,
    () => null,
  );
  return parseFavoriteTeam(raw);
}
