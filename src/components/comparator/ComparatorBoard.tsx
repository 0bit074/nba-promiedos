import { Shield, User } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { StatusMessage } from "@/components/ui/StatusMessage";
import {
  getPlayerProfile,
  getStandings,
  getTeamStats,
  type PlayerAverages,
  type PlayerProfile,
  type Team,
  type TeamSeasonStats,
} from "@/lib/nba";
import { getPositionName } from "@/lib/nba/format";
import { ComparisonBars, type ComparisonMetric } from "./ComparisonBars";
import {
  readComparatorParams,
  SIDE_STYLES,
  type ComparatorParams,
  type ComparatorSide,
  type ComparatorType,
} from "./params";
import { PlayerPicker } from "./PlayerPicker";
import { TeamPicker } from "./TeamPicker";

const TYPES: { id: ComparatorType; label: string; icon: typeof User }[] = [
  { id: "jugadores", label: "Jugadores", icon: User },
  { id: "equipos", label: "Equipos", icon: Shield },
];

function TypeToggle({ active }: { active: ComparatorType }) {
  return (
    <nav
      aria-label="Qué comparar"
      className="grid grid-cols-2 gap-1 rounded-lg bg-surface p-1 sm:inline-grid sm:w-72"
    >
      {TYPES.map(({ id, label, icon: Icon }) => (
        <Link
          key={id}
          href={`/comparador?tipo=${id}`}
          aria-current={id === active ? "page" : undefined}
          className={`flex h-9 items-center justify-center gap-1.5 rounded-md text-sm font-semibold ${
            id === active ? "bg-accent text-background" : "text-muted hover:text-foreground"
          }`}
        >
          <Icon aria-hidden className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** Convierte "28.4" o "46.3" en número; `null` si no hay dato. */
function toNumber(value: string | undefined) {
  const number = Number(value);
  return value === undefined || value === "-" || Number.isNaN(number)
    ? null
    : number;
}

const PLAYER_METRICS: {
  key: keyof PlayerAverages;
  label: string;
  title: string;
  isPercent?: boolean;
}[] = [
  { key: "points", label: "PTS", title: "Puntos por partido" },
  { key: "rebounds", label: "REB", title: "Rebotes por partido" },
  { key: "assists", label: "AST", title: "Asistencias por partido" },
  { key: "steals", label: "ROB", title: "Robos por partido" },
  { key: "blocks", label: "TAP", title: "Tapones por partido" },
  { key: "minutes", label: "MIN", title: "Minutos por partido" },
  { key: "fieldGoalPct", label: "%TC", title: "Porcentaje de tiros de campo", isPercent: true },
  { key: "threePointPct", label: "%3P", title: "Porcentaje de triples", isPercent: true },
  { key: "freeThrowPct", label: "%TL", title: "Porcentaje de tiros libres", isPercent: true },
];

const TEAM_METRICS: {
  key: Exclude<keyof TeamSeasonStats, "team" | "gamesPlayed">;
  label: string;
  title: string;
  isPercent?: boolean;
  lowerIsBetter?: boolean;
}[] = [
  { key: "points", label: "PTS", title: "Puntos por partido" },
  { key: "rebounds", label: "REB", title: "Rebotes por partido" },
  { key: "assists", label: "AST", title: "Asistencias por partido" },
  { key: "steals", label: "ROB", title: "Robos por partido" },
  { key: "blocks", label: "TAP", title: "Tapones por partido" },
  { key: "turnovers", label: "PER", title: "Pérdidas por partido (menos es mejor)", lowerIsBetter: true },
  { key: "fieldGoalPct", label: "%TC", title: "Porcentaje de tiros de campo", isPercent: true },
  { key: "threePointPct", label: "%3P", title: "Porcentaje de triples", isPercent: true },
  { key: "freeThrowPct", label: "%TL", title: "Porcentaje de tiros libres", isPercent: true },
];

/** Nombres de los dos lados, con su color, sobre las barras. */
function ComparisonHeader({
  names,
  caption,
}: {
  names: Record<ComparatorSide, string>;
  caption: string;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {(["a", "b"] as const).map((side) => (
          <p
            key={side}
            className={`flex min-w-0 items-center gap-1.5 text-sm font-bold ${
              side === "b" ? "justify-end text-right" : ""
            }`}
          >
            <span
              aria-hidden
              className={`size-2.5 shrink-0 rounded-full ${SIDE_STYLES[side].dotClass} ${
                side === "b" ? "order-last" : ""
              }`}
            />
            <span className="truncate">{names[side]}</span>
          </p>
        ))}
      </div>
      <p className="mt-0.5 text-center text-xs text-muted">{caption}</p>
    </div>
  );
}

function PickBoth({ type }: { type: ComparatorType }) {
  return (
    <StatusMessage
      title={`Elige dos ${type === "equipos" ? "equipos" : "jugadores"}`}
    >
      Compara sus promedios de la temporada, estadística por estadística.
    </StatusMessage>
  );
}

const LOAD_ERROR = (
  <StatusMessage title="No pudimos cargar la comparación">
    Vuelve a intentarlo en unos minutos.
  </StatusMessage>
);

function toSelectedPlayer(profile: PlayerProfile | null) {
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.name,
    headshotUrl: profile.headshotUrl,
    details: [profile.team?.name, getPositionName(profile.position)]
      .filter(Boolean)
      .join(" · "),
  };
}

async function PlayerComparison({ params }: { params: ComparatorParams }) {
  let profiles: [PlayerProfile | null, PlayerProfile | null];
  try {
    profiles = await Promise.all([
      params.a ? getPlayerProfile(params.a) : null,
      params.b ? getPlayerProfile(params.b) : null,
    ]);
  } catch (error) {
    console.error("No se pudieron cargar los jugadores a comparar", error);
    return LOAD_ERROR;
  }
  const [a, b] = profiles;

  let result;
  if (!a || !b) {
    result = <PickBoth type="jugadores" />;
  } else if (!a.seasonAverages || !b.seasonAverages) {
    const missing = !a.seasonAverages ? a.name : b.name;
    result = (
      <StatusMessage title="Faltan datos para comparar">
        {missing} todavía no tiene promedios esta temporada.
      </StatusMessage>
    );
  } else {
    const [averagesA, averagesB] = [a.seasonAverages, b.seasonAverages];
    const metrics: ComparisonMetric[] = PLAYER_METRICS.map(
      ({ key, label, title, isPercent }) => ({
        label,
        title,
        isPercent,
        a: toNumber(averagesA[key]),
        b: toNumber(averagesB[key]),
      }),
    );
    result = (
      <div className="space-y-2">
        <ComparisonHeader
          names={{ a: a.name, b: b.name }}
          caption={`Promedios de la temporada · ${averagesA.gamesPlayed} vs ${averagesB.gamesPlayed} partidos`}
        />
        <ComparisonBars metrics={metrics} />
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <PlayerPicker side="a" params={params} selected={toSelectedPlayer(a)} />
        <PlayerPicker side="b" params={params} selected={toSelectedPlayer(b)} />
      </div>
      {result}
    </>
  );
}

async function TeamComparison({ params }: { params: ComparatorParams }) {
  let teams: Team[];
  let stats: [TeamSeasonStats | null, TeamSeasonStats | null];
  try {
    const [standings, statsA, statsB] = await Promise.all([
      getStandings(),
      params.a ? getTeamStats(params.a) : null,
      params.b ? getTeamStats(params.b) : null,
    ]);
    teams = standings
      .flatMap((conference) => conference.teams.map(({ team }) => team))
      .sort((x, y) => x.fullName.localeCompare(y.fullName, "es"));
    stats = [statsA, statsB];
  } catch (error) {
    console.error("No se pudieron cargar los equipos a comparar", error);
    return LOAD_ERROR;
  }
  const [a, b] = stats;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <TeamPicker side="a" params={params} teams={teams} />
        <TeamPicker side="b" params={params} teams={teams} />
      </div>
      {a && b ? (
        <div className="space-y-2">
          <ComparisonHeader
            names={{ a: a.team.name, b: b.team.name }}
            caption={`Promedios de la temporada · ${a.gamesPlayed} vs ${b.gamesPlayed} partidos`}
          />
          <ComparisonBars
            metrics={TEAM_METRICS.map(
              ({ key, label, title, isPercent, lowerIsBetter }) => ({
                label,
                title,
                isPercent,
                lowerIsBetter,
                a: a[key],
                b: b[key],
              }),
            )}
          />
        </div>
      ) : (
        <PickBoth type="equipos" />
      )}
    </>
  );
}

interface ComparatorBoardProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Mano a mano entre dos jugadores o dos equipos, elegidos en la URL. */
export async function ComparatorBoard({ searchParams }: ComparatorBoardProps) {
  const params = readComparatorParams(await searchParams);
  await connection();

  return (
    <div className="space-y-4">
      <TypeToggle active={params.type} />
      {params.type === "equipos" ? (
        <TeamComparison params={params} />
      ) : (
        <PlayerComparison params={params} />
      )}
    </div>
  );
}

export function ComparatorSkeleton() {
  return (
    <div aria-busy aria-label="Cargando comparador" className="space-y-4">
      <div className="h-11 animate-pulse rounded-lg bg-surface sm:w-72" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-20 animate-pulse rounded-lg bg-surface" />
        <div className="h-20 animate-pulse rounded-lg bg-surface" />
      </div>
      <div className="h-96 animate-pulse rounded-lg border border-line bg-surface" />
    </div>
  );
}
