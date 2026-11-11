import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { runPushCron } from "@/lib/push/cron";
import { configureWebPush } from "@/lib/push/send";
import { getPushStore } from "@/lib/push/store";

/** Se llama cada minuto: tiene que terminar mucho antes del siguiente. */
export const maxDuration = 30;

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

  try {
    return Response.json(await runPushCron(store, { dryRun }));
  } catch (error) {
    console.error("Falló el envío de notificaciones", error);
    return Response.json({ error: "Falló el envío." }, { status: 500 });
  }
}
