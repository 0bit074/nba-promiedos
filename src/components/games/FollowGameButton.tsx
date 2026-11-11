"use client";

import { Bell, BellRing } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  followGame,
  parseFollowedGames,
  readFollowedGamesRaw,
  subscribeToFollowedGames,
  unfollowGame,
} from "@/lib/followed-games";
import { enablePush, PUSH_STATUS_MESSAGES, waitForServiceWorker } from "@/lib/push/client";

const NOTICE_DURATION_MS = 5_000;

interface FollowGameButtonProps {
  gameId: string;
  startTime: string;
  /** Por ejemplo "Celtics vs Lakers", para el lector de pantalla. */
  matchup: string;
  size?: "compact" | "default";
}

function useIsFollowed(gameId: string) {
  const raw = useSyncExternalStore(subscribeToFollowedGames, readFollowedGamesRaw, () => null);
  return parseFollowedGames(raw).some(({ id }) => id === gameId);
}

/**
 * Campanita de un partido: recibir su marcador en vivo como notificación.
 * Si las notificaciones no están activas, primero las activa.
 */
export function FollowGameButton({
  gameId,
  startTime,
  matchup,
  size = "compact",
}: FollowGameButtonProps) {
  const isFollowed = useIsFollowed(gameId);
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  async function toggle() {
    if (isFollowed) {
      unfollowGame(gameId);
      return;
    }

    setIsBusy(true);
    try {
      const status = await enablePush();
      if (status !== "active") {
        setNotice(PUSH_STATUS_MESSAGES[status] ?? "Primero permite las notificaciones.");
        return;
      }
      followGame({ id: gameId, startTime });
      // Si antes se silenció desde la notificación, vuelve a mostrarse.
      const registration = await waitForServiceWorker();
      registration.active?.postMessage({ type: "live-score-unmute", gameId });
      setNotice(`Te avisaremos el marcador de ${matchup} en vivo.`);
    } catch (error) {
      console.error("No se pudo seguir el partido", error);
      setNotice("No se pudieron activar las notificaciones en este navegador.");
    } finally {
      setIsBusy(false);
    }
  }

  const label = isFollowed
    ? `Dejar de recibir notificaciones de ${matchup}`
    : `Recibir notificaciones de ${matchup}`;
  const Icon = isFollowed ? BellRing : Bell;
  const isCompact = size === "compact";

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={isBusy}
        aria-pressed={isFollowed}
        aria-label={label}
        title={label}
        className={`relative z-10 flex shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-50 ${
          isCompact ? "size-8" : "size-10 border border-line hover:border-accent"
        } ${isFollowed ? "text-accent" : "text-muted hover:text-accent"}`}
      >
        <Icon
          aria-hidden
          className={isCompact ? "size-4" : "size-5"}
          fill={isFollowed ? "currentColor" : "none"}
        />
      </button>
      {notice && (
        <p
          role="status"
          className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-sm rounded-lg border border-line bg-surface-raised px-4 py-3 text-center text-sm font-normal text-foreground shadow-lg shadow-black/25 md:bottom-6"
        >
          {notice}
        </p>
      )}
    </>
  );
}
