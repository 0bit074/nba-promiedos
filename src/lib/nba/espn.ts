import type {
  BoxScorePlayer,
  ConferenceId,
  ConferenceStandings,
  Game,
  GameCompetitor,
  GameDetail,
  GameStatus,
  NbaDataProvider,
  PlayerAverages,
  PlayerGameLogEntry,
  PlayerSummary,
  RosterPlayer,
  ShootingStat,
  StatCategoryId,
  StatLeaderCategory,
  Team,
  TeamBoxScore,
  TeamGameStats,
  TeamRoster,
  TeamStanding,
} from "./types";

const SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";
const SUMMARY_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary";
const TEAMS_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams";
const STANDINGS_URL =
  "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?level=2";
const LEADERS_URL =
  "https://site.web.api.espn.com/apis/site/v3/sports/basketball/nba/leaders?limit=5";
const SEARCH_URL = "https://site.web.api.espn.com/apis/common/v3/search";
const ATHLETES_URL =
  "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes";
const REQUEST_TIMEOUT_MS = 8_000;
const SEARCH_LIMIT = 20;
const MIN_SEARCH_CHARACTERS = 2;
const RECENT_GAMES_LIMIT = 10;

const LEADER_CATEGORIES: [espnName: string, id: StatCategoryId][] = [
  ["pointsPerGame", "points"],
  ["reboundsPerGame", "rebounds"],
  ["assistsPerGame", "assists"],
  ["stealsPerGame", "steals"],
  ["blocksPerGame", "blocks"],
];

/** La búsqueda también devuelve equipos de G League, con ids que se repiten. */
const NBA_TEAM_ABBREVIATIONS = new Set([
  "ATL", "BKN", "BOS", "CHA", "CHI", "CLE", "DAL", "DEN", "DET", "GS",
  "HOU", "IND", "LAC", "LAL", "MEM", "MIA", "MIL", "MIN", "NO", "NY",
  "OKC", "ORL", "PHI", "PHX", "POR", "SA", "SAC", "TOR", "UTAH", "WSH",
]);

/** Solo los campos que usa la app; la respuesta real trae muchos más. */
interface EspnCompetitor {
  homeAway: "home" | "away";
  score?: string;
  records?: { type?: string; summary: string }[];
  leaders?: {
    name: string;
    leaders?: {
      displayValue: string;
      athlete: { id: string; shortName: string };
    }[];
  }[];
  team: {
    id: string;
    shortDisplayName: string;
    displayName: string;
    abbreviation: string;
    logo?: string;
    logoDark?: string;
  };
}

interface EspnEvent {
  id: string;
  date: string;
  status: {
    period?: number;
    displayClock?: string;
    type: { name: string; state: "pre" | "in" | "post" };
  };
  competitions: {
    competitors: EspnCompetitor[];
    broadcasts?: { names?: string[] }[];
  }[];
}

interface EspnStat {
  name: string;
  value?: number;
  displayValue: string;
}

interface EspnLogo {
  href: string;
  rel: string[];
}

interface EspnTeam {
  id: string;
  shortDisplayName: string;
  displayName: string;
  abbreviation: string;
  logos?: EspnLogo[];
}

interface EspnStandingEntry {
  team: EspnTeam;
  stats: EspnStat[];
}

interface EspnConference {
  abbreviation: string;
  standings: { entries: EspnStandingEntry[] };
}

interface EspnLeaderCategory {
  name: string;
  leaders?: {
    displayValue: string;
    athlete: {
      id: string;
      displayName: string;
      headshot?: { href: string };
      position?: { abbreviation: string };
    };
    team?: { shortDisplayName: string };
  }[];
}

interface EspnSearchItem {
  id: string;
  displayName: string;
  isActive?: boolean;
  headshot?: { href: string };
  position?: { abbreviation: string };
  teamRelationships?: {
    core?: { abbreviation?: string; shortDisplayName?: string };
  }[];
}

interface EspnAthlete {
  id: string;
  displayName: string;
  headshot?: { href: string };
  position?: { abbreviation: string };
  jersey?: string;
  team?: EspnTeam;
  displayHeight?: string;
  displayWeight?: string;
  age?: number;
  displayBirthPlace?: string;
  displayDraft?: string;
  displayExperience?: string;
}

interface EspnSummaryCompetitor {
  homeAway: "home" | "away";
  score?: string;
  record?: { type?: string; summary: string }[];
  linescores?: unknown[];
  team: Omit<EspnTeam, "shortDisplayName"> & { name: string };
}

interface EspnBoxScoreAthlete {
  starter?: boolean;
  didNotPlay?: boolean;
  stats?: string[];
  athlete: { id: string; displayName: string; shortName?: string };
}

interface EspnBoxScoreTeam {
  homeAway: "home" | "away";
  statistics: { name: string; displayValue: string }[];
}

interface EspnBoxScorePlayers {
  team: { id: string };
  statistics: { keys: string[]; athletes: EspnBoxScoreAthlete[] }[];
}

interface EspnSummary {
  header: {
    id: string;
    competitions: {
      date: string;
      status: EspnEvent["status"] & { displayClock?: string };
      competitors: EspnSummaryCompetitor[];
    }[];
  };
  boxscore?: {
    teams?: EspnBoxScoreTeam[];
    players?: EspnBoxScorePlayers[];
  };
}

interface EspnRoster {
  team?: {
    id: string;
    name: string;
    displayName: string;
    abbreviation: string;
    logo?: string;
  };
  athletes?: {
    id: string;
    displayName: string;
    jersey?: string;
    headshot?: { href: string };
    position?: { abbreviation: string };
  }[];
}

interface EspnOverview {
  statistics?: {
    names: string[];
    splits: { displayName: string; stats: string[] }[];
  };
}

interface EspnGameLog {
  labels?: string[];
  events?: Record<
    string,
    {
      gameDate: string;
      atVs: string;
      gameResult: string;
      score: string;
      opponent: { abbreviation: string };
    }
  >;
  seasonTypes?: {
    displayName: string;
    categories?: {
      type: string;
      events?: { eventId: string; stats: string[] }[];
    }[];
  }[];
}

/** Devuelve `null` si el recurso no existe. */
async function fetchJsonOrNull<T>(url: string): Promise<T | null> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error(`ESPN respondió con estado ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function fetchJson<T>(url: string): Promise<T> {
  const data = await fetchJsonOrNull<T>(url);
  if (data === null) throw new Error("ESPN respondió con estado 404");
  return data;
}

function toTeam(team: EspnTeam): Team {
  const logos = team.logos ?? [];
  const darkLogo = logos.find(({ rel }) => rel.includes("dark"));

  return {
    id: team.id,
    name: team.shortDisplayName,
    fullName: team.displayName,
    abbreviation: team.abbreviation,
    logoUrl: darkLogo?.href ?? logos[0]?.href ?? "",
  };
}

function toGameStatus({ name, state }: EspnEvent["status"]["type"]): GameStatus {
  if (name === "STATUS_POSTPONED") return "postponed";
  if (name === "STATUS_CANCELED") return "canceled";
  if (state === "in") return "live";
  if (state === "post") return "final";
  return "scheduled";
}

function toTopScorer({ leaders = [] }: EspnCompetitor) {
  // "points" en partidos jugados y "pointsPerGame" en los que todavía no.
  const category = leaders.find(
    ({ name }) => name === "points" || name === "pointsPerGame",
  );
  const leader = category?.leaders?.[0];
  if (!leader) return null;

  return {
    playerId: leader.athlete.id,
    name: leader.athlete.shortName,
    points: leader.displayValue,
  };
}

function toCompetitor(
  competitor: EspnCompetitor,
  status: GameStatus,
): GameCompetitor {
  const { team, score, records } = competitor;
  const hasScore = status === "live" || status === "final";

  return {
    team: {
      id: team.id,
      name: team.shortDisplayName,
      fullName: team.displayName,
      abbreviation: team.abbreviation,
      logoUrl: team.logoDark ?? team.logo ?? "",
    },
    score: hasScore && score ? Number(score) : null,
    record: records?.find((record) => record.type === "total")?.summary ?? null,
    topScorer: toTopScorer(competitor),
  };
}

function toGame(event: EspnEvent): Game | null {
  const competition = event.competitions[0];
  const home = competition?.competitors.find((c) => c.homeAway === "home");
  const away = competition?.competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const status = toGameStatus(event.status.type);
  const statusName = event.status.type.name;

  return {
    id: event.id,
    startTime: event.date,
    status,
    period: event.status.period ?? 0,
    clock: event.status.displayClock ?? null,
    isPeriodBreak:
      statusName === "STATUS_HALFTIME" || statusName === "STATUS_END_PERIOD",
    home: toCompetitor(home, status),
    away: toCompetitor(away, status),
    broadcast: competition.broadcasts?.[0]?.names?.[0] ?? null,
  };
}

function toTeamStanding({ team, stats }: EspnStandingEntry): TeamStanding {
  const getStat = (name: string) => stats.find((stat) => stat.name === name);

  return {
    team: toTeam(team),
    seed: getStat("playoffSeed")?.value ?? 0,
    wins: getStat("wins")?.value ?? 0,
    losses: getStat("losses")?.value ?? 0,
    winPercent: getStat("winPercent")?.displayValue ?? "-",
    gamesBehind: getStat("gamesBehind")?.displayValue ?? "-",
    streak: getStat("streak")?.value ?? 0,
    lastTen: getStat("Last Ten Games")?.displayValue ?? "-",
  };
}

function toConferenceStandings(
  conference: ConferenceId,
  { standings }: EspnConference,
): ConferenceStandings {
  return {
    conference,
    // ESPN no entrega los equipos ordenados por puesto.
    teams: standings.entries
      .map(toTeamStanding)
      .sort((a, b) => a.seed - b.seed),
  };
}

function toLeaderCategory(
  category: EspnLeaderCategory,
  id: StatCategoryId,
): StatLeaderCategory {
  return {
    id,
    leaders: (category.leaders ?? []).map(({ athlete, team, displayValue }) => ({
      value: displayValue,
      player: {
        id: athlete.id,
        name: athlete.displayName,
        headshotUrl: athlete.headshot?.href ?? null,
        position: athlete.position?.abbreviation ?? null,
        teamName: team?.shortDisplayName ?? null,
      },
    })),
  };
}

function toPlayerSummary(item: EspnSearchItem): PlayerSummary | null {
  const team = item.teamRelationships?.[0]?.core;
  const isNbaPlayer =
    item.isActive && NBA_TEAM_ABBREVIATIONS.has(team?.abbreviation ?? "");
  if (!isNbaPlayer) return null;

  return {
    id: item.id,
    name: item.displayName,
    headshotUrl: item.headshot?.href ?? null,
    position: item.position?.abbreviation ?? null,
    teamName: team?.shortDisplayName ?? null,
  };
}

/**
 * ESPN rechaza las búsquedas con menos de dos caracteres válidos y bloquea las
 * que incluyen símbolos como "<". Se conservan los usados en nombres reales.
 */
function sanitizeSearchQuery(query: string) {
  const cleanQuery = query.replace(/[^\p{L}\p{N}\s'.-]/gu, " ").trim();
  const validCharacters = cleanQuery.match(/[\p{L}\p{N}]/gu) ?? [];
  return validCharacters.length >= MIN_SEARCH_CHARACTERS ? cleanQuery : null;
}

function toPlayerAverages(
  statistics: EspnOverview["statistics"],
  splitName: string,
): PlayerAverages | null {
  const split = statistics?.splits.find((s) => s.displayName === splitName);
  if (!statistics || !split) return null;

  const getStat = (name: string) =>
    split.stats[statistics.names.indexOf(name)] ?? "-";

  return {
    gamesPlayed: getStat("gamesPlayed"),
    minutes: getStat("avgMinutes"),
    points: getStat("avgPoints"),
    rebounds: getStat("avgRebounds"),
    assists: getStat("avgAssists"),
    steals: getStat("avgSteals"),
    blocks: getStat("avgBlocks"),
    fieldGoalPct: getStat("fieldGoalPct"),
    threePointPct: getStat("threePointPct"),
    freeThrowPct: getStat("freeThrowPct"),
  };
}

function toRecentGames(gameLog: EspnGameLog | null): PlayerGameLogEntry[] {
  const { labels = [], events = {}, seasonTypes = [] } = gameLog ?? {};
  const getStat = (stats: string[], label: string) =>
    stats[labels.indexOf(label)] ?? "-";

  // ESPN agrupa por tipo de temporada y por mes.
  return seasonTypes
    .filter(({ displayName }) => displayName.includes("Regular Season"))
    .flatMap(({ categories = [] }) => categories)
    .filter(({ type }) => type === "event")
    .flatMap((category) => category.events ?? [])
    .flatMap(({ eventId, stats }) => {
      const event = events[eventId];
      if (!event) return [];

      return {
        id: eventId,
        startTime: event.gameDate,
        isHome: event.atVs !== "@",
        opponent: event.opponent.abbreviation,
        isWin: event.gameResult === "W",
        score: event.score,
        minutes: getStat(stats, "MIN"),
        points: getStat(stats, "PTS"),
        rebounds: getStat(stats, "REB"),
        assists: getStat(stats, "AST"),
      };
    })
    .sort((a, b) => b.startTime.localeCompare(a.startTime))
    .slice(0, RECENT_GAMES_LIMIT);
}

/** Convierte, por ejemplo, 6' 6" a 198 cm. */
function parseHeightCm(height = "") {
  const match = height.match(/(\d+)'\s*(\d+)/);
  if (!match) return null;
  return Math.round((Number(match[1]) * 12 + Number(match[2])) * 2.54);
}

/** Convierte, por ejemplo, 195 lbs a 88 kg. */
function parseWeightKg(weight = "") {
  const match = weight.match(/\d+/);
  return match ? Math.round(Number(match[0]) * 0.4536) : null;
}

/** Interpreta, por ejemplo, "2018: Rd 1, Pk 11 (CHA)". */
function parseDraft(draft = "") {
  const match = draft.match(/^(\d{4}): Rd (\d+), Pk (\d+)/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    round: Number(match[2]),
    pick: Number(match[3]),
  };
}

/** Interpreta, por ejemplo, "9th Season" o "Rookie". */
function parseSeasonNumber(experience = "") {
  if (experience === "Rookie") return 1;
  const match = experience.match(/^\d+/);
  return match ? Number(match[0]) : null;
}

function toRosterPlayer(
  athlete: NonNullable<EspnRoster["athletes"]>[number],
): RosterPlayer {
  return {
    id: athlete.id,
    name: athlete.displayName,
    headshotUrl: athlete.headshot?.href ?? null,
    position: athlete.position?.abbreviation ?? null,
    teamName: null,
    jersey: athlete.jersey ?? null,
  };
}

function toSummaryCompetitor(
  { team, score, record }: EspnSummaryCompetitor,
  status: GameStatus,
): GameCompetitor {
  const hasScore = status === "live" || status === "final";

  return {
    team: toTeam({ ...team, shortDisplayName: team.name }),
    score: hasScore && score ? Number(score) : null,
    record: record?.find(({ type }) => type === "total")?.summary ?? null,
    topScorer: null,
  };
}

function toBoxScorePlayer(
  { athlete, starter, didNotPlay, stats = [] }: EspnBoxScoreAthlete,
  keys: string[],
): BoxScorePlayer {
  const getStat = (key: string) => stats[keys.indexOf(key)] ?? "-";

  return {
    id: athlete.id,
    name: athlete.shortName ?? athlete.displayName,
    isStarter: starter ?? false,
    didNotPlay: (didNotPlay ?? false) || stats.length === 0,
    minutes: getStat("minutes"),
    points: Number(getStat("points")) || 0,
    rebounds: getStat("rebounds"),
    assists: getStat("assists"),
  };
}

/** Interpreta, por ejemplo, "42-98". */
function parseShooting(value = ""): ShootingStat {
  const [made, attempted] = value.split("-").map(Number);
  return { made: made || 0, attempted: attempted || 0 };
}

function toTeamGameStats({ statistics }: EspnBoxScoreTeam): TeamGameStats {
  const getStat = (name: string) =>
    statistics.find((stat) => stat.name === name)?.displayValue;

  return {
    fieldGoals: parseShooting(getStat("fieldGoalsMade-fieldGoalsAttempted")),
    threePointers: parseShooting(
      getStat("threePointFieldGoalsMade-threePointFieldGoalsAttempted"),
    ),
    freeThrows: parseShooting(getStat("freeThrowsMade-freeThrowsAttempted")),
    offensiveRebounds: Number(getStat("offensiveRebounds")) || 0,
    defensiveRebounds: Number(getStat("defensiveRebounds")) || 0,
    turnovers: Number(getStat("totalTurnovers")) || 0,
  };
}

function toTeamBoxScore(
  teamId: string,
  stats: EspnBoxScoreTeam,
  players: EspnBoxScorePlayers[],
): TeamBoxScore | null {
  const group = players.find(({ team }) => team.id === teamId)?.statistics[0];
  if (!group) return null;

  return {
    players: group.athletes.map((athlete) =>
      toBoxScorePlayer(athlete, group.keys),
    ),
    stats: toTeamGameStats(stats),
  };
}

function toGameDetail({ header, boxscore }: EspnSummary): GameDetail | null {
  const competition = header.competitions[0];
  const home = competition?.competitors.find((c) => c.homeAway === "home");
  const away = competition?.competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const { status: espnStatus } = competition;
  const status = toGameStatus(espnStatus.type);
  const statusName = espnStatus.type.name;

  const game: Game = {
    id: header.id,
    startTime: competition.date,
    status,
    // En partidos terminados ESPN omite el cuarto: se deduce de los parciales.
    period: espnStatus.period ?? home.linescores?.length ?? 0,
    clock: espnStatus.displayClock ?? null,
    isPeriodBreak:
      statusName === "STATUS_HALFTIME" || statusName === "STATUS_END_PERIOD",
    home: toSummaryCompetitor(home, status),
    away: toSummaryCompetitor(away, status),
    broadcast: null,
  };

  // Antes del partido, ESPN llena estos datos con promedios de la temporada.
  const hasBeenPlayed = status === "live" || status === "final";
  const { teams = [], players = [] } = boxscore ?? {};
  const homeStats = teams.find((team) => team.homeAway === "home");
  const awayStats = teams.find((team) => team.homeAway === "away");
  if (!hasBeenPlayed || !homeStats || !awayStats) {
    return { game, boxScores: null };
  }

  const homeBox = toTeamBoxScore(home.team.id, homeStats, players);
  const awayBox = toTeamBoxScore(away.team.id, awayStats, players);

  return {
    game,
    boxScores: homeBox && awayBox ? { home: homeBox, away: awayBox } : null,
  };
}

/** API pública no oficial de ESPN: no requiere clave, pero no tiene garantías. */
export const espnProvider: NbaDataProvider = {
  async getGamesByDate(date) {
    const url = `${SCOREBOARD_URL}?dates=${date.replaceAll("-", "")}`;
    const { events = [] } = await fetchJson<{ events?: EspnEvent[] }>(url);

    return events.map(toGame).filter((game) => game !== null);
  },

  async getGameDetail(id) {
    const url = `${SUMMARY_URL}?event=${encodeURIComponent(id)}`;
    const summary = await fetchJsonOrNull<EspnSummary>(url);
    return summary ? toGameDetail(summary) : null;
  },

  async getStandings() {
    const { children = [] } = await fetchJson<{ children?: EspnConference[] }>(
      STANDINGS_URL,
    );
    const east = children.find((c) => c.abbreviation === "East");
    const west = children.find((c) => c.abbreviation === "West");

    if (!east || !west) {
      throw new Error("ESPN no devolvió las dos conferencias");
    }

    return [
      toConferenceStandings("east", east),
      toConferenceStandings("west", west),
    ];
  },

  async getStatLeaders() {
    const { leaders } = await fetchJson<{
      leaders?: { categories?: EspnLeaderCategory[] };
    }>(LEADERS_URL);
    const categories = leaders?.categories ?? [];

    return LEADER_CATEGORIES.flatMap(([espnName, id]) => {
      const category = categories.find(({ name }) => name === espnName);
      return category ? toLeaderCategory(category, id) : [];
    });
  },

  async searchPlayers(query) {
    const cleanQuery = sanitizeSearchQuery(query);
    if (!cleanQuery) return [];

    const params = new URLSearchParams({
      query: cleanQuery,
      type: "player",
      sport: "basketball",
      league: "nba",
      limit: String(SEARCH_LIMIT),
    });
    const { items = [] } = await fetchJson<{ items?: EspnSearchItem[] }>(
      `${SEARCH_URL}?${params}`,
    );

    return items.map(toPlayerSummary).filter((player) => player !== null);
  },

  async getPlayerProfile(id) {
    const url = `${ATHLETES_URL}/${encodeURIComponent(id)}`;
    const [profile, overview, gameLog] = await Promise.all([
      fetchJsonOrNull<{ athlete: EspnAthlete }>(url),
      fetchJsonOrNull<EspnOverview>(`${url}/overview`),
      fetchJsonOrNull<EspnGameLog>(`${url}/gamelog`),
    ]);

    if (!profile) return null;
    const { athlete } = profile;

    return {
      id: athlete.id,
      name: athlete.displayName,
      headshotUrl: athlete.headshot?.href ?? null,
      position: athlete.position?.abbreviation ?? null,
      jersey: athlete.jersey ?? null,
      team: athlete.team ? toTeam(athlete.team) : null,
      heightCm: parseHeightCm(athlete.displayHeight),
      weightKg: parseWeightKg(athlete.displayWeight),
      age: athlete.age ?? null,
      birthPlace: athlete.displayBirthPlace ?? null,
      draft: parseDraft(athlete.displayDraft),
      seasonNumber: parseSeasonNumber(athlete.displayExperience),
      seasonAverages: toPlayerAverages(overview?.statistics, "Regular Season"),
      careerAverages: toPlayerAverages(overview?.statistics, "Career"),
      recentGames: toRecentGames(gameLog),
    };
  },

  async getTeamRoster(teamId): Promise<TeamRoster | null> {
    const url = `${TEAMS_URL}/${encodeURIComponent(teamId)}/roster`;
    const roster = await fetchJsonOrNull<EspnRoster>(url);
    const { team, athletes = [] } = roster ?? {};

    // Un equipo inexistente no da 404: responde con el plantel vacío.
    if (!team || athletes.length === 0) return null;

    return {
      team: {
        id: team.id,
        name: team.name,
        fullName: team.displayName,
        abbreviation: team.abbreviation,
        // Este endpoint solo trae el logo para fondos claros.
        logoUrl: team.logo?.replace("/500/", "/500-dark/") ?? "",
      },
      players: athletes.map(toRosterPlayer),
    };
  },
};
