import { getTeamConference } from "./nba/conferences";
import type { ConferenceId } from "./nba/types";

/** Equipo favorito ("Mis equipos"), guardado en este navegador. */
export interface FavoriteTeam {
  id: string;
  name: string;
  abbreviation: string;
}

/** Cuántos favoritos se permiten en cada conferencia (Este y Oeste). */
export const MAX_FAVORITES_PER_CONFERENCE = 3;

const STORAGE_KEY = "favorite-teams";

/** Versión anterior, con un solo favorito y sin conferencia: se descarta. */
const LEGACY_STORAGE_KEY = "favorite-team";

/** Avisa a los componentes de esta pestaña; `storage` cubre las demás. */
const CHANGE_EVENT = "favorite-teams-change";

function isFavoriteTeam(value: unknown): value is FavoriteTeam {
  if (typeof value !== "object" || value === null) return false;
  const { id, name, abbreviation } = value as Record<string, unknown>;
  return (
    typeof id === "string" &&
    typeof name === "string" &&
    typeof abbreviation === "string"
  );
}

/** Texto guardado tal cual: así la instantánea es estable entre lecturas. */
export function readFavoriteTeamsRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function parseFavoriteTeams(raw: string | null): FavoriteTeam[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter(isFavoriteTeam) : [];
  } catch {
    return [];
  }
}

function saveFavoriteTeams(teams: FavoriteTeam[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Sin almacenamiento, los favoritos no se pueden guardar.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function countFavoritesInConference(
  favorites: FavoriteTeam[],
  conference: ConferenceId,
) {
  return favorites.filter(
    ({ abbreviation }) => getTeamConference(abbreviation) === conference,
  ).length;
}

export type ToggleFavoriteResult = "added" | "removed" | "full";

/**
 * Agrega o quita un favorito. No agrega si su conferencia ya tiene el máximo
 * y devuelve "full", para que la interfaz lo explique.
 */
export function toggleFavoriteTeam(team: FavoriteTeam): ToggleFavoriteResult {
  const favorites = parseFavoriteTeams(readFavoriteTeamsRaw());

  if (favorites.some(({ id }) => id === team.id)) {
    saveFavoriteTeams(favorites.filter(({ id }) => id !== team.id));
    return "removed";
  }

  const conference = getTeamConference(team.abbreviation);
  if (
    conference &&
    countFavoritesInConference(favorites, conference) >=
      MAX_FAVORITES_PER_CONFERENCE
  ) {
    return "full";
  }

  saveFavoriteTeams([...favorites, team]);
  return "added";
}

export function subscribeToFavoriteTeams(onChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", handleStorage);
  };
}
