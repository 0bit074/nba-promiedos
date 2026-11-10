import { connection } from "next/server";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { getNews } from "@/lib/news";
import { NewsCard } from "./NewsCard";
import { NewsFilters } from "./NewsFilters";

/** Últimas noticias de la liga: traspasos, lesiones y novedades. */
export async function NewsBoard() {
  await connection();

  const articles = await getNews();

  if (articles.length === 0) {
    return (
      <StatusMessage title="No hay noticias por ahora">
        Vuelve a intentarlo en unos minutos.
      </StatusMessage>
    );
  }

  return (
    <NewsFilters
      items={articles.map((article) => ({
        id: article.id,
        category: article.category,
        card: <NewsCard article={article} />,
      }))}
    />
  );
}

export function NewsSkeleton() {
  return (
    <div aria-busy aria-label="Cargando noticias" className="space-y-4">
      <div className="h-9 w-72 max-w-full animate-pulse rounded-full bg-surface" />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-lg border border-line bg-surface"
          />
        ))}
      </div>
    </div>
  );
}
