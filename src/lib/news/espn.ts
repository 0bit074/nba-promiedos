import { classifyNews } from "./categories";
import type { NewsArticle, NewsProvider } from "./types";

const NEWS_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=30";

const REQUEST_TIMEOUT_MS = 8_000;

/** Deben coincidir con `images.remotePatterns` de next.config.ts. */
const IMAGE_URL_PREFIXES = [
  "https://a.espncdn.com/photo/",
  "https://espnmedia-cdn.akamaized.net/espn/media/",
];

/** Máximo de equipos o jugadores a mostrar por noticia. */
const MAX_INVOLVED = 2;

interface EspnNewsArticle {
  id?: number;
  dataSourceIdentifier?: string;
  type?: string;
  headline?: string;
  description?: string;
  published?: string;
  byline?: string;
  images?: { url?: string }[];
  links?: { web?: { href?: string } };
  categories?: { type?: string; description?: string }[];
}

function getInvolved(categories: EspnNewsArticle["categories"] = []) {
  const byType = (type: string) =>
    categories
      .filter((category) => category.type === type && category.description)
      .map((category) => category.description as string);

  const teams = byType("team");
  return (teams.length > 0 ? teams : byType("athlete")).slice(0, MAX_INVOLVED);
}

/** Primera foto de un host permitido para `next/image`. */
function getImageUrl(images: EspnNewsArticle["images"] = []) {
  const image = images.find(({ url }) =>
    IMAGE_URL_PREFIXES.some((prefix) => url?.startsWith(prefix)),
  );
  return image?.url ?? null;
}

function toNewsArticle(article: EspnNewsArticle): NewsArticle | null {
  const { headline, published } = article;
  if (!headline || !published) return null;

  const summary = article.description ?? "";

  return {
    id: String(article.id ?? article.dataSourceIdentifier ?? headline),
    category: classifyNews(`${headline} ${summary}`),
    headline,
    summary,
    publishedAt: published,
    source: article.byline?.trim() || "ESPN",
    involved: getInvolved(article.categories),
    imageUrl: getImageUrl(article.images),
    url: article.links?.web?.href ?? null,
  };
}

export const espnNewsProvider: NewsProvider = {
  async getNews() {
    const response = await fetch(NEWS_URL, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`ESPN respondió con estado ${response.status}`);
    }

    const { articles = [] } = (await response.json()) as {
      articles?: EspnNewsArticle[];
    };

    return articles
      .map(toNewsArticle)
      .filter((article): article is NewsArticle => article !== null)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  },
};
