export type NewsCategory = "trade" | "injury" | "league";

export interface NewsArticle {
  id: string;
  category: NewsCategory;
  headline: string;
  summary: string;
  /** Fecha de publicación en formato ISO. */
  publishedAt: string;
  /** Medio o autor, por ejemplo "ESPN" o "Adrian Wojnarowski". */
  source: string;
  /** Equipos (y si no hay, jugadores) involucrados, por ejemplo ["Lakers"]. */
  involved: string[];
  imageUrl: string | null;
  /** Nota completa; `null` si no hay enlace externo. */
  url: string | null;
}

/** Para sumar otro feed: implementar esta interfaz y elegirlo en index.ts. */
export interface NewsProvider {
  /** Devuelve las noticias de la más nueva a la más vieja. */
  getNews(): Promise<NewsArticle[]>;
}
