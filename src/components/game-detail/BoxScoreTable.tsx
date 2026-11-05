import { Flame } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { BoxScorePlayer, Team } from "@/lib/nba";

const STAT_CELL = "w-10 px-1 text-right tabular-nums";

function PlayerRow({
  player,
  isTopScorer,
}: {
  player: BoxScorePlayer;
  isTopScorer: boolean;
}) {
  return (
    <tr className="h-10 border-t border-line">
      <th scope="row" className="w-full max-w-0 pl-3 text-left font-normal">
        <span className="flex items-center gap-1.5">
          <Link
            href={`/jugadores/${player.id}`}
            className="truncate font-semibold hover:text-accent"
          >
            {player.name}
          </Link>
          {isTopScorer && (
            <>
              <Flame
                aria-hidden
                className="size-3.5 shrink-0 text-orange-500"
              />
              <span className="sr-only">(máximo anotador)</span>
            </>
          )}
        </span>
      </th>
      <td className={`${STAT_CELL} text-muted`}>{player.minutes}</td>
      <td className={`${STAT_CELL} font-semibold`}>{player.points}</td>
      <td className={STAT_CELL}>{player.rebounds}</td>
      <td className={`${STAT_CELL} pr-3`}>{player.assists}</td>
    </tr>
  );
}

function PlayerGroup({
  title,
  players,
  topPoints,
}: {
  title: string;
  players: BoxScorePlayer[];
  topPoints: number;
}) {
  if (players.length === 0) return null;

  return (
    <tbody>
      <tr className="border-t border-line bg-surface-raised">
        <th
          scope="colgroup"
          colSpan={5}
          className="px-3 py-1 text-left text-xs font-medium text-muted"
        >
          {title}
        </th>
      </tr>
      {players.map((player) => (
        <PlayerRow
          key={player.id}
          player={player}
          isTopScorer={topPoints > 0 && player.points === topPoints}
        />
      ))}
    </tbody>
  );
}

interface BoxScoreTableProps {
  team: Team;
  players: BoxScorePlayer[];
  /** En vivo, quienes no jugaron todavía pueden entrar. */
  isLive: boolean;
}

export function BoxScoreTable({ team, players, isLive }: BoxScoreTableProps) {
  const played = players.filter((player) => !player.didNotPlay);
  const absent = players.filter((player) => player.didNotPlay);
  const topPoints = Math.max(0, ...played.map((player) => player.points));
  const header = "w-10 px-1 py-2 text-right font-medium";

  return (
    <section className="min-w-0">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Image
          src={team.logoUrl}
          alt=""
          width={20}
          height={20}
          className="size-5 shrink-0 object-contain"
        />
        {team.fullName}
      </h3>
      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Box score de {team.fullName}</caption>
          <thead className="text-xs text-muted">
            <tr>
              <th scope="col" className="py-2 pl-3 text-left font-medium">
                Jugador
              </th>
              <th scope="col" className={header}>
                <abbr title="Minutos" className="no-underline">MIN</abbr>
              </th>
              <th scope="col" className={header}>
                <abbr title="Puntos" className="no-underline">PTS</abbr>
              </th>
              <th scope="col" className={header}>
                <abbr title="Rebotes" className="no-underline">REB</abbr>
              </th>
              <th scope="col" className={`${header} pr-3`}>
                <abbr title="Asistencias" className="no-underline">AST</abbr>
              </th>
            </tr>
          </thead>
          <PlayerGroup
            title="Titulares"
            players={played.filter((player) => player.isStarter)}
            topPoints={topPoints}
          />
          <PlayerGroup
            title="Suplentes"
            players={played.filter((player) => !player.isStarter)}
            topPoints={topPoints}
          />
        </table>
      </div>
      {absent.length > 0 && (
        <p className="mt-2 text-xs text-muted">
          {isLive ? "Aún sin jugar" : "No jugaron"}:{" "}
          {absent.map((player) => player.name).join(", ")}
        </p>
      )}
    </section>
  );
}
