"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, type KeyboardEvent } from "react";
import { PlayerAvatar } from "@/components/players/PlayerAvatar";
import {
  SuggestionsList,
  usePlayerSuggestions,
} from "@/components/players/PlayerSuggestions";
import type { PlayerSummary } from "@/lib/nba";
import {
  getComparatorHref,
  SIDE_STYLES,
  type ComparatorParams,
  type ComparatorSide,
} from "./params";

interface SelectedPlayer {
  id: string;
  name: string;
  headshotUrl: string | null;
  details: string;
}

interface PlayerPickerProps {
  side: ComparatorSide;
  params: ComparatorParams;
  /** `null` si todavía no se eligió (o el id no existe). */
  selected: SelectedPlayer | null;
}

/** Buscador con sugerencias para elegir el jugador de un lado. */
export function PlayerPicker({ side, params, selected }: PlayerPickerProps) {
  const router = useRouter();
  const listId = useId();
  const [text, setText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { status, players } = usePlayerSuggestions(text);
  const { label, dotClass } = SIDE_STYLES[side];

  const showList = isOpen && text.trim().length > 0;
  const selectedIndex = activeIndex < players.length ? activeIndex : -1;
  const getOptionId = (index: number) => `${listId}-option-${index}`;

  function choose(id: string | null) {
    setText("");
    setIsOpen(false);
    setActiveIndex(-1);
    router.replace(getComparatorHref(params, side, id), { scroll: false });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      if (players.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => {
        const next = (index < players.length ? index : -1) + step;
        if (next < -1) return players.length - 1;
        return next >= players.length ? -1 : next;
      });
    } else if (event.key === "Enter") {
      event.preventDefault();
      const player = players[selectedIndex >= 0 ? selectedIndex : 0];
      if (showList && player) choose(player.id);
    }
  }

  const title = (
    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted">
      <span aria-hidden className={`size-2.5 rounded-full ${dotClass}`} />
      Jugador {label}
    </p>
  );

  if (selected) {
    return (
      <div>
        {title}
        <div className="flex h-14 items-center gap-3 rounded-lg border border-line bg-surface px-3">
          <PlayerAvatar name={selected.name} url={selected.headshotUrl} size={36} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {selected.name}
            </span>
            <span className="block truncate text-xs text-muted">
              {selected.details}
            </span>
          </span>
          <button
            type="button"
            onClick={() => choose(null)}
            aria-label={`Quitar a ${selected.name}`}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-raised hover:text-foreground"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {title}
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar jugador"
          aria-label={`Buscar jugador ${label}`}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={
            showList && selectedIndex >= 0 ? getOptionId(selectedIndex) : undefined
          }
          autoComplete="off"
          spellCheck={false}
          maxLength={60}
          className="h-14 w-full rounded-lg border border-line bg-surface pr-3 pl-9 text-base outline-none placeholder:text-muted focus:border-accent"
        />
        {showList && (
          <SuggestionsList
            id={listId}
            query={text}
            status={status}
            players={players}
            activeIndex={selectedIndex}
            getOptionId={getOptionId}
            onSelect={() => setIsOpen(false)}
            onPick={(player: PlayerSummary) => choose(player.id)}
          />
        )}
      </div>
    </div>
  );
}
