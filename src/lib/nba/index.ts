import { cacheLife } from "next/cache";
import { espnProvider } from "./espn";
import { mockProvider } from "./mock";
import type {
  ConferenceStandings,
  Game,
  NbaDataProvider,
  PlayerProfile,
  PlayerSummary,
  StatLeaderCategory,
  TeamRoster,
} from "./types";

export type {
  ConferenceId,
  ConferenceStandings,
  Game,
  GameCompetitor,
  GameStatus,
  PlayerAverages,
  PlayerGameLogEntry,
  PlayerProfile,
  PlayerSummary,
  RosterPlayer,
  StatCategoryId,
  StatLeaderCategory,
  Team,
  TeamRoster,
  TeamStanding,
} from "./types";

/** Para sumar otra API: implementar `NbaDataProvider` y elegirla acá. */
const provider: NbaDataProvider =
  process.env.NBA_DATA_SOURCE === "mock" ? mockProvider : espnProvider;

export function isGameOver({ status }: Game) {
  return status === "final" || status === "postponed" || status === "canceled";
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
