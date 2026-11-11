"use client";

import { BellOff, BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import {
  disablePush,
  enablePush,
  PUSH_STATUS_MESSAGES,
  readPushStatus,
  subscribeToPushStatus,
  type PushStatus,
} from "@/lib/push/client";

const MESSAGE_DURATION_MS = 7_000;

const ACTIVE_MESSAGE =
  "Notificaciones activas. Toca la 🔔 de un partido para seguir su marcador en vivo; tus ⭐ te avisan el día que juegan.";

const BUTTON_CLASS =
  "flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs font-medium whitespace-nowrap text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50";

/** Activa (o desactiva) las notificaciones push de este dispositivo. */
export function PushNotifications() {
  const [status, setStatus] = useState<PushStatus | "loading">("loading");
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Se vuelve a leer si otro componente (la 🔔 de un partido) las activa.
  useEffect(() => {
    const refresh = () => {
      readPushStatus().then(setStatus);
    };
    refresh();
    return subscribeToPushStatus(refresh);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), MESSAGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [message]);

  async function activate() {
    setIsBusy(true);
    try {
      const result = await enablePush();
      setStatus(result);
      setMessage(
        result === "active"
          ? ACTIVE_MESSAGE
          : (PUSH_STATUS_MESSAGES[result] ?? "No se activaron las notificaciones."),
      );
    } catch (error) {
      console.error("No se pudieron activar las notificaciones", error);
      setMessage("No se pudieron activar las notificaciones en este navegador.");
    } finally {
      setIsBusy(false);
    }
  }

  async function deactivate() {
    setIsBusy(true);
    setIsPanelOpen(false);
    try {
      await disablePush();
      setStatus("inactive");
      setMessage("Notificaciones desactivadas en este dispositivo.");
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
          onClick={() => setIsPanelOpen((open) => !open)}
          aria-expanded={isPanelOpen}
          aria-label="Notificaciones activas"
          className={`${BUTTON_CLASS} text-accent`}
        >
          <BellRing aria-hidden className="size-4" />
          <span className="hidden lg:inline">Activas</span>
        </button>
      ) : (
        <button
          type="button"
          disabled={isBusy}
          onClick={activate}
          aria-label="Activar Notificaciones"
          className={BUTTON_CLASS}
        >
          <span className="md:hidden lg:inline">Activar Notificaciones</span>
          <BellRing aria-hidden className="size-4" />
        </button>
      )}

      {isPanelOpen && status === "active" && (
        <div className="absolute top-full right-4 z-50 mt-2 w-72 rounded-md border border-line bg-surface-raised p-3 text-xs text-foreground shadow-lg shadow-black/25 md:right-6">
          <p>{ACTIVE_MESSAGE}</p>
          <button
            type="button"
            onClick={deactivate}
            disabled={isBusy}
            className="mt-3 flex items-center gap-1.5 font-medium text-muted hover:text-live"
          >
            <BellOff aria-hidden className="size-3.5" />
            Desactivar en este dispositivo
          </button>
        </div>
      )}

      {message && !isPanelOpen && (
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
