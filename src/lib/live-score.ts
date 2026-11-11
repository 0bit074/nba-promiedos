import type { Game } from "./nba/types";

/**
 * Actualización de marcador en vivo que el servidor envía por Web Push. El
 * service worker (`public/sw.js`) arma con ella la notificación, con el
 * título "BOS 104 - 108 LAL • 4º Q 02:45" (local primero).
 */

export interface LiveScoreTeam {
  /** Abreviatura, por ejemplo "LAL". */
  abbr: string;
  score: number;
  /** Nombre corto, por ejemplo "Lakers". */
  name: string;
  /** Logo de ESPN para fondo oscuro (la notificación arma su imagen con él). */
  logo: string;
}

export interface LiveScoreUpdate {
  type: "live-score";
  gameId: string;
  home: LiveScoreTeam;
  away: LiveScoreTeam;
  period: number;
  /** Tiempo restante del período, "MM:SS". */
  clock: string;
  /** Descanso entre cuartos o entretiempo. */
  isPeriodBreak: boolean;
  status: "live" | "final";
}

/** ESPN da "5:32" o "45.2" (último minuto): siempre "MM:SS". */
export function normalizeClock(clock: string | null) {
  if (!clock) return "00:00";
  if (!clock.includes(":")) {
    const seconds = Math.floor(Number(clock) || 0);
    return `00:${String(seconds).padStart(2, "0")}`;
  }
  const [minutes, seconds] = clock.split(":");
  return `${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
}

function toLiveScoreTeam({ team, score }: Game["home"]): LiveScoreTeam {
  return {
    abbr: team.abbreviation,
    score: score ?? 0,
    name: team.name,
    logo: team.logoUrl,
  };
}

/** `null` si el partido no está en juego ni terminado. */
export function toLiveScoreUpdate(game: Game): LiveScoreUpdate | null {
  if (game.status !== "live" && game.status !== "final") return null;

  return {
    type: "live-score",
    gameId: game.id,
    home: toLiveScoreTeam(game.home),
    away: toLiveScoreTeam(game.away),
    period: Math.max(game.period, 1),
    clock: normalizeClock(game.clock),
    isPeriodBreak: game.isPeriodBreak,
    status: game.status,
  };
}

/** Clave que cambia solo si cambian los puntos, el período o el reloj. */
export function getLiveScoreKey(update: LiveScoreUpdate) {
  const { home, away, period, clock, isPeriodBreak, status } = update;
  return [home.score, away.score, period, clock, isPeriodBreak, status].join("|");
}
