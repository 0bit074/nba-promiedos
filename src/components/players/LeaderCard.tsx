import Link from "next/link";
import type { StatCategoryId, StatLeader } from "@/lib/nba";
import { getPositionName } from "@/lib/nba/format";
import { PlayerAvatar } from "./PlayerAvatar";

export const LEADER_CATEGORIES: Record<
  StatCategoryId,
  { title: string; abbreviation: string; unit: string }
> = {
  points: { title: "Puntos", abbreviation: "PPG", unit: "pts por partido" },
  assists: { title: "Asistencias", abbreviation: "APG", unit: "ast por partido" },
  rebounds: { title: "Rebotes", abbreviation: "RPG", unit: "reb por partido" },
  blocks: { title: "Tapones", abbreviation: "BPG", unit: "tap por partido" },
  threePointers: {
    title: "Triples convertidos",
    abbreviation: "3PM",
    unit: "triples por partido",
  },
};

function getDetails({ player }: StatLeader) {
  return [player.teamName, getPositionName(player.position)]
    .filter(Boolean)
    .join(" · ");
}

function TopLeader({ leader, unit }: { leader: StatLeader; unit: string }) {
  const { player, value } = leader;

  return (
    <Link
      href={`/jugadores/${player.id}`}
      className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-raised"
    >
      <div className="relative shrink-0">
        <PlayerAvatar name={player.name} url={player.headshotUrl} size={64} />
        <span className="absolute -top-1 -left-1 flex size-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-background">
          1°
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{player.name}</p>
        <p className="truncate text-xs text-muted">{getDetails(leader)}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-3xl leading-none font-bold text-accent tabular-nums">
          {value}
        </p>
        <p className="mt-1 text-[11px] text-muted">{unit}</p>
      </div>
    </Link>
  );
}

function LeaderRow({ leader, rank }: { leader: StatLeader; rank: number }) {
  const { player, value } = leader;

  return (
    <Link
      href={`/jugadores/${player.id}`}
      className="flex h-12 items-center gap-3 px-4 transition-colors hover:bg-surface-raised"
    >
      <span className="w-5 shrink-0 text-xs font-bold text-muted tabular-nums">
        {rank}°
      </span>
      <PlayerAvatar name={player.name} url={player.headshotUrl} size={28} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{player.name}</span>
        <span className="block truncate text-[11px] text-muted">
          {getDetails(leader)}
        </span>
      </span>
      <span className="shrink-0 font-bold tabular-nums">{value}</span>
    </Link>
  );
}

/** Top 5 de una categoría: el líder destacado y del 2° al 5° en filas. */
export function LeaderCard({
  id,
  leaders,
}: {
  id: StatCategoryId;
  leaders: StatLeader[];
}) {
  const { title, abbreviation, unit } = LEADER_CATEGORIES[id];
  const [first, ...rest] = leaders.slice(0, 5);
  if (!first) return null;

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-surface">
      <h2 className="flex items-baseline justify-between gap-2 border-b border-line px-4 py-2.5">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs font-bold tracking-wide text-muted">
          {abbreviation}
        </span>
      </h2>
      <TopLeader leader={first} unit={unit} />
      {rest.length > 0 && (
        <ol start={2} className="divide-y divide-line border-t border-line">
          {rest.map((leader, index) => (
            <li key={leader.player.id}>
              <LeaderRow leader={leader} rank={index + 2} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
