import { ChevronLeft, Flame } from "lucide-react";
import { TeamLogo } from "@/components/teams/TeamLogo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { LiveRefresher } from "@/components/games/LiveRefresher";
import { GameTime } from "@/components/games/GameTime";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { getNbaDate } from "@/lib/dates";
import {
  getGameDetail,
  type Game,
  type GameCompetitor,
  type GameDetail as GameDetailData,
} from "@/lib/nba";
import { getGameStatusLabel } from "@/lib/nba/format";
import { BoxScoreTable } from "./BoxScoreTable";
import { GameDetailTabs } from "./GameDetailTabs";
import { GameStatsComparison } from "./GameStatsComparison";
import { LineupCourt } from "./LineupCourt";

const LIVE_REFRESH_MS = 30_000;

/** Evita consultar rutas arbitrarias con lo que llegue en la URL. */
export function isValidGameId(id: string) {
  return /^[\w-]+$/.test(id);
}

function TeamHeader({ competitor }: { competitor: GameCompetitor }) {
  const { team, record } = competitor;

  return (
    <div className="flex min-w-0 flex-col items-center gap-1 text-center">
      <TeamLogo url={team.logoUrl} size={48} className="size-12 object-contain" />
      <p className="w-full text-sm leading-tight font-semibold" title={team.fullName}>
        {team.name}
      </p>
      {record && <p className="text-xs text-muted tabular-nums">{record}</p>}
    </div>
  );
}

function GameStatusLine({ game }: { game: Game }) {
  if (game.status === "scheduled") {
    return (
      <p className="text-sm font-semibold tabular-nums">
        <GameTime startTime={game.startTime} />
      </p>
    );
  }

  const label = getGameStatusLabel(game);

  if (game.status === "live") {
    return (
      <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-live">
        <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-live" />
        {label}
        {!game.isPeriodBreak && game.clock && (
          <span className="tabular-nums">{game.clock}</span>
        )}
      </p>
    );
  }

  return <p className="text-xs font-medium text-muted">{label}</p>;
}

function GameHeader({ game }: { game: Game }) {
  const { away, home } = game;
  const hasScore = away.score !== null && home.score !== null;

  return (
    <header className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-6 md:gap-3 md:px-8 md:pt-0">
      <TeamHeader competitor={away} />
      <div className="text-center">
        {hasScore && (
          <p className="text-2xl font-bold whitespace-nowrap tabular-nums sm:text-3xl">
            {away.score} <span className="text-muted">-</span> {home.score}
          </p>
        )}
        <GameStatusLine game={game} />
      </div>
      <TeamHeader competitor={home} />
    </header>
  );
}

function GameDetailContent({ detail }: { detail: GameDetailData }) {
  const { game, boxScores } = detail;

  if (!boxScores) {
    return (
      <StatusMessage title="Todavía no hay estadísticas">
        {game.status === "scheduled" || game.status === "live"
          ? "Aparecerán aquí cuando empiece el partido."
          : "Este partido no se jugó."}
      </StatusMessage>
    );
  }

  return (
    <GameDetailTabs
      stats={
        <GameStatsComparison
          game={game}
          away={boxScores.away.stats}
          home={boxScores.home.stats}
        />
      }
      players={
        <div className="@container">
          {/* Lado a lado sólo si cada tabla entra sin scroll horizontal. */}
          <div className="grid gap-4 @5xl:grid-cols-2">
            <BoxScoreTable
              team={game.away.team}
              players={boxScores.away.players}
              isLive={game.status === "live"}
            />
            <BoxScoreTable
              team={game.home.team}
              players={boxScores.home.players}
              isLive={game.status === "live"}
            />
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <Flame aria-hidden className="size-3.5 text-orange-500" />
            Máximo anotador del equipo
          </p>
        </div>
      }
      lineups={
        <div>
          <div className="grid gap-4 md:grid-cols-2">
            <LineupCourt team={game.away.team} players={boxScores.away.players} />
            <LineupCourt team={game.home.team} players={boxScores.home.players} />
          </div>
          <p className="mt-3 text-xs text-muted">
            Titulares del partido. Las posiciones son aproximadas: la fuente
            sólo indica base, alero o pívot.
          </p>
        </div>
      }
    />
  );
}

interface GameDetailProps {
  params: Promise<{ id: string }>;
  /** En la página completa no hay modal que cerrar. */
  showBackLink?: boolean;
}

/** Marcador, estadísticas y box score de un partido. */
export async function GameDetail({ params, showBackLink = false }: GameDetailProps) {
  const { id } = await params;
  if (!isValidGameId(id)) notFound();

  await connection();

  let detail: GameDetailData | null;
  try {
    detail = await getGameDetail(id);
  } catch (error) {
    console.error(`No se pudo cargar el partido ${id}`, error);
    return (
      <StatusMessage title="No pudimos cargar el partido">
        Vuelve a intentarlo en unos minutos.
      </StatusMessage>
    );
  }

  if (!detail) notFound();
  const { game } = detail;

  return (
    <div>
      {showBackLink && (
        <Link
          href={`/?date=${getNbaDate(new Date(game.startTime))}`}
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Partidos
        </Link>
      )}
      {game.status === "live" && <LiveRefresher intervalMs={LIVE_REFRESH_MS} />}
      <GameHeader game={game} />
      <GameDetailContent detail={detail} />
    </div>
  );
}

export function GameDetailSkeleton() {
  return (
    <div aria-busy aria-label="Cargando partido" className="space-y-4">
      <div className="h-24 animate-pulse rounded-lg bg-surface" />
      <div className="h-10 animate-pulse rounded-lg bg-surface" />
      <div className="h-80 animate-pulse rounded-lg bg-surface" />
    </div>
  );
}
