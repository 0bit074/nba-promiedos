import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  isValidPlayerId,
  PlayerDetails,
  PlayerDetailsSkeleton,
} from "@/components/players/PlayerDetails";
import { getPlayerProfile } from "@/lib/nba";

export async function generateMetadata({
  params,
}: PageProps<"/jugadores/[id]">): Promise<Metadata> {
  const { id } = await params;
  const player = isValidPlayerId(id)
    ? await getPlayerProfile(id).catch(() => null)
    : null;

  return { title: player?.name ?? "Jugador" };
}

export default function Page({ params }: PageProps<"/jugadores/[id]">) {
  return (
    <div className="space-y-3">
      <Link
        href="/jugadores"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground"
      >
        <ChevronLeft aria-hidden className="size-4" />
        Jugadores
      </Link>
      <Suspense fallback={<PlayerDetailsSkeleton />}>
        <PlayerDetails params={params} />
      </Suspense>
    </div>
  );
}
