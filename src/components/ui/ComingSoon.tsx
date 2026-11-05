import type { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

/** Marcador para las secciones que todavía no están desarrolladas. */
export function ComingSoon({ title, description, icon: Icon }: ComingSoonProps) {
  return (
    <section>
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="mt-4 flex flex-col items-center rounded-lg border border-line bg-surface px-6 py-16 text-center">
        <Icon aria-hidden className="size-8 text-accent" />
        <p className="mt-3 font-semibold">Próximamente</p>
        <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      </div>
    </section>
  );
}
