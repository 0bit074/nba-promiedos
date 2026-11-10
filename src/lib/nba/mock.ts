import type {
  BoxScorePlayer,
  ConferenceId,
  ConferenceStandings,
  Game,
  GameCompetitor,
  GameStatus,
  NbaDataProvider,
  PlayerAverages,
  PlayerProfile,
  PlayerSummary,
  StatCategoryId,
  Team,
  TeamBoxScore,
} from "./types";

function team(abbreviation: string, name: string, fullName: string): Team {
  return {
    id: abbreviation,
    name,
    fullName,
    abbreviation: abbreviation.toUpperCase(),
    logoUrl: `https://a.espncdn.com/i/teamlogos/nba/500-dark/scoreboard/${abbreviation}.png`,
  };
}

const TEAMS = {
  atl: team("atl", "Hawks", "Atlanta Hawks"),
  bkn: team("bkn", "Nets", "Brooklyn Nets"),
  bos: team("bos", "Celtics", "Boston Celtics"),
  cha: team("cha", "Hornets", "Charlotte Hornets"),
  chi: team("chi", "Bulls", "Chicago Bulls"),
  cle: team("cle", "Cavaliers", "Cleveland Cavaliers"),
  dal: team("dal", "Mavericks", "Dallas Mavericks"),
  den: team("den", "Nuggets", "Denver Nuggets"),
  det: team("det", "Pistons", "Detroit Pistons"),
  gs: team("gs", "Warriors", "Golden State Warriors"),
  hou: team("hou", "Rockets", "Houston Rockets"),
  ind: team("ind", "Pacers", "Indiana Pacers"),
  lac: team("lac", "Clippers", "LA Clippers"),
  lal: team("lal", "Lakers", "Los Angeles Lakers"),
  mem: team("mem", "Grizzlies", "Memphis Grizzlies"),
  mia: team("mia", "Heat", "Miami Heat"),
  mil: team("mil", "Bucks", "Milwaukee Bucks"),
  min: team("min", "Timberwolves", "Minnesota Timberwolves"),
  no: team("no", "Pelicans", "New Orleans Pelicans"),
  ny: team("ny", "Knicks", "New York Knicks"),
  okc: team("okc", "Thunder", "Oklahoma City Thunder"),
  orl: team("orl", "Magic", "Orlando Magic"),
  phi: team("phi", "76ers", "Philadelphia 76ers"),
  phx: team("phx", "Suns", "Phoenix Suns"),
  por: team("por", "Trail Blazers", "Portland Trail Blazers"),
  sa: team("sa", "Spurs", "San Antonio Spurs"),
  sac: team("sac", "Kings", "Sacramento Kings"),
  tor: team("tor", "Raptors", "Toronto Raptors"),
  utah: team("utah", "Jazz", "Utah Jazz"),
  wsh: team("wsh", "Wizards", "Washington Wizards"),
};

function side(
  teamData: Team,
  record: string,
  score: number | null = null,
): GameCompetitor {
  return {
    team: teamData,
    score,
    record,
    topScorer: { playerId: "1", name: "M. Prueba", points: "24" },
  };
}

interface MockGame {
  status: GameStatus;
  /** Hora UTC de inicio, como desplazamiento en horas desde la jornada. */
  startHour: number;
  period?: number;
  clock?: string;
  isPeriodBreak?: boolean;
  away: GameCompetitor;
  home: GameCompetitor;
  broadcast?: string;
}

/** Cubre todos los estados posibles para poder probar la UI sin partidos reales. */
const MOCK_GAMES: MockGame[] = [
  {
    status: "live",
    startHour: 23,
    period: 3,
    clock: "5:32",
    away: side(TEAMS.lal, "5-2", 78),
    home: side(TEAMS.bos, "6-1", 81),
    broadcast: "ESPN",
  },
  {
    status: "live",
    startHour: 23.5,
    period: 2,
    clock: "0.0",
    isPeriodBreak: true,
    away: side(TEAMS.mia, "3-4", 54),
    home: side(TEAMS.ny, "4-3", 49),
  },
  {
    status: "live",
    startHour: 23.5,
    period: 5,
    clock: "1:08",
    away: side(TEAMS.dal, "4-3", 112),
    home: side(TEAMS.sa, "5-2", 112),
    broadcast: "NBA TV",
  },
  {
    status: "scheduled",
    startHour: 26,
    away: side(TEAMS.gs, "4-2"),
    home: side(TEAMS.den, "5-1"),
    broadcast: "TNT",
  },
  {
    status: "scheduled",
    startHour: 27,
    away: side(TEAMS.por, "2-5"),
    home: side(TEAMS.okc, "6-0"),
  },
  {
    status: "final",
    startHour: 21,
    period: 4,
    away: side(TEAMS.chi, "3-3", 101),
    home: side(TEAMS.tor, "2-4", 96),
  },
  {
    status: "final",
    startHour: 21,
    period: 6,
    away: side(TEAMS.okc, "6-0", 131),
    home: side(TEAMS.den, "5-1", 134),
  },
  {
    status: "postponed",
    startHour: 22,
    away: side(TEAMS.tor, "2-4"),
    home: side(TEAMS.bos, "6-1"),
  },
];

const MOCK_GAMES_PLAYED = 40;

function createConference(
  conference: ConferenceId,
  teams: Team[],
): ConferenceStandings {
  const leaderWins = MOCK_GAMES_PLAYED - 8;

  return {
    conference,
    teams: teams.map((teamData, index) => {
      const wins = leaderWins - index * 2;
      const behind = leaderWins - wins;

      return {
        team: teamData,
        seed: index + 1,
        wins,
        losses: MOCK_GAMES_PLAYED - wins,
        winPercent: (wins / MOCK_GAMES_PLAYED).toFixed(3).replace(/^0/, ""),
        gamesBehind: behind === 0 ? "-" : String(behind),
        streak: index % 3 === 0 ? -(index % 4) - 1 : (index % 5) + 1,
        lastTen: `${8 - (index % 7)}-${2 + (index % 7)}`,
      };
    }),
  };
}

const MOCK_STANDINGS = [
  createConference("east", [
    TEAMS.bos,
    TEAMS.cle,
    TEAMS.ny,
    TEAMS.det,
    TEAMS.mil,
    TEAMS.orl,
    TEAMS.ind,
    TEAMS.phi,
    TEAMS.atl,
    TEAMS.mia,
    TEAMS.chi,
    TEAMS.tor,
    TEAMS.cha,
    TEAMS.bkn,
    TEAMS.wsh,
  ]),
  createConference("west", [
    TEAMS.okc,
    TEAMS.den,
    TEAMS.hou,
    TEAMS.lal,
    TEAMS.min,
    TEAMS.gs,
    TEAMS.sa,
    TEAMS.mem,
    TEAMS.dal,
    TEAMS.por,
    TEAMS.phx,
    TEAMS.lac,
    TEAMS.sac,
    TEAMS.no,
    TEAMS.utah,
  ]),
];

const MOCK_AVERAGES: PlayerAverages = {
  gamesPlayed: "40",
  minutes: "34.2",
  points: "24.8",
  rebounds: "6.1",
  assists: "5.4",
  steals: "1.2",
  blocks: "0.7",
  fieldGoalPct: "48.3",
  threePointPct: "37.9",
  freeThrowPct: "85.1",
};

function createPlayer(
  id: string,
  name: string,
  teamData: Team,
  position: string,
  gamesPlayed: number,
): PlayerProfile {
  const hasGames = gamesPlayed > 0;

  return {
    id,
    name,
    // Nombres ficticios: se prueba el respaldo con iniciales de PlayerAvatar.
    headshotUrl: null,
    position,
    jersey: id,
    team: teamData,
    heightCm: 198,
    weightKg: 95,
    age: 26,
    birthPlace: "Buenos Aires, Argentina",
    draft: hasGames ? { year: 2019, round: 1, pick: 12 } : null,
    seasonNumber: hasGames ? 7 : 1,
    seasonAverages: hasGames ? MOCK_AVERAGES : null,
    careerAverages: hasGames ? MOCK_AVERAGES : null,
    recentGames: Array.from({ length: gamesPlayed }, (_, index) => ({
      id: `mock-log-${id}-${index}`,
      startTime: new Date(Date.UTC(2026, 10, 3 - index * 2)).toISOString(),
      isHome: index % 2 === 0,
      opponent: index % 2 === 0 ? "LAL" : "BOS",
      isWin: index % 3 !== 0,
      score: "112-104",
      minutes: String(30 + index),
      points: String(18 + index * 2),
      rebounds: String(4 + index),
      assists: String(3 + index),
    })),
  };
}

const MOCK_PLAYERS = [
  createPlayer("1", "Mateo Prueba", TEAMS.bos, "PG", 10),
  createPlayer("2", "Lucas Ejemplo", TEAMS.lal, "SF", 10),
  createPlayer("3", "Tomás De Muestra", TEAMS.den, "C", 10),
  createPlayer("4", "Bruno Ficticio", TEAMS.okc, "SG", 10),
  createPlayer("5", "Nicolás Novato", TEAMS.por, "PF", 0),
];

function toMockSummary({
  id,
  name,
  headshotUrl,
  position,
  team,
}: PlayerProfile): PlayerSummary {
  return { id, name, headshotUrl, position, teamName: team?.name ?? null };
}

const MOCK_STAT_CATEGORIES: StatCategoryId[] = [
  "points",
  "rebounds",
  "assists",
  "steals",
  "blocks",
];

function getMockGames(date: string) {
  const dayStart = Date.parse(`${date}T00:00:00Z`);

  return MOCK_GAMES.map(
    ({ startHour, period, clock, isPeriodBreak, broadcast, ...game }, index): Game => ({
      ...game,
      id: `mock-${date}-${index}`,
      startTime: new Date(dayStart + startHour * 3_600_000).toISOString(),
      period: period ?? 0,
      clock: clock ?? null,
      isPeriodBreak: isPeriodBreak ?? false,
      broadcast: broadcast ?? null,
    }),
  );
}

function createBoxScore(prefix: string, topPoints: number): TeamBoxScore {
  const players = Array.from({ length: 9 }, (_, index): BoxScorePlayer => {
    const didNotPlay = index === 8;
    const points = didNotPlay ? 0 : Math.max(topPoints - index * 4, 0);
    const threesMade = didNotPlay ? 0 : (index * 2) % 4;
    const plusMinus = 8 - index * 3;

    return {
      id: String((index % 5) + 1),
      name: `${prefix} Jugador ${index + 1}`,
      isStarter: index < 5,
      didNotPlay,
      minutes: didNotPlay ? "-" : String(36 - index * 3),
      points,
      rebounds: didNotPlay ? "-" : String(9 - index),
      assists: didNotPlay ? "-" : String((index * 3) % 7),
      fieldGoals: didNotPlay
        ? { made: 0, attempted: 0 }
        : { made: Math.round(points / 2.4), attempted: Math.round(points / 2.4) * 2 + 1 },
      threePointers: { made: threesMade, attempted: didNotPlay ? 0 : threesMade + 3 },
      turnovers: didNotPlay ? "-" : String(index % 4),
      plusMinus: didNotPlay ? "-" : plusMinus > 0 ? `+${plusMinus}` : String(plusMinus),
    };
  });

  return {
    players,
    stats: {
      fieldGoals: { made: 38 + topPoints % 7, attempted: 86 },
      threePointers: { made: 11 + topPoints % 5, attempted: 33 },
      freeThrows: { made: 14 + topPoints % 4, attempted: 19 },
      offensiveRebounds: 8 + topPoints % 6,
      defensiveRebounds: 30 + topPoints % 8,
      turnovers: 9 + topPoints % 5,
    },
  };
}

export const mockProvider: NbaDataProvider = {
  async getGamesByDate(date) {
    return getMockGames(date);
  },

  async getGameDetail(id) {
    const match = id.match(/^mock-(\d{4}-\d{2}-\d{2})-\d+$/);
    const game = match && getMockGames(match[1]).find((g) => g.id === id);
    if (!game) return null;

    const hasBeenPlayed = game.status === "live" || game.status === "final";

    return {
      game,
      boxScores: hasBeenPlayed
        ? { home: createBoxScore("L.", 31), away: createBoxScore("V.", 27) }
        : null,
    };
  },

  async getStandings() {
    return MOCK_STANDINGS;
  },

  async getStatLeaders() {
    return MOCK_STAT_CATEGORIES.map((id) => ({
      id,
      leaders: MOCK_PLAYERS.map((player, index) => ({
        player: toMockSummary(player),
        value: (20 - index * 2.5).toFixed(1),
      })),
    }));
  },

  async searchPlayers(query) {
    const normalizedQuery = query.toLowerCase();
    return MOCK_PLAYERS.filter(({ name }) =>
      name.toLowerCase().includes(normalizedQuery),
    ).map(toMockSummary);
  },

  async getPlayerProfile(id) {
    return MOCK_PLAYERS.find((player) => player.id === id) ?? null;
  },

  async getTeamRoster(teamId) {
    const teamData = Object.values(TEAMS).find(({ id }) => id === teamId);
    if (!teamData) return null;

    return {
      team: teamData,
      players: MOCK_PLAYERS.map((player) => ({
        ...toMockSummary(player),
        teamName: null,
        jersey: player.jersey,
      })),
    };
  },
};
