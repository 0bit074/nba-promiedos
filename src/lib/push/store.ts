// Solo lo importan los route handlers de /api/push (servidor).
import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";

/** Suscripción Web Push tal como la entrega el navegador. */
export interface StoredPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Un dispositivo con notificaciones activas y lo que sigue. */
export interface PushRecord {
  id: string;
  subscription: StoredPushSubscription;
  /** Equipos favoritos (⭐): reciben el recordatorio del día. */
  favoriteTeamIds: string[];
  /** Partidos con la campanita activada: reciben el marcador en vivo. */
  followedGameIds: string[];
  /** Zona horaria del dispositivo, para el recordatorio y sus horarios. */
  timeZone: string;
  /** Fecha local (YYYY-MM-DD) del último recordatorio enviado. */
  lastReminderDate: string | null;
  updatedAt: string;
}

export interface PushStore {
  list(): Promise<PushRecord[]>;
  get(id: string): Promise<PushRecord | null>;
  save(record: PushRecord): Promise<void>;
  remove(id: string): Promise<void>;
  /** Última versión del marcador enviada de un partido. */
  getLiveKey(gameId: string): Promise<string | null>;
  setLiveKey(gameId: string, key: string): Promise<void>;
}

/** Un dispositivo inactivo por dos meses se olvida solo. */
const RECORD_TTL_SECONDS = 60 * 24 * 60 * 60;
const LIVE_KEY_TTL_SECONDS = 24 * 60 * 60;

/** El id es un hash del endpoint: no se guarda el endpoint como clave. */
export function getRecordId(endpoint: string) {
  return createHash("sha256").update(endpoint).digest("hex").slice(0, 32);
}

function createRedisStore(redis: Redis): PushStore {
  return {
    async list() {
      const ids = await redis.smembers("push:subs");
      if (ids.length === 0) return [];
      const records = await redis.mget<(PushRecord | null)[]>(
        ...ids.map((id) => `push:sub:${id}`),
      );
      // Las que vencieron por TTL se quitan del índice.
      const expired = ids.filter((_, index) => !records[index]);
      if (expired.length > 0) await redis.srem("push:subs", ...expired);
      return records.filter((record): record is PushRecord => record !== null);
    },
    get(id) {
      return redis.get<PushRecord>(`push:sub:${id}`);
    },
    async save(record) {
      await redis.set(`push:sub:${record.id}`, record, { ex: RECORD_TTL_SECONDS });
      await redis.sadd("push:subs", record.id);
    },
    async remove(id) {
      await redis.del(`push:sub:${id}`);
      await redis.srem("push:subs", id);
    },
    getLiveKey(gameId) {
      return redis.get<string>(`push:live:${gameId}`);
    },
    async setLiveKey(gameId, key) {
      await redis.set(`push:live:${gameId}`, key, { ex: LIVE_KEY_TTL_SECONDS });
    },
  };
}

/** Solo para desarrollo: se pierde al reiniciar el servidor. */
function createMemoryStore(): PushStore {
  const records = new Map<string, PushRecord>();
  const liveKeys = new Map<string, string>();
  return {
    async list() {
      return [...records.values()];
    },
    async get(id) {
      return records.get(id) ?? null;
    },
    async save(record) {
      records.set(record.id, record);
    },
    async remove(id) {
      records.delete(id);
    },
    async getLiveKey(gameId) {
      return liveKeys.get(gameId) ?? null;
    },
    async setLiveKey(gameId, key) {
      liveKeys.set(gameId, key);
    },
  };
}

const globalStore = globalThis as { __pushMemoryStore?: PushStore };

/**
 * Redis (Upstash, conectado desde Vercel) si hay credenciales. En desarrollo,
 * sin credenciales, usa memoria; en producción devuelve `null`.
 */
export function getPushStore(): PushStore | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) return createRedisStore(new Redis({ url, token }));

  if (process.env.NODE_ENV === "production") return null;
  globalStore.__pushMemoryStore ??= createMemoryStore();
  return globalStore.__pushMemoryStore;
}
