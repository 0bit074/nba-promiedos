import { timingSafeEqual } from "node:crypto";
import { after, type NextRequest } from "next/server";
import { runPushCron } from "@/lib/push/cron";
import { configureWebPush } from "@/lib/push/send";
import { getPushStore, type PushStore } from "@/lib/push/store";

/**
 * Se llama cada minuto. Responde enseguida (cron-job.org corta a los 30 s) y,
 * si alguien sigue un partido en juego, sigue revisando a los 15, 30 y 45 s:
 * así el reloj de la notificación no queda quieto un minuto entero.
 */
export const maxDuration = 60;

const EXTRA_ROUNDS_SECONDS = [15, 30, 45];

function waitUntil(startedAt: number, seconds: number) {
  const delay = startedAt + seconds * 1000 - Date.now();
  return new Promise((resolve) => setTimeout(resolve, Math.max(delay, 0)));
}

async function runExtraRounds(store: PushStore, startedAt: number) {
  for (const seconds of EXTRA_ROUNDS_SECONDS) {
    await waitUntil(startedAt, seconds);
    try {
      const summary = await runPushCron(store, { liveOnly: true });
      console.info(`Ronda en vivo +${seconds}s: ${summary.deliveries.length} envíos`);
      // Sin partidos seguidos en juego no hace falta seguir esperando.
      if (summary.followedLiveGames === 0) return;
    } catch (error) {
      console.error("Falló una ronda de notificaciones en vivo", error);
    }
  }
}

function isAuthorized(request: NextRequest, secret: string) {
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/**
 * GET /api/push/cron: envía los marcadores en vivo y los recordatorios.
 * Lo llama un programador externo con `Authorization: Bearer <CRON_SECRET>`.
 * Con `?dryRun=1` arma los envíos sin mandarlos.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "Falta CRON_SECRET." }, { status: 503 });
  }
  if (!isAuthorized(request, secret)) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  const store = getPushStore();
  if (!store) {
    return Response.json({ error: "Falta la base de datos (Redis)." }, { status: 503 });
  }
  const vapidError = dryRun ? null : configureWebPush();
  if (vapidError) {
    return Response.json({ error: vapidError }, { status: 503 });
  }

  const startedAt = Date.now();
  try {
    const summary = await runPushCron(store, { dryRun });
    if (!dryRun && summary.followedLiveGames > 0) {
      after(() => runExtraRounds(store, startedAt));
    }
    return Response.json(summary);
  } catch (error) {
    console.error("Falló el envío de notificaciones", error);
    return Response.json({ error: "Falló el envío." }, { status: 500 });
  }
}
