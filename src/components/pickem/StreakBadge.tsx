import { getStreakBadge } from "@/lib/pickem/streak";

/** Insignia de racha; no muestra nada si no corresponde una. */
export function StreakBadge({ streak }: { streak: number }) {
  const badge = getStreakBadge(streak);
  if (!badge) return null;

  const { icon: Icon, colorClass, label } = badge;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-raised px-3 py-1 text-sm font-semibold">
      <Icon aria-hidden className={`size-4 ${colorClass}`} />
      {label}
    </span>
  );
}
