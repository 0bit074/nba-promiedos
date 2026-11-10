"use client";

import { useSyncExternalStore } from "react";
import { formatGameDay, formatTimeAgo } from "@/lib/dates";

const REFRESH_MS = 60_000;

function subscribe(onChange: () => void) {
  const interval = setInterval(onChange, REFRESH_MS);
  return () => clearInterval(interval);
}

/**
 * Tiempo desde la publicación, calculado en el navegador: la página puede
 * venir de la caché y el servidor sólo conoce la fecha.
 */
export function TimeAgo({ date }: { date: string }) {
  const label = useSyncExternalStore(
    subscribe,
    () => formatTimeAgo(date),
    () => formatGameDay(date),
  );

  return <time dateTime={date}>{label}</time>;
}
