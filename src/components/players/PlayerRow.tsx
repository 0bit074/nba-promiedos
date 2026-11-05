import Link from "next/link";
import type { PlayerSummary } from "@/lib/nba";
import { getPositionName } from "@/lib/nba/format";
import { PlayerAvatar } from "./PlayerAvatar";

/** Fila enlazada a la ficha; `children` ocupa el extremo derecho. */
export function PlayerRow({
  player,
  children,
}: React.PropsWithChildren<{ player: PlayerSummary }>) {
  const details = [player.teamName, getPositionName(player.position)]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/jugadores/${player.id}`}
      className="flex h-14 items-center gap-3 px-3 transition-colors hover:bg-surface-raised"
    >
      <PlayerAvatar name={player.name} url={player.headshotUrl} size={36} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{player.name}</span>
        <span className="block truncate text-xs text-muted">{details}</span>
      </span>
      {children}
    </Link>
  );
}
