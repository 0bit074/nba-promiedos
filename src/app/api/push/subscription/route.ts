import { getPushStore, getRecordId, type PushRecord } from "@/lib/push/store";
import {
  isValidEndpoint,
  MAX_FAVORITE_TEAMS,
  MAX_FOLLOWED_GAMES,
  parseIdList,
  parseSubscription,
  parseTimeZone,
  readJsonBody,
} from "@/lib/push/validate";

function notConfigured() {
  return Response.json(
    { error: "Las notificaciones todavía no están configuradas en el servidor." },
    { status: 503 },
  );
}

/**
 * POST /api/push/subscription: guarda o actualiza un dispositivo con sus
 * partidos seguidos (🔔) y equipos favoritos (⭐).
 */
export async function POST(request: Request) {
  const store = getPushStore();
  if (!store) return notConfigured();

  const body = (await readJsonBody(request)) as Record<string, unknown> | null;
  const subscription = parseSubscription(body?.subscription);
  const followedGameIds = parseIdList(body?.followedGameIds, "game", MAX_FOLLOWED_GAMES);
  const favoriteTeamIds = parseIdList(body?.favoriteTeamIds, "team", MAX_FAVORITE_TEAMS);
  const timeZone = parseTimeZone(body?.timeZone);

  if (!subscription || !followedGameIds || !favoriteTeamIds || !timeZone) {
    return Response.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const id = getRecordId(subscription.endpoint);
  const previous = await store.get(id);
  const record: PushRecord = {
    id,
    subscription,
    followedGameIds,
    favoriteTeamIds,
    timeZone,
    lastReminderDate: previous?.lastReminderDate ?? null,
    updatedAt: new Date().toISOString(),
  };
  await store.save(record);

  return Response.json({ ok: true });
}

/** DELETE /api/push/subscription: el dispositivo desactivó las notificaciones. */
export async function DELETE(request: Request) {
  const store = getPushStore();
  if (!store) return notConfigured();

  const body = (await readJsonBody(request)) as Record<string, unknown> | null;
  if (!isValidEndpoint(body?.endpoint)) {
    return Response.json({ error: "Datos inválidos." }, { status: 400 });
  }

  await store.remove(getRecordId(body.endpoint));
  return Response.json({ ok: true });
}
