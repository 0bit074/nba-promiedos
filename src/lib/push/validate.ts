import type { StoredPushSubscription } from "./store";

export const MAX_FOLLOWED_GAMES = 50;
export const MAX_FAVORITE_TEAMS = 6;
/** Los cuerpos JSON de /api/push son chicos: se rechaza lo que exceda. */
export const MAX_BODY_BYTES = 4_000;

const GAME_ID = /^[\w-]{1,30}$/;
const TEAM_ID = /^[\w-]{1,10}$/;

function isString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

export function isValidGameId(value: unknown): value is string {
  return typeof value === "string" && GAME_ID.test(value);
}

/** Solo URLs https: así no se puede usar el servidor para pedir otras cosas. */
export function isValidEndpoint(value: unknown): value is string {
  if (!isString(value, 1_000)) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function parseSubscription(value: unknown): StoredPushSubscription | null {
  if (typeof value !== "object" || value === null) return null;
  const { endpoint, keys } = value as Record<string, unknown>;
  if (!isValidEndpoint(endpoint)) return null;
  if (typeof keys !== "object" || keys === null) return null;
  const { p256dh, auth } = keys as Record<string, unknown>;
  if (!isString(p256dh, 200) || !isString(auth, 100)) return null;
  return { endpoint, keys: { p256dh, auth } };
}

/** Lista de ids válidos, sin repetidos y con un máximo. */
export function parseIdList(
  value: unknown,
  pattern: "game" | "team",
  max: number,
): string[] | null {
  if (!Array.isArray(value) || value.length > max) return null;
  const regex = pattern === "game" ? GAME_ID : TEAM_ID;
  if (!value.every((id) => typeof id === "string" && regex.test(id))) return null;
  return [...new Set(value as string[])];
}

export function parseTimeZone(value: unknown): string | null {
  if (!isString(value, 64)) return null;
  try {
    new Intl.DateTimeFormat("es", { timeZone: value });
    return value;
  } catch {
    return null;
  }
}

/** Lee un cuerpo JSON chico; `null` si es demasiado grande o inválido. */
export async function readJsonBody(request: Request): Promise<unknown> {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
