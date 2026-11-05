/**
 * Una jornada NBA se define por la fecha en la costa este de EE. UU.: un
 * partido de las 22:30 ET sigue siendo de ese día aunque en Argentina ya sea
 * el siguiente. Las fechas viajan como texto YYYY-MM-DD.
 */
const NBA_TIME_ZONE = "America/New_York";

const LOCALE = "es-AR";

/** Zona usada en el HTML del servidor, antes de conocer la del navegador. */
export const DEFAULT_TIME_ZONE = "America/Argentina/Buenos_Aires";

const DAY_IN_MS = 86_400_000;

function toUtcDate(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

export function getNbaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: NBA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = toUtcDate(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

/** Devuelve la fecha pedida en la URL o, si no es válida, la jornada de hoy. */
export function resolveDate(value: unknown, today: string) {
  return typeof value === "string" && isValidDate(value) ? value : today;
}

export function addDays(date: string, days: number) {
  const shifted = new Date(toUtcDate(date).getTime() + days * DAY_IN_MS);
  return shifted.toISOString().slice(0, 10);
}

function formatDate(date: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: "UTC" }).format(
    toUtcDate(date),
  );
}

/** Por ejemplo "mié". */
export function formatWeekday(date: string) {
  return formatDate(date, { weekday: "short" }).replace(".", "");
}

/** Por ejemplo "4". */
export function formatDayNumber(date: string) {
  return formatDate(date, { day: "numeric" });
}

/** Por ejemplo "miércoles, 4 de noviembre". */
export function formatLongDate(date: string) {
  return formatDate(date, { weekday: "long", day: "numeric", month: "long" });
}

/** Fecha de la jornada de un partido, por ejemplo "2 nov". */
export function formatGameDay(isoDate: string) {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    timeZone: NBA_TIME_ZONE,
  })
    .format(new Date(isoDate))
    .replace(".", "");
}

/** Hora de inicio en formato 24 h, por ejemplo "21:30". */
export function formatTime(isoDate: string, timeZone?: string) {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(new Date(isoDate));
}
