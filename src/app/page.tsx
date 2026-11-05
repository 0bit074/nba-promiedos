import { Suspense } from "react";
import { DateNav, DateNavSkeleton } from "@/components/games/DateNav";
import { GameBoard, GameBoardSkeleton } from "@/components/games/GameBoard";

export default function Page({ searchParams }: PageProps<"/">) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="mb-1 text-2xl font-bold">Partidos</h1>
        <Suspense fallback={<DateNavSkeleton />}>
          <DateNav />
        </Suspense>
      </div>
      <Suspense fallback={<GameBoardSkeleton />}>
        <GameBoard searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
