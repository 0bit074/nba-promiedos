import { connection } from "next/server";
import { StatusMessage } from "@/components/ui/StatusMessage";
import {
  getStandings,
  type ConferenceId,
  type ConferenceStandings,
} from "@/lib/nba";
import { ConferenceTabs } from "./ConferenceTabs";
import { StandingsTable, ZONES } from "./StandingsTable";

const CONFERENCE_LABELS: Record<ConferenceId, string> = {
  east: "Este",
  west: "Oeste",
};

function StandingsLegend() {
  return (
    <div className="mt-3 text-xs text-muted">
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {Object.values(ZONES).map(({ label, dotClass }) => (
          <li key={label} className="flex items-center gap-1.5">
            <span aria-hidden className={`size-2.5 rounded-sm ${dotClass}`} />
            {label}
          </li>
        ))}
      </ul>
      <p className="mt-2">
        Zonas según la posición actual. DIF: juegos de diferencia con el líder.
        <span className="hidden sm:inline"> U10: últimos 10 partidos.</span>{" "}
        Racha: W ganados, L perdidos.
      </p>
      <p className="mt-1">
        ⭐ Marca hasta 3 equipos favoritos del Este y 3 del Oeste.
      </p>
    </div>
  );
}

/** Tablas de posiciones de las dos conferencias. */
export async function StandingsBoard() {
  await connection();

  let conferences: ConferenceStandings[];
  try {
    conferences = await getStandings();
  } catch (error) {
    console.error("No se pudieron cargar las posiciones", error);
    return (
      <StatusMessage title="No pudimos cargar las posiciones">
        Vuelve a intentarlo en unos minutos.
      </StatusMessage>
    );
  }

  return (
    <>
      <ConferenceTabs
        panels={conferences.map(({ conference, teams }) => {
          const title = `Conferencia ${CONFERENCE_LABELS[conference]}`;
          return {
            id: conference,
            label: CONFERENCE_LABELS[conference],
            title,
            content: <StandingsTable caption={title} teams={teams} />,
          };
        })}
      />
      <StandingsLegend />
    </>
  );
}

export function StandingsSkeleton() {
  return (
    <div
      aria-busy
      aria-label="Cargando posiciones"
      className="grid gap-4 lg:grid-cols-2"
    >
      {[0, 1].map((index) => (
        <div
          key={index}
          className={`h-[42rem] animate-pulse rounded-lg border border-line bg-surface ${
            index === 1 ? "hidden lg:block" : ""
          }`}
        />
      ))}
    </div>
  );
}
