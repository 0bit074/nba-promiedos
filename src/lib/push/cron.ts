// Solo lo importa el route handler de /api/push/cron (servidor).
import { addDays, formatTime, getNbaToday } from "@/lib/dates";
import { getLiveScoreKey, toLiveScoreUpdate } from "@/lib/live-score";
import { getGamesByDate, type Game } from "@/lib/nba";
import { runWithLimit, sendPush, type PushMessage, type SendResult } from "./send";
import type { PushRecord, PushStore } from "./store";

/** Desde esta hora local se manda el recordatorio de los favoritos. */
const REMINDER_HOUR = 10;
const SEND_CONCURRENCY = 20;

/** Un mensaje en vivo sin entregar en 2 minutos ya no sirve. */
const LIVE_TTL_SECONDS = 120;
const REMINDER_TTL_SECONDS = 6 * 60 * 60;

interface Delivery {
  record: PushRecord;
  message: PushMessage;
  kind: "live" | "reminder";
}

export interface CronSummary {
  liveGames: number;
  deliveries: { kind: Delivery["kind"]; title: string; to: number }[];
  sent: number;
  failed: number;
  expired: number;
  dryRun: boolean;
}

function getLocalDateAndHour(timeZone: string, now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
  };
}

/** Título que verá el usuario (igual al que arma el service worker). */
function describeLive(game: Game) {
  const { home, away } = game;
  return `${home.team.abbreviation} ${home.score ?? 0} - ${away.score ?? 0} ${away.team.abbreviation}`;
}

function buildReminder(record: PushRecord, games: Game[], date: string): PushMessage {
  const favorites = new Set(record.favoriteTeamIds);
  const lines = games.map(({ home, away, startTime }) => {
    const time = formatTime(startTime, record.timeZone);
    return `${home.team.name} vs ${away.team.name} · ${time}`;
  });
  const teams = games.flatMap(({ home, away }) =>
    [home.team, away.team].filter((team) => favorites.has(team.id)),
  );
  const title =
    teams.length === 1
      ? `Hoy juega ${teams[0].name} ⭐`
      : "Hoy juegan tus equipos ⭐";

  return {
    payload: { title, body: lines.join("\n"), url: "/", tag: `reminder-${date}` },
    ttl: REMINDER_TTL_SECONDS,
  };
}

/**
 * Lo que corre cada minuto: marcador en vivo de los partidos seguidos (solo
 * si cambió) y, una vez por día, el recordatorio de los equipos favoritos.
 */
export async function runPushCron(
  store: PushStore,
  { dryRun = false, now = new Date() } = {},
): Promise<CronSummary> {
  const today = getNbaToday();
  // Los partidos de la jornada anterior pueden seguir en juego después de medianoche.
  const [todayGames, yesterdayGames] = await Promise.all([
    getGamesByDate(today),
    getGamesByDate(addDays(today, -1)),
  ]);
  const games = [...yesterdayGames, ...todayGames];
  const records = await store.list();
  const deliveries: Delivery[] = [];
  const liveKeysToSave: [string, string][] = [];
  const remindersToSave: PushRecord[] = [];

  // 1. Marcador en vivo.
  const liveGames = games.filter((game) => game.status === "live" || game.status === "final");
  for (const game of liveGames) {
    const followers = records.filter((record) => record.followedGameIds.includes(game.id));
    if (followers.length === 0) continue;

    const update = toLiveScoreUpdate(game);
    if (!update) continue;
    const key = getLiveScoreKey(update);
    const previousKey = await store.getLiveKey(game.id);
    if (key === previousKey) continue;
    // El final solo se avisa si antes se mandó el partido en vivo.
    if (update.status === "final" && previousKey === null) continue;

    liveKeysToSave.push([game.id, key]);
    for (const record of followers) {
      deliveries.push({
        record,
        kind: "live",
        message: { payload: update, ttl: LIVE_TTL_SECONDS, topic: `live${game.id}`.slice(0, 32) },
      });
    }
  }

  // 2. Recordatorio del día de los favoritos.
  for (const record of records) {
    if (record.favoriteTeamIds.length === 0) continue;
    const { date, hour } = getLocalDateAndHour(record.timeZone, now);
    if (hour < REMINDER_HOUR || record.lastReminderDate === date) continue;

    const favorites = new Set(record.favoriteTeamIds);
    const favoriteGames = todayGames.filter(
      (game) =>
        game.status !== "final" &&
        game.status !== "canceled" &&
        game.status !== "postponed" &&
        (favorites.has(game.home.team.id) || favorites.has(game.away.team.id)),
    );
    // Se marca el día aunque no jueguen, para no revisar cada minuto.
    remindersToSave.push({ ...record, lastReminderDate: date });
    if (favoriteGames.length > 0) {
      deliveries.push({ record, kind: "reminder", message: buildReminder(record, favoriteGames, date) });
    }
  }

  const summary: CronSummary = {
    liveGames: liveGames.filter((game) => game.status === "live").length,
    deliveries: summarize(deliveries, games),
    sent: 0,
    failed: 0,
    expired: 0,
    dryRun,
  };
  if (dryRun) return summary;

  const results = await runWithLimit(deliveries, SEND_CONCURRENCY, ({ record, message }) =>
    sendPush(record, message).then((result) => ({ record, result })),
  );

  const expiredIds = new Set<string>();
  for (const { record, result } of results) {
    count(summary, result);
    if (result === "expired") expiredIds.add(record.id);
  }

  await Promise.all([
    ...liveKeysToSave.map(([gameId, key]) => store.setLiveKey(gameId, key)),
    ...remindersToSave
      .filter((record) => !expiredIds.has(record.id))
      .map((record) => store.save(record)),
    ...[...expiredIds].map((id) => store.remove(id)),
  ]);

  return summary;
}

function count(summary: CronSummary, result: SendResult) {
  if (result === "sent") summary.sent++;
  else if (result === "expired") summary.expired++;
  else summary.failed++;
}

/** Resumen legible, sin datos de las suscripciones. */
function summarize(deliveries: Delivery[], games: Game[]) {
  const byTitle = new Map<string, { kind: Delivery["kind"]; title: string; to: number }>();
  for (const { kind, message } of deliveries) {
    const payload = message.payload as { gameId?: string; title?: string };
    const game = games.find((candidate) => candidate.id === payload.gameId);
    const title = kind === "live" && game ? describeLive(game) : (payload.title ?? "");
    const entry = byTitle.get(`${kind}:${title}`) ?? { kind, title, to: 0 };
    entry.to++;
    byTitle.set(`${kind}:${title}`, entry);
  }
  return [...byTitle.values()];
}
