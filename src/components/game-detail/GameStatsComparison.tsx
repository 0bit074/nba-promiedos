import type { Game, ShootingStat, TeamGameStats } from "@/lib/nba";
import { getShootingPercent } from "@/lib/nba/format";

interface StatSide {
  /** Valor que define el largo de la barra. */
  value: number;
  label: string;
  detail?: string;
}

interface StatRowProps {
  title: string;
  away: StatSide;
  home: StatSide;
  /** En las pérdidas, tener menos es mejor. */
  lowerIsBetter?: boolean;
}

function StatRow({ title, away, home, lowerIsBetter = false }: StatRowProps) {
  const total = away.value + home.value;
  const awayShare = total === 0 ? 50 : (away.value / total) * 100;
  const isTie = away.value === home.value;
  const awayLeads = lowerIsBetter ? away.value < home.value : away.value > home.value;

  const leaderClass = "bg-accent";
  const otherClass = "bg-surface-raised";

  return (
    <div>
      <div className="mb-1.5 grid grid-cols-[1fr_auto_1fr] items-baseline gap-2">
        <p className="text-sm font-semibold tabular-nums">
          {away.label}
          {away.detail && (
            <span className="ml-1.5 text-xs font-normal text-muted">
              {away.detail}
            </span>
          )}
        </p>
        <p className="text-center text-xs text-muted">{title}</p>
        <p className="text-right text-sm font-semibold tabular-nums">
          {home.detail && (
            <span className="mr-1.5 text-xs font-normal text-muted">
              {home.detail}
            </span>
          )}
          {home.label}
        </p>
      </div>
      <div aria-hidden className="flex h-1.5 gap-1">
        <div
          style={{ width: `${awayShare}%` }}
          className={`rounded-l-full ${!isTie && awayLeads ? leaderClass : otherClass}`}
        />
        <div
          style={{ width: `${100 - awayShare}%` }}
          className={`rounded-r-full ${!isTie && !awayLeads ? leaderClass : otherClass}`}
        />
      </div>
    </div>
  );
}

function toShootingSide(stat: ShootingStat): StatSide {
  const percent = getShootingPercent(stat);

  return {
    value: percent,
    label: `${percent.toFixed(1)}%`,
    detail: `${stat.made}/${stat.attempted}`,
  };
}

function toCountSide(value: number): StatSide {
  return { value, label: String(value) };
}

interface GameStatsComparisonProps {
  game: Game;
  away: TeamGameStats;
  home: TeamGameStats;
}

/** Comparación de ambos equipos; la barra naranja marca quién va mejor. */
export function GameStatsComparison({ game, away, home }: GameStatsComparisonProps) {
  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-4 flex justify-between text-xs font-semibold tracking-wide text-muted uppercase">
        <span>{game.away.team.abbreviation}</span>
        <span>{game.home.team.abbreviation}</span>
      </div>
      <div className="space-y-4">
        <StatRow
          title="Tiros de campo"
          away={toShootingSide(away.fieldGoals)}
          home={toShootingSide(home.fieldGoals)}
        />
        <StatRow
          title="Triples"
          away={toShootingSide(away.threePointers)}
          home={toShootingSide(home.threePointers)}
        />
        <StatRow
          title="Tiros libres"
          away={toShootingSide(away.freeThrows)}
          home={toShootingSide(home.freeThrows)}
        />
        <StatRow
          title="Reb. ofensivos"
          away={toCountSide(away.offensiveRebounds)}
          home={toCountSide(home.offensiveRebounds)}
        />
        <StatRow
          title="Reb. defensivos"
          away={toCountSide(away.defensiveRebounds)}
          home={toCountSide(home.defensiveRebounds)}
        />
        <StatRow
          title="Pérdidas"
          away={toCountSide(away.turnovers)}
          home={toCountSide(home.turnovers)}
          lowerIsBetter
        />
      </div>
    </section>
  );
}
