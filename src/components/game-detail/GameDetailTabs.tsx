"use client";

import { useState, type ReactNode } from "react";

interface GameDetailTabsProps {
  stats: ReactNode;
  players: ReactNode;
  lineups: ReactNode;
}

const TABS = [
  { id: "stats", label: "Estadísticas" },
  { id: "players", label: "Jugadores" },
  { id: "lineups", label: "Alineaciones" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function GameDetailTabs(panels: GameDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("stats");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Detalle del partido"
        className="mb-4 grid grid-cols-3 gap-1 rounded-lg bg-surface p-1"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={id === activeTab}
            onClick={() => setActiveTab(id)}
            className={`h-10 truncate rounded-md px-1 text-sm font-semibold ${
              id === activeTab ? "bg-accent text-background" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{panels[activeTab]}</div>
    </div>
  );
}
