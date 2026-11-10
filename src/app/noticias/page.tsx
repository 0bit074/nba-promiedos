import type { Metadata } from "next";
import { Suspense } from "react";
import { NewsBoard, NewsSkeleton } from "@/components/news/NewsBoard";

export const metadata: Metadata = { title: "Noticias" };

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Noticias</h1>
      <Suspense fallback={<NewsSkeleton />}>
        <NewsBoard />
      </Suspense>
    </div>
  );
}
