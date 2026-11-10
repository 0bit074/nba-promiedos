import { Flame, Skull, type LucideIcon } from "lucide-react";

export interface StreakBadgeData {
  /** Ícono SVG: a diferencia de un emoji, toma el color de Tailwind. */
  icon: LucideIcon;
  /** Clases de Tailwind para el ícono. */
  colorClass: string;
  label: string;
}

/**
 * Insignia de la racha del jugador en el Pick'em.
 *
 * @param streak Positiva si son aciertos seguidos y negativa si son fallos.
 * @returns `null` si la racha no alcanza para mostrar una insignia.
 */
export function getStreakBadge(streak: number): StreakBadgeData | null {
  const count = Math.abs(streak);

  if (streak >= 10) {
    return {
      icon: Flame,
      colorClass: "animate-pulse text-blue-500 motion-reduce:animate-none",
      label: `¡${count} en racha!`,
    };
  }

  if (streak >= 5) {
    return {
      icon: Flame,
      colorClass: "text-purple-500 drop-shadow-[0_0_6px_rgb(168_85_247/0.8)]",
      label: `¡${count} en racha!`,
    };
  }

  if (streak >= 1) {
    return {
      icon: Flame,
      colorClass: "text-orange-500",
      label: `¡${count} en racha!`,
    };
  }

  if (streak <= -5) {
    return {
      icon: Skull,
      colorClass: "text-neutral-500 dark:text-neutral-300",
      label: `${count} fallos seguidos`,
    };
  }

  if (streak <= -3) {
    return {
      icon: Flame,
      colorClass: "text-red-600",
      label: `${count} fallos seguidos`,
    };
  }

  return null;
}
