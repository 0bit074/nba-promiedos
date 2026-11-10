import type { NewsArticle, NewsProvider } from "./types";

const HOUR_IN_MS = 3_600_000;

type MockArticle = Omit<NewsArticle, "publishedAt" | "imageUrl" | "url"> & {
  hoursAgo: number;
};

const MOCK_ARTICLES: MockArticle[] = [
  {
    id: "mock-1",
    category: "trade",
    headline: "Los Hawks envían a su escolta titular a los Kings en un cambio de tres equipos",
    summary:
      "Atlanta recibe dos selecciones de primera ronda y un pívot joven, mientras Sacramento suma tirador para pelear por el Play-In.",
    source: "Redacción NBA Rookie",
    involved: ["Atlanta Hawks", "Sacramento Kings"],
    hoursAgo: 0.5,
  },
  {
    id: "mock-2",
    category: "injury",
    headline: "El alero de los Celtics estará afuera al menos dos semanas por un esguince de tobillo",
    summary:
      "Se lesionó en el último cuarto ante Miami. Los estudios descartaron una rotura y será reevaluado a fin de mes.",
    source: "Parte médico oficial",
    involved: ["Boston Celtics"],
    hoursAgo: 2,
  },
  {
    id: "mock-3",
    category: "league",
    headline: "La NBA confirma las sedes de los partidos internacionales de la temporada",
    summary:
      "La liga volverá a jugar en Ciudad de México y París, y suma por primera vez un encuentro de temporada regular en Sudamérica.",
    source: "NBA",
    involved: [],
    hoursAgo: 4,
  },
  {
    id: "mock-4",
    category: "trade",
    headline: "Los Nets firman a un base agente libre por un año",
    summary:
      "El veterano llega para cubrir la baja del armador titular y aportar experiencia a un plantel joven.",
    source: "Redacción NBA Rookie",
    involved: ["Brooklyn Nets"],
    hoursAgo: 7,
  },
  {
    id: "mock-5",
    category: "injury",
    headline: "Duda para el clásico: el pívot de los Lakers figura como 'cuestionable'",
    summary:
      "Arrastra una molestia en la rodilla derecha. El cuerpo técnico decidirá después de la entrada en calor.",
    source: "Parte médico oficial",
    involved: ["Los Angeles Lakers"],
    hoursAgo: 10,
  },
  {
    id: "mock-6",
    category: "league",
    headline: "Se definieron los Jugadores de la Semana en ambas conferencias",
    summary:
      "Un base del Oeste promedió 34 puntos y un ala-pívot del Este encadenó cuatro dobles-dobles seguidos.",
    source: "NBA",
    involved: ["Oklahoma City Thunder", "Cleveland Cavaliers"],
    hoursAgo: 20,
  },
  {
    id: "mock-7",
    category: "trade",
    headline: "Rumor: los Warriors buscan un ala-pívot antes del cierre del mercado",
    summary:
      "Golden State ofrecería contratos que vencen y una segunda ronda para reforzar el rebote.",
    source: "Fuentes de la liga",
    involved: ["Golden State Warriors"],
    hoursAgo: 30,
  },
  {
    id: "mock-8",
    category: "injury",
    headline: "Vuelve el escolta de los Bucks tras perderse seis partidos",
    summary:
      "Recibió el alta médica después de superar una distensión en el isquiotibial y jugaría con minutos limitados.",
    source: "Parte médico oficial",
    involved: ["Milwaukee Bucks"],
    hoursAgo: 48,
  },
  {
    id: "mock-9",
    category: "league",
    headline: "La liga anuncia cambios en la revisión de jugadas en los últimos dos minutos",
    summary:
      "Los entrenadores tendrán un segundo desafío si aciertan el primero, una prueba que se evaluará al final de la temporada.",
    source: "NBA",
    involved: [],
    hoursAgo: 72,
  },
];

/** Noticias de ejemplo en español, para desarrollo o si falla el feed real. */
export const mockNewsProvider: NewsProvider = {
  async getNews() {
    const now = Date.now();

    return MOCK_ARTICLES.map(({ hoursAgo, ...article }) => ({
      ...article,
      publishedAt: new Date(now - hoursAgo * HOUR_IN_MS).toISOString(),
      imageUrl: null,
      url: null,
    }));
  },
};
