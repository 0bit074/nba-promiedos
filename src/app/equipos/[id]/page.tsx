import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  isValidTeamId,
  TeamRosterSkeleton,
  TeamRosterView,
} from "@/components/teams/TeamRosterView";
import { getTeamRoster } from "@/lib/nba";

export async function generateMetadata({
  params,
}: PageProps<"/equipos/[id]">): Promise<Metadata> {
  const { id } = await params;
  const roster = isValidTeamId(id)
    ? await getTeamRoster(id).catch(() => null)
    : null;

  return { title: roster?.team.fullName ?? "Equipo" };
}

export default function Page({ params }: PageProps<"/equipos/[id]">) {
  return (
    <div className="space-y-3">
      <Link
        href="/posiciones"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground"
      >
        <ChevronLeft aria-hidden className="size-4" />
        Posiciones
      </Link>
      <Suspense fallback={<TeamRosterSkeleton />}>
        <TeamRosterView params={params} />
      </Suspense>
    </div>
  );
}
