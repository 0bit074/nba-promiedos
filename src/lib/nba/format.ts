import type { Game, ShootingStat } from "./types";

function getPeriodName(period: number) {
  if (period <= 4) return `Q${period}`;
  const overtime = period - 4;
  return overtime === 1 ? "OT" : `${overtime}OT`;
}

/** Texto corto del estado de un partido en juego o terminado. */
export function getGameStatusLabel(game: Game) {
  switch (game.status) {
    case "live":
      if (!game.isPeriodBreak) return getPeriodName(game.period);
      return game.period === 2
        ? "Entretiempo"
        : `Fin ${getPeriodName(game.period)}`;
    case "final":
      return game.period > 4 ? `Final (${getPeriodName(game.period)})` : "Final";
    case "postponed":
      return "Postergado";
    case "canceled":
      return "Cancelado";
    case "scheduled":
      return "";
  }
}

/** Búsqueda en YouTube del resumen de un partido. */
export function getHighlightsUrl({ home, away }: Game) {
  const params = new URLSearchParams({
    search_query: `NBA highlights ${home.team.name} vs ${away.team.name}`,
  });

  return `https://www.youtube.com/results?${params}`;
}

/** Porcentaje de acierto con un decimal; 0 si no hubo intentos. */
export function getShootingPercent({ made, attempted }: ShootingStat) {
  if (attempted === 0) return 0;
  return Math.round((made / attempted) * 1000) / 10;
}

export type StandingZone = "playoffs" | "play-in" | "out";

/** Del 1 al 6 clasifican directo; del 7 al 10 juegan el Play-In. */
export function getStandingZone(seed: number): StandingZone {
  if (seed <= 6) return "playoffs";
  if (seed <= 10) return "play-in";
  return "out";
}

/** Por ejemplo "W3" (3 victorias seguidas) o "L2" (2 derrotas seguidas). */
export function formatStreak(streak: number) {
  if (streak === 0) return "-";
  return `${streak > 0 ? "W" : "L"}${Math.abs(streak)}`;
}

const POSITION_NAMES: Record<string, string> = {
  PG: "Base",
  SG: "Escolta",
  G: "Escolta",
  SF: "Alero",
  F: "Alero",
  PF: "Ala-pívot",
  C: "Pívot",
};

export function getPositionName(position: string | null) {
  if (!position) return null;
  return POSITION_NAMES[position] ?? position;
}

/** Por ejemplo "1,98 m". */
export function formatHeight(heightCm: number) {
  return `${(heightCm / 100).toFixed(2).replace(".", ",")} m`;
}
