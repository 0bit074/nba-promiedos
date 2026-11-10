import type { Metadata } from "next";
import { Suspense } from "react";
import {
  ComparatorBoard,
  ComparatorSkeleton,
} from "@/components/comparator/ComparatorBoard";

export const metadata: Metadata = { title: "Comparador" };

export default function Page({ searchParams }: PageProps<"/comparador">) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Mano a mano</h1>
        <p className="text-sm text-muted">
          Compara los promedios de la temporada de dos jugadores o equipos.
        </p>
      </div>
      <Suspense fallback={<ComparatorSkeleton />}>
        <ComparatorBoard searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
