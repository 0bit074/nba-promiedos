"use client";

import { useState, type ReactNode } from "react";

interface GameDetailTabsProps {
  stats: ReactNode;
  players: ReactNode;
}

const TABS = [
  { id: "stats", label: "Estadísticas" },
  { id: "players", label: "Jugadores" },
] as const;

export function GameDetailTabs({ stats, players }: GameDetailTabsProps) {
  const [activeTab, setActiveTab] =
    useState<(typeof TABS)[number]["id"]>("stats");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Detalle del partido"
        className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-surface p-1"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={id === activeTab}
            onClick={() => setActiveTab(id)}
            className={`h-10 rounded-md text-sm font-semibold ${
              id === activeTab ? "bg-accent text-background" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{activeTab === "stats" ? stats : players}</div>
    </div>
  );
}
