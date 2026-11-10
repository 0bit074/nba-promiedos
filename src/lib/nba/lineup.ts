import type { BoxScorePlayer } from "./types";

export type CourtPosition = "PG" | "SG" | "SF" | "PF" | "C";

export const COURT_POSITIONS: CourtPosition[] = ["PG", "SG", "SF", "PF", "C"];

export interface LineupSpot {
  position: CourtPosition;
  player: BoxScorePlayer;
}

/** Orden en la cancha según la posición genérica que da la fuente. */
const POSITION_ORDER: Record<string, number> = {
  PG: 0,
  G: 1,
  SG: 1,
  GF: 2,
  SF: 2,
  F: 3,
  PF: 3,
  FC: 4,
  C: 4,
};

/**
 * Ubica a los 5 titulares en PG, SG, SF, PF y C. ESPN suele dar sólo G, F o
 * C, así que se ordenan de base a pívot y se asignan en ese orden: es una
 * aproximación, no la posición táctica exacta.
 */
export function getStartingLineup(players: BoxScorePlayer[]): LineupSpot[] {
  const starters = players
    .filter((player) => player.isStarter)
    .slice(0, COURT_POSITIONS.length);

  const exact = starters.every((player) =>
    COURT_POSITIONS.includes(player.position as CourtPosition),
  );
  if (exact && new Set(starters.map((p) => p.position)).size === starters.length) {
    return starters
      .map((player) => ({ position: player.position as CourtPosition, player }))
      .sort(
        (a, b) =>
          COURT_POSITIONS.indexOf(a.position) - COURT_POSITIONS.indexOf(b.position),
      );
  }

  return starters
    .map((player, index) => ({ player, index }))
    .sort(
      (a, b) =>
        (POSITION_ORDER[a.player.position ?? ""] ?? 2) -
          (POSITION_ORDER[b.player.position ?? ""] ?? 2) || a.index - b.index,
    )
    .map(({ player }, index) => ({ position: COURT_POSITIONS[index], player }));
}
