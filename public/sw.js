// Cambiar la versión al modificar los archivos de PRECACHE_URLS.
const CACHE_NAME = "offline-v3";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/icons/icon-192.png"];
const APP_NAME = "The Rookie App";

const ICON_URL = "/icons/icon-192.png";
const BADGE_URL = "/icons/badge-96.png";

// Preferencias del service worker (no tiene localStorage). No se borra al
// actualizar la versión de la caché offline.
const PREFS_CACHE = "prefs-v1";
const MUTED_GAMES_KEY = "/__muted-games";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME && name !== PREFS_CACHE)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Los marcadores nunca salen de la caché: las páginas siempre van a la red y,
// si no hay conexión, se muestra la pantalla offline.
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  const { origin, pathname } = new URL(request.url);
  if (origin === self.location.origin && PRECACHE_URLS.includes(pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request)),
    );
  }
});

/* ------------------------------------------------------------------ */
/* Partidos silenciados                                                */
/* ------------------------------------------------------------------ */

async function readMutedGames() {
  try {
    const cache = await caches.open(PREFS_CACHE);
    const response = await cache.match(MUTED_GAMES_KEY);
    const ids = response ? await response.json() : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

async function writeMutedGames(ids) {
  const cache = await caches.open(PREFS_CACHE);
  await cache.put(
    MUTED_GAMES_KEY,
    new Response(JSON.stringify(ids), {
      headers: { "Content-Type": "application/json" },
    }),
  );
}

async function setGameMuted(gameId, isMuted) {
  const ids = (await readMutedGames()).filter((id) => id !== gameId);
  await writeMutedGames(isMuted ? [...ids, gameId] : ids);
}

/** Avisa a las pestañas abiertas (por ejemplo, al simulador). */
async function notifyClients(message) {
  const windows = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of windows) client.postMessage(message);
}

/* ------------------------------------------------------------------ */
/* Marcador en vivo                                                    */
/* ------------------------------------------------------------------ */

// Formato de una actualización (push real o simulador):
// { type: "live-score", gameId, away: { abbr, score }, home: { abbr, score },
//   period, clock: "MM:SS", status: "live" | "final", lastPlay? }
// Mantener el formato del título sincronizado con src/lib/live-score.ts.

function isValidLiveScore(data) {
  const isTeam = (team) =>
    team &&
    typeof team.abbr === "string" &&
    team.abbr.length <= 5 &&
    Number.isFinite(team.score);
  return (
    data &&
    typeof data.gameId === "string" &&
    /^[\w-]{1,20}$/.test(data.gameId) &&
    isTeam(data.away) &&
    isTeam(data.home) &&
    Number.isInteger(data.period) &&
    data.period >= 1 &&
    typeof data.clock === "string"
  );
}

function getPeriodName(period) {
  if (period <= 4) return `${period}º Q`;
  const overtime = period - 4;
  return overtime === 1 ? "OT" : `${overtime}OT`;
}

function formatGameTime({ period, clock, status }) {
  if (status === "final") {
    return period > 4 ? `Final (${getPeriodName(period)})` : "Final";
  }
  if (period === 2 && /^0?0:00$/.test(clock)) return "Entretiempo";
  return `${getPeriodName(period)} ${clock}`;
}

/** Por ejemplo "LAL 108 - 104 BOS • 4º Q 02:45" (visitante primero). */
function formatLiveScoreTitle(data) {
  const { away, home } = data;
  return `${away.abbr} ${away.score} - ${home.score} ${home.abbr} • ${formatGameTime(data)}`;
}

function getLiveScoreTag(gameId) {
  return `live-match-${gameId}`;
}

async function showLiveScore(data) {
  if (!isValidLiveScore(data)) return;
  if ((await readMutedGames()).includes(data.gameId)) return;

  const tag = getLiveScoreTag(data.gameId);
  const isLive = data.status !== "final";
  // Solo suena la primera: las demás reemplazan a la anterior en silencio.
  const existing = await self.registration.getNotifications({ tag });

  await self.registration.showNotification(formatLiveScoreTitle(data), {
    tag,
    body:
      typeof data.lastPlay === "string" && data.lastPlay
        ? data.lastPlay
        : "Toca para ver el partido",
    icon: ICON_URL,
    badge: BADGE_URL,
    actions: [
      { action: "open", title: "Ver Partido" },
      { action: "mute", title: "Silenciar" },
    ],
    // Fija mientras se juega; al terminar puede descartarse sola.
    requireInteraction: isLive,
    silent: existing.length > 0,
    timestamp: Date.now(),
    data: { url: `/partidos/${data.gameId}`, gameId: data.gameId },
  });
}

async function clearLiveScore(gameId) {
  const notifications = await self.registration.getNotifications({
    tag: getLiveScoreTag(gameId),
  });
  for (const notification of notifications) notification.close();
}

/* ------------------------------------------------------------------ */
/* Push y mensajes de la página                                        */
/* ------------------------------------------------------------------ */

function readPushData(event) {
  if (!event.data) return {};

  try {
    return event.data.json();
  } catch {
    return { body: event.data.text() };
  }
}

// Formatos: una actualización "live-score" o { title, body, url, tag }.
self.addEventListener("push", (event) => {
  const data = readPushData(event);

  if (data.type === "live-score") {
    event.waitUntil(showLiveScore(data));
    return;
  }

  const { title, body, url, tag } = data;
  event.waitUntil(
    self.registration.showNotification(title ?? APP_NAME, {
      body,
      tag,
      icon: ICON_URL,
      badge: BADGE_URL,
      data: { url },
    }),
  );
});

// El simulador de la app usa el mismo camino que un push real.
self.addEventListener("message", (event) => {
  if (event.origin && event.origin !== self.location.origin) return;
  const data = event.data ?? {};

  switch (data.type) {
    case "live-score":
      event.waitUntil(showLiveScore(data));
      break;
    case "live-score-clear":
      if (typeof data.gameId === "string") {
        event.waitUntil(clearLiveScore(data.gameId));
      }
      break;
    case "live-score-unmute":
      if (typeof data.gameId === "string") {
        event.waitUntil(setGameMuted(data.gameId, false));
      }
      break;
  }
});

/* ------------------------------------------------------------------ */
/* Clic en la notificación                                             */
/* ------------------------------------------------------------------ */

/** Solo abre rutas de la app, aunque el mensaje traiga otra dirección. */
function getNotificationUrl(notification) {
  const url = new URL(notification.data?.url ?? "/", self.location.origin);
  return url.origin === self.location.origin ? url.href : self.location.origin;
}

async function openNotificationUrl(url) {
  const windows = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  for (const client of windows) {
    try {
      const navigated = await client.navigate(url);
      return (navigated ?? client).focus();
    } catch {
      // Una ventana que este service worker no controla no se puede redirigir.
    }
  }

  return self.clients.openWindow(url);
}

async function muteGame(gameId) {
  await setGameMuted(gameId, true);
  await notifyClients({ type: "live-score-muted", gameId });
}

self.addEventListener("notificationclick", (event) => {
  const { notification, action } = event;
  notification.close();

  const gameId = notification.data?.gameId;
  if (action === "mute" && typeof gameId === "string") {
    event.waitUntil(muteGame(gameId));
    return;
  }

  event.waitUntil(openNotificationUrl(getNotificationUrl(notification)));
});
