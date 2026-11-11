export const APP_NAME = "The Rookie App";

/** Nombre corto del ícono instalado: 12 caracteres o menos. */
export const APP_SHORT_NAME = "Rookie App";

export const APP_DESCRIPTION =
  "Marcadores en vivo, fixture, posiciones y estadísticas de la NBA.";

/**
 * Dirección pública del sitio (dominio de producción en Vercel). Se puede
 * cambiar sin tocar el código con NEXT_PUBLIC_SITE_URL.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://the-rookie-app.vercel.app"
).replace(/\/$/, "");

/** Debe coincidir con `--color-background` de globals.css. */
export const THEME_COLOR = "#0a0e14";

/** Clave pública de Web Push: es segura de publicar; la privada va en el servidor. */
export const VAPID_PUBLIC_KEY =
  "BL20SVVB5lwFCQq-9Rxsk0fDseGqPI9GRP3jD-iDv98RozwU6-PkbfiYL7XCIlvfSSeGsKWfojyKOVzNjaQGkSc";
