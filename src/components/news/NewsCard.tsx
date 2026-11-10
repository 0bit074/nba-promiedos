import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { NEWS_CATEGORIES, type NewsArticle } from "@/lib/news";
import { TimeAgo } from "./TimeAgo";

export function NewsCard({ article }: { article: NewsArticle }) {
  const { label, chipClass } = NEWS_CATEGORIES[article.category];
  const meta = [article.source, ...article.involved].join(" · ");

  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-lg border border-line bg-surface transition-colors hover:border-accent/60">
      {article.imageUrl && (
        <div className="relative aspect-video bg-surface-raised">
          <Image
            src={article.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span
            className={`rounded-full px-2 py-0.5 font-semibold ${chipClass}`}
          >
            {label}
          </span>
          <span className="shrink-0 text-muted">
            <TimeAgo date={article.publishedAt} />
          </span>
        </div>
        <h2 className="leading-snug font-semibold">
          {article.url ? (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              // El enlace cubre toda la tarjeta.
              className="after:absolute after:inset-0 group-hover:text-accent"
            >
              {article.headline}
              <ExternalLink
                aria-hidden
                className="ml-1 inline size-3.5 align-baseline text-muted"
              />
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          ) : (
            article.headline
          )}
        </h2>
        {article.summary && (
          <p className="line-clamp-3 text-sm text-muted">{article.summary}</p>
        )}
        <p className="mt-auto truncate pt-1 text-xs font-medium text-muted">
          {meta}
        </p>
      </div>
    </article>
  );
}
