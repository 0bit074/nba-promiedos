"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_TIME_ZONE, formatTime } from "@/lib/dates";

const subscribe = () => () => {};

/** Muestra la hora en la zona del navegador, que el servidor no conoce. */
export function GameTime({ startTime }: { startTime: string }) {
  const time = useSyncExternalStore(
    subscribe,
    () => formatTime(startTime),
    () => formatTime(startTime, DEFAULT_TIME_ZONE),
  );

  return <time dateTime={startTime}>{time}</time>;
}
