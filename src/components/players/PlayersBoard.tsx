import Link from "next/link";
import { connection } from "next/server";
import { StatusMessage } from "@/components/ui/StatusMessage";
import {
  getStatLeaders,
  searchPlayers,
  type PlayerSummary,
  type StatLeaderCategory,
} from "@/lib/nba";
import { LeaderCard } from "./LeaderCard";
import { PlayerRow } from "./PlayerRow";
import { PlayerSearchForm } from "./PlayerSearch";
import { getPlayersTab, PlayersTabs } from "./PlayersTabs";

function StatLeaders({ categories }: { categories: StatLeaderCategory[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {categories.map(({ id, leaders }) => (
        <LeaderCard key={id} id={id} leaders={leaders} />
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
      <h2 className="mb-2 truncate text-xs font-semibold tracking-wide text-muted uppercase">
        Resultados para “{query}” ({players.length})
      </h2>
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

const LOAD_ERROR = (
  <StatusMessage title="No pudimos cargar los jugadores">
    Vuelve a intentarlo en unos minutos.
  </StatusMessage>
);

async function SearchTab({ query }: { query: string }) {
  let players: PlayerSummary[] = [];
  if (query) {
    try {
      players = await searchPlayers(query);
    } catch (error) {
      console.error("No se pudieron buscar jugadores", error);
      return LOAD_ERROR;
    }
  }

  return (
    <div className="space-y-4">
      {/* La clave reinicia el campo al navegar entre búsquedas. */}
      <PlayerSearchForm key={query} defaultQuery={query} autoFocus={!query} />
      {query ? (
        <PlayerResults query={query} players={players} />
      ) : (
        <p className="text-sm text-muted">
          Escribe al menos 2 letras para ver sugerencias mientras escribes.
        </p>
      )}
    </div>
  );
}

async function LeadersTab() {
  let categories: StatLeaderCategory[];
  try {
    categories = await getStatLeaders();
  } catch (error) {
    console.error("No se pudieron cargar los líderes", error);
    return LOAD_ERROR;
  }

  if (categories.length === 0) {
    return (
      <StatusMessage title="Todavía no hay líderes">
        Aparecerán cuando avance la temporada.
      </StatusMessage>
    );
  }

  return <StatLeaders categories={categories} />;
}

interface PlayersBoardProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Pestañas de /jugadores: los líderes de la liga o el buscador. */
export async function PlayersBoard({ searchParams }: PlayersBoardProps) {
  const params = await searchParams;
  await connection();

  const tab = getPlayersTab(params);
  const query = typeof params.q === "string" ? params.q.trim() : "";

  return (
    <div className="space-y-4">
      <PlayersTabs active={tab} />
      {tab === "search" ? <SearchTab query={query} /> : <LeadersTab />}
    </div>
  );
}

export function PlayersBoardSkeleton() {
  return (
    <div aria-busy aria-label="Cargando jugadores" className="space-y-4">
      <div className="h-11 animate-pulse rounded-lg bg-surface sm:w-72" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-lg border border-line bg-surface"
          />
        ))}
      </div>
    </div>
  );
}
