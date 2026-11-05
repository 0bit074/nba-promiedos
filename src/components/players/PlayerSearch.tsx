"use client";

import { Search } from "lucide-react";
import Form from "next/form";
import { useSearchParams } from "next/navigation";

/** Formulario GET: la búsqueda queda en la URL y funciona sin JavaScript. */
export function PlayerSearchForm({ defaultQuery = "" }: { defaultQuery?: string }) {
  return (
    <Form action="/jugadores" role="search" className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          name="q"
          defaultValue={defaultQuery}
          placeholder="Buscar jugador"
          aria-label="Buscar jugador"
          enterKeyHint="search"
          autoComplete="off"
          maxLength={60}
          className="h-11 w-full rounded-lg border border-line bg-surface pr-3 pl-9 text-base outline-none placeholder:text-muted focus:border-accent"
        />
      </div>
      <button
        type="submit"
        className="h-11 shrink-0 rounded-lg bg-accent px-4 text-sm font-semibold text-background"
      >
        Buscar
      </button>
    </Form>
  );
}

export function PlayerSearch() {
  const query = useSearchParams().get("q") ?? "";

  // La clave reinicia el campo al navegar entre búsquedas.
  return <PlayerSearchForm key={query} defaultQuery={query} />;
}
