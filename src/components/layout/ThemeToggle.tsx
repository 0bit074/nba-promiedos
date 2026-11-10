"use client";

import { Moon, Sun } from "lucide-react";
import { useLayoutEffect, useSyncExternalStore } from "react";
import {
  DEFAULT_THEME,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  isTheme,
  type Theme,
} from "@/lib/theme";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readTheme(): Theme {
  const value = document.documentElement.dataset.theme;
  return isTheme(value) ? value : DEFAULT_THEME;
}

function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[theme]);
  listeners.forEach((listener) => listener());
}

/** Alterna entre el tema oscuro (predeterminado) y el claro crema. */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => DEFAULT_THEME);

  // En desarrollo, React borra el atributo del <html> al remontar: se vuelve
  // a aplicar antes de pintar. En producción no cambia nada.
  useLayoutEffect(() => {
    const stored = readStoredTheme();
    if (stored && stored !== readTheme()) applyTheme(stored);
  }, []);

  const isLight = theme === "light";
  const label = isLight ? "Activar tema oscuro" : "Activar tema claro";

  function toggle() {
    const next: Theme = isLight ? "dark" : "light";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Sin almacenamiento, el tema dura hasta recargar.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="flex size-9 shrink-0 items-center justify-center rounded-md border border-line text-muted transition-colors hover:border-accent hover:text-accent"
    >
      {isLight ? (
        <Moon aria-hidden className="size-4" />
      ) : (
        <Sun aria-hidden className="size-4" />
      )}
    </button>
  );
}
