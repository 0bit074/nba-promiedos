"use client";

import { useEffect, useState } from "react";
import { APP_NAME, VAPID_PUBLIC_KEY } from "@/lib/site";

type PushStatus =
  | "loading"
  | "unsupported"
  | "needs-install"
  | "blocked"
  | "inactive"
  | "active";

const SERVICE_WORKER_TIMEOUT_MS = 5_000;
const MESSAGE_DURATION_MS = 6_000;

const INSTALL_MESSAGE =
  "En iPhone, primero agrega la app a tu pantalla de inicio desde Compartir.";
const BLOCKED_MESSAGE =
  "Las notificaciones están bloqueadas: actívalas en los permisos del navegador.";

/** Partido real de ejemplo, para comprobar que el clic abre su detalle. */
const TEST_NOTIFICATION = {
  title: `${APP_NAME} - ¡Resultado Final!`,
  body: "Thunder 117 - 112 Cavaliers",
  url: "/partidos/401909907",
};

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

async function readPushStatus(): Promise<PushStatus> {
  if (!isPushSupported()) return isIos() ? "needs-install" : "unsupported";
  if (Notification.permission === "denied") return "blocked";
  if (Notification.permission !== "granted") return "inactive";

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  return subscription ? "active" : "inactive";
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

const BUTTON_CLASS =
  "h-9 shrink-0 rounded-md border border-line px-2.5 text-xs font-medium whitespace-nowrap text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50";

/** Activa las notificaciones y, una vez activas, permite probarlas. */
export function PushNotifications() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    readPushStatus().then(setStatus);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), MESSAGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [message]);

  async function activate() {
    if (status === "needs-install") return setMessage(INSTALL_MESSAGE);
    if (status === "blocked") return setMessage(BLOCKED_MESSAGE);

    setIsBusy(true);
    try {
      const permission = await Notification.requestPermission();

      if (permission === "denied") {
        setStatus("blocked");
        setMessage(BLOCKED_MESSAGE);
      } else if (permission === "granted") {
        const registration = await waitForServiceWorker();
        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidKey(VAPID_PUBLIC_KEY),
        });
        setStatus("active");
        setMessage("Notificaciones activadas. Usa Probar para ver un ejemplo.");
      }
    } catch (error) {
      console.error("No se pudieron activar las notificaciones", error);
      setMessage("No se pudieron activar las notificaciones en este navegador.");
    } finally {
      setIsBusy(false);
    }
  }

  async function sendTest() {
    const { title, body, url } = TEST_NOTIFICATION;

    setIsBusy(true);
    try {
      const registration = await waitForServiceWorker();
      await registration.showNotification(title, {
        body,
        tag: "prueba",
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-96.png",
        data: { url },
      });
    } catch (error) {
      console.error("No se pudo mostrar la notificación", error);
      setMessage("No se pudo mostrar la notificación de prueba.");
    } finally {
      setIsBusy(false);
    }
  }

  if (status === "loading" || status === "unsupported") return null;

  return (
    <>
      {status === "active" ? (
        <button
          type="button"
          disabled={isBusy}
          onClick={sendTest}
          className={BUTTON_CLASS}
        >
          Probar 🔔
        </button>
      ) : (
        <button
          type="button"
          disabled={isBusy}
          onClick={activate}
          aria-label="Activar Notificaciones"
          className={BUTTON_CLASS}
        >
          <span className="md:hidden lg:inline">Activar Notificaciones </span>🔔
        </button>
      )}
      {message && (
        <p
          role="status"
          className="absolute top-full right-4 z-50 mt-2 max-w-72 rounded-md border border-line bg-surface-raised px-3 py-2 text-xs text-foreground md:right-6"
        >
          {message}
        </p>
      )}
    </>
  );
}
