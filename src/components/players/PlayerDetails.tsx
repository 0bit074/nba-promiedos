import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { formatGameDay } from "@/lib/dates";
import {
  getPlayerProfile,
  type PlayerAverages,
  type PlayerGameLogEntry,
  type PlayerProfile,
} from "@/lib/nba";
import { formatHeight, getPositionName } from "@/lib/nba/format";
import { PlayerAvatar } from "./PlayerAvatar";

const SECTION_TITLE =
  "mb-2 text-xs font-semibold tracking-wide text-muted uppercase";

function formatExperience(seasonNumber: number | null) {
  if (seasonNumber === null) return null;
  return seasonNumber === 1 ? "Novato" : `${seasonNumber}.ª temporada`;
}

function getPlayerFacts(player: PlayerProfile) {
  const { draft, seasonNumber } = player;

  const facts: [label: string, value: string | null][] = [
    ["Posición", getPositionName(player.position)],
    ["Número", player.jersey && `#${player.jersey}`],
    ["Altura", player.heightCm ? formatHeight(player.heightCm) : null],
    ["Peso", player.weightKg ? `${player.weightKg} kg` : null],
    ["Edad", player.age ? `${player.age} años` : null],
    ["Nacimiento", player.birthPlace],
    [
      "Draft",
      draft && `${draft.year} · Ronda ${draft.round}, puesto ${draft.pick}`,
    ],
    ["Experiencia", formatExperience(seasonNumber)],
  ];

  return facts.filter((fact): fact is [string, string] => Boolean(fact[1]));
}

function PlayerHeader({ player }: { player: PlayerProfile }) {
  const { name, headshotUrl, team } = player;

  return (
    <header className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-center gap-4">
        <PlayerAvatar name={name} url={headshotUrl} size={88} />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{name}</h1>
          {team ? (
            <p className="mt-1 flex items-center gap-2 text-sm text-muted">
              <Image
                src={team.logoUrl}
                alt=""
                width={20}
                height={20}
                className="size-5 shrink-0 object-contain"
              />
              <span className="truncate">{team.fullName}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">Sin equipo</p>
          )}
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 sm:grid-cols-4">
        {getPlayerFacts(player).map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}

const AVERAGE_ROWS: [label: string, key: keyof PlayerAverages][] = [
  ["Partidos", "gamesPlayed"],
  ["Minutos", "minutes"],
  ["Puntos", "points"],
  ["Rebotes", "rebounds"],
  ["Asistencias", "assists"],
  ["Robos", "steals"],
  ["Tapones", "blocks"],
  ["% de campo", "fieldGoalPct"],
  ["% de triples", "threePointPct"],
  ["% de libres", "freeThrowPct"],
];

function AveragesTable({ player }: { player: PlayerProfile }) {
  const { seasonAverages, careerAverages } = player;

  return (
    <section className="min-w-0">
      <h2 className={SECTION_TITLE}>Promedios por partido</h2>
      {seasonAverages || careerAverages ? (
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Promedios de la temporada y de la carrera
            </caption>
            <thead className="text-xs text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium">
                  Estadística
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Temporada
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Carrera
                </th>
              </tr>
            </thead>
            <tbody>
              {AVERAGE_ROWS.map(([label, key]) => (
                <tr key={key} className="h-10 border-t border-line">
                  <th scope="row" className="px-3 text-left font-normal text-muted">
                    {label}
                  </th>
                  <td className="px-3 text-right font-semibold tabular-nums">
                    {seasonAverages?.[key] ?? "-"}
                  </td>
                  <td className="px-3 text-right text-muted tabular-nums">
                    {careerAverages?.[key] ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <StatusMessage title="Sin estadísticas">
          Todavía no tiene partidos registrados.
        </StatusMessage>
      )}
    </section>
  );
}

function GameLogRow({ game }: { game: PlayerGameLogEntry }) {
  const stat = "px-1.5 text-right tabular-nums sm:px-2";

  return (
    <tr className="h-10 border-t border-line">
      <td className="pl-3 whitespace-nowrap text-muted">
        {formatGameDay(game.startTime)}
      </td>
      <th scope="row" className="px-1.5 text-left font-semibold whitespace-nowrap sm:px-2">
        <span className="font-normal text-muted">{game.isHome ? "vs" : "@"}</span>{" "}
        {game.opponent}
      </th>
      <td className="px-1.5 whitespace-nowrap tabular-nums sm:px-2">
        <span className={`font-semibold ${game.isWin ? "text-win" : "text-live"}`}>
          {game.isWin ? "G" : "P"}
        </span>{" "}
        <span className="text-muted max-[359px]:hidden">{game.score}</span>
      </td>
      <td className={`${stat} hidden text-muted sm:table-cell`}>{game.minutes}</td>
      <td className={`${stat} font-semibold`}>{game.points}</td>
      <td className={stat}>{game.rebounds}</td>
      <td className={`${stat} pr-3 sm:pr-3`}>{game.assists}</td>
    </tr>
  );
}

function GameLogTable({ games }: { games: PlayerGameLogEntry[] }) {
  const header = "px-1.5 py-2 text-right font-medium sm:px-2";

  return (
    <section className="min-w-0">
      <h2 className={SECTION_TITLE}>Últimos partidos</h2>
      {games.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Últimos partidos de temporada regular
            </caption>
            <thead className="text-xs text-muted">
              <tr>
                <th scope="col" className="py-2 pl-3 text-left font-medium">
                  Fecha
                </th>
                <th scope="col" className="px-1.5 py-2 text-left font-medium sm:px-2">
                  Rival
                </th>
                <th scope="col" className="px-1.5 py-2 text-left font-medium sm:px-2">
                  Res.
                </th>
                <th scope="col" className={`${header} hidden sm:table-cell`}>
                  <abbr title="Minutos" className="no-underline">MIN</abbr>
                </th>
                <th scope="col" className={header}>
                  <abbr title="Puntos" className="no-underline">PTS</abbr>
                </th>
                <th scope="col" className={header}>
                  <abbr title="Rebotes" className="no-underline">REB</abbr>
                </th>
                <th scope="col" className={`${header} pr-3 sm:pr-3`}>
                  <abbr title="Asistencias" className="no-underline">AST</abbr>
                </th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <GameLogRow key={game.id} game={game} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <StatusMessage title="Sin partidos esta temporada">
          Aparecerán aquí cuando juegue en temporada regular.
        </StatusMessage>
      )}
    </section>
  );
}

/** Los ids de ESPN son numéricos; evita consultar rutas arbitrarias. */
export function isValidPlayerId(id: string) {
  return /^\d+$/.test(id);
}

/** Ficha completa de un jugador. */
export async function PlayerDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidPlayerId(id)) notFound();

  await connection();

  let player: PlayerProfile | null;
  try {
    player = await getPlayerProfile(id);
  } catch (error) {
    console.error(`No se pudo cargar el jugador ${id}`, error);
    return (
      <StatusMessage title="No pudimos cargar al jugador">
        Vuelve a intentarlo en unos minutos.
      </StatusMessage>
    );
  }

  if (!player) notFound();

  return (
    <div className="space-y-4">
      <PlayerHeader player={player} />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <AveragesTable player={player} />
        <GameLogTable games={player.recentGames} />
      </div>
    </div>
  );
}

export function PlayerDetailsSkeleton() {
  return (
    <div aria-busy aria-label="Cargando jugador" className="space-y-4">
      <div className="h-56 animate-pulse rounded-lg border border-line bg-surface" />
      <div className="h-96 animate-pulse rounded-lg border border-line bg-surface" />
    </div>
  );
}
