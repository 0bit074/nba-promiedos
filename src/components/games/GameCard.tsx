import { Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Game, GameCompetitor } from "@/lib/nba";
import { getGameStatusLabel, getHighlightsUrl } from "@/lib/nba/format";
import { GameTime } from "./GameTime";

interface TeamRowProps {
  competitor: GameCompetitor;
  /** Atenúa al equipo que perdió un partido terminado. */
  isDimmed: boolean;
  /** Unidad del anotador: puntos del partido o promedio de la temporada. */
  pointsUnit: string;
}

function TeamRow({ competitor, isDimmed, pointsUnit }: TeamRowProps) {
  const { team, score, record, topScorer } = competitor;

  return (
    <div className="flex h-14 items-center gap-2.5 px-3">
      <Image
        src={team.logoUrl}
        alt=""
        width={28}
        height={28}
        className="size-7 shrink-0 object-contain"
      />
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2">
          <span
            title={team.fullName}
            className={`truncate font-semibold ${isDimmed ? "text-muted" : ""}`}
          >
            {team.name}
          </span>
          {record && (
            <span className="shrink-0 text-xs text-muted tabular-nums max-[359px]:hidden">
              {record}
            </span>
          )}
        </p>
        {topScorer && (
          <Link
            href={`/jugadores/${topScorer.playerId}`}
            className="relative z-10 flex gap-1 text-xs text-muted hover:text-accent"
          >
            <span className="truncate">{topScorer.name}</span>
            <span className="shrink-0">
              · {topScorer.points} {pointsUnit}
            </span>
          </Link>
        )}
      </div>
      {score !== null && (
        <span
          className={`text-lg font-bold tabular-nums ${isDimmed ? "text-muted" : ""}`}
        >
          {score}
        </span>
      )}
    </div>
  );
}

function GameStatusPanel({ game }: { game: Game }) {
  if (game.status === "scheduled") {
    return (
      <>
        <span className="text-sm font-semibold tabular-nums">
          <GameTime startTime={game.startTime} />
        </span>
        {game.broadcast && (
          <span className="w-full truncate text-xs text-muted">
            {game.broadcast}
          </span>
        )}
      </>
    );
  }

  const label = getGameStatusLabel(game);

  if (game.status === "live") {
    return (
      <>
        <span className="flex items-center gap-1.5 text-xs font-bold text-live">
          <span
            aria-hidden
            className="size-1.5 animate-pulse rounded-full bg-live"
          />
          {label}
        </span>
        {!game.isPeriodBreak && game.clock && (
          <span className="text-sm font-semibold tabular-nums">
            {game.clock}
          </span>
        )}
      </>
    );
  }

  return (
    <>
      <span className="text-xs font-medium text-muted">{label}</span>
      {game.status === "final" && (
        <a
          href={getHighlightsUrl(game)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Ver resumen de ${game.away.team.name} contra ${game.home.team.name} en YouTube (se abre en una pestaña nueva)`}
          className="relative z-10 flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <Video aria-hidden className="size-3.5" />
          Resumen
        </a>
      )}
    </>
  );
}

function hasLost(game: Game, team: GameCompetitor, rival: GameCompetitor) {
  return (
    game.status === "final" &&
    team.score !== null &&
    rival.score !== null &&
    team.score < rival.score
  );
}

interface GameCardProps {
  game: Game;
  /** Conserva la jornada elegida al abrir el detalle sobre la cartelera. */
  detailQuery: string;
}

export function GameCard({ game, detailQuery }: GameCardProps) {
  const { home, away, status } = game;
  const hasBeenPlayed = status === "live" || status === "final";
  const pointsUnit = hasBeenPlayed ? "pts" : "pts/p";

  return (
    <article
      className={`relative flex overflow-hidden rounded-lg border bg-surface transition-colors ${
        status === "live" ? "border-live/50" : "border-line"
      } ${hasBeenPlayed ? "hover:border-muted" : ""}`}
    >
      {hasBeenPlayed && (
        // Capa enlazada: el anotador y "Resumen" quedan por encima de ella.
        <Link
          href={`/partidos/${game.id}${detailQuery}`}
          scroll={false}
          aria-label={`Ver estadísticas de ${away.team.name} contra ${home.team.name}`}
          className="absolute inset-0"
        />
      )}
      <div className="min-w-0 flex-1 divide-y divide-line">
        <TeamRow
          competitor={away}
          isDimmed={hasLost(game, away, home)}
          pointsUnit={pointsUnit}
        />
        <TeamRow
          competitor={home}
          isDimmed={hasLost(game, home, away)}
          pointsUnit={pointsUnit}
        />
      </div>
      <div className="flex w-24 shrink-0 flex-col items-center justify-center gap-1 border-l border-line px-1.5 text-center">
        <GameStatusPanel game={game} />
      </div>
    </article>
  );
}
