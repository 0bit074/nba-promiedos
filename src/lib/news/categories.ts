import type { NewsCategory } from "./types";

interface NewsCategoryInfo {
  /** Etiqueta de la tarjeta. */
  label: string;
  /** Texto del filtro. */
  filterLabel: string;
  chipClass: string;
}

export const NEWS_CATEGORIES: Record<NewsCategory, NewsCategoryInfo> = {
  trade: {
    label: "Traspaso",
    filterLabel: "Traspasos",
    chipClass: "bg-accent/15 text-accent",
  },
  injury: {
    label: "Parte Médico",
    filterLabel: "Lesiones",
    chipClass: "bg-live/15 text-live",
  },
  league: {
    label: "Liga",
    filterLabel: "Liga",
    chipClass: "bg-surface-raised text-muted",
  },
};

const TRADE_PATTERN =
  /\b(trade[sd]?|trading|acquir\w*|deal|sign(s|ed|ing)?|waive[sd]?|free agen\w*|extension|contract|roster move)\b/i;

const INJURY_PATTERN =
  /\b(injur\w*|surgery|sprain\w*|strain\w*|torn|tear|fracture\w*|concussion|questionable|day-to-day|out for|miss(es|ed)?|sidelined|knee|ankle|hamstring|achilles|swelling)\b/i;

/** Clasifica una noticia en inglés según palabras clave. */
export function classifyNews(text: string): NewsCategory {
  if (INJURY_PATTERN.test(text)) return "injury";
  if (TRADE_PATTERN.test(text)) return "trade";
  return "league";
}
