"use client";

import { useEffect, useSyncExternalStore } from "react";
import { readFavoriteTeamsRaw, subscribeToFavoriteTeams } from "@/lib/favorites";
import {
  readFollowedGamesRaw,
  subscribeToFollowedGames,
  unfollowGame,
} from "@/lib/followed-games";
import { readPushStatus, syncPushSubscription } from "@/lib/push/client";

const SYNC_DELAY_MS = 800;

/**
 * Mantiene al servidor al tanto de los partidos seguidos (🔔) y los equipos
 * favoritos (⭐) de este dispositivo, si tiene las notificaciones activas.
 */
export function PushSync() {
  const favoritesRaw = useSyncExternalStore(subscribeToFavoriteTeams, readFavoriteTeamsRaw, () => null);
  const followedRaw = useSyncExternalStore(subscribeToFollowedGames, readFollowedGamesRaw, () => null);

  // Al abrir la app y con cada cambio (con una pausa, por si hay varios seguidos).
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        if ((await readPushStatus()) === "active") await syncPushSubscription();
      } catch (error) {
        console.error("No se pudieron sincronizar las notificaciones", error);
      }
    }, SYNC_DELAY_MS);
    return () => clearTimeout(timer);
  }, [favoritesRaw, followedRaw]);

  // "Silenciar" en una notificación también apaga la 🔔 del partido.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "live-score-muted" && typeof event.data.gameId === "string") {
        unfollowGame(event.data.gameId);
      }
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, []);

  return null;
}
