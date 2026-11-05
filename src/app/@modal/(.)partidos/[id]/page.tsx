import { Suspense } from "react";
import {
  GameDetail,
  GameDetailSkeleton,
} from "@/components/game-detail/GameDetail";
import { GameDetailModal } from "@/components/game-detail/GameDetailModal";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <GameDetailModal>
      <Suspense fallback={<GameDetailSkeleton />}>
        <GameDetail params={params} />
      </Suspense>
    </GameDetailModal>
  );
}
