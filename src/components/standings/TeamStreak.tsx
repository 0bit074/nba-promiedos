import { Flame, Skull, type LucideIcon } from "lucide-react";
import { formatStreak } from "@/lib/nba/format";

interface TeamStreakStyle {
  textClass: string;
  icon?: LucideIcon;
  iconClass?: string;
}

function getTeamStreakStyle(streak: number): TeamStreakStyle {
  if (streak >= 10) {
    return {
      textClass: "font-bold text-blue-400",
      icon: Flame,
      iconClass: "text-blue-400",
    };
  }

  if (streak >= 5) {
    return {
      textClass: "font-bold text-purple-500",
      icon: Flame,
      iconClass: "text-purple-500 drop-shadow-[0_0_4px_rgb(168_85_247/0.8)]",
    };
  }

  if (streak >= 1) {
    return {
      textClass: "font-semibold text-win",
      icon: Flame,
      iconClass: "text-orange-500",
    };
  }

  if (streak <= -5) {
    return {
      textClass: "font-semibold text-muted",
      icon: Skull,
      iconClass: "text-neutral-300",
    };
  }

  if (streak <= -3) {
    return {
      textClass: "font-semibold text-red-500",
      icon: Flame,
      iconClass: "text-red-500",
    };
  }

  return { textClass: `font-semibold ${streak < 0 ? "text-live" : "text-muted"}` };
}

/** Racha de un equipo; el ancho mínimo mantiene alineados los códigos. */
export function TeamStreak({ streak }: { streak: number }) {
  const { textClass, icon: Icon, iconClass } = getTeamStreakStyle(streak);

  return (
    <span
      className={`inline-flex min-w-10 items-center gap-0.5 ${textClass}`}
    >
      {formatStreak(streak)}
      {Icon && <Icon aria-hidden className={`size-3.5 shrink-0 ${iconClass}`} />}
    </span>
  );
}
