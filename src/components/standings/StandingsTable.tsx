import { TeamLogo } from "@/components/teams/TeamLogo";
import Link from "next/link";
import type { TeamStanding } from "@/lib/nba";
import { getStandingZone, type StandingZone } from "@/lib/nba/format";
import { TeamStreak } from "./TeamStreak";

export const ZONES: Record<
  StandingZone,
  { label: string; seedClass: string; dotClass: string }
> = {
  playoffs: {
    label: "Playoffs directo",
    seedClass: "bg-zone-playoffs text-background",
    dotClass: "bg-zone-playoffs",
  },
  "play-in": {
    label: "Play-In",
    seedClass: "bg-zone-play-in text-background",
    dotClass: "bg-zone-play-in",
  },
  out: {
    label: "Fuera de Playoffs",
    seedClass: "bg-surface-raised text-muted",
    dotClass: "bg-surface-raised ring-1 ring-muted",
  },
};

const STAT_CELL =
  "px-1.5 text-center text-sm whitespace-nowrap tabular-nums max-[359px]:px-1 sm:px-2";
const HEADER_CELL =
  "px-1.5 py-2 text-center font-medium max-[359px]:px-1 sm:px-2";

function StandingRow({
  standing,
  startsZone,
}: {
  standing: TeamStanding;
  /** Marca el corte con la zona anterior. */
  startsZone: boolean;
}) {
  const { team, seed, wins, losses, winPercent, gamesBehind, streak, lastTen } =
    standing;
  const zone = getStandingZone(seed);
  const isOut = zone === "out";

  return (
    <tr
      className={`h-11 border-t ${startsZone ? "border-t-2 border-muted" : "border-line"}`}
    >
      <td className="pr-1 pl-2">
        <span
          className={`flex size-6 items-center justify-center rounded text-xs font-bold tabular-nums ${ZONES[zone].seedClass}`}
        >
          {seed}
        </span>
      </td>
      <th scope="row" className="w-full max-w-0 px-1 text-left font-normal">
        <Link
          href={`/equipos/${team.id}`}
          className="flex items-center gap-2 hover:text-accent"
        >
          <TeamLogo url={team.logoUrl} size={24} className="size-6 shrink-0 object-contain" />
          <span
            title={team.fullName}
            className={`truncate text-sm font-semibold ${isOut ? "text-muted" : ""}`}
          >
            {team.name}
          </span>
          <span className="sr-only">({ZONES[zone].label})</span>
        </Link>
      </th>
      <td className={`${STAT_CELL} font-semibold`}>{wins}</td>
      <td className={STAT_CELL}>{losses}</td>
      <td className={`${STAT_CELL} text-muted max-[359px]:hidden`}>
        {winPercent}
      </td>
      <td className={`${STAT_CELL} text-muted`}>{gamesBehind}</td>
      <td className={`${STAT_CELL} hidden text-muted sm:table-cell`}>{lastTen}</td>
      <td className={STAT_CELL}>
        <TeamStreak streak={streak} />
      </td>
    </tr>
  );
}

interface StandingsTableProps {
  caption: string;
  teams: TeamStanding[];
}

export function StandingsTable({ caption, teams }: StandingsTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <table className="w-full border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead className="text-xs text-muted">
          <tr>
            <th scope="col" className="py-2 pl-2 text-center font-medium">
              <abbr title="Puesto" className="no-underline">#</abbr>
            </th>
            <th scope="col" className="px-1 py-2 text-left font-medium">
              Equipo
            </th>
            <th scope="col" className={HEADER_CELL}>
              <abbr title="Partidos ganados" className="no-underline">G</abbr>
            </th>
            <th scope="col" className={HEADER_CELL}>
              <abbr title="Partidos perdidos" className="no-underline">P</abbr>
            </th>
            <th scope="col" className={`${HEADER_CELL} max-[359px]:hidden`}>
              <abbr title="Porcentaje de victorias" className="no-underline">%</abbr>
            </th>
            <th scope="col" className={HEADER_CELL}>
              <abbr title="Juegos de diferencia con el líder" className="no-underline">DIF</abbr>
            </th>
            <th scope="col" className={`${HEADER_CELL} hidden sm:table-cell`}>
              <abbr title="Últimos 10 partidos" className="no-underline">U10</abbr>
            </th>
            <th scope="col" className={HEADER_CELL}>
              <abbr title="Racha actual" className="no-underline">RACHA</abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          {teams.map((standing, index) => (
            <StandingRow
              key={standing.team.id}
              standing={standing}
              startsZone={
                index > 0 &&
                getStandingZone(standing.seed) !==
                  getStandingZone(teams[index - 1].seed)
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
