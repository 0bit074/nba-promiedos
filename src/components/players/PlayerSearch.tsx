"use client";

import { Search } from "lucide-react";
import Form from "next/form";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState, type KeyboardEvent } from "react";
import { SuggestionsList, usePlayerSuggestions } from "./PlayerSuggestions";

/**
 * Formulario GET: la búsqueda queda en la URL y funciona sin JavaScript.
 * Mientras se escribe, muestra los jugadores que coinciden.
 */
export function PlayerSearchForm({ defaultQuery = "" }: { defaultQuery?: string }) {
  const router = useRouter();
  const listId = useId();
  const [text, setText] = useState(defaultQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { status, players } = usePlayerSuggestions(text);

  const showList = isOpen && text.trim().length > 0;
  const selectedIndex = activeIndex < players.length ? activeIndex : -1;
  const getOptionId = (index: number) => `${listId}-option-${index}`;

  function close() {
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (showList) event.preventDefault();
      close();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      if (players.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      // Desde "sin selección" (-1), ↓ va al primero y ↑ al último.
      setActiveIndex((index) => {
        const current = index < players.length ? index : -1;
        const next = current + step;
        if (next < -1) return players.length - 1;
        return next >= players.length ? -1 : next;
      });
      return;
    }

    // Enter con un jugador marcado abre su ficha; si no, se envía el formulario.
    if (event.key === "Enter" && showList && selectedIndex >= 0) {
      event.preventDefault();
      close();
      router.push(`/jugadores/${players[selectedIndex].id}`);
    }
  }

  return (
    <Form action="/jugadores" role="search" className="flex gap-2" onSubmit={close}>
      <div className="relative min-w-0 flex-1">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          name="q"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={close}
          onKeyDown={handleKeyDown}
          placeholder="Buscar jugador"
          aria-label="Buscar jugador"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={
            showList && selectedIndex >= 0 ? getOptionId(selectedIndex) : undefined
          }
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          maxLength={60}
          className="h-11 w-full rounded-lg border border-line bg-surface pr-3 pl-9 text-base outline-none placeholder:text-muted focus:border-accent"
        />
        {showList && (
          <SuggestionsList
            id={listId}
            query={text}
            status={status}
            players={players}
            activeIndex={selectedIndex}
            getOptionId={getOptionId}
            onSelect={close}
          />
        )}
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
