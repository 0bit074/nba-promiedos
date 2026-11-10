"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { normalize } from "@/components/players/PlayerSuggestions";
import { TeamLogo } from "@/components/teams/TeamLogo";
import type { Team } from "@/lib/nba";
import {
  getComparatorHref,
  SIDE_STYLES,
  type ComparatorParams,
  type ComparatorSide,
} from "./params";

interface TeamPickerProps {
  side: ComparatorSide;
  params: ComparatorParams;
  /** Los 30 equipos, ordenados por nombre. */
  teams: Team[];
}

/**
 * Desplegable propio en lugar de un `<select>`: el del sistema no respeta el
 * tema oscuro en todos los navegadores y no puede mostrar los logos.
 */
export function TeamPicker({ side, params, teams }: TeamPickerProps) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const { label, dotClass } = SIDE_STYLES[side];
  const value = params[side];
  const selected = teams.find((team) => team.id === value) ?? null;

  const query = normalize(filter);
  const visibleTeams = query
    ? teams.filter((team) => normalize(team.fullName).includes(query))
    : teams;
  const getOptionId = (index: number) => `${id}-option-${index}`;

  function open() {
    setFilter("");
    const index = teams.findIndex((team) => team.id === value);
    setActiveIndex(Math.max(index, 0));
    setIsOpen(true);
  }

  function close({ restoreFocus = false } = {}) {
    setIsOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  function choose(teamId: string | null) {
    close({ restoreFocus: true });
    router.replace(getComparatorHref(params, side, teamId), { scroll: false });
  }

  // Cierra al tocar o hacer clic fuera del desplegable.
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  // Mantiene visible la opción marcada con el teclado.
  useEffect(() => {
    if (!isOpen) return;
    listRef.current
      ?.querySelector(`#${CSS.escape(getOptionId(activeIndex))}`)
      ?.scrollIntoView({ block: "nearest" });
    // `getOptionId` sólo depende de `id`, que no cambia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeIndex]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close({ restoreFocus: true });
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (visibleTeams.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(
        (index) => (index + step + visibleTeams.length) % visibleTeams.length,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const team = visibleTeams[activeIndex];
      if (team) choose(team.id);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <p
        id={`${id}-label`}
        className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted"
      >
        <span aria-hidden className={`size-2.5 rounded-full ${dotClass}`} />
        Equipo {label}
      </p>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (isOpen ? close() : open())}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-labelledby={`${id}-label ${id}-value`}
        className={`flex h-14 w-full items-center gap-3 rounded-lg border bg-surface px-3 text-left transition-colors ${
          isOpen ? "border-accent" : "border-line hover:border-muted"
        }`}
      >
        {selected ? (
          <TeamLogo
            url={selected.logoUrl}
            size={32}
            className="size-8 shrink-0 object-contain"
          />
        ) : (
          <span aria-hidden className="size-8 shrink-0 rounded-full bg-surface-raised" />
        )}
        <span
          id={`${id}-value`}
          className={`min-w-0 flex-1 truncate text-sm font-semibold ${
            selected ? "" : "text-muted"
          }`}
        >
          {selected?.fullName ?? "Elegir equipo"}
        </span>
        <ChevronDown
          aria-hidden
          className={`size-4 shrink-0 text-muted transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-line bg-surface shadow-lg shadow-black/25">
          <div className="relative border-b border-line">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleKeyDown}
              autoFocus
              placeholder="Buscar equipo"
              aria-label={`Buscar equipo ${label}`}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={
                visibleTeams.length > 0 ? getOptionId(activeIndex) : undefined
              }
              autoComplete="off"
              spellCheck={false}
              className="h-11 w-full bg-transparent pr-3 pl-9 text-base outline-none placeholder:text-muted sm:text-sm"
            />
          </div>

          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={`Equipos para el lado ${label}`}
            className="max-h-[min(22rem,55dvh)] overflow-y-auto py-1"
          >
            {visibleTeams.map((team, index) => {
              const isSelected = team.id === value;
              const isActive = index === activeIndex;
              return (
                <li
                  key={team.id}
                  id={getOptionId(index)}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => choose(team.id)}
                  onPointerMove={() => setActiveIndex(index)}
                  className={`flex h-11 cursor-pointer items-center gap-3 px-3 text-sm ${
                    isActive ? "bg-surface-raised" : ""
                  } ${isSelected ? "font-semibold text-accent" : ""}`}
                >
                  <TeamLogo
                    url={team.logoUrl}
                    size={28}
                    className="size-7 shrink-0 object-contain"
                  />
                  <span className="min-w-0 flex-1 truncate">{team.fullName}</span>
                  {isSelected && <Check aria-hidden className="size-4 shrink-0" />}
                </li>
              );
            })}
            {visibleTeams.length === 0 && (
              <li role="presentation" className="px-3 py-3 text-sm text-muted">
                Sin coincidencias
              </li>
            )}
          </ul>

          {selected && (
            <button
              type="button"
              onClick={() => choose(null)}
              className="flex w-full items-center gap-2 border-t border-line px-3 py-2.5 text-xs font-medium text-muted hover:bg-surface-raised hover:text-foreground"
            >
              <X aria-hidden className="size-3.5" />
              Quitar equipo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
