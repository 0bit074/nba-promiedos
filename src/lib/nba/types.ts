/**
 * Modelo de dominio de la app. La UI solo conoce estos tipos: cada proveedor
 * de datos traduce la respuesta de su API a este formato.
 */

export type GameStatus =
  | "scheduled"
  | "live"
  | "final"
  | "postponed"
  | "canceled";

export interface Team {
  id: string;
  /** Nombre corto, por ejemplo "Pistons". */
  name: string;
  /** Nombre completo, por ejemplo "Detroit Pistons". */
  fullName: string;
  abbreviation: string;
  logoUrl: string;
}

export interface GameTopScorer {
  playerId: string;
  /** Nombre abreviado, por ejemplo "S. Gilgeous-Alexander". */
  name: string;
  /** Puntos del partido o, si todavía no se jugó, promedio de la temporada. */
  points: string;
}

export interface GameCompetitor {
  team: Team;
  /** `null` mientras el partido no empezó. */
  score: number | null;
  /** Récord de la temporada, por ejemplo "6-1". */
  record: string | null;
  topScorer: GameTopScorer | null;
}

export interface Game {
  id: string;
  /** Inicio del partido en formato ISO 8601 (UTC). */
  startTime: string;
  status: GameStatus;
  /** Cuarto actual: 1-4 son tiempo regular y de 5 en adelante, alargues. */
  period: number;
  /** Reloj del cuarto, por ejemplo "5:32". */
  clock: string | null;
  /** `true` en los descansos entre cuartos y en el entretiempo. */
  isPeriodBreak: boolean;
  home: GameCompetitor;
  away: GameCompetitor;
  broadcast: string | null;
}

export interface BoxScorePlayer {
  id: string;
  /** Nombre abreviado, por ejemplo "S. Gilgeous-Alexander". */
  name: string;
  isStarter: boolean;
  didNotPlay: boolean;
  minutes: string;
  points: number;
  rebounds: string;
  assists: string;
}

export interface ShootingStat {
  made: number;
  attempted: number;
}

export interface TeamGameStats {
  fieldGoals: ShootingStat;
  threePointers: ShootingStat;
  freeThrows: ShootingStat;
  offensiveRebounds: number;
  defensiveRebounds: number;
  turnovers: number;
}

export interface TeamBoxScore {
  players: BoxScorePlayer[];
  stats: TeamGameStats;
}

export interface GameDetail {
  game: Game;
  /** `null` si el partido no empezó o todavía no hay estadísticas. */
  boxScores: { home: TeamBoxScore; away: TeamBoxScore } | null;
}

export type ConferenceId = "east" | "west";

export interface TeamStanding {
  team: Team;
  /** Puesto en la conferencia, del 1 al 15. */
  seed: number;
  wins: number;
  losses: number;
  /** Porcentaje de victorias, por ejemplo ".875". */
  winPercent: string;
  /** Juegos de diferencia con el líder, por ejemplo "2.5". */
  gamesBehind: string;
  /** Positiva si son victorias seguidas y negativa si son derrotas. */
  streak: number;
  /** Récord de los últimos diez partidos, por ejemplo "7-3". */
  lastTen: string;
}

export interface ConferenceStandings {
  conference: ConferenceId;
  /** Ordenados por puesto. */
  teams: TeamStanding[];
}

export interface PlayerSummary {
  id: string;
  name: string;
  headshotUrl: string | null;
  /** Abreviatura de la posición, por ejemplo "G" o "PF". */
  position: string | null;
  teamName: string | null;
}

export interface RosterPlayer extends PlayerSummary {
  jersey: string | null;
}

export interface TeamRoster {
  team: Team;
  players: RosterPlayer[];
}

export type StatCategoryId =
  | "points"
  | "rebounds"
  | "assists"
  | "steals"
  | "blocks";

export interface StatLeader {
  player: PlayerSummary;
  /** Promedio ya formateado, por ejemplo "28.4". */
  value: string;
}

export interface StatLeaderCategory {
  id: StatCategoryId;
  leaders: StatLeader[];
}

/** Promedios por partido, tal como los entrega la fuente de datos. */
export interface PlayerAverages {
  gamesPlayed: string;
  minutes: string;
  points: string;
  rebounds: string;
  assists: string;
  steals: string;
  blocks: string;
  fieldGoalPct: string;
  threePointPct: string;
  freeThrowPct: string;
}

export interface PlayerGameLogEntry {
  id: string;
  /** Inicio del partido en formato ISO 8601 (UTC). */
  startTime: string;
  isHome: boolean;
  opponent: string;
  isWin: boolean;
  /** Resultado, por ejemplo "117-112". */
  score: string;
  minutes: string;
  points: string;
  rebounds: string;
  assists: string;
}

export interface PlayerProfile {
  id: string;
  name: string;
  headshotUrl: string | null;
  position: string | null;
  jersey: string | null;
  team: Team | null;
  heightCm: number | null;
  weightKg: number | null;
  age: number | null;
  birthPlace: string | null;
  draft: { year: number; round: number; pick: number } | null;
  /** Temporada en curso en la liga: 1 para un novato. */
  seasonNumber: number | null;
  seasonAverages: PlayerAverages | null;
  careerAverages: PlayerAverages | null;
  /** Últimos partidos de temporada regular, del más reciente al más antiguo. */
  recentGames: PlayerGameLogEntry[];
}

/** Contrato que implementa cada fuente de datos. */
export interface NbaDataProvider {
  /** @param date Jornada NBA en formato YYYY-MM-DD. */
  getGamesByDate(date: string): Promise<Game[]>;
  /** Devuelve `null` si el partido no existe. */
  getGameDetail(id: string): Promise<GameDetail | null>;
  /** Devuelve primero el Este y después el Oeste. */
  getStandings(): Promise<ConferenceStandings[]>;
  getStatLeaders(): Promise<StatLeaderCategory[]>;
  searchPlayers(query: string): Promise<PlayerSummary[]>;
  /** Devuelve `null` si el jugador no existe. */
  getPlayerProfile(id: string): Promise<PlayerProfile | null>;
  /** Devuelve `null` si el equipo no existe. */
  getTeamRoster(teamId: string): Promise<TeamRoster | null>;
}
