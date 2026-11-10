import type { Metadata } from "next";
import { Suspense } from "react";
import {
  PlayersBoard,
  PlayersBoardSkeleton,
} from "@/components/players/PlayersBoard";

export const metadata: Metadata = { title: "Jugadores" };

export default function Page({ searchParams }: PageProps<"/jugadores">) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Jugadores</h1>
      <Suspense fallback={<PlayersBoardSkeleton />}>
        <PlayersBoard searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
