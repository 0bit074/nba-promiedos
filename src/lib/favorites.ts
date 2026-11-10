/** Equipo favorito del usuario ("Mi Equipo"), guardado en este navegador. */
export interface FavoriteTeam {
  id: string;
  name: string;
}

const STORAGE_KEY = "favorite-team";

/** Avisa a los componentes de esta pestaña; `storage` cubre las demás. */
const CHANGE_EVENT = "favorite-team-change";

function isFavoriteTeam(value: unknown): value is FavoriteTeam {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as FavoriteTeam).id === "string" &&
    typeof (value as FavoriteTeam).name === "string"
  );
}

/** Texto guardado tal cual: así la instantánea es estable entre lecturas. */
export function readFavoriteTeamRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function parseFavoriteTeam(raw: string | null): FavoriteTeam | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return isFavoriteTeam(value) ? value : null;
  } catch {
    return null;
  }
}

/** Guarda el favorito; con `null` lo borra. */
export function setFavoriteTeam(team: FavoriteTeam | null) {
  try {
    if (team) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Sin almacenamiento, el favorito no se puede guardar.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeToFavoriteTeam(onChange: () => void) {
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
