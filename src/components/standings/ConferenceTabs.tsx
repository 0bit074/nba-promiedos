"use client";

import { useState, type ReactNode } from "react";

interface ConferencePanel {
  id: string;
  label: string;
  title: string;
  content: ReactNode;
}

/** En celulares muestra una conferencia por vez; en PC, las dos en paralelo. */
export function ConferenceTabs({ panels }: { panels: ConferencePanel[] }) {
  const [activeId, setActiveId] = useState(panels[0].id);

  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-surface p-1 lg:hidden">
        {panels.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={id === activeId}
            onClick={() => setActiveId(id)}
            className={`h-10 rounded-md text-sm font-semibold ${
              id === activeId ? "bg-accent text-background" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {panels.map(({ id, title, content }) => (
          <section key={id} className={id === activeId ? "" : "hidden lg:block"}>
            <h2 className="mb-2 hidden text-xs font-semibold tracking-wide text-muted uppercase lg:block">
              {title}
            </h2>
            {content}
          </section>
        ))}
      </div>
    </div>
  );
}
