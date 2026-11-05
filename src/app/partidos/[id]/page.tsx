import type { Metadata } from "next";
import { Suspense } from "react";
import {
  GameDetail,
  GameDetailSkeleton,
  isValidGameId,
} from "@/components/game-detail/GameDetail";
import { getGameDetail } from "@/lib/nba";

export async function generateMetadata({
  params,
}: PageProps<"/partidos/[id]">): Promise<Metadata> {
  const { id } = await params;
  const detail = isValidGameId(id)
    ? await getGameDetail(id).catch(() => null)
    : null;

  if (!detail) return { title: "Partido" };

  const { away, home } = detail.game;
  return { title: `${away.team.name} vs ${home.team.name}` };
}

export default function Page({ params }: PageProps<"/partidos/[id]">) {
  return (
    <Suspense fallback={<GameDetailSkeleton />}>
      <GameDetail params={params} showBackLink />
    </Suspense>
  );
}
