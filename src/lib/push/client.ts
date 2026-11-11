/**
 * Notificaciones push en el navegador: permiso, suscripción y envío al
 * servidor de lo que sigue el usuario (🔔 partidos y ⭐ favoritos).
 */
import { parseFavoriteTeams, readFavoriteTeamsRaw } from "@/lib/favorites";
import { parseFollowedGames, readFollowedGamesRaw } from "@/lib/followed-games";
import { VAPID_PUBLIC_KEY } from "@/lib/site";

export type PushStatus =
  | "unsupported"
  | "needs-install"
  | "blocked"
  | "inactive"
  | "active";

const SERVICE_WORKER_TIMEOUT_MS = 5_000;
/** Avisa a los componentes que el estado cambió (activar/desactivar). */
const STATUS_EVENT = "push-status-change";

function isIos() {
  const { userAgent, maxTouchPoints } = navigator;
  // Safari en iPad se presenta como una Mac.
  return (
    /iPhone|iPad|iPod/.test(userAgent) ||
    (userAgent.includes("Macintosh") && maxTouchPoints > 1)
  );
}

function isPushSupported() {
  return (
    "serviceWorker" in navigator &&
    "Notification" in window &&
    "PushManager" in window
  );
}

/** El service worker solo existe en producción: `ready` no resolvería en dev. */
export function waitForServiceWorker() {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Service worker no disponible")),
        SERVICE_WORKER_TIMEOUT_MS,
      );
    }),
  ]);
}

function decodeVapidKey(key: string) {
  const base64 = key.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function getSubscription() {
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
}

export async function readPushStatus(): Promise<PushStatus> {
  if (!isPushSupported()) return isIos() ? "needs-install" : "unsupported";
  if (Notification.permission === "denied") return "blocked";
  if (Notification.permission !== "granted") return "inactive";
  return (await getSubscription()) ? "active" : "inactive";
}

export function subscribeToPushStatus(onChange: () => void) {
  window.addEventListener(STATUS_EVENT, onChange);
  return () => window.removeEventListener(STATUS_EVENT, onChange);
}

function notifyStatusChange() {
  window.dispatchEvent(new Event(STATUS_EVENT));
}

/** Manda al servidor la suscripción con los partidos y favoritos actuales. */
export async function syncPushSubscription() {
  const subscription = await getSubscription();
  if (!subscription) return;

  const response = await fetch("/api/push/subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      followedGameIds: parseFollowedGames(readFollowedGamesRaw()).map(({ id }) => id),
      favoriteTeamIds: parseFavoriteTeams(readFavoriteTeamsRaw()).map(({ id }) => id),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  });
  if (!response.ok) {
    throw new Error(`El servidor respondió ${response.status}`);
  }
}

/**
 * Pide el permiso nativo, se suscribe y lo registra en el servidor.
 * Devuelve el estado final para que la interfaz lo explique.
 */
export async function enablePush(): Promise<PushStatus> {
  const status = await readPushStatus();
  if (status === "active" || status === "unsupported" || status === "needs-install") {
    return status;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    notifyStatusChange();
    return permission === "denied" ? "blocked" : "inactive";
  }

  const registration = await waitForServiceWorker();
  await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeVapidKey(VAPID_PUBLIC_KEY),
  });
  try {
    await syncPushSubscription();
  } finally {
    notifyStatusChange();
  }
  return "active";
}

/** Deja de recibir notificaciones en este dispositivo. */
export async function disablePush() {
  const subscription = await getSubscription();
  if (subscription) {
    await fetch("/api/push/subscription", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    }).catch(() => {});
    await subscription.unsubscribe();
  }
  notifyStatusChange();
}

/** Mensajes para cada estado que impide activar las notificaciones. */
export const PUSH_STATUS_MESSAGES: Partial<Record<PushStatus, string>> = {
  unsupported: "Este navegador no admite notificaciones push.",
  "needs-install":
    "En iPhone, primero agrega la app a tu pantalla de inicio desde Compartir.",
  blocked:
    "Las notificaciones están bloqueadas: actívalas en los permisos del navegador.",
};
