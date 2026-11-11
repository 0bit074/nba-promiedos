// Solo lo importan los route handlers de /api/push (servidor).
import { sendNotification, setVapidDetails, WebPushError } from "web-push";
import { VAPID_PUBLIC_KEY } from "@/lib/site";
import type { PushRecord } from "./store";

/** Quita espacios y comillas que suelen colarse al pegar en Vercel. */
function readEnv(name: string) {
  return process.env[name]?.trim().replace(/^["']|["']$/g, "") || undefined;
}

/** Identifica al remitente ante los servicios push (no hace falta un email). */
function getVapidSubject() {
  const subject = readEnv("VAPID_SUBJECT");
  if (!subject) return "https://nba-promiedos-gamma.vercel.app";
  // Un email suelto no es válido para web-push: necesita "mailto:".
  return subject.includes("@") && !subject.includes(":") ? `mailto:${subject}` : subject;
}

let isConfigured = false;

/** `null` si quedó configurado; si no, el motivo para mostrarlo en la respuesta. */
export function configureWebPush(): string | null {
  if (isConfigured) return null;
  const privateKey = readEnv("VAPID_PRIVATE_KEY");
  if (!privateKey) return "Falta VAPID_PRIVATE_KEY.";
  try {
    setVapidDetails(getVapidSubject(), VAPID_PUBLIC_KEY, privateKey);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return `VAPID inválido (revisa VAPID_PRIVATE_KEY y VAPID_SUBJECT): ${reason}`;
  }
  isConfigured = true;
  return null;
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
