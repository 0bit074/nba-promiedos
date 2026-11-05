"use client";

import { WifiOff } from "lucide-react";
import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);

  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** Avisa que los marcadores en pantalla dejaron de actualizarse. */
export function OfflineBanner() {
  const isOnline = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );

  if (isOnline) return null;

  return (
    <p
      role="status"
      className="flex items-center justify-center gap-2 bg-surface-raised px-4 py-1.5 text-xs font-medium text-accent"
    >
      <WifiOff aria-hidden className="size-3.5" />
      Sin conexión: los datos pueden estar desactualizados
    </p>
  );
}
