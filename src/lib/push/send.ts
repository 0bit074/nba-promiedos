// Solo lo importan los route handlers de /api/push (servidor).
import { sendNotification, setVapidDetails, WebPushError } from "web-push";
import { VAPID_PUBLIC_KEY } from "@/lib/site";
import type { PushRecord } from "./store";

/** Identifica al remitente ante los servicios push (no hace falta un email). */
const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "https://nba-promiedos-gamma.vercel.app";

let isConfigured = false;

/** `false` si falta la clave privada: no se puede enviar nada. */
export function configureWebPush() {
  if (isConfigured) return true;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!privateKey) return false;
  setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, privateKey);
  isConfigured = true;
  return true;
}

export interface PushMessage {
  /** Lo que recibe el service worker en el evento `push`. */
  payload: object;
  /** Segundos que el servicio push guarda el mensaje si el equipo está apagado. */
  ttl: number;
  /** Un mensaje nuevo con el mismo topic reemplaza al que no se entregó. */
  topic?: string;
}

export type SendResult = "sent" | "expired" | "failed";

export async function sendPush(
  record: PushRecord,
  { payload, ttl, topic }: PushMessage,
): Promise<SendResult> {
  try {
    await sendNotification(record.subscription, JSON.stringify(payload), {
      TTL: ttl,
      topic,
      urgency: "high",
      timeout: 10_000,
    });
    return "sent";
  } catch (error) {
    // 404 y 410: la suscripción ya no existe (se desinstaló o venció).
    if (
      error instanceof WebPushError &&
      (error.statusCode === 404 || error.statusCode === 410)
    ) {
      return "expired";
    }
    console.error("No se pudo enviar un push", error);
    return "failed";
  }
}

/** Ejecuta las tareas de a `limit` a la vez. */
export async function runWithLimit<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let index = 0; index < items.length; index += limit) {
    results.push(...(await Promise.all(items.slice(index, index + limit).map(task))));
  }
  return results;
}
