import {
  CalendarDays,
  ListOrdered,
  Newspaper,
  Swords,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Otra ruta que pertenece a esta sección. */
  relatedPath?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Partidos",
    icon: CalendarDays,
    relatedPath: "/partidos",
  },
  {
    href: "/posiciones",
    label: "Posiciones",
    icon: ListOrdered,
    relatedPath: "/equipos",
  },
  { href: "/jugadores", label: "Jugadores", icon: Users },
  { href: "/comparador", label: "Comparador", icon: Swords },
  { href: "/noticias", label: "Noticias", icon: Newspaper },
];
