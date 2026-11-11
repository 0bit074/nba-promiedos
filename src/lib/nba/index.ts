import { cacheLife } from "next/cache";
import { espnProvider } from "./espn";
import { mockProvider } from "./mock";
import type {
  ConferenceStandings,
  Game,
  GameDetail,
  NbaDataProvider,
  PlayerProfile,
  PlayerSummary,
  StatLeaderCategory,
  TeamRoster,
  TeamSeasonStats,
} from "./types";

export type {
  BoxScorePlayer,
  ConferenceId,
  ConferenceStandings,
  Game,
  GameCompetitor,
  GameDetail,
  GameStatus,
  PlayerAverages,
  PlayerGameLogEntry,
  PlayerProfile,
  PlayerSummary,
  RosterPlayer,
  ShootingStat,
  StatCategoryId,
  StatLeader,
  StatLeaderCategory,
  Team,
  TeamBoxScore,
  TeamGameStats,
  TeamRoster,
  TeamSeasonStats,
  TeamStanding,
} from "./types";

/** Para sumar otra API: implementar `NbaDataProvider` y elegirla acá. */
const provider: NbaDataProvider =
  process.env.NBA_DATA_SOURCE === "mock" ? mockProvider : espnProvider;

export function isGameOver({ status }: Game) {
  return status === "final" || status === "postponed" || status === "canceled";
}

/** Sin caché: para el marcador en vivo de las notificaciones (cada 15 s). */
export function getGamesByDateFresh(date: string): Promise<Game[]> {
  return provider.getGamesByDate(date);
}

export async function getGamesByDate(date: string): Promise<Game[]> {
  "use cache";

  const games = await provider.getGamesByDate(date);

  // La duración de la caché depende de cuánto pueden cambiar los datos.
  if (games.some((game) => game.status === "live")) {
    cacheLife("seconds");
  } else if (games.length > 0 && games.every(isGameOver)) {
    cacheLife("hours");
  } else {
    cacheLife("minutes");
  }

  return games;
}

export async function getGameDetail(id: string): Promise<GameDetail | null> {
  "use cache";

  const detail = await provider.getGameDetail(id);

  if (detail?.game.status === "live") {
    cacheLife("seconds");
  } else if (detail && isGameOver(detail.game)) {
    cacheLife("hours");
  } else {
    cacheLife("minutes");
  }

  return detail;
}

export async function getStandings(): Promise<ConferenceStandings[]> {
  "use cache";
  cacheLife("minutes");

  return provider.getStandings();
}

export async function getStatLeaders(): Promise<StatLeaderCategory[]> {
  "use cache";
  cacheLife("minutes");

  return provider.getStatLeaders();
}

export async function searchPlayers(query: string): Promise<PlayerSummary[]> {
  "use cache";
  cacheLife("minutes");

  return provider.searchPlayers(query);
}

export async function getPlayerProfile(
  id: string,
): Promise<PlayerProfile | null> {
  "use cache";
  cacheLife("minutes");

  return provider.getPlayerProfile(id);
}

export async function getTeamRoster(
  teamId: string,
): Promise<TeamRoster | null> {
  "use cache";
  cacheLife("hours");

  return provider.getTeamRoster(teamId);
}

export async function getTeamStats(
  teamId: string,
): Promise<TeamSeasonStats | null> {
  "use cache";
  cacheLife("hours");

  return provider.getTeamStats(teamId);
}
