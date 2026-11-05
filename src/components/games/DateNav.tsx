"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  addDays,
  formatDayNumber,
  formatLongDate,
  formatWeekday,
  getNbaToday,
  resolveDate,
} from "@/lib/dates";

const VISIBLE_DAYS_AROUND = 3;

function getDateHref(date: string, today: string) {
  return date === today ? "/" : `/?date=${date}`;
}

function ArrowLink({ href, label, children }: React.PropsWithChildren<{ href: string; label: string }>) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-label={label}
      className="flex w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground"
    >
      {children}
    </Link>
  );
}

/** Selector de jornada: una semana centrada en la fecha elegida. */
export function DateNav() {
  const dateParam = useSearchParams().get("date");
  const today = getNbaToday();
  const selected = resolveDate(dateParam, today);

  const days = Array.from({ length: VISIBLE_DAYS_AROUND * 2 + 1 }, (_, index) =>
    addDays(selected, index - VISIBLE_DAYS_AROUND),
  );

  return (
    <div>
      <p className="mb-3 text-sm text-muted first-letter:uppercase">
        {formatLongDate(selected)}
        {selected !== today && (
          <>
            {" · "}
            <Link href="/" scroll={false} className="font-medium text-accent">
              Volver a hoy
            </Link>
          </>
        )}
      </p>
      <nav aria-label="Fechas" className="flex gap-1">
        <ArrowLink
          href={getDateHref(addDays(selected, -1), today)}
          label="Día anterior"
        >
          <ChevronLeft aria-hidden className="size-5" />
        </ArrowLink>
        <ul className="grid flex-1 grid-cols-7 gap-1">
          {days.map((day) => {
            const isSelected = day === selected;
            return (
              <li key={day}>
                <Link
                  href={getDateHref(day, today)}
                  scroll={false}
                  aria-current={isSelected ? "date" : undefined}
                  className={`flex h-13 flex-col items-center justify-center rounded-md text-center ${
                    isSelected
                      ? "bg-accent font-bold text-background"
                      : "bg-surface text-muted hover:bg-surface-raised hover:text-foreground"
                  }`}
                >
                  <span className="text-[0.6875rem] leading-4 uppercase">
                    {day === today ? "Hoy" : formatWeekday(day)}
                  </span>
                  <span className="text-sm leading-5 font-semibold tabular-nums">
                    {formatDayNumber(day)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <ArrowLink
          href={getDateHref(addDays(selected, 1), today)}
          label="Día siguiente"
        >
          <ChevronRight aria-hidden className="size-5" />
        </ArrowLink>
      </nav>
    </div>
  );
}

export function DateNavSkeleton() {
  return (
    <div aria-hidden>
      <div className="mb-3 h-5 w-48 animate-pulse rounded bg-surface" />
      <div className="h-13 animate-pulse rounded-md bg-surface" />
    </div>
  );
}
