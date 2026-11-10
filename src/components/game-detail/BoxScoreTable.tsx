import { Flame } from "lucide-react";
import { TeamLogo } from "@/components/teams/TeamLogo";
import Link from "next/link";
import type { BoxScorePlayer, ShootingStat, Team } from "@/lib/nba";
import {
  formatPlusMinus,
  formatShooting,
  getShootingPercent,
} from "@/lib/nba/format";

interface StatColumn {
  label: string;
  title: string;
  /** Las columnas de tiro muestran "encestados-intentados" y el porcentaje. */
  wide?: boolean;
}

const STAT_COLUMNS: StatColumn[] = [
  { label: "MIN", title: "Minutos" },
  { label: "PTS", title: "Puntos" },
  { label: "REB", title: "Rebotes" },
  { label: "AST", title: "Asistencias" },
  { label: "TO", title: "Pérdidas" },
  { label: "TC", title: "Tiros de campo (encestados-intentados y %)", wide: true },
  { label: "3P", title: "Triples (encestados-intentados y %)", wide: true },
  { label: "+/-", title: "Diferencia de puntos con el jugador en cancha" },
];

/** Columna del jugador más las estadísticas. */
const COLUMN_COUNT = STAT_COLUMNS.length + 1;

const STAT_CELL = "px-1.5 text-right tabular-nums whitespace-nowrap";
const NARROW = "min-w-10";
const WIDE = "min-w-14";

/** Fija la columna del jugador al scrollear la tabla en celulares. */
const STICKY_CELL = "sticky left-0 z-10 bg-surface";

function ShootingCell({ stat }: { stat: ShootingStat }) {
  return (
    <td className={`${STAT_CELL} ${WIDE}`}>
      <span className="block leading-tight">{formatShooting(stat)}</span>
      <span className="block text-[11px] leading-tight text-muted">
        {stat.attempted > 0 ? `${getShootingPercent(stat)}%` : "-"}
      </span>
    </td>
  );
}

function PlusMinusCell({ value }: { value: string }) {
  const formatted = formatPlusMinus(value);
  const number = Number(formatted);
  const color =
    number > 0 ? "text-win" : number < 0 ? "text-live" : "text-muted";

  return (
    <td className={`${STAT_CELL} ${NARROW} pr-3 font-semibold ${color}`}>
      {formatted}
    </td>
  );
}

function PlayerRow({
  player,
  isTopScorer,
}: {
  player: BoxScorePlayer;
  isTopScorer: boolean;
}) {
  return (
    <tr className="h-11 border-t border-line">
      <th
        scope="row"
        className={`${STICKY_CELL} max-w-40 min-w-32 pr-2 pl-3 text-left font-normal`}
      >
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
      <td className={`${STAT_CELL} ${NARROW} text-muted`}>{player.minutes}</td>
      <td className={`${STAT_CELL} ${NARROW} font-semibold`}>
        {player.points}
      </td>
      <td className={`${STAT_CELL} ${NARROW}`}>{player.rebounds}</td>
      <td className={`${STAT_CELL} ${NARROW}`}>{player.assists}</td>
      <td className={`${STAT_CELL} ${NARROW}`}>{player.turnovers}</td>
      <ShootingCell stat={player.fieldGoals} />
      <ShootingCell stat={player.threePointers} />
      <PlusMinusCell value={player.plusMinus} />
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
          colSpan={COLUMN_COUNT}
          className="py-1 text-left text-xs font-medium text-muted"
        >
          <span className="sticky left-0 px-3">{title}</span>
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

  return (
    <section className="min-w-0">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <TeamLogo url={team.logoUrl} size={20} className="size-5 shrink-0 object-contain" />
        {team.fullName}
      </h3>
      <div className="overflow-x-auto overscroll-x-contain rounded-lg border border-line bg-surface">
        <table className="w-full min-w-max border-collapse text-sm">
          <caption className="sr-only">Box score de {team.fullName}</caption>
          <thead className="text-xs text-muted">
            <tr>
              <th
                scope="col"
                className={`${STICKY_CELL} py-2 pl-3 text-left font-medium`}
              >
                Jugador
              </th>
              {STAT_COLUMNS.map(({ label, title, wide }, index) => (
                <th
                  key={label}
                  scope="col"
                  className={`px-1.5 py-2 text-right font-medium ${wide ? WIDE : NARROW} ${
                    index === STAT_COLUMNS.length - 1 ? "pr-3" : ""
                  }`}
                >
                  <abbr title={title} className="no-underline">
                    {label}
                  </abbr>
                </th>
              ))}
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
