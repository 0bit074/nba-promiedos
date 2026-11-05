import Link from "next/link";
import { connection } from "next/server";
import { StatusMessage } from "@/components/ui/StatusMessage";
import {
  getStatLeaders,
  searchPlayers,
  type PlayerSummary,
  type StatCategoryId,
  type StatLeaderCategory,
} from "@/lib/nba";
import { PlayerRow } from "./PlayerRow";

const CATEGORY_TITLES: Record<StatCategoryId, string> = {
  points: "Puntos por partido",
  rebounds: "Rebotes por partido",
  assists: "Asistencias por partido",
  steals: "Robos por partido",
  blocks: "Tapones por partido",
};

function StatLeaders({ categories }: { categories: StatLeaderCategory[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {categories.map(({ id, leaders }) => (
        <section key={id}>
          <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
            {CATEGORY_TITLES[id]}
          </h2>
          <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
            {leaders.map(({ player, value }) => (
              <li key={player.id}>
                <PlayerRow player={player}>
                  <span className="text-lg font-bold tabular-nums">{value}</span>
                </PlayerRow>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function PlayerResults({
  query,
  players,
}: {
  query: string;
  players: PlayerSummary[];
}) {
  if (players.length === 0) {
    return (
      <StatusMessage title="No encontramos jugadores">
        Revisa el nombre o{" "}
        <Link href="/jugadores" className="font-medium text-accent">
          vuelve a los líderes
        </Link>
        .
      </StatusMessage>
    );
  }

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <h2 className="min-w-0 truncate text-xs font-semibold tracking-wide text-muted uppercase">
          Resultados para “{query}” ({players.length})
        </h2>
        <Link
          href="/jugadores"
          className="shrink-0 text-xs font-medium text-accent"
        >
          Ver líderes
        </Link>
      </div>
      <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {players.map((player) => (
          <li
            key={player.id}
            className="overflow-hidden rounded-lg border border-line bg-surface"
          >
            <PlayerRow player={player} />
          </li>
        ))}
      </ul>
    </section>
  );
}

interface PlayersBoardProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Resultados de la búsqueda o, si no hay una, los líderes de la liga. */
export async function PlayersBoard({ searchParams }: PlayersBoardProps) {
  const { q } = await searchParams;
  await connection();

  const query = typeof q === "string" ? q.trim() : "";

  let players: PlayerSummary[] = [];
  let categories: StatLeaderCategory[] = [];
  try {
    if (query) {
      players = await searchPlayers(query);
    } else {
      categories = await getStatLeaders();
    }
  } catch (error) {
    console.error("No se pudieron cargar los jugadores", error);
    return (
      <StatusMessage title="No pudimos cargar los jugadores">
        Vuelve a intentarlo en unos minutos.
      </StatusMessage>
    );
  }

  return query ? (
    <PlayerResults query={query} players={players} />
  ) : (
    <StatLeaders categories={categories} />
  );
}

export function PlayersBoardSkeleton() {
  return (
    <div
      aria-busy
      aria-label="Cargando jugadores"
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="h-72 animate-pulse rounded-lg border border-line bg-surface"
        />
      ))}
    </div>
  );
}
