import { getPushStore, getRecordId } from "@/lib/push/store";
import { isValidEndpoint, isValidGameId, readJsonBody } from "@/lib/push/validate";

/**
 * POST /api/push/unfollow: lo llama el service worker al tocar "Silenciar"
 * en una notificación, para que el servidor deje de enviar ese partido.
 */
export async function POST(request: Request) {
  const store = getPushStore();
  if (!store) return Response.json({ ok: false }, { status: 503 });

  const body = (await readJsonBody(request)) as Record<string, unknown> | null;
  if (!isValidEndpoint(body?.endpoint) || !isValidGameId(body?.gameId)) {
    return Response.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const record = await store.get(getRecordId(body.endpoint));
  if (record) {
    await store.save({
      ...record,
      followedGameIds: record.followedGameIds.filter((id) => id !== body.gameId),
      updatedAt: new Date().toISOString(),
    });
  }

  return Response.json({ ok: true });
}
