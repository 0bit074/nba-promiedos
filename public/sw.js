// Cambiar la versión al modificar los archivos de PRECACHE_URLS.
const CACHE_NAME = "offline-v2";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/icons/icon-192.png"];
const APP_NAME = "NBA Rookie";

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
            .filter((name) => name !== CACHE_NAME)
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

function readPushData(event) {
  if (!event.data) return {};

  try {
    return event.data.json();
  } catch {
    return { body: event.data.text() };
  }
}

// Formato esperado: { title, body, url, tag }.
self.addEventListener("push", (event) => {
  const { title, body, url, tag } = readPushData(event);

  event.waitUntil(
    self.registration.showNotification(title ?? APP_NAME, {
      body,
      tag,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      data: { url },
    }),
  );
});

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

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(openNotificationUrl(getNotificationUrl(event.notification)));
});
