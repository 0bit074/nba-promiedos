import type { Metadata } from "next";
import { Suspense } from "react";
import {
  StandingsBoard,
  StandingsSkeleton,
} from "@/components/standings/StandingsBoard";

export const metadata: Metadata = { title: "Posiciones" };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Posiciones</h1>
      <Suspense fallback={<StandingsSkeleton />}>
        <StandingsBoard />
      </Suspense>
    </div>
  );
}
