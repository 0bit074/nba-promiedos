/**
 * Actualizaciones de marcador en vivo para las notificaciones. El service
 * worker (`public/sw.js`) arma la notificación con el mismo formato de título:
 * si cambia uno, hay que cambiar el otro.
 */

export interface LiveScoreTeam {
  /** Abreviatura, por ejemplo "LAL". */
  abbr: string;
  score: number;
}

export interface LiveScoreUpdate {
  type: "live-score";
  gameId: string;
  away: LiveScoreTeam;
  home: LiveScoreTeam;
  period: number;
  /** Tiempo restante del período, "MM:SS". */
  clock: string;
  status: "live" | "final";
  /** Última jugada, por ejemplo "Triple de LAL". */
  lastPlay?: string;
}

const QUARTER_SECONDS = 12 * 60;
const OVERTIME_SECONDS = 5 * 60;

export function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function parseClock(clock: string) {
  const [minutes, seconds] = clock.split(":").map(Number);
  return (minutes || 0) * 60 + (seconds || 0);
}

function getPeriodName(period: number) {
  if (period <= 4) return `${period}º Q`;
  const overtime = period - 4;
  return overtime === 1 ? "OT" : `${overtime}OT`;
}

function formatGameTime({ period, clock, status }: LiveScoreUpdate) {
  if (status === "final") {
    return period > 4 ? `Final (${getPeriodName(period)})` : "Final";
  }
  if (period === 2 && parseClock(clock) === 0) return "Entretiempo";
  return `${getPeriodName(period)} ${clock}`;
}

/** Por ejemplo "LAL 108 - 104 BOS • 4º Q 02:45" (visitante primero). */
export function formatLiveScoreTitle(update: LiveScoreUpdate) {
  const { away, home } = update;
  return `${away.abbr} ${away.score} - ${home.score} ${home.abbr} • ${formatGameTime(update)}`;
}

export function createInitialUpdate(
  gameId: string,
  awayAbbr: string,
  homeAbbr: string,
): LiveScoreUpdate {
  return {
    type: "live-score",
    gameId,
    away: { abbr: awayAbbr, score: 0 },
    home: { abbr: homeAbbr, score: 0 },
    period: 1,
    clock: formatClock(QUARTER_SECONDS),
    status: "live",
    lastPlay: "Salto inicial",
  };
}

/** Termina el partido con el marcador actual. */
export function finishUpdate(update: LiveScoreUpdate): LiveScoreUpdate {
  return { ...update, clock: formatClock(0), status: "final", lastPlay: "Final del partido" };
}

/**
 * Siguiente momento de un partido simulado: corre el reloj entre 20 y 40
 * segundos y, la mayoría de las veces, alguien anota. Al llegar a 0:00 se
 * pasa al siguiente período; tras el 4º Q termina, salvo empate (alargue).
 */
export function nextSimulatedUpdate(
  previous: LiveScoreUpdate,
  random: () => number = Math.random,
): LiveScoreUpdate {
  if (previous.status === "final") return previous;

  const secondsLeft = parseClock(previous.clock);

  if (secondsLeft === 0) {
    const isTied = previous.away.score === previous.home.score;
    if (previous.period >= 4 && !isTied) return finishUpdate(previous);

    const period = previous.period + 1;
    return {
      ...previous,
      period,
      clock: formatClock(period > 4 ? OVERTIME_SECONDS : QUARTER_SECONDS),
      lastPlay: `Comienza el ${getPeriodName(period)}`,
    };
  }

  const clock = formatClock(Math.max(0, secondsLeft - 20 - Math.floor(random() * 21)));
  const next: LiveScoreUpdate = { ...previous, clock, lastPlay: undefined };

  if (random() < 0.75) {
    const side = random() < 0.5 ? "away" : "home";
    const roll = random();
    const points = roll < 0.35 ? 3 : roll < 0.9 ? 2 : 1;
    const team = previous[side];
    next[side] = { ...team, score: team.score + points };
    next.lastPlay = `${points === 3 ? "Triple" : points === 2 ? "Doble" : "Tiro libre"} de ${team.abbr}`;
  } else {
    next.lastPlay = "Posesión sin puntos";
  }

  if (formatClock(0) === clock) {
    next.lastPlay = `Fin del ${getPeriodName(previous.period)}`;
  }

  return next;
}
