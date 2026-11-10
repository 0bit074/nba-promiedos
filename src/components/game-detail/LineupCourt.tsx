import Link from "next/link";
import { TeamLogo } from "@/components/teams/TeamLogo";
import type { BoxScorePlayer, Team } from "@/lib/nba";
import {
  getStartingLineup,
  type CourtPosition,
} from "@/lib/nba/lineup";

/** Ubicación de cada puesto, en % del ancho y alto de la media cancha. */
const SPOTS: Record<CourtPosition, { left: string; top: string }> = {
  PG: { left: "50%", top: "70%" },
  SG: { left: "82%", top: "48%" },
  SF: { left: "18%", top: "48%" },
  PF: { left: "70%", top: "20%" },
  C: { left: "32%", top: "20%" },
};

/**
 * Media cancha FIBA/NBA a escala en pies (50 × 47), con el aro arriba. Los
 * colores salen de los tokens del tema, así se adapta a oscuro y crema.
 */
function HalfCourt() {
  return (
    <svg
      viewBox="0 0 50 47"
      aria-hidden
      className="absolute inset-0 size-full"
      fill="none"
      strokeWidth={0.35}
    >
      <rect width="50" height="47" className="fill-surface-raised" />
      <g className="stroke-muted/60">
        {/* Pintura y círculo de tiro libre. */}
        <rect x="17" y="0" width="16" height="19" className="fill-accent/10" />
        <circle cx="25" cy="19" r="6" />
        {/* Línea de 3: rectas en las esquinas y arco de 23,75 pies. */}
        <path d="M3 0 V14 A23.75 23.75 0 0 0 47 14 V0" />
        {/* Zona restringida, tablero y aro. */}
        <path d="M21 5.25 A4 4 0 0 0 29 5.25" />
        <path d="M22 4 H28" strokeWidth={0.6} />
        <circle cx="25" cy="5.25" r="0.75" className="stroke-accent" />
        {/* Línea y círculo central. */}
        <path d="M19 47 A6 6 0 0 1 31 47" />
        <rect x="0.2" y="0.2" width="49.6" height="46.6" />
      </g>
    </svg>
  );
}

function PlayerMarker({
  position,
  player,
}: {
  position: CourtPosition;
  player: BoxScorePlayer;
}) {
  return (
    <Link
      href={`/jugadores/${player.id}`}
      style={SPOTS[position]}
      className="group absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 text-center"
    >
      <span className="flex size-10 items-center justify-center rounded-full border-2 border-accent bg-surface text-sm font-bold tabular-nums shadow-md shadow-black/20 transition-transform group-hover:scale-110">
        {player.jersey ?? position}
      </span>
      <span className="max-w-full truncate rounded bg-surface/90 px-1 text-[11px] leading-tight font-semibold group-hover:text-accent">
        {player.name}
      </span>
      <span className="text-[10px] leading-none font-bold tracking-wide text-accent">
        {position}
      </span>
    </Link>
  );
}

interface LineupCourtProps {
  team: Team;
  players: BoxScorePlayer[];
}

/** Los 5 titulares de un equipo ubicados sobre una media cancha. */
export function LineupCourt({ team, players }: LineupCourtProps) {
  const lineup = getStartingLineup(players);

  return (
    <section className="min-w-0">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <TeamLogo url={team.logoUrl} size={20} className="size-5 shrink-0 object-contain" />
        {team.fullName}
      </h3>
      {lineup.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface px-4 py-8 text-center text-sm text-muted">
          Todavía no se conocen los titulares.
        </p>
      ) : (
        <div className="relative aspect-[50/47] w-full overflow-hidden rounded-lg border border-line">
          <HalfCourt />
          <ol aria-label={`Titulares de ${team.fullName}`}>
            {lineup.map(({ position, player }) => (
              <li key={player.id}>
                <PlayerMarker position={position} player={player} />
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
