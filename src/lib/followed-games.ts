/** Partidos con la campanita activada (🔔), guardados en este navegador. */
export interface FollowedGame {
  id: string;
  /** Inicio del partido (ISO), para olvidarlo cuando ya pasó. */
  startTime: string;
}

const STORAGE_KEY = "followed-games";
const CHANGE_EVENT = "followed-games-change";
/** Un partido seguido se olvida dos días después de empezar. */
const KEEP_MS = 2 * 24 * 60 * 60 * 1000;

function isFollowedGame(value: unknown): value is FollowedGame {
  if (typeof value !== "object" || value === null) return false;
  const { id, startTime } = value as Record<string, unknown>;
  return typeof id === "string" && typeof startTime === "string";
}

export function readFollowedGamesRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function parseFollowedGames(
  raw: string | null,
  now = Date.now(),
): FollowedGame[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value
      .filter(isFollowedGame)
      .filter(({ startTime }) => now - Date.parse(startTime) < KEEP_MS);
  } catch {
    return [];
  }
}

function save(games: FollowedGame[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch {
    // Sin almacenamiento no se puede guardar la elección.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function isGameFollowed(id: string) {
  return parseFollowedGames(readFollowedGamesRaw()).some((game) => game.id === id);
}

export function followGame(game: FollowedGame) {
  const games = parseFollowedGames(readFollowedGamesRaw()).filter(
    ({ id }) => id !== game.id,
  );
  save([...games, game]);
}

export function unfollowGame(id: string) {
  const games = parseFollowedGames(readFollowedGamesRaw());
  if (games.some((game) => game.id === id)) {
    save(games.filter((game) => game.id !== id));
  }
}

export function subscribeToFollowedGames(onChange: () => void) {
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
