import { TeamLogo } from "@/components/teams/TeamLogo";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PlayerRow } from "@/components/players/PlayerRow";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { FavoriteTeamButton } from "./FavoriteTeamButton";
import { getTeamRoster, type TeamRoster } from "@/lib/nba";

/** Evita consultar rutas arbitrarias con lo que llegue en la URL. */
export function isValidTeamId(id: string) {
  return /^[a-z0-9]+$/i.test(id);
}

/** Plantel de un equipo, con cada jugador enlazado a su ficha. */
export async function TeamRosterView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isValidTeamId(id)) notFound();

  await connection();

  let roster: TeamRoster | null;
  try {
    roster = await getTeamRoster(id);
  } catch (error) {
    console.error(`No se pudo cargar el equipo ${id}`, error);
    return (
      <StatusMessage title="No pudimos cargar el equipo">
        Vuelve a intentarlo en unos minutos.
      </StatusMessage>
    );
  }

  if (!roster) notFound();
  const { team, players } = roster;

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <TeamLogo url={team.logoUrl} size={48} className="size-12 shrink-0 object-contain" />
        <h1 className="min-w-0 flex-1 text-2xl font-bold">{team.fullName}</h1>
        <FavoriteTeamButton team={{ id: team.id, name: team.name }} />
      </header>
      <section>
        <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
          Plantel ({players.length})
        </h2>
        <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <li
              key={player.id}
              className="overflow-hidden rounded-lg border border-line bg-surface"
            >
              <PlayerRow player={player}>
                {player.jersey && (
                  <span className="text-sm font-semibold text-muted tabular-nums">
                    #{player.jersey}
                  </span>
                )}
              </PlayerRow>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function TeamRosterSkeleton() {
  return (
    <div aria-busy aria-label="Cargando equipo" className="space-y-4">
      <div className="h-12 w-64 max-w-full animate-pulse rounded bg-surface" />
      <div className="h-96 animate-pulse rounded-lg border border-line bg-surface" />
    </div>
  );
}
