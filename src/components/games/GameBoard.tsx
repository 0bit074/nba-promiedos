import { connection } from "next/server";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { getNbaToday, resolveDate } from "@/lib/dates";
import { getGamesByDate, isGameOver, type Game } from "@/lib/nba";
import { GameCard } from "./GameCard";
import { LiveRefresher } from "./LiveRefresher";

const LIVE_REFRESH_MS = 30_000;
const PENDING_REFRESH_MS = 60_000;

function GameSection({ title, games }: { title: string; games: Game[] }) {
  if (games.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
        {title} ({games.length})
      </h2>
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  );
}

interface GameBoardProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Cartelera de una jornada: partidos en vivo, próximos y finalizados. */
export async function GameBoard({ searchParams }: GameBoardProps) {
  const params = await searchParams;
  await connection();

  const today = getNbaToday();
  const date = resolveDate(params.date, today);

  let games: Game[];
  try {
    games = await getGamesByDate(date);
  } catch (error) {
    console.error(`No se pudieron cargar los partidos del ${date}`, error);
    return (
      <StatusMessage title="No pudimos cargar los partidos">
        Vuelve a intentarlo en unos minutos.
      </StatusMessage>
    );
  }

  if (games.length === 0) {
    return (
      <StatusMessage title="No hay partidos este día">
        Elige otra fecha para ver el fixture.
      </StatusMessage>
    );
  }

  const liveGames = games.filter((game) => game.status === "live");
  const upcomingGames = games.filter((game) => game.status === "scheduled");
  const finishedGames = games.filter(isGameOver);

  const refreshInterval =
    liveGames.length > 0
      ? LIVE_REFRESH_MS
      : date === today && upcomingGames.length > 0
        ? PENDING_REFRESH_MS
        : null;

  return (
    <div className="space-y-6">
      {refreshInterval && <LiveRefresher intervalMs={refreshInterval} />}
      <GameSection title="En vivo" games={liveGames} />
      <GameSection title="Próximos" games={upcomingGames} />
      <GameSection title="Finalizados" games={finishedGames} />
    </div>
  );
}

export function GameBoardSkeleton() {
  return (
    <div
      aria-busy
      aria-label="Cargando partidos"
      className="grid gap-2 md:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="h-[7.1875rem] animate-pulse rounded-lg border border-line bg-surface"
        />
      ))}
    </div>
  );
}
