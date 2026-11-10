import type { NextRequest } from "next/server";
import { searchPlayers, type PlayerSummary } from "@/lib/nba";

/** Sugerencias que muestra el buscador mientras se escribe. */
const MAX_SUGGESTIONS = 8;

/** La búsqueda de ESPN no devuelve nada con una sola letra. */
const MIN_QUERY_LENGTH = 2;

const MAX_QUERY_LENGTH = 60;

/** GET /api/jugadores/buscar?q=leb → jugadores que coinciden. */
export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "")
    .trim()
    .slice(0, MAX_QUERY_LENGTH);

  if (query.length < MIN_QUERY_LENGTH) {
    return Response.json([] satisfies PlayerSummary[]);
  }

  try {
    const players = await searchPlayers(query);
    return Response.json(players.slice(0, MAX_SUGGESTIONS));
  } catch (error) {
    console.error("No se pudieron buscar jugadores", error);
    return Response.json([] satisfies PlayerSummary[], { status: 502 });
  }
}
