"use client";

import { BellRing, Pause, Play, RotateCcw, Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { waitForServiceWorker } from "@/components/pwa/PushNotifications";
import {
  createInitialUpdate,
  finishUpdate,
  formatLiveScoreTitle,
  nextSimulatedUpdate,
  type LiveScoreUpdate,
} from "@/lib/live-score";

const TICK_MS = 3_000;

type Availability =
  | "checking"
  /** Sin service worker: en desarrollo o en navegadores sin soporte. */
  | "unavailable"
  | "default"
  | "granted"
  | "denied";

interface LiveScoreSimulatorProps {
  gameId: string;
  awayAbbr: string;
  homeAbbr: string;
}

async function readAvailability(): Promise<Availability> {
  if (!("serviceWorker" in navigator) || !("Notification" in window)) {
    return "unavailable";
  }
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return "unavailable";
  return Notification.permission;
}

async function postToServiceWorker(message: object) {
  const registration = await waitForServiceWorker();
  registration.active?.postMessage(message);
}

const BUTTON =
  "flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:opacity-50";
const PRIMARY = `${BUTTON} bg-accent text-background`;
const SECONDARY = `${BUTTON} border border-line bg-surface text-foreground hover:border-accent`;

/**
 * Herramienta de prueba: simula un partido en vivo y envía cada cambio de
 * puntos o de tiempo al service worker, que muestra la notificación con el
 * mismo código que usaría un push real.
 */
export function LiveScoreSimulator({
  gameId,
  awayAbbr,
  homeAbbr,
}: LiveScoreSimulatorProps) {
  const [availability, setAvailability] = useState<Availability>("checking");
  const [update, setUpdate] = useState(() =>
    createInitialUpdate(gameId, awayAbbr, homeAbbr),
  );
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // El último estado enviado, para el intervalo y para cerrar al salir.
  const latestRef = useRef(update);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    readAvailability().then(setAvailability);
  }, []);

  // El service worker avisa cuando se toca "Silenciar" en la notificación.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "live-score-muted" && event.data.gameId === gameId) {
        setIsMuted(true);
        setIsRunning(false);
      }
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, [gameId]);

  function send(next: LiveScoreUpdate) {
    latestRef.current = next;
    setUpdate(next);
    postToServiceWorker(next).catch((sendError: unknown) => {
      console.error("No se pudo enviar la actualización", sendError);
      setError("No se pudo enviar la notificación.");
      setIsRunning(false);
    });
  }

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const previous = latestRef.current;
      const next = nextSimulatedUpdate(previous);
      if (next.status === "final") setIsRunning(false);
      // Solo se notifica si cambiaron los puntos o el tiempo.
      if (formatLiveScoreTitle(next) !== formatLiveScoreTitle(previous)) {
        send(next);
      }
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Al salir de la página, la notificación deja de estar fija.
  useEffect(
    () => () => {
      const last = latestRef.current;
      if (hasStartedRef.current && last.status === "live") {
        postToServiceWorker(finishUpdate(last)).catch(() => {});
      }
    },
    [],
  );

  async function requestPermission() {
    const permission = await Notification.requestPermission();
    setAvailability(permission);
  }

  function start() {
    setError(null);
    setIsRunning(true);
    if (!hasStarted) {
      setHasStarted(true);
      hasStartedRef.current = true;
      send(latestRef.current);
    }
  }

  function finish() {
    setIsRunning(false);
    send(finishUpdate(latestRef.current));
  }

  function reset() {
    setIsRunning(false);
    setHasStarted(false);
    hasStartedRef.current = false;
    const initial = createInitialUpdate(gameId, awayAbbr, homeAbbr);
    latestRef.current = initial;
    setUpdate(initial);
    postToServiceWorker({ type: "live-score-clear", gameId }).catch(() => {});
  }

  function unmute() {
    setIsMuted(false);
    postToServiceWorker({ type: "live-score-unmute", gameId }).catch(() => {});
  }

  const isFinal = update.status === "final";

  return (
    <details className="group mt-6 rounded-lg border border-dashed border-line bg-surface/60">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-muted hover:text-foreground">
        <BellRing aria-hidden className="size-4 text-accent" />
        Probar notificaciones en vivo
        <span className="ml-auto text-xs font-normal group-open:hidden">
          Simulador
        </span>
      </summary>

      <div className="space-y-4 border-t border-line px-4 py-4">
        <p className="text-sm text-muted">
          Simula este partido en vivo: cada vez que cambian los puntos o el
          tiempo se actualiza una sola notificación, sin duplicarse.
        </p>

        {availability === "checking" ? null : availability === "unavailable" ? (
          <p className="rounded-lg bg-surface-raised px-3 py-2 text-sm">
            Disponible en la app instalada o en la versión publicada (las
            notificaciones necesitan el service worker).
          </p>
        ) : availability === "denied" ? (
          <p className="rounded-lg bg-surface-raised px-3 py-2 text-sm">
            Las notificaciones están bloqueadas: actívalas en los permisos del
            navegador para este sitio.
          </p>
        ) : availability === "default" ? (
          <button type="button" onClick={requestPermission} className={PRIMARY}>
            <BellRing aria-hidden className="size-4" />
            Permitir notificaciones
          </button>
        ) : (
          <>
            {/* Vista previa: el mismo título que la notificación. */}
            <div
              aria-live="polite"
              className="rounded-lg border border-line bg-surface p-3"
            >
              <p className="flex items-center gap-2 text-xs font-semibold">
                {isFinal ? (
                  <span className="text-muted">FINAL</span>
                ) : hasStarted ? (
                  <span className="flex items-center gap-1.5 text-live">
                    <span aria-hidden className="size-2 animate-pulse rounded-full bg-live motion-reduce:animate-none" />
                    EN VIVO
                  </span>
                ) : (
                  <span className="text-muted">LISTO PARA EMPEZAR</span>
                )}
                {isMuted && (
                  <span className="ml-auto rounded bg-surface-raised px-1.5 py-0.5 text-muted">
                    Silenciado
                  </span>
                )}
              </p>
              <p className="mt-1 text-base font-bold tabular-nums sm:text-lg">
                {formatLiveScoreTitle(update)}
              </p>
              <p className="text-sm text-muted">{update.lastPlay}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {isRunning ? (
                <button type="button" onClick={() => setIsRunning(false)} className={PRIMARY}>
                  <Pause aria-hidden className="size-4" />
                  Pausar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={start}
                  disabled={isFinal || isMuted}
                  className={PRIMARY}
                >
                  <Play aria-hidden className="size-4" />
                  {hasStarted ? "Continuar" : "Iniciar simulación"}
                </button>
              )}
              <button
                type="button"
                onClick={finish}
                disabled={!hasStarted || isFinal}
                className={SECONDARY}
              >
                <Square aria-hidden className="size-4" />
                Terminar partido
              </button>
              <button type="button" onClick={reset} className={SECONDARY}>
                <RotateCcw aria-hidden className="size-4" />
                Reiniciar
              </button>
              {isMuted && (
                <button type="button" onClick={unmute} className={SECONDARY}>
                  <Volume2 aria-hidden className="size-4" />
                  Reactivar
                </button>
              )}
            </div>

            {error && (
              <p role="alert" className="text-sm text-live">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </details>
  );
}
