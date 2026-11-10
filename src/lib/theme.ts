import { THEME_COLOR } from "./site";

export type Theme = "dark" | "light";

export const DEFAULT_THEME: Theme = "dark";

export const THEME_STORAGE_KEY = "theme";

/** Deben coincidir con `--color-background` de cada tema en globals.css. */
export const THEME_COLORS: Record<Theme, string> = {
  dark: THEME_COLOR,
  light: "#f5f2eb",
};

export function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

/**
 * Corre antes de pintar la página para aplicar el tema guardado y evitar un
 * destello del tema oscuro. Si localStorage falla, queda el predeterminado.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="light"?${JSON.stringify(
  THEME_COLORS.light,
)}:${JSON.stringify(THEME_COLORS.dark)})}}catch(e){}})()`;
