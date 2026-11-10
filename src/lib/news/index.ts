import { cacheLife } from "next/cache";
import { espnNewsProvider } from "./espn";
import { mockNewsProvider } from "./mock";
import type { NewsArticle } from "./types";

export { NEWS_CATEGORIES } from "./categories";
export type { NewsArticle, NewsCategory } from "./types";

const useMock = process.env.NBA_DATA_SOURCE === "mock";

async function getEspnNews(): Promise<NewsArticle[]> {
  "use cache";
  cacheLife("minutes");

  return espnNewsProvider.getNews();
}

/**
 * Noticias de la liga. Si el feed real falla se muestran las de ejemplo; el
 * error no se guarda en caché, así el próximo pedido vuelve a intentar.
 */
export async function getNews(): Promise<NewsArticle[]> {
  if (useMock) return mockNewsProvider.getNews();

  try {
    return await getEspnNews();
  } catch (error) {
    console.error("No se pudieron cargar las noticias de ESPN", error);
    return mockNewsProvider.getNews();
  }
}
